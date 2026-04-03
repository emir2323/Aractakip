import { apiClient } from './client';
import type { Region, Station, Vehicle, FaultLog, Personnel, PrivateService, AppSettings } from '../types';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    apiClient.post<{ token: string; user: { id: string; username: string; role: string } }>('/auth/login', { username, password }),
  me: () => apiClient.get('/auth/me'),
};

// ── Regions ───────────────────────────────────────────────────────────────────
export const regionsApi = {
  list: () => apiClient.get<(Region & { stations: Station[] })[]>('/regions'),
  create: (data: { name: string }) => apiClient.post<Region>('/regions', data),
  update: (id: string, data: { name: string }) => apiClient.put<Region>(`/regions/${id}`, data),
  delete: (id: string) => apiClient.delete(`/regions/${id}`),
};

// ── Stations ──────────────────────────────────────────────────────────────────
export const stationsApi = {
  create: (data: { name: string; regionId: string }) => apiClient.post<Station>('/stations', data),
  update: (id: string, data: Partial<Station>) => apiClient.put<Station>(`/stations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/stations/${id}`),
};

// ── Vehicles ──────────────────────────────────────────────────────────────────
export interface VehiclePayload {
  plate: string;
  brand: string;
  model: string;
  year: number;
  stationId: string;
  status: string;
  dutyStationId?: string | null;
  materials: string[];
  insuranceExpiry?: string | null;
  kaskoExpiry?: string | null;
  muayeneExpiry?: string | null;
  notes?: string;
}

export const vehiclesApi = {
  list: (params?: Record<string, string>) => apiClient.get<Vehicle[]>('/vehicles', { params }),
  get: (id: string) => apiClient.get<Vehicle>(`/vehicles/${id}`),
  create: (data: VehiclePayload) => apiClient.post<Vehicle>('/vehicles', data),
  update: (id: string, data: Partial<VehiclePayload>) => apiClient.put<Vehicle>(`/vehicles/${id}`, data),
  delete: (id: string) => apiClient.delete(`/vehicles/${id}`),
  alerts: () => apiClient.get<Vehicle[]>('/vehicles/alerts'),
  renewMuayene: (id: string, date: string) => apiClient.put<Vehicle>(`/vehicles/${id}/renew-muayene`, { date }),
  renewSigorta: (id: string, date: string) => apiClient.put<Vehicle>(`/vehicles/${id}/renew-sigorta`, { date }),
  renewKasko: (id: string, date: string) => apiClient.put<Vehicle>(`/vehicles/${id}/renew-kasko`, { date }),
};

// ── Faults ────────────────────────────────────────────────────────────────────
export interface FaultPayload {
  vehicleId: string;
  type: string;
  description: string;
  location?: string;
  serviceId?: string | null;
  serviceName?: string | null;
  startDate: string;
  endDate?: string | null;
  status: 'Devam Ediyor' | 'Çözüldü';
}

export const faultsApi = {
  list: (params?: Record<string, string>) => apiClient.get<FaultLog[]>('/faults', { params }),
  create: (data: FaultPayload) => apiClient.post<FaultLog>('/faults', data),
  update: (id: string, data: Partial<FaultPayload>) => apiClient.put<FaultLog>(`/faults/${id}`, data),
  delete: (id: string) => apiClient.delete(`/faults/${id}`),
};

// ── Personnel ─────────────────────────────────────────────────────────────────
export interface PersonnelPayload {
  firstName: string;
  lastName: string;
  title: string;
  stationId: string;
  phone?: string;
  notes?: string;
}

export const personnelApi = {
  list: (params?: Record<string, string>) => apiClient.get<Personnel[]>('/personnel', { params }),
  create: (data: PersonnelPayload) => apiClient.post<Personnel>('/personnel', data),
  update: (id: string, data: Partial<PersonnelPayload>) => apiClient.put<Personnel>(`/personnel/${id}`, data),
  delete: (id: string) => apiClient.delete(`/personnel/${id}`),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const servicesApi = {
  list: () => apiClient.get<PrivateService[]>('/services'),
  create: (data: Omit<PrivateService, 'id'>) => apiClient.post<PrivateService>('/services', data),
  update: (id: string, data: Partial<PrivateService>) => apiClient.put<PrivateService>(`/services/${id}`, data),
  delete: (id: string) => apiClient.delete(`/services/${id}`),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => apiClient.get<AppSettings>('/settings'),
  update: (key: string, value: any) => apiClient.put(`/settings/${key}`, { value }),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  faultyVehicles: (regionId?: string) =>
    apiClient.get('/reports/faulty-vehicles', { params: regionId ? { regionId } : {} }),
  documentAlerts: () => apiClient.get('/reports/document-alerts'),
  regionSummary: () => apiClient.get('/reports/region-summary'),
};

// ── Backup ────────────────────────────────────────────────────────────────────
export const backupApi = {
  export: () => apiClient.get('/backup/export'),
};
