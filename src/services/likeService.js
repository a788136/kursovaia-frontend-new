// front/src/services/likeService.js
import http from '../api/http';

export const likeService = {
  getLikes: (itemId) => http.get(`/items/${itemId}/likes`).then(r => r.data),
  like:     (itemId) => http.post(`/items/${itemId}/like`).then(r => r.data),
  unlike:   (itemId) => http.delete(`/items/${itemId}/like`).then(r => r.data),
};
