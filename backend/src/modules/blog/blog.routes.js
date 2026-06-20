const express = require('express');
const BlogController = require('./blog.controller');
const {
  validateListBlogs,
  validateBlogSlug,
  validateBlogId,
  validateCreateBlog,
  validateUpdateBlog,
} = require('./blog.validator');
const { BLOG_ROUTE_PATHS } = require('./blog.types');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { USER_ROLES } = require('../../shared/constants/roles');

const router = express.Router();

// Admin routes
router.get(
  BLOG_ROUTE_PATHS.ADMIN_ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateListBlogs,
  BlogController.listAdminBlogs,
);

router.get(
  BLOG_ROUTE_PATHS.ADMIN_DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateBlogId,
  BlogController.getAdminBlogById,
);

router.post(
  BLOG_ROUTE_PATHS.ADMIN_ROOT,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateCreateBlog,
  BlogController.createBlog,
);

router.patch(
  BLOG_ROUTE_PATHS.ADMIN_DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateBlogId,
  validateUpdateBlog,
  BlogController.updateBlog,
);

router.delete(
  BLOG_ROUTE_PATHS.ADMIN_DETAIL,
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateBlogId,
  BlogController.deleteBlog,
);

// Public routes
router.get(
  BLOG_ROUTE_PATHS.ROOT,
  validateListBlogs,
  BlogController.listPublicBlogs,
);

router.get(
  BLOG_ROUTE_PATHS.DETAIL,
  validateBlogSlug,
  BlogController.getPublicBlogBySlug,
);

module.exports = router;
