// src/services/usersService.js
import http from '../api/http';

function mapUser(u) {
  if (!u) return u;
  return {
    id: String(u._id || u.id),
    _id: String(u._id || u.id),
    name: u.name || '',
    email: u.email || '',
    avatar: u.avatar || '',
    blocked: !!u.blocked || !!u.isBlocked,
    role: u.role || (u.isAdmin ? 'admin' : 'user'),
  };
}

export const usersService = {
  async search(q, limit = 10) {
    const { data } = await http.get('/users/search', { params: { q, limit } });
    const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    return list.map(mapUser);
  },

  async getById(id) {
    const { data } = await http.get(`/users/${id}`);
    return mapUser(data?.user || data);
  },

  async setRole(id, role) {
    const { data } = await http.put(`/users/${id}/role`, { role });
    return { ok: !!data?.ok, user: mapUser(data?.user || data) };
  },
};
