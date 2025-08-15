// src/services/usersService.js
import http from '../api/http';

export const usersService = {
  async search(q, limit = 10) {
    const { data } = await http.get('/users/search', { params: { q, limit } });
    return data; // [{id,name,email,avatar,blocked}]
  },
};
