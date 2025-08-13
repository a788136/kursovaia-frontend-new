// src/services/likeService.js
import http from '../api/http';

export const likeService = {
  async getLikes(itemId) {
    const { data } = await http.get(`/items/${itemId}/likes`);
    return data; // { count, liked }
  },

  async like(itemId) {
    const { data } = await http.post(`/items/${itemId}/like`, null, {
      headers: { 'Content-Type': 'application/json' }
    });
    return data; // { ok: true, count, liked: true }
  },

  async unlike(itemId) {
    const { data } = await http.delete(`/items/${itemId}/like`);
    return data; // { ok: true, count, liked: false }
  },
};
