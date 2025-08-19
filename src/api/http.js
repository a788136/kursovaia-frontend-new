// src/api/http.js
import axios from 'axios';
import { getToken } from './token';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const http = axios.create({
  baseURL: API_BASE || undefined,
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const t = getToken?.();
  // Не подставляем сомнительные/пустые маркеры
  if (t && t !== 'cookie-session') {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${t}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

export default http;
