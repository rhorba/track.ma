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
