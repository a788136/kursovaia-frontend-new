let inMemory = null;

export function setToken(t) {
  inMemory = t || null;
  try { localStorage.setItem('accessToken', inMemory || ''); } catch {}
}
export function getToken() {
  if (inMemory) return inMemory;
  try {
    const t = localStorage.getItem('accessToken') || '';
    inMemory = t || null;
    return inMemory;
  } catch { return null; }
}
export function clearToken() {
  inMemory = null;
  try { localStorage.removeItem('accessToken'); } catch {}
}
