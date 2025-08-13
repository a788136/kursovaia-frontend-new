// src/services/likeService.js

const API_BASE = '/api';

async function request(method, url, token, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }
  // некоторые эндпоинты возвращают пусто
  try { return await res.json(); } catch { return {}; }
}

async function getLikes(itemId, token) {
  const data = await request('GET', `/items/${encodeURIComponent(itemId)}/likes`, token);
  // ожидаем { count, liked }, но подстрахуемся
  return {
    count: typeof data.count === 'number' ? data.count : 0,
    liked: !!data.liked,
  };
}

async function like(itemId, token) {
  return request('POST', `/items/${encodeURIComponent(itemId)}/like`, token);
}

async function unlike(itemId, token) {
  return request('DELETE', `/items/${encodeURIComponent(itemId)}/like`, token);
}

async function toggle(itemId, liked, token) {
  return liked ? unlike(itemId, token) : like(itemId, token);
}

export const likeService = { getLikes, like, unlike, toggle };
export default likeService;
