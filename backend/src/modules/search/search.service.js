const elasticClient = require('../../infrastructure/search/elastic.client');
const prisma = require('../../infrastructure/database/prisma.client');

const INDEX_NAMES = {
  USERS: 'users',
  SPECIALTIES: 'specialties',
  DOCTORS: 'doctors',
  BLOGS: 'blogs',
};

const USER_SEARCH_SELECT = {
  id: true,
  name: true,
  avatarUrl: true,
  email: true,
  phone: true,
  gender: true,
  dateOfBirth: true,
  address: true,
  role: true,
  status: true,
  noShowCount: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
};

class SearchService {
  static isEnabled() {
    return String(process.env.ELASTICSEARCH_ENABLED || 'true').toLowerCase() !== 'false';
  }

  static getIndexPrefix() {
    return (process.env.ELASTICSEARCH_INDEX_PREFIX || 'careplus').trim() || 'careplus';
  }

  static getResolvedIndexName(index) {
    if (index === INDEX_NAMES.USERS || index === INDEX_NAMES.SPECIALTIES) {
      return `${this.getIndexPrefix()}_${index}`;
    }

    return index;
  }

  /**
   * Helper to check if Elasticsearch is available.
   * Runs a quick ping.
   */
  static async isHealthy() {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      await elasticClient.ping();
      return true;
    } catch (error) {
      console.warn('[SearchService] Elasticsearch unavailable, falling back to database search.', {
        message: error.message,
      });
      return false;
    }
  }

  /**
   * Indexes a single document.
   * If Elasticsearch is down, fails silently with a log.
   */
  static async indexDocument(index, id, document) {
    try {
      const isHealthy = await this.isHealthy();
      if (!isHealthy) return;

      const resolvedIndex = this.getResolvedIndexName(index);
      await elasticClient.index({
        index: resolvedIndex,
        id: id,
        document: document,
        refresh: 'wait_for',
      });
    } catch (error) {
      console.warn('[SearchService] Failed to index Elasticsearch document.', {
        index,
        id,
        message: error.message,
      });
    }
  }

  /**
   * Deletes a document from the index.
   * If Elasticsearch is down, fails silently.
   */
  static async deleteDocument(index, id) {
    try {
      const isHealthy = await this.isHealthy();
      if (!isHealthy) return;

      const resolvedIndex = this.getResolvedIndexName(index);
      await elasticClient.delete({
        index: resolvedIndex,
        id: id,
        refresh: 'wait_for',
      });
    } catch (error) {
      console.warn('[SearchService] Failed to delete Elasticsearch document.', {
        index,
        id,
        message: error.message,
      });
    }
  }

  static async syncUserDocument(user) {
    if (!user?.id) {
      return;
    }

    await this.indexDocument(INDEX_NAMES.USERS, user.id, {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      noShowCount: user.noShowCount ?? 0,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  static async syncSpecialtyDocument(specialty) {
    if (!specialty?.id) {
      return;
    }

    await this.indexDocument(INDEX_NAMES.SPECIALTIES, specialty.id, {
      id: specialty.id,
      name: specialty.name,
      slug: specialty.slug,
      description: specialty.description,
      icon: specialty.icon,
      doctorCount: specialty.doctorCount ?? 0,
      active: specialty.active,
      createdAt: specialty.createdAt,
      updatedAt: specialty.updatedAt,
    });
  }

  static async searchUsers({
    query,
    role,
    status,
    createdFrom,
    createdTo,
    page = 1,
    limit = 10,
  }) {
    const from = (page - 1) * limit;
    const esAvailable = await this.isHealthy();

    if (esAvailable) {
      try {
        const mustQueries = [];

        if (query) {
          mustQueries.push({
            multi_match: {
              query,
              fields: ['name^3', 'email^2', 'phone^2', 'role', 'status'],
              fuzziness: 'AUTO',
            },
          });
        } else {
          mustQueries.push({ match_all: {} });
        }

        const filterQueries = [];
        if (role) {
          filterQueries.push({ term: { role } });
        }
        if (status) {
          filterQueries.push({ term: { status } });
        }
        if (createdFrom || createdTo) {
          const createdAtFilter = {};
          if (createdFrom) {
            createdAtFilter.gte = createdFrom.toISOString();
          }
          if (createdTo) {
            createdAtFilter.lte = createdTo.toISOString();
          }
          filterQueries.push({ range: { createdAt: createdAtFilter } });
        }

        const esResponse = await elasticClient.search({
          index: this.getResolvedIndexName(INDEX_NAMES.USERS),
          from,
          size: limit,
          query: {
            bool: {
              must: mustQueries,
              filter: filterQueries,
            },
          },
        });

        const hits = esResponse.hits.hits;
        const totalHits = typeof esResponse.hits.total === 'object'
          ? esResponse.hits.total.value
          : esResponse.hits.total;

        return {
          success: true,
          source: 'elasticsearch',
          data: hits.map((hit) => ({
            id: hit._id,
            score: hit._score,
          })),
          meta: {
            page,
            limit,
            total: totalHits,
            totalPages: Math.ceil(totalHits / limit),
          },
        };
      } catch (error) {
        console.warn('[SearchService] Elasticsearch user search failed, using Prisma fallback.', {
          message: error.message,
        });
      }
    }

    return this.searchUsersFallback({
      query,
      role,
      status,
      createdFrom,
      createdTo,
      page,
      limit,
    });
  }

  static async searchUsersFallback({
    query,
    role,
    status,
    createdFrom,
    createdTo,
    page,
    limit,
  }) {
    const skip = (page - 1) * limit;
    const whereClause = {};

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { email: { contains: query } },
        { phone: { contains: query } },
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (status) {
      whereClause.status = status;
    }

    if (createdFrom || createdTo) {
      whereClause.createdAt = {};
      if (createdFrom) {
        whereClause.createdAt.gte = createdFrom;
      }
      if (createdTo) {
        whereClause.createdAt.lte = createdTo;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: USER_SEARCH_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: whereClause,
      }),
    ]);

    return {
      success: true,
      source: 'mysql',
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * General search method with fallback to database.
   * Supports multi_match full-text, filters, highlighting, and pagination.
   */
  static async searchDoctors({ query, active = true, specialtyId, page = 1, limit = 10 }) {
    const from = (page - 1) * limit;

    // Check if Elasticsearch is available
    const esAvailable = await this.isHealthy();

    if (esAvailable) {
      try {
        const mustQueries = [];

        if (query) {
          mustQueries.push({
            multi_match: {
              query: query,
              fields: ['name^3', 'specialtyName^2', 'description', 'title^1.5'],
              fuzziness: 'AUTO',
            }
          });
        } else {
          mustQueries.push({ match_all: {} });
        }

        const filterQueries = [];
        if (active !== undefined) {
          filterQueries.push({ term: { active: active } });
        }
        if (specialtyId) {
          filterQueries.push({ term: { specialtyId: specialtyId } });
        }

        const esResponse = await elasticClient.search({
          index: this.getResolvedIndexName(INDEX_NAMES.DOCTORS),
          from: from,
          size: limit,
          query: {
            bool: {
              must: mustQueries,
              filter: filterQueries,
            }
          },
          highlight: query ? {
            fields: {
              name: {},
              specialtyName: {},
              description: {},
            }
          } : undefined
        });

        const hits = esResponse.hits.hits;
        const totalHits = typeof esResponse.hits.total === 'object'
          ? esResponse.hits.total.value
          : esResponse.hits.total;

        const data = hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          highlights: hit.highlight || null,
          score: hit._score,
        }));

        return {
          success: true,
          source: 'elasticsearch',
          data,
          meta: {
            page,
            limit,
            total: totalHits,
            totalPages: Math.ceil(totalHits / limit)
          }
        };
      } catch (error) {
        console.warn('[SearchService] Elasticsearch doctor search failed, using Prisma fallback.', {
          message: error.message,
        });
      }
    }

    // Fallback: MySQL DB query
    console.log('Running fallback doctor search in database...');
    return this.searchDoctorsFallback({ query, active, specialtyId, page, limit });
  }

  /**
   * Fallback database search for Doctors using MySQL LIKE query.
   */
  static async searchDoctorsFallback({ query, active, specialtyId, page, limit }) {
    const skip = (page - 1) * limit;

    // Construct database query criteria
    const whereClause = {};
    if (active !== undefined) {
      whereClause.active = active;
    }
    if (specialtyId) {
      whereClause.specialtyId = specialtyId;
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { specialtyName: { contains: query } },
        { description: { contains: query } },
        { title: { contains: query } }
      ];
    }

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.doctor.count({
        where: whereClause
      })
    ]);

    return {
      success: true,
      source: 'mysql',
      data: doctors.map(doc => ({
        id: doc.id,
        userId: doc.userId,
        title: doc.title,
        name: doc.name,
        specialtyId: doc.specialtyId,
        specialtyName: doc.specialtyName,
        experience: doc.experience,
        price: doc.price,
        rating: doc.rating,
        reviewCount: doc.reviewCount,
        avatar: doc.avatar,
        description: doc.description,
        position: doc.position,
        active: doc.active,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        highlights: null,
        score: null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Full-text search for blogs with DB fallback.
   */
  static async searchBlogs({ query, status = 'PUBLISHED', page = 1, limit = 10 }) {
    const from = (page - 1) * limit;
    const esAvailable = await this.isHealthy();

    if (esAvailable) {
      try {
        const mustQueries = [];
        if (query) {
          mustQueries.push({
            multi_match: {
              query: query,
              fields: ['title^3', 'content', 'tags^2', 'summary^1.5'],
              fuzziness: 'AUTO',
            }
          });
        } else {
          mustQueries.push({ match_all: {} });
        }

        const filterQueries = [];
        if (status) {
          filterQueries.push({ term: { status: status.toLowerCase() } });
        }

        const esResponse = await elasticClient.search({
          index: this.getResolvedIndexName(INDEX_NAMES.BLOGS),
          from: from,
          size: limit,
          query: {
            bool: {
              must: mustQueries,
              filter: filterQueries,
            }
          },
          highlight: query ? {
            fields: {
              title: {},
              summary: {},
            }
          } : undefined
        });

        const hits = esResponse.hits.hits;
        const totalHits = typeof esResponse.hits.total === 'object'
          ? esResponse.hits.total.value
          : esResponse.hits.total;

        const data = hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          highlights: hit.highlight || null,
          score: hit._score,
        }));

        return {
          success: true,
          source: 'elasticsearch',
          data,
          meta: {
            page,
            limit,
            total: totalHits,
            totalPages: Math.ceil(totalHits / limit)
          }
        };
      } catch (error) {
        console.warn('[SearchService] Elasticsearch blog search failed, using Prisma fallback.', {
          message: error.message,
        });
      }
    }

    // Fallback: MySQL DB query
    console.log('Running fallback blog search in database...');
    return this.searchBlogsFallback({ query, status, page, limit });
  }

  /**
   * Fallback database search for Blogs using MySQL LIKE query.
   */
  static async searchBlogsFallback({ query, status, page, limit }) {
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    if (query) {
      whereClause.OR = [
        { title: { contains: query } },
        { content: { contains: query } },
        { tags: { contains: query } },
        { summary: { contains: query } }
      ];
    }

    const [blogs, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.blogPost.count({
        where: whereClause
      })
    ]);

    return {
      success: true,
      source: 'mysql',
      data: blogs.map(blog => ({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        content: blog.content,
        summary: blog.summary,
        thumbnail: blog.thumbnail,
        status: blog.status,
        tags: blog.tags,
        authorId: blog.authorId,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
        highlights: null,
        score: null,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Full-text search for specialties with DB fallback.
   */
  static async searchSpecialties({ query, active = true, page = 1, limit = 10 }) {
    const from = (page - 1) * limit;
    const esAvailable = await this.isHealthy();

    if (esAvailable) {
      try {
        const mustQueries = [];
        if (query) {
          mustQueries.push({
            multi_match: {
              query: query,
              fields: ['name^3', 'slug^2', 'description'],
              fuzziness: 'AUTO',
            }
          });
        } else {
          mustQueries.push({ match_all: {} });
        }

        const filterQueries = [];
        if (active !== undefined) {
          filterQueries.push({ term: { active: active } });
        }

        const esResponse = await elasticClient.search({
          index: this.getResolvedIndexName(INDEX_NAMES.SPECIALTIES),
          from: from,
          size: limit,
          query: {
            bool: {
              must: mustQueries,
              filter: filterQueries,
            }
          }
        });

        const hits = esResponse.hits.hits;
        const totalHits = typeof esResponse.hits.total === 'object'
          ? esResponse.hits.total.value
          : esResponse.hits.total;

        const data = hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
        }));

        return {
          success: true,
          source: 'elasticsearch',
          data,
          meta: {
            page,
            limit,
            total: totalHits,
            totalPages: Math.ceil(totalHits / limit)
          }
        };
      } catch (error) {
        console.warn('[SearchService] Elasticsearch specialty search failed, using Prisma fallback.', {
          message: error.message,
        });
      }
    }

    // Fallback: MySQL DB query
    console.log('Running fallback specialty search in database...');
    return this.searchSpecialtiesFallback({ query, active, page, limit });
  }

  /**
   * Fallback database search for Specialties using MySQL LIKE query.
   */
  static async searchSpecialtiesFallback({ query, active, page, limit }) {
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (active !== undefined) {
      whereClause.active = active;
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { description: { contains: query } }
      ];
    }

    const [specialties, total] = await Promise.all([
      prisma.specialty.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.specialty.count({
        where: whereClause
      })
    ]);

    return {
      success: true,
      source: 'mysql',
      data: specialties.map(spec => ({
        id: spec.id,
        name: spec.name,
        slug: spec.slug,
        description: spec.description,
        icon: spec.icon,
        doctorCount: spec.doctorCount,
        active: spec.active,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = SearchService;
