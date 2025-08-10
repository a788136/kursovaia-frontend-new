import axios from 'axios';
import { getToken } from './token';

const http = axios.create({
  baseURL: '/api' // прокси на Vercel
});

// подставляем Bearer токен
http.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default http;
