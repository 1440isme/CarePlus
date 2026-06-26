import { APP_ROUTES } from '../../../shared/constants/routes.js';
import { AUTH_ROLE_DEFAULT_ROUTES } from '../types/auth.types.js';

const AUTH_PUBLIC_PATHS = new Set([
  APP_ROUTES.login,
  APP_ROUTES.register,
  APP_ROUTES.forgotPassword,
  APP_ROUTES.resetPassword,
  APP_ROUTES.verifyEmail,
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
]);

function stripQueryAndHash(path) {
  return typeof path === 'string' ? path.split(/[?#]/, 1)[0] : '';
}

export function isSafeInternalRedirect(path) {
  return typeof path === 'string'
    && path.startsWith('/')
    && !path.startsWith('//')
    && !path.includes('://');
}

export function buildRedirectPath(locationLike) {
  if (!locationLike?.pathname || !isSafeInternalRedirect(locationLike.pathname)) {
    return null;
  }

  return `${locationLike.pathname}${locationLike.search || ''}`;
}

export function getDefaultRouteByRole(role) {
  return AUTH_ROLE_DEFAULT_ROUTES[role] ?? APP_ROUTES.patientRoot;
}

export function isAuthPublicRoute(path) {
  return AUTH_PUBLIC_PATHS.has(stripQueryAndHash(path));
}

export function isRoleAllowedForRedirect(role, path) {
  if (!isSafeInternalRedirect(path)) {
    return false;
  }

  const pathname = stripQueryAndHash(path);

  if (pathname.startsWith(APP_ROUTES.adminRoot)) {
    return role === 'ADMIN';
  }

  if (pathname.startsWith(APP_ROUTES.doctorRoot)) {
    return role === 'DOCTOR';
  }

  if (pathname.startsWith(APP_ROUTES.receptionistRoot)) {
    return role === 'RECEPTIONIST';
  }

  if (pathname.startsWith(APP_ROUTES.patientRoot)) {
    return role === 'PATIENT';
  }

  return true;
}

export function resolvePostLoginRedirect({ role, stateFrom, redirectParam }) {
  const fallbackPath = getDefaultRouteByRole(role);
  const candidates = [buildRedirectPath(stateFrom), redirectParam];

  for (const candidate of candidates) {
    if (!isSafeInternalRedirect(candidate)) {
      continue;
    }

    if (isAuthPublicRoute(candidate)) {
      continue;
    }

    if (!isRoleAllowedForRedirect(role, candidate)) {
      continue;
    }

    return candidate;
  }

  return fallbackPath;
}
