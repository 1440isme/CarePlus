import { createContext, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useMemo } from 'react';

// Auth selectors
export const useApp = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const state = useMemo(() => ({
    currentUser: auth.user,
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken,
    role: auth.role,
  }), [auth.user, auth.isAuthenticated, auth.accessToken, auth.role]);

  const logout = async () => {
    const { logout: logoutService } = await import('../features/auth/services/auth.service.js');
    const { clearAuth } = await import('../features/auth/store/auth.slice.js');
    const { clearAuthSession } = await import('../features/auth/store/auth.storage.js');
    
    try {
      await logoutService();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthSession();
      dispatch(clearAuth());
    }
  };

  return { ...state, logout, dispatch };
};

const AppContext = createContext(null);

export const AppProvider = AppContext.Provider;

export { AppContext };