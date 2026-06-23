import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api`,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Auth
export const login = (email: string, password: string) =>
  api.post<{ accessToken: string }>('/auth/login', { email, password }).then((r) => r.data);

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
export const getVehicleStats = (from?: string, to?: string) =>
  api.get('/reports/by-vehicle', { params: { from, to } }).then((r) => r.data);

// Users & Invites
export const getTeam = () => api.get('/users/team').then((r) => r.data);
export const inviteUser = (email: string, role: string) =>
  api.post('/users/invite', { email, role }).then((r) => r.data);
export const updateUserRole = (id: string, role: string) =>
  api.patch(`/users/${id}/role`, { role }).then((r) => r.data);
export const acceptInvite = (token: string, name: string, password: string) =>
  api.post('/auth/accept-invite', { token, name, password }).then((r) => r.data);

// Organizations
export const getUsage = () => api.get('/organizations/me/usage').then((r) => r.data);
export const getMyOrg = () => api.get('/organizations/me').then((r) => r.data);
export const updateBranding = (data: { logoUrl?: string; primaryColor?: string }) =>
  api.patch('/organizations/me/branding', data).then((r) => r.data);
export const getPublicBranding = (slug: string) =>
  api.get(`/organizations/public?slug=${encodeURIComponent(slug)}`).then((r) => r.data);

// Billing
export const createCheckout = (priceId: string, returnUrl: string) =>
  api.post('/billing/checkout', { priceId, returnUrl }).then((r) => r.data);
