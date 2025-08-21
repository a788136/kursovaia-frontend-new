// src/services/usersService.js
import http from '../api/http';

// Унифицированное приведение полей пользователя
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
  // Поиск пользователей для автокомплита
  async search(q, limit = 10) {
    const { data } = await http.get('/users/search', { params: { q, limit } });
    // Поддерживаем оба формата ответа: {items: [...] } и просто [...]
    const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    return list.map(mapUser); // [{id,name,email,avatar,blocked,role}]
  },

  // Получить пользователя по id (для показа/предзаполнения роли)
  async getById(id) {
    const { data } = await http.get(`/users/${id}`);
    return mapUser(data?.user || data);
  },

  // Назначить глобальную роль (admin/user) — только для администраторов
  async setRole(id, role) {
    const { data } = await http.put(`/users/${id}/role`, { role });
    // ожидаем { ok:true, user:{...} }
    return { ok: !!data?.ok, user: mapUser(data?.user || data) };
  },
};
