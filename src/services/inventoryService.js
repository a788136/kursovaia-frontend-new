// src/services/inventoryService.js
// Сервис на fetch; использует Bearer-токен, если он передан.
// База берётся из VITE_API_URL (без конечного слэша) или из относительного пути.

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function url(path) {
  if (!API_BASE) return path;            // относительный путь (через прокси / ту же origin)
  return `${API_BASE}${path}`;           // абсолютный к бекенду
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  // 204/304 может быть без тела
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
    });
    return handle(res);
  },

  async getById(id) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(id)}`), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  async create(payload, token) {
    const res = await fetch(url('/inventories'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify(payload),
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
    });
    return handle(res);
  },
};
