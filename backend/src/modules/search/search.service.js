const elasticClient = require('../../infrastructure/search/elastic.client');
const prisma = require('../../infrastructure/database/prisma.client');

class SearchService {
  /**
   * Helper to check if Elasticsearch is available.
   * Runs a quick ping.
   */
  static async isHealthy() {
    try {
      await elasticClient.ping();
      return true;
    } catch (error) {
      console.warn('Elasticsearch is not reachable. Falling back to database search. Error:', error.message);
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

      await elasticClient.index({
        index: index,
        id: id,
        document: document,
        refresh: 'wait_for',
      });
      console.log(`Successfully indexed document in ES [Index: ${index}, ID: ${id}]`);
    } catch (error) {
      console.error(`Error indexing document in ES [Index: ${index}, ID: ${id}]:`, error.message);
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

      await elasticClient.delete({
        index: index,
        id: id,
        refresh: 'wait_for',
      });
      console.log(`Successfully deleted document in ES [Index: ${index}, ID: ${id}]`);
    } catch (error) {
      console.error(`Error deleting document in ES [Index: ${index}, ID: ${id}]:`, error.message);
    }
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
          index: 'doctors',
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
        console.error('Elasticsearch search error, falling back to MySQL:', error.message);
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
          index: 'blogs',
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
        console.error('Elasticsearch blog search error, falling back to MySQL:', error.message);
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
              fields: ['name^3', 'description'],
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
          index: 'specialties',
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
        console.error('Elasticsearch specialty search error, falling back to MySQL:', error.message);
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
}

module.exports = SearchService;
