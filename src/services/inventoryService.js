// src/services/inventoryService.js
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function url(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

function authHeaders(token) {
  return token && token !== 'cookie-session' ? { Authorization: `Bearer ${token}` } : {};
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
  async getAll(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(url(`/inventories${qs ? `?${qs}` : ''}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    return handle(res);
  },

  async create(payload, token) {
    const res = await fetch(url(`/inventories`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    return handle(res);
  },

  async update(id, payload, token) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
    return handle(res);
  },

  async remove(id, token) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...authHeaders(token),
      },
      credentials: 'include',
    });
    return handle(res);
  },

  async getById(id) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    return handle(res);
  },

  async getLatest(limit = 12) {
    const qs = new URLSearchParams({ limit: String(limit) }).toString();
    const res = await fetch(url(`/inventories/latest?${qs}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    return handle(res);
  },

  async getTop() {
    const res = await fetch(url(`/inventories/top`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    return handle(res);
  },

  async getTags() {
    const res = await fetch(url(`/tags`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'include',
    });
    return handle(res);
  },
};
