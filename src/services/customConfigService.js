// src/services/customConfigService.js
// Хелперы для сохранения полей и формата кастомного ID.
// Исправлено: по умолчанию подставляем Bearer JWT из localStorage.

import { getToken } from '../api/token';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

function base(url) {
  if (!API_BASE) return url;
  return `${API_BASE}${url}`;
}

function authHeaders() {
  const t = getToken?.();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function saveFields({ inventoryId, fields }) {
  if (!inventoryId) throw new Error('inventoryId is required');
  const res = await fetch(base(`/inventories/${encodeURIComponent(inventoryId)}/fields`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `Failed to save fields: ${res.status}`);
  return res.json();
}

export async function saveCustomIdFormat({ inventoryId, format }) {
  if (!inventoryId) throw new Error('inventoryId is required');
  const res = await fetch(base(`/inventories/${encodeURIComponent(inventoryId)}/custom-id`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ format }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `Failed to save format: ${res.status}`);
  return res.json();
}

export async function previewCustomId({ inventoryId, format, sampleFields }) {
  const res = await fetch(base(`/inventories/${encodeURIComponent(inventoryId)}/custom-id/preview`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // превью можно делать и без авторизации, но пусть будет единообразно:
      ...authHeaders(),
    },
    body: JSON.stringify({ format, sampleFields }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || `Failed to preview: ${res.status}`);
  return res.json(); // { preview: "..." }
}
