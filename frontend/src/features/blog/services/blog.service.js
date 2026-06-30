import axiosInstance from '../../../shared/services/axios.instance.js';

function buildQueryParams(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams;
}

export async function getPublicBlogs(params = {}) {
  const searchParams = buildQueryParams(params);
  const queryString = searchParams.toString();
  const url = queryString ? `/blogs?${queryString}` : '/blogs';
  const response = await axiosInstance.get(url);
  return response.data;
}

export async function getPublicBlogBySlug(slug) {
  const response = await axiosInstance.get(`/blogs/${slug}`);
  return response.data;
}

export async function getAdminBlogs(params = {}) {
  const searchParams = buildQueryParams(params);
  const queryString = searchParams.toString();
  const url = queryString ? `/blogs/admin?${queryString}` : '/blogs/admin';
  const response = await axiosInstance.get(url);
  return response.data;
}

export async function getAdminBlogById(id) {
  const response = await axiosInstance.get(`/blogs/admin/${id}`);
  return response.data;
}

export async function createBlog(payload) {
  const response = await axiosInstance.post('/blogs/admin', payload);
  return response.data;
}

export async function updateBlog(id, payload) {
  const response = await axiosInstance.patch(`/blogs/admin/${id}`, payload);
  return response.data;
}

export async function deleteBlog(id) {
  const response = await axiosInstance.delete(`/blogs/admin/${id}`);
  return response.data;
}
