const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';
const AUTH_USER_STORAGE_KEY = 'authUser';
const REMEMBER_ME_STORAGE_KEY = 'rememberMe';

function getSafeStorage(storageType) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return storageType === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function readStoredValue(key, storageType) {
  const storage = getSafeStorage(storageType);

  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStoredValue(key, value, storageType) {
  const storage = getSafeStorage(storageType);

  try {
    storage?.setItem(key, value);
  } catch {
    // Ignore storage write errors to keep auth flow functional in restricted environments.
  }
}

function removeStoredValue(key, storageType) {
  const storage = getSafeStorage(storageType);

  try {
    storage?.removeItem(key);
  } catch {
    // Ignore storage removal errors.
  }
}

export function getRememberMePreference() {
  return readStoredValue(REMEMBER_ME_STORAGE_KEY, 'local') === 'true';
}

export function persistAuthSession({ user, accessToken, rememberMe }) {
  clearAuthSession();

  const storageType = rememberMe ? 'local' : 'session';
  writeStoredValue(ACCESS_TOKEN_STORAGE_KEY, accessToken, storageType);
  writeStoredValue(AUTH_USER_STORAGE_KEY, JSON.stringify(user), storageType);
  writeStoredValue(REMEMBER_ME_STORAGE_KEY, rememberMe ? 'true' : 'false', 'local');
}

export function clearAuthSession() {
  removeStoredValue(ACCESS_TOKEN_STORAGE_KEY, 'local');
  removeStoredValue(AUTH_USER_STORAGE_KEY, 'local');
  removeStoredValue(ACCESS_TOKEN_STORAGE_KEY, 'session');
  removeStoredValue(AUTH_USER_STORAGE_KEY, 'session');
  removeStoredValue(REMEMBER_ME_STORAGE_KEY, 'local');
}

export function readStoredAccessToken() {
  return readStoredValue(ACCESS_TOKEN_STORAGE_KEY, 'local')
    ?? readStoredValue(ACCESS_TOKEN_STORAGE_KEY, 'session');
}

export function readStoredUser() {
  const storedUser = readStoredValue(AUTH_USER_STORAGE_KEY, 'local')
    ?? readStoredValue(AUTH_USER_STORAGE_KEY, 'session');

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}
