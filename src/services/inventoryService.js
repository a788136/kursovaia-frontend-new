// src/services/inventoryService.js
// Универсальный fetch-сервис для /inventories и смежных публичных эндпойнтов.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function url(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

async function handle(res) {
  if (res.status === 204 || res.status === 304) return null;
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const inventoryService = {
  /**
   * Список инвентаризаций (публично).
   * params: { owner, q, tag, category, limit, page }
   */
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(url(`/inventories${qs ? `?${qs}` : ''}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  /** Создать (требует JWT — эта функция оставлена как в проекте) */
  async create(payload, token) {
    const res = await fetch(url(`/inventories`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  /** Обновить (JWT) */
  async update(id, payload, token) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  /** Удалить (JWT) */
  async remove(id, token) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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

  /** Последние (публично) */
  async getLatest(limit = 12) {
    const qs = new URLSearchParams({ limit: String(limit) }).toString();
    const res = await fetch(url(`/inventories/latest?${qs}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  /** Топ по количеству items (публично) */
  async getTop() {
    const res = await fetch(url(`/inventories/top`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
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
