import axios from 'axios';

// Determine the API host: prefer the Vercel/production env, fall back to local emulation.
const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();
// If the env var is absent locally, point to the Functions emulator / local server.
const fallbackBaseUrl = import.meta.env.DEV
  ? 'http://localhost:3000/api'
  : 'https://us-central1-smartformai-51e03.cloudfunctions.net/api';
// Remove any trailing slashes to avoid "//" when appending request paths.
const baseURL = (rawBaseUrl || fallbackBaseUrl).replace(/\/+$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Normalise request URLs so callers can use 'path' or '/path' interchangeably.
api.interceptors.request.use(
  (config) => {
    if (config.url && !/^https?:\/\//i.test(config.url)) {
      config.url = config.url.replace(/^\/+/u, '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Surface useful diagnostics for API failures.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API error:', error.response.data);
    } else if (error.request) {
      console.error('API request error:', error.request);
    } else {
      console.error('API error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;