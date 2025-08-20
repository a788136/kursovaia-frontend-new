// src/services/inventoryService.js
// Универсальный fetch-сервис для /inventories и смежных публичных эндпойнтов.
// Исправлено: защищённые методы автоматически подставляют Bearer JWT из localStorage.

import { getToken } from '../api/token';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function url(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

function authHeaders() {
  const t = getToken?.();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle(res) {
  if (res.status === 204 || res.status === 304) return null;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const reason = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(reason);
  }
  return data;
}

export const inventoryService = {
  /** Список (публично) */
  async getAll({ q = '', limit = 20, skip = 0 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (limit != null) params.set('limit', String(limit));
    if (skip != null) params.set('skip', String(skip));
    const res = await fetch(url(`/inventories?${params.toString()}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  /** Последние (публично) */
  async getLatest(limit = 10) {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', String(limit));
    const res = await fetch(url(`/inventories/latest?${params.toString()}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  /** Популярные (публично) */
  async getTop(limit = 5) {
    const params = new URLSearchParams();
    if (limit != null) params.set('limit', String(limit));
    const res = await fetch(url(`/inventories/top?${params.toString()}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  /** Детальная (публично) */
  async getById(id) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  /** Создать (JWT) */
  async create(payload) {
    const res = await fetch(url(`/inventories`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload || {}),
    });
    return handle(res);
  },

  /** Обновить (JWT) */
  async update(id, payload) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'PUT', // роут на бэке ожидает PUT
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(),
      },
      body: JSON.stringify(payload || {}),
    });
    return handle(res);
  },

  /** Удалить (JWT) */
  async remove(id) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...authHeaders(),
      },
    });
    return handle(res);
  },

  /** Уникальные теги (публично) */
  async getTags() {
    const res = await fetch(url(`/tags`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },
};
