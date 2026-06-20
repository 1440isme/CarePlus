const BlogService = require('./blog.service');
const { toPublicBlogPostDto, toAdminBlogPostDto, toBlogPostListDto } = require('./blog.dto');

class BlogController {
  /**
   * List public blog posts (only returns PUBLISHED posts).
   * GET /api/v1/blogs
   */
  async listPublicBlogs(req, res, next) {
    try {
      const result = await BlogService.listBlogs(req.query, { isAdmin: false });
      return res.status(200).json({
        success: true,
        data: toBlogPostListDto(result.data, { isAdmin: false }),
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get public blog post by its slug.
   * GET /api/v1/blogs/:slug
   */
  async getPublicBlogBySlug(req, res, next) {
    try {
      const blog = await BlogService.getBlogBySlug(req.params.slug, { isAdmin: false });
      return res.status(200).json({
        success: true,
        data: toPublicBlogPostDto(blog),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * List all blog posts for administration (DRAFT, PUBLISHED, ARCHIVED).
   * GET /api/v1/blogs/admin
   */
  async listAdminBlogs(req, res, next) {
    try {
      const result = await BlogService.listBlogs(req.query, { isAdmin: true });
      return res.status(200).json({
        success: true,
        data: toBlogPostListDto(result.data, { isAdmin: true }),
        meta: result.meta,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Get blog post detail for admin by ID.
   * GET /api/v1/blogs/admin/:id
   */
  async getAdminBlogById(req, res, next) {
    try {
      const blog = await BlogService.getBlogById(req.params.id);
      return res.status(200).json({
        success: true,
        data: toAdminBlogPostDto(blog),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Create a new blog post (Admin only).
   * POST /api/v1/blogs/admin
   */
  async createBlog(req, res, next) {
    try {
      const blog = await BlogService.createBlog(req.body, req.user.userId);
      return res.status(201).json({
        success: true,
        data: toAdminBlogPostDto(blog),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Update an existing blog post (Admin only).
   * PATCH /api/v1/blogs/admin/:id
   */
  async updateBlog(req, res, next) {
    try {
      const blog = await BlogService.updateBlog(req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data: toAdminBlogPostDto(blog),
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Delete a blog post (Admin only).
   * DELETE /api/v1/blogs/admin/:id
   */
  async deleteBlog(req, res, next) {
    try {
      await BlogService.deleteBlog(req.params.id);
      return res.status(200).json({
        success: true,
        data: {
          message: 'Bài viết đã được xóa thành công',
        },
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new BlogController();
