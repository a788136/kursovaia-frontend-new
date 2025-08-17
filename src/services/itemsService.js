// src/services/itemsService.js
// В точности как твой inventoryService по стилю: fetch + опц. Bearer-токен.

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

export const itemsService = {
  // Алиас для совместимости: itemsService.list(...) === getAll(...)
  async list(inventoryId, params = {}, token) {
    return this.getAll(inventoryId, params, token);
  },

  async getAll(inventoryId, params = {}, token) {
    // очищаем пустые параметры, чтобы URL был аккуратным
    const clean = {};
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      clean[k] = v;
    });
    const qs = new URLSearchParams(clean).toString();

    const res = await fetch(
      url(`/inventories/${encodeURIComponent(inventoryId)}/items${qs ? `?${qs}` : ''}`),
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...authHeaders(token),
        },
      }
    );
    return handle(res);
  },

  // НУЖНО для страницы /items/:itemId
  async get(itemId, token) {
    const res = await fetch(url(`/items/${encodeURIComponent(itemId)}`), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeaders(token),
      },
    });
    return handle(res);
  },

  async create(inventoryId, payload, token) {
    const res = await fetch(url(`/inventories/${encodeURIComponent(inventoryId)}/items`), {
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

  // Для оптимистической блокировки передаём { version, ...patch }
  async update(itemId, payload, token) {
    const res = await fetch(url(`/items/${encodeURIComponent(itemId)}`), {
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

  async remove(itemId, token) {
    const res = await fetch(url(`/items/${encodeURIComponent(itemId)}`), {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...authHeaders(token),
      },
    });
    return handle(res);
  },

  async bulkRemove(itemIds = [], token) {
    // Просто последовательные DELETE (без отдельного бэкенд-эндпойнта)
    for (const id of itemIds) {
      try { await this.remove(id, token); } catch (_) {}
    }
    return true;
  },
};
