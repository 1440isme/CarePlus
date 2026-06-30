import axios from 'axios';
import { store } from '../../app/store.js';
import { clearAuth, setCredentials } from '../../features/auth/store/auth.slice.js';
import { readStoredAccessToken } from '../../features/auth/store/auth.storage.js';
import {
  clearAuthSession,
  getRememberMePreference,
  persistAuthSession,
} from '../../features/auth/store/auth.storage.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const AUTH_REFRESH_PATH = '/auth/refresh';

let refreshPromise = null;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

function formatAxiosError(error) {
  return {
    message: error.response?.data?.error?.message || 'Có lỗi xảy ra trên hệ thống',
    code: error.response?.data?.error?.code || 'UNEXPECTED_ERROR',
    status: error.response?.status || 500,
    details: error.response?.data?.error?.details || null,
  };
}

function getAccessToken() {
  return store.getState()?.auth?.accessToken || readStoredAccessToken();
}

function isRefreshRequest(config) {
  const url = config?.url || '';
  return typeof url === 'string' && url.includes(AUTH_REFRESH_PATH);
}

function shouldTryRefresh(error) {
  const originalRequest = error.config;
  const status = error.response?.status;
  const code = error.response?.data?.error?.code;

  if (!originalRequest || originalRequest.skipAuthRefresh || originalRequest._retry) {
    return false;
  }

  if (isRefreshRequest(originalRequest)) {
    return false;
  }

  if (status !== 401) {
    return false;
  }

  return [
    'AUTH_TOKEN_MISSING',
    'INVALID_AUTH_HEADER',
    'INVALID_ACCESS_TOKEN',
    'ACCESS_TOKEN_EXPIRED',
    'ACCESS_TOKEN_REVOKED',
  ].includes(code);
}

async function requestNewAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post(AUTH_REFRESH_PATH, undefined, {
        withCredentials: true,
        skipAuthRefresh: true,
      })
      .then((response) => {
        const accessToken = response?.data?.data?.accessToken ?? null;
        const user = response?.data?.data?.user ?? null;

        if (!accessToken || !user) {
          throw new Error('Missing refresh payload');
        }

        const rememberMe = getRememberMePreference();
        persistAuthSession({
          user,
          accessToken,
          rememberMe,
        });

        store.dispatch(
          setCredentials({
            user,
            accessToken,
          }),
        );

        return accessToken;
      })
      .catch((error) => {
        clearAuthSession();
        store.dispatch(clearAuth());
        throw formatAxiosError(error);
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Request Interceptor: Attach Auth Token if exists in localStorage/cookies
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
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
  async (error) => {
    if (shouldTryRefresh(error)) {
      try {
        const newAccessToken = await requestNewAccessToken();
        const originalRequest = error.config;
        originalRequest._retry = true;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(formatAxiosError(error));
  }
);

export default axiosInstance;
