import axios from 'axios';
import { readStoredAccessToken } from '../../features/auth/store/auth.storage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth Token if exists in localStorage/cookies
axiosInstance.interceptors.request.use(
  (config) => {
    const token = readStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Standardize error formatting from CarePlus backend
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Standardize error envelope
    const formattedError = {
      message: error.response?.data?.error?.message || 'Có lỗi xảy ra trên hệ thống',
      code: error.response?.data?.error?.code || 'UNEXPECTED_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.error?.details || null,
    };
    return Promise.reject(formattedError);
  }
);

export default axiosInstance;
