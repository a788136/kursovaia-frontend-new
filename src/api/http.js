import axios from 'axios';
import { getToken } from './token';

const http = axios.create({
  baseURL: '/api',
  withCredentials: true, // отправляем cookie (сессию) на бэк
});

// Всегда подставляем Bearer accessToken из localStorage, если он есть
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  } else {
    // Без токена тоже ок — сработает cookie-сессия
    delete config.headers.Authorization;
  }
  return config;
});

export default http;
