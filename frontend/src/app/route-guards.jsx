import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth.js';
import { APP_ROUTES, ROLE_HOME_ROUTES } from '../shared/constants/routes.js';

export function GuestOnlyRoute() {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    return <Navigate to={ROLE_HOME_ROUTES[role] || APP_ROUTES.patientRoot} replace />;
  }

  return <Outlet />;
}

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`${APP_ROUTES.login}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME_ROUTES[role] || APP_ROUTES.home} replace />;
  }

  return <Outlet />;
}
