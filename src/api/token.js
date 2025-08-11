// src/api/token.js
// Единая точка для работы с JWT accessToken в localStorage.

const KEY = 'accessToken';

export function getToken() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {}
}

export function clearToken() {
  try { localStorage.removeItem(KEY); } catch {}
}
