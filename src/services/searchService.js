// src/services/searchService.js
import http from '../api/http';

/**
 * Универсальный поиск по бэкенду:
 * GET /api/search?q=xxx&type=all|inventories|items&page=1&limit=20
 */
export async function searchAll({ q, type = 'all', page = 1, limit = 20 }) {
  const resp = await http.get('/search', {
    params: { q, type, page, limit }
  });
  return resp.data;
}
