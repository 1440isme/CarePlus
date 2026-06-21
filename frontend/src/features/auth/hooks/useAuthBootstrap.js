import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { APP_ROUTES } from '../../../shared/constants/routes.js';
import { refreshToken } from '../services/auth.service.js';
import { clearAuth, finishAuthHydration, setCredentials } from '../store/auth.slice.js';
import {
  clearAuthSession,
  getRememberMePreference,
  persistAuthSession,
  readStoredAccessToken,
  readStoredUser,
} from '../store/auth.storage.js';

function hasStoredAuthSnapshot() {
  return Boolean(readStoredAccessToken() || readStoredUser() || getRememberMePreference());
}

function shouldAttemptBootstrapRefresh() {
  if (hasStoredAuthSnapshot()) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const currentPathname = window.location.pathname || '/';

  return currentPathname.startsWith(APP_ROUTES.patientRoot)
    || currentPathname.startsWith('/portal/');
}

export function useAuthBootstrap() {
  const dispatch = useDispatch();
  const isHydrated = useSelector((state) => state.auth.isHydrated);

  useEffect(() => {
    if (isHydrated) {
      return;
    }

    let isMounted = true;

    const bootstrapAuthSession = async () => {
      if (!shouldAttemptBootstrapRefresh()) {
        dispatch(finishAuthHydration());
        return;
      }

      try {
        const response = await refreshToken();
        const user = response?.data?.user ?? null;
        const accessToken = response?.data?.accessToken ?? null;

        if (!isMounted || !user || !accessToken) {
          return;
        }

        const rememberMe = getRememberMePreference();
        persistAuthSession({
          user,
          accessToken,
          rememberMe,
        });

        dispatch(
          setCredentials({
            user,
            accessToken,
          }),
        );
      } catch {
        if (!isMounted) {
          return;
        }

        clearAuthSession();
        dispatch(clearAuth());
      } finally {
        if (isMounted) {
          dispatch(finishAuthHydration());
        }
      }
    };

    bootstrapAuthSession();

    return () => {
      isMounted = false;
    };
  }, [dispatch, isHydrated]);
}
