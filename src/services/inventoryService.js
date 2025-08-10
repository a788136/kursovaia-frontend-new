const API_BASE_INV = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const ct = res.headers.get('content-type') || '';
  let body = null;
  if (ct.includes('application/json')) {
    try { body = await res.json(); } catch {}
  } else {
    try { body = await res.text(); } catch {}
  }
  if (!res.ok) {
    const msg = (body && (body.error || body.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // Возвращаем data|items|inventory|сам объект/массив
  if (body && typeof body === 'object') {
    if (Array.isArray(body)) return body;
    return body.data ?? body.items ?? body.inventory ?? body;
  }
  return body;
}

export const inventoryService = {
  async getAll() {
    const res = await fetch(`${API_BASE_INV}/inventories`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return handle(res);
  },

  async getById(id, token) {
    const res = await fetch(`${API_BASE_INV}/inventories/${id}`, {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders(token) },
    });
    return handle(res);
  },

  async create(payload, token) {
    const res = await fetch(`${API_BASE_INV}/inventories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  async update(id, payload, token) {
    const res = await fetch(`${API_BASE_INV}/inventories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    });
    return handle(res);
  },

  async remove(id, token) {
    const res = await fetch(`${API_BASE_INV}/inventories/${id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', ...authHeaders(token) },
    });
    return handle(res);
  },
};
