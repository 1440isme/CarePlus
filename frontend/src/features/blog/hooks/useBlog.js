import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPublicBlogs,
  getPublicBlogBySlug,
  getAdminBlogs,
  getAdminBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../services/blog.service.js';

export const BLOG_QUERY_KEYS = {
  all: ['blogs'],
  publicList: (params) => ['blogs', 'public', 'list', params],
  publicDetail: (slug) => ['blogs', 'public', 'detail', slug],
  adminList: (params) => ['blogs', 'admin', 'list', params],
  adminDetail: (id) => ['blogs', 'admin', 'detail', id],
};

export function usePublicBlogs(params, options = {}) {
  return useQuery({
    queryKey: BLOG_QUERY_KEYS.publicList(params),
    queryFn: () => getPublicBlogs(params),
    ...options,
  });
}

export function usePublicBlogBySlug(slug, options = {}) {
  return useQuery({
    queryKey: BLOG_QUERY_KEYS.publicDetail(slug),
    queryFn: () => getPublicBlogBySlug(slug),
    enabled: !!slug,
    ...options,
  });
}

export function useAdminBlogs(params, options = {}) {
  return useQuery({
    queryKey: BLOG_QUERY_KEYS.adminList(params),
    queryFn: () => getAdminBlogs(params),
    ...options,
  });
}

export function useAdminBlogById(id, options = {}) {
  return useQuery({
    queryKey: BLOG_QUERY_KEYS.adminDetail(id),
    queryFn: () => getAdminBlogById(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateBlog(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBlog,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      if (options.onSuccess) options.onSuccess(data);
    },
    ...options,
  });
}

export function useUpdateBlog(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateBlog(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      if (options.onSuccess) options.onSuccess(data);
    },
    ...options,
  });
}

export function useDeleteBlog(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBlog,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      if (options.onSuccess) options.onSuccess(data);
    },
    ...options,
  });
}
