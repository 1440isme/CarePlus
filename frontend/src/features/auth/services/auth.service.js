import axiosInstance from '../../../shared/services/axios.instance.js';
import { AUTH_API_PATHS } from '../types/auth.types.js';

const AUTH_REQUEST_CONFIG = {
  withCredentials: true,
};

async function post(path, payload) {
  const response = await axiosInstance.post(path, payload, AUTH_REQUEST_CONFIG);
  return response.data;
}

export function register(payload) {
  return post(AUTH_API_PATHS.register, payload);
}

export function login(payload) {
  return post(AUTH_API_PATHS.login, payload);
}

export function verifyEmail(payload) {
  return post(AUTH_API_PATHS.verifyEmail, payload);
}

export function resendVerificationOtp(payload) {
  return post(AUTH_API_PATHS.resendVerificationOtp, payload);
}

export function forgotPassword(payload) {
  return post(AUTH_API_PATHS.forgotPassword, payload);
}

export function resetPassword(payload) {
  return post(AUTH_API_PATHS.resetPassword, payload);
}

export async function refreshToken() {
  const response = await axiosInstance.post(AUTH_API_PATHS.refresh, undefined, {
    ...AUTH_REQUEST_CONFIG,
    skipAuthRefresh: true,
  });
  return response.data;
}

export async function logout() {
  const response = await axiosInstance.post(AUTH_API_PATHS.logout, undefined, {
    ...AUTH_REQUEST_CONFIG,
    skipAuthRefresh: true,
  });
  return response.data;
}
