import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post<{ access_token: string }>('/auth/login', { email, password }).then((r) => r.data);

export const register = (data: { name: string; email: string; password: string; organizationName: string }) =>
  api.post('/auth/register', data).then((r) => r.data);

// Vehicles
export const getVehicles = () => api.get('/vehicles').then((r) => r.data);
export const createVehicle = (data: object) => api.post('/vehicles', data).then((r) => r.data);
export const updateVehicle = (id: string, data: object) =>
  api.patch(`/vehicles/${id}`, data).then((r) => r.data);
export const deleteVehicle = (id: string) => api.delete(`/vehicles/${id}`).then((r) => r.data);

// Fleet
export const getFleetPositions = () => api.get('/fleet/positions').then((r) => r.data);

// Alerts
export const getAlerts = () => api.get('/alerts').then((r) => r.data);
export const getRules = () => api.get('/alerts/rules').then((r) => r.data);
export const createRule = (data: object) => api.post('/alerts/rules', data).then((r) => r.data);
export const acknowledgeAlert = (id: string) =>
  api.patch(`/alerts/${id}/acknowledge`).then((r) => r.data);

// Geofences
export const getGeofences = () => api.get('/geofences').then((r) => r.data);
export const createGeofence = (data: object) => api.post('/geofences', data).then((r) => r.data);
export const deleteGeofence = (id: string) => api.delete(`/geofences/${id}`).then((r) => r.data);

// Reports
export const getFleetSummary = (from?: string, to?: string) =>
  api.get('/reports/summary', { params: { from, to } }).then((r) => r.data);
export const getTripReport = (vehicleId?: string, from?: string, to?: string) =>
  api.get('/reports/trips', { params: { vehicleId, from, to } }).then((r) => r.data);
