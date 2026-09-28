import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || '';
  if (!envUrl) return '/api/v1';
  const cleanUrl = envUrl.replace(/\/$/, '');
  if (cleanUrl.endsWith('/api/v1')) return cleanUrl;
  return `${cleanUrl}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  // Do NOT set a default Content-Type here — axios auto-selects the correct one
  // (application/json for objects, multipart/form-data with boundary for FormData)
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
