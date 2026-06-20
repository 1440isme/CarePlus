const blogPostRepository = require('./blog-post.repository');
const SearchService = require('../search/search.service');
const { BLOG_ERROR_CODES } = require('./blog.types');

class BlogServiceError extends Error {
  constructor({ code, message, statusCode, details = [] }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

class BlogService {
  /**
   * Helper to ensure slug is unique by appending suffix if exists
   */
  async _generateUniqueSlug(title, excludeId = null) {
    let slug = slugify(title);
    let isUnique = false;
    let counter = 0;
    let tempSlug = slug;

    while (!isUnique) {
      const existing = await blogPostRepository.findOne({ slug: tempSlug });
      if (!existing || existing.id === excludeId) {
        isUnique = true;
        slug = tempSlug;
      } else {
        counter++;
        tempSlug = `${slug}-${counter}`;
      }
    }

    return slug;
  }

  /**
   * List blogs with optional search, pagination, and filters.
   * Leverages Elasticsearch if query is provided, fallbacks to database.
   */
  async listBlogs(filters = {}, { isAdmin = false } = {}) {
    const { page = 1, limit = 10, search, status, tag } = filters;

    // Public users can only see PUBLISHED posts
    const queryStatus = isAdmin ? status : 'PUBLISHED';

    if (search) {
      // Use Elasticsearch search with database fallback
      const searchResult = await SearchService.searchBlogs({
        query: search,
        status: queryStatus,
        page,
        limit
      });

      // If search returns data from ES, we need to populate/format it
      // ES returns metadata. We should fetch the full author details if needed
      // or return the mapped hits directly.
      // Let's populate the author info from DB for ES hits.
      if (searchResult.source === 'elasticsearch' && searchResult.data.length > 0) {
        const blogIds = searchResult.data.map(h => h.id);
        const blogsFromDb = await blogPostRepository.prisma.blogPost.findMany({
          where: { id: { in: blogIds } },
          include: { author: { select: { id: true, name: true, email: true } } }
        });

        // Maintain the ES sorting order (hits order)
        const populatedData = searchResult.data.map(hit => {
          const dbBlog = blogsFromDb.find(b => b.id === hit.id);
          return dbBlog || { ...hit, author: null };
        }).filter(Boolean);

        return {
          data: populatedData,
          meta: searchResult.meta
        };
      }

      // If fallback was run, it already returns mysql formatted list
      if (searchResult.source === 'mysql') {
        // Need to load author info for the fallback list
        const blogIds = searchResult.data.map(h => h.id);
        const blogsWithAuthor = await blogPostRepository.prisma.blogPost.findMany({
          where: { id: { in: blogIds } },
          include: { author: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        });

        return {
          data: blogsWithAuthor,
          meta: searchResult.meta
        };
      }
    }

    // Standard database query without Elasticsearch text query
    const queryFilters = {};
    if (queryStatus) {
      queryFilters.status = queryStatus;
    }
    if (tag) {
      queryFilters.tags = { contains: tag };
    }

    return blogPostRepository.findMany(
      { page, limit, sortBy: 'createdAt', sortOrder: 'desc', ...queryFilters },
      { include: { author: { select: { id: true, name: true, email: true } } } }
    );
  }

  /**
   * Get a blog post by its slug
   */
  async getBlogBySlug(slug, { isAdmin = false } = {}) {
    const where = { slug };
    if (!isAdmin) {
      where.status = 'PUBLISHED';
    }

    const blog = await blogPostRepository.findOne(where, {
      include: { author: { select: { id: true, name: true, email: true } } }
    });

    if (!blog) {
      throw new BlogServiceError({
        message: 'Không tìm thấy bài viết',
        statusCode: 404,
        code: BLOG_ERROR_CODES.BLOG_NOT_FOUND
      });
    }

    return blog;
  }

  /**
   * Get a blog post by its ID
   */
  async getBlogById(id) {
    const blog = await blogPostRepository.findById(id, {
      include: { author: { select: { id: true, name: true, email: true } } }
    });

    if (!blog) {
      throw new BlogServiceError({
        message: 'Không tìm thấy bài viết',
        statusCode: 404,
        code: BLOG_ERROR_CODES.BLOG_NOT_FOUND
      });
    }

    return blog;
  }

  /**
   * Create a new blog post
   */
  async createBlog(blogData, authorId) {
    const { title, slug: customSlug, content, summary, thumbnail, status = 'DRAFT', tags } = blogData;

    // Check slug uniqueness or generate one
    let slug = customSlug;
    if (slug) {
      const existing = await blogPostRepository.findOne({ slug });
      if (existing) {
        throw new BlogServiceError({
          message: 'Slug của bài viết đã tồn tại',
          statusCode: 400,
          code: BLOG_ERROR_CODES.BLOG_SLUG_ALREADY_EXISTS
        });
      }
    } else {
      slug = await this._generateUniqueSlug(title);
    }

    const blog = await blogPostRepository.create({
      title,
      slug,
      content,
      summary,
      thumbnail,
      status,
      tags,
      authorId
    }, {
      include: { author: { select: { id: true, name: true, email: true } } }
    });

    // Sync to Elasticsearch
    await SearchService.indexDocument('blogs', blog.id, {
      title: blog.title,
      content: blog.content,
      summary: blog.summary,
      thumbnail: blog.thumbnail,
      status: blog.status.toLowerCase(),
      tags: blog.tags,
      slug: blog.slug,
      authorId: blog.authorId,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt
    });

    return blog;
  }

  /**
   * Update an existing blog post
   */
  async updateBlog(id, blogData) {
    // Verify blog exists
    const blog = await this.getBlogById(id);

    const { title, slug: customSlug, content, summary, thumbnail, status, tags } = blogData;

    let slug = customSlug;
    if (slug && slug !== blog.slug) {
      const existing = await blogPostRepository.findOne({ slug });
      if (existing && existing.id !== id) {
        throw new BlogServiceError({
          message: 'Slug của bài viết đã tồn tại',
          statusCode: 400,
          code: BLOG_ERROR_CODES.BLOG_SLUG_ALREADY_EXISTS
        });
      }
    } else if (title && title !== blog.title && !customSlug) {
      // If title changes but slug was not customized, generate a new unique slug
      slug = await this._generateUniqueSlug(title, id);
    }

    const updatePayload = {
      title,
      slug,
      content,
      summary,
      thumbnail,
      status,
      tags
    };

    // Remove undefined fields
    Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

    const updatedBlog = await blogPostRepository.update(id, updatePayload, {
      include: { author: { select: { id: true, name: true, email: true } } }
    });

    // Update index in Elasticsearch
    await SearchService.indexDocument('blogs', updatedBlog.id, {
      title: updatedBlog.title,
      content: updatedBlog.content,
      summary: updatedBlog.summary,
      thumbnail: updatedBlog.thumbnail,
      status: updatedBlog.status.toLowerCase(),
      tags: updatedBlog.tags,
      slug: updatedBlog.slug,
      authorId: updatedBlog.authorId,
      createdAt: updatedBlog.createdAt,
      updatedAt: updatedBlog.updatedAt
    });

    return updatedBlog;
  }

  /**
   * Delete a blog post
   */
  async deleteBlog(id) {
    // Verify blog exists
    await this.getBlogById(id);

    await blogPostRepository.delete(id);

    // Remove from Elasticsearch
    await SearchService.deleteDocument('blogs', id);

    return true;
  }
}

module.exports = new BlogService();
