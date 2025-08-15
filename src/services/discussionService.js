// src/services/discussionService.js
// Fetch-based service for discussion endpoints, consistent with other services.
import { getToken } from '../api/token';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function url(path) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  if (res.status === 204 || res.status === 304) return null;
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = isJson ? (data?.error || data?.message) : res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

export const discussionService = {
  async list(inventoryId, { limit = 200, after } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (after) params.set('after', new Date(after).toISOString());
    const res = await fetch(url(`/inventories/${encodeURIComponent(inventoryId)}/discussion?${params.toString()}`), {
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  async create(inventoryId, text, token = getToken()) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(inventoryId)}/discussion`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ text }),
    });
    return handle(res);
  },
};
