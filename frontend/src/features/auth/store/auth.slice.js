import { createSlice } from '@reduxjs/toolkit';
import { readStoredAccessToken, readStoredUser } from './auth.storage.js';

const storedUser = readStoredUser();
const storedAccessToken = readStoredAccessToken();

const initialState = {
  user: storedUser,
  accessToken: storedAccessToken,
  role: storedUser?.role ?? null,
  isAuthenticated: Boolean(storedUser && storedAccessToken),
  isHydrated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload;

      state.user = user;
      state.accessToken = accessToken;
      state.role = user?.role ?? null;
      state.isAuthenticated = Boolean(user && accessToken);
      state.isHydrated = true;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isHydrated = true;
    },
    finishAuthHydration(state) {
      state.isHydrated = true;
    },
  },
});

export const { setCredentials, clearAuth, finishAuthHydration } = authSlice.actions;
export default authSlice.reducer;
