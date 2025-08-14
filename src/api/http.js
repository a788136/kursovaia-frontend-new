// front/src/api/http.js
import axios from 'axios';
import { getToken } from './token';

const http = axios.create({
  baseURL: '/api',
  withCredentials: true, // обязательно, чтобы сессия доходила
});

http.interceptors.request.use((config) => {
  const t = getToken?.();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export default http;
