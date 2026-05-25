import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agregar token JWT a cada request automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =============================================
// AUTH
// =============================================
export const authService = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  verify: () => api.get('/auth/verify'),
};

// =============================================
// CONNECTIONS
// =============================================
export const connectionsService = {
  getAll: () => api.get('/connections'),
  getById: (id: number) => api.get(`/connections/${id}`),
  create: (data: any) => api.post('/connections', data),
  updateStatus: (id: number, status: string) =>
    api.put(`/connections/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/connections/${id}`),
};

// =============================================
// METRICS
// =============================================
export const metricsService = {
  getAll: () => api.get('/metrics'),
  getHistory: (id: number, limit?: number) =>
    api.get(`/metrics/${id}/history`, { params: { limit } }),
  getStatus: (id: number) => api.get(`/metrics/${id}/status`),
  getSummary: () => api.get('/metrics/summary/all'),
};

// =============================================
// QUERIES
// =============================================
export const queriesService = {
  getAll: (params?: any) => api.get('/queries', { params }),
  getTopSlow: () => api.get('/queries/top-slow'),
  getStats: () => api.get('/queries/stats'),
  simulate: (data: any) => api.post('/queries/simulate', data),
  simulateConcurrency: (data: any) =>
    api.post('/queries/concurrency/simulate', data),
  getConcurrencyLogs: () => api.get('/queries/concurrency/logs'),
};

// =============================================
// BACKUPS
// =============================================
export const backupsService = {
  getAll: () => api.get('/backups'),
  simulate: (data: any) => api.post('/backups/simulate', data),
  createSnapshot: (data: any) => api.post('/backups/snapshot', data),
  restore: (id: number) => api.post(`/backups/restore/${id}`),
  getSLA: () => api.get('/backups/sla'),
};

// =============================================
// ALERTS
// =============================================
export const alertsService = {
  getAll: (params?: any) => api.get('/alerts', { params }),
  getSummary: () => api.get('/alerts/summary'),
  getRules: () => api.get('/alerts/rules'),
  createRule: (data: any) => api.post('/alerts/rules', data),
  updateRule: (id: number, data: any) => api.put(`/alerts/rules/${id}`, data),
  resolve: (id: number) => api.put(`/alerts/${id}/resolve`),
};

// =============================================
// REPLICATION
// =============================================
export const replicationService = {
  getStatus: () => api.get('/replication/status'),
  simulate: (scenario: string) =>
    api.post('/replication/simulate', { scenario }),
  getCapAnalysis: () => api.get('/replication/cap-analysis'),
  getHistory: () => api.get('/replication/history'),
};

// =============================================
// CACHE
// =============================================
export const cacheService = {
  getStats: () => api.get('/cache/stats'),
  simulate: (data: any) => api.post('/cache/simulate', data),
  invalidate: (query_key: string) =>
    api.post('/cache/invalidate', { query_key }),
  flush: () => api.post('/cache/flush'),
};

export default api;