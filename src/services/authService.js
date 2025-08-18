// src/services/authService.js
import http from '../api/http';
import { setToken, getToken, clearToken } from '../api/token';

/**
 * Небольшая обёртка над авторизацией.
 * - loginPassword: классический email/password (если бэкенд это поддерживает)
 * - me: получить текущего пользователя по JWT
 * - logout: очистить токен
 * - buildOAuthUrl: собрать URL провайдера (редирект вернётся на #/oauth?token=...)
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function buildRedirectHash() {
  // Бэкенд после OAuth должен редиректить на <origin> + "/#/oauth?token=..."
  return `${window.location.origin}/#/oauth`;
}

export const authService = {
  async loginPassword(email, password) {
    // Если на бэке нет этого эндпоинта — вернёт 404, мы поймаем и покажем сообщение
    const { data } = await http.post('/auth/login', { email, password });
    // Ожидаем { token, user } (либо только { token }), поэтому подстрахуемся:
    const token = data?.token || data?.access_token || data?.jwt;
    if (!token) throw new Error('Token not received');
    setToken(token);
    // Синхронизируем пользователя
    const me = await this.me();
    return me;
  },

  async me() {
    const { data } = await http.get('/auth/me');
    if (!data?.authenticated) return { authenticated: false, user: null };
    return data;
  },

  logout() {
    clearToken();
  },

  buildOAuthUrl(provider) {
    // База — VITE_AUTH_URL или VITE_API_URL
    const base = (import.meta.env.VITE_AUTH_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const redirect = buildRedirectHash();

    // На бэкендах обычно используются пути вида:
    //   /auth/google?redirect=<...>   или   /auth/github?redirect=<...>
    // Если у вас другой путь — поправьте ниже один раз.
    const path = `/auth/${encodeURIComponent(provider)}?redirect=${encodeURIComponent(redirect)}`;

    return `${base}${path}`;
  },
};
