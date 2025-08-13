// src/services/likeService.js
import http from '../api/http';

const authHeader = (token) => token ? { Authorization: `Bearer ${token}` } : {};

export const likeService = {
  async getLikes(itemId, token) {
    const { data } = await http.get(`/items/${itemId}/likes`, {
      headers: { ...authHeader(token) }
    });
    return data; // { count, liked }
  },

  async like(itemId, token) {
    const { data } = await http.post(`/items/${itemId}/like`, null, {
      headers: { 'Content-Type': 'application/json', ...authHeader(token) }
    });
    return data; // { count, liked: true }
  },

  async unlike(itemId, token) {
    const { data } = await http.delete(`/items/${itemId}/like`, {
      headers: { ...authHeader(token) }
    });
    return data; // { count, liked: false }
  },
};
