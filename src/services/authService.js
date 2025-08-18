// src/services/authService.js
import http from '../api/http';
import { setToken, clearToken } from '../api/token';

function buildRedirectHash() {
  // Бэкенд после OAuth должен редиректить на <origin> + "/#/oauth?token=..."
  return `${window.location.origin}/#/oauth`;
}

/** Универсальный извлекатель токена из ответа бэкенда */
function extractToken(resp) {
  const data = resp?.data ?? resp;

  let token =
    data?.accessToken ||
    data?.token ||
    data?.jwt ||
    data?.access_token ||
    null;

  if (!token && data?.data) {
    token =
      data.data.accessToken ||
      data.data.token ||
      data.data.jwt ||
      data.data.access_token ||
      null;
  }

  if (!token && resp?.headers) {
    const hAuth = resp.headers['authorization'] || resp.headers['Authorization'];
    const hX = resp.headers['x-auth-token'] || resp.headers['X-Auth-Token'];
    if (hAuth && typeof hAuth === 'string') {
      token = hAuth.startsWith('Bearer ') ? hAuth.slice(7) : hAuth;
    } else if (hX && typeof hX === 'string') {
      token = hX;
    }
  }

  return token || null;
}

export const authService = {
  /**
   * Email + пароль
   * Возвращает { authenticated, user }
   */
  async loginPassword(email, password) {
    let resp;
    try {
      resp = await http.post('/auth/login', { email, password }, { withCredentials: true });
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Login failed';
      throw new Error(msg);
    }

    const token = extractToken(resp);
    let user = resp?.data?.user || null;

    if (token) {
      setToken(token);
    }

    // если юзер не пришёл — дотянем через /auth/me
    if (!user) {
      try {
        const me = await http.get('/auth/me', { withCredentials: true });
        if (me?.data?.authenticated && me?.data?.user) {
          user = me.data.user;
        }
      } catch (_e) {}
    }

    if (!token && !user) {
      throw new Error('Token not received');
    }

    return { authenticated: !!user, user };
  },

  async me() {
    const { data } = await http.get('/auth/me', { withCredentials: true });
    if (!data?.authenticated) return { authenticated: false, user: null };
    return data;
  },

  logout() {
    clearToken();
  },

  buildOAuthUrl(provider) {
    const base = (import.meta.env.VITE_AUTH_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const redirect = buildRedirectHash();
    const path = `/auth/${encodeURIComponent(provider)}?redirect=${encodeURIComponent(redirect)}`;
    return `${base}${path}`;
  },
};
