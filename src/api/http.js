import axios from 'axios';

const http = axios.create({
  baseURL: '/api',          // идём через прокси на том же домене
  withCredentials: true     // куки станут first‑party → браузер не режет
});

export default http;