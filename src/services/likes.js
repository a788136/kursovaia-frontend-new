import http from '../api/http';

export const likesApi = {
  async get(itemId) {
    const { data } = await http.get(`/api/items/${itemId}/likes`);
    return data; // { count, liked? }
  },
  async like(itemId) {
    const { data } = await http.post(`/api/items/${itemId}/like`);
    return data; // { liked: true, count }
  },
  async unlike(itemId) {
    const { data } = await http.delete(`/api/items/${itemId}/like`);
    return data; // { liked: false, count }
  },
};
