import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../shared/hooks/useAuth.js';
import { APP_ROUTES, ROLE_HOME_ROUTES } from '../shared/constants/routes.js';
import { buildRedirectPath, resolvePostLoginRedirect } from '../features/auth/utils/post-login-redirect.js';

export function GuestOnlyRoute() {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (isAuthenticated && role) {
    const redirectParam = new URLSearchParams(location.search).get('redirect');
    const nextPath = resolvePostLoginRedirect({
      role,
      stateFrom: location.state?.from,
      redirectParam,
    });

    return <Navigate to={nextPath || ROLE_HOME_ROUTES[role] || APP_ROUTES.patientRoot} replace />;
  }

  return <Outlet />;
}

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const redirectPath = buildRedirectPath(location);

    return (
      <Navigate
        to={redirectPath ? `${APP_ROUTES.login}?redirect=${encodeURIComponent(redirectPath)}` : APP_ROUTES.login}
        state={{ from: { pathname: location.pathname, search: location.search } }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME_ROUTES[role] || APP_ROUTES.home} replace />;
  }

  return <Outlet />;
}
