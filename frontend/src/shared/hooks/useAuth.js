import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useAuth() {
  const auth = useSelector((state) => state.auth);

  return useMemo(() => ({
    user: auth.user,
    role: auth.role,
    accessToken: auth.accessToken,
    isAuthenticated: auth.isAuthenticated,
  }), [auth.accessToken, auth.isAuthenticated, auth.role, auth.user]);
}
