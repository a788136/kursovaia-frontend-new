// src/services/authService.js
import http from '../api/http';
import { setToken, getToken, clearToken } from '../api/token';

/**
 * Небольшая обёртка над авторизацией.
 * - loginPassword: классический email/password (если бэкенд это поддерживает)
 * - me: получить текущего пользователя по JWT/сессии
 * - logout: очистить токен (и локальное состояние)
 * - buildOAuthUrl: собрать URL провайдера (редирект вернётся на #/oauth?token=...)
 */
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function buildRedirectHash() {
  // Бэкенд после OAuth должен редиректить на <origin> + "/#/oauth?token=..."
  return `${window.location.origin}/#/oauth`;
}

/** Универсальный извлекатель токена из ответа бэкенда */
function extractToken(resp) {
  const data = resp?.data ?? resp;

  // 1) самые частые поля
  let token = data?.token || data?.access_token || data?.jwt;

  // 2) вложенные обёртки
  if (!token && data?.data) {
    token = data.data.token || data.data.access_token || data.data.jwt;
  }

  // 3) заголовки (на всякий случай)
  if (!token && resp?.headers) {
    const hAuth = resp.headers['authorization'] || resp.headers['Authorization'];
    const hX = resp.headers['x-auth-token'] || resp.headers['X-Auth-Token'];
    if (hAuth && typeof hAuth === 'string') {
      // "Bearer <token>" или просто "<token>"
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
    // Если бэкенд ставит httpOnly cookie — с ним нужен withCredentials
    let resp;
    try {
      resp = await http.post('/auth/login', { email, password }, { withCredentials: true });
    } catch (e) {
      // Пробрасываем понятное сообщение
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        'Login failed';
      throw new Error(msg);
    }

    // Пробуем достать токен из разных мест
    const token = extractToken(resp);

    if (token) {
      setToken(token);
      // сразу синхронизируем пользователя
      const me = await this.me();
      return me;
    }

    // Фолбэк: возможно, логин установил cookie-сессию (без токена в payload)
    // Проверим /auth/me; если аутентифицирован — сохраняем спец. маркер,
    // чтобы ваш App.jsx (который проверяет наличие токена) продолжал обычный флоу.
    try {
      const me = await this.me();
      if (me?.authenticated) {
        setToken('cookie-session'); // маркер, реального смысла вне клиента не несёт
        return me;
      }
    } catch {
      // ignore — обработаем общей ошибкой ниже
    }

    // Если дошли сюда — реально не получили способ авторизоваться
    throw new Error('Token not received');
  },

  /** Текущий пользователь по JWT/сессии */
  async me() {
    const { data } = await http.get('/auth/me', { withCredentials: true });
    if (!data?.authenticated) return { authenticated: false, user: null };
    return data;
  },

  /** Локальный логаут (очистка токена в хранилище клиента) */
  logout() {
    clearToken();
  },

  /** Сборка OAuth-URL (Google/GitHub и т.п.) */
  buildOAuthUrl(provider) {
    const base = (import.meta.env.VITE_AUTH_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
    const redirect = buildRedirectHash();
    const path = `/auth/${encodeURIComponent(provider)}?redirect=${encodeURIComponent(redirect)}`;
    return `${base}${path}`;
  },
};
