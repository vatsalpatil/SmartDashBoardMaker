/**
 * Auth API helpers – thin wrappers around the /api/auth/* endpoints.
 * The axios instance in api.js automatically attaches the Bearer token.
 */
import api from './api';

export const authApi = {
  /** Register a new account. Returns { access_token, refresh_token, user } */
  signup: async ({ username, email, password, fullName }) => {
    const { data } = await api.post('/auth/signup', {
      username,
      email,
      password,
      full_name: fullName,
    });
    return data;
  },

  /** Login with email + password. Returns { access_token, refresh_token, user } */
  login: async ({ email, password, rememberMe = false }) => {
    const { data } = await api.post('/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    });
    return data;
  },

  /** Logout – tells the server (for future blacklisting). Client must clear tokens. */
  logout: async () => {
    await api.post('/auth/logout').catch(() => {}); // best-effort
  },

  /** Fetch the current user's profile. */
  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  /** Exchange a refresh token for a new token pair. */
  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return data;
  },

  /** Change password. */
  changePassword: async ({ currentPassword, newPassword }) => {
    const { data } = await api.put('/auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return data;
  },
};
