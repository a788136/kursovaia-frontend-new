// src/services/inventoryService.js
// Используем ваш http (axios-инстанс с JWT и базовым URL)
import http from '../api/http';

// ⚠️ На бэке пока есть публичный /inventories/latest, полноценного /inventories (все) может не быть.
// Для списка "всех" пока используем latest с большим лимитом.
const ALL_LIMIT = 500;

export const inventoryService = {
  // Список для таблицы (временно через /inventories/latest)
  async getAll() {
    const { data } = await http.get(`/inventories/latest?limit=${ALL_LIMIT}`);
    return data;
  },

  async getLatest(limit = 10) {
    const { data } = await http.get(`/inventories/latest?limit=${limit}`);
    return data;
  },

  async getTop() {
    const { data } = await http.get('/inventories/top');
    return data;
  },

  async getTags() {
    const { data } = await http.get('/tags');
    return data;
  },

  // Заготовки под CRUD (могут вернуть 404, если бэк еще не готов)
  async getById(id) {
    const { data } = await http.get(`/inventories/${id}`);
    return data;
  },

  async create(payload) {
    const { data } = await http.post('/inventories', payload);
    return data;
  },

  async update(id, payload) {
    const { data } = await http.put(`/inventories/${id}`, payload);
    return data;
  },

  async remove(id) {
    const { data } = await http.delete(`/inventories/${id}`);
    return data;
  },
};
