import { createSlice } from '@reduxjs/toolkit';

const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
const AUTH_USER_STORAGE_KEY = 'authUser';

function readStoredUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function readStoredAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

const storedUser = readStoredUser();
const storedAccessToken = readStoredAccessToken();

const initialState = {
  user: storedUser,
  accessToken: storedAccessToken,
  role: storedUser?.role ?? null,
  isAuthenticated: Boolean(storedUser && storedAccessToken),
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
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.role = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, clearAuth } = authSlice.actions;
export default authSlice.reducer;
