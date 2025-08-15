// src/services/accessService.js
import http from '../api/http';

export const accessService = {
  async list(inventoryId) {
    const { data } = await http.get(`/inventories/${encodeURIComponent(inventoryId)}/access`);
    return data;
  },
  async update(inventoryId, payload) {
    const { data } = await http.put(`/inventories/${encodeURIComponent(inventoryId)}/access`, payload);
    return data;
  },
};
