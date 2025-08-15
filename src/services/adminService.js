// src/services/adminService.js
import http from '../api/http';

export const adminService = {
  async listUsers({ q = '', page = 1, limit = 20 } = {}) {
    const { data } = await http.get('/admin/users', { params: { q, page, limit } });
    return data; // { items, total, page, limit }
  },
  async setBlocked(userId, blocked) {
    const { data } = await http.patch(`/admin/users/${encodeURIComponent(userId)}/block`, { blocked });
    return data; // обновлённый пользователь
  },
  async setAdmin(userId, isAdmin) {
    const { data } = await http.patch(`/admin/users/${encodeURIComponent(userId)}/admin`, { isAdmin });
    return data; // обновлённый пользователь
  },
};
