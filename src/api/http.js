import axios from 'axios';
import { getToken } from './token';

const http = axios.create({
  baseURL: '/api' // прокси на Vercel → Render
});

// Всегда подставляем Bearer accessToken из localStorage
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default http;

