// src/services/discussionService.js
import http from '../api/http';

// Все пути — под /api (см. http baseURL)

export const discussionService = {
  async list(inventoryId, { limit = 200, after } = {}) {
    const params = {};
    if (limit) params.limit = limit;
    if (after) params.after = new Date(after).toISOString();
    const { data } = await http.get(`/inventories/${encodeURIComponent(inventoryId)}/discussion`, { params });
    return data;
  },

  async create(inventoryId, text) {
    const { data } = await http.post(`/inventories/${encodeURIComponent(inventoryId)}/discussion`, { text });
    return data;
  },
};
