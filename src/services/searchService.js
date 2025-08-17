// src/services/searchService.js
import http from '../api/http';

export const searchService = {
  async search({ q, type = 'all', page = 1, limit = 20 }) {
    const { data } = await http.get('/search', { params: { q, type, page, limit } });
    return data;
  },
};
