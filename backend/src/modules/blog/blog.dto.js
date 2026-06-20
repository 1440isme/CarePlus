function toPublicBlogPostDto(blog) {
  if (!blog) return null;

  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    summary: blog.summary,
    thumbnail: blog.thumbnail,
    tags: blog.tags ? blog.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    createdAt: blog.createdAt,
    author: blog.author ? {
      id: blog.author.id,
      name: blog.author.name
    } : null
  };
}

function toAdminBlogPostDto(blog) {
  if (!blog) return null;

  return {
    id: blog.id,
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    summary: blog.summary,
    thumbnail: blog.thumbnail,
    status: blog.status,
    tags: blog.tags ? blog.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    createdAt: blog.createdAt,
    updatedAt: blog.updatedAt,
    author: blog.author ? {
      id: blog.author.id,
      name: blog.author.name,
      email: blog.author.email
    } : null
  };
}

function toBlogPostListDto(blogs, { isAdmin = false } = {}) {
  if (!Array.isArray(blogs)) return [];
  return blogs.map(blog => isAdmin ? toAdminBlogPostDto(blog) : toPublicBlogPostDto(blog));
}

module.exports = {
  toPublicBlogPostDto,
  toAdminBlogPostDto,
  toBlogPostListDto,
};
