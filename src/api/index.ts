import { apiClient } from './client';
import type {
  Region, Station, Vehicle, FaultLog, Personnel, PrivateService, AppSettings,
  OilMaintenance, OilMaintenanceListResponse, FaultReport, AppUser,
} from '../types';

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
  addPhoto: (vehicleId: string, data: string, mimeType: string, fileName?: string) =>
    apiClient.post(`/vehicles/${vehicleId}/photos`, { data, mimeType, fileName }),
  deletePhoto: (vehicleId: string, photoId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/photos/${photoId}`),
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

// ── Oil Maintenance ───────────────────────────────────────────────────────────
export const oilMaintenanceApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<OilMaintenanceListResponse>('/oil-maintenance', { params }),
  getWeek: (weekNumber: number, year?: number) =>
    apiClient.get<OilMaintenance[]>(`/oil-maintenance/week/${weekNumber}`, { params: year ? { year } : {} }),
  my: () => apiClient.get<OilMaintenance[]>('/oil-maintenance/my'),
  submit: (data: { vehicleId?: string; km: number; notes?: string }) =>
    apiClient.post<OilMaintenance>('/oil-maintenance', data),
  updateStatus: (id: string, status: 'pending' | 'printed' | 'done') =>
    apiClient.put<OilMaintenance>(`/oil-maintenance/${id}/status`, { status }),
  delete: (id: string) => apiClient.delete(`/oil-maintenance/${id}`),
};

// ── Fault Reports ─────────────────────────────────────────────────────────────
export const faultReportsApi = {
  list: (params?: { status?: string }) =>
    apiClient.get<FaultReport[]>('/fault-reports', { params }),
  my: () => apiClient.get<FaultReport[]>('/fault-reports/my'),
  pendingCount: () => apiClient.get<{ count: number }>('/fault-reports/pending-count'),
  get: (id: string) => apiClient.get<FaultReport>(`/fault-reports/${id}`),
  submit: (data: { vehicleId?: string; type: string; description: string; location?: string }) =>
    apiClient.post<FaultReport>('/fault-reports', data),
  review: (id: string, adminNote?: string) =>
    apiClient.put<FaultReport>(`/fault-reports/${id}/review`, { adminNote }),
  reject: (id: string, adminNote?: string) =>
    apiClient.put<FaultReport>(`/fault-reports/${id}/reject`, { adminNote }),
  convert: (id: string) =>
    apiClient.put<{ report: FaultReport; faultId: string }>(`/fault-reports/${id}/convert`, {}),
  delete: (id: string) => apiClient.delete(`/fault-reports/${id}`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export interface CreateUserPayload {
  username: string;
  password: string;
  name?: string;
  role: 'admin' | 'driver' | 'onleme';
  vehicleId?: string | null;
  phone?: string;
}

export const usersApi = {
  list: () => apiClient.get<AppUser[]>('/users'),
  create: (data: CreateUserPayload) => apiClient.post<AppUser>('/users', data),
  update: (id: string, data: Partial<Omit<AppUser, 'id' | 'username' | 'createdAt' | 'vehicle'>>) =>
    apiClient.put<AppUser>(`/users/${id}`, data),
  resetPassword: (id: string, password: string) =>
    apiClient.put(`/users/${id}/password`, { password }),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
};

// ── Vehicle Requests ──────────────────────────────────────────────────────────
export interface VehicleRequestPayload {
  requestDate: string;
  returnDate?: string | null;
  purpose: string;
}

export const vehicleRequestsApi = {
  list: () => apiClient.get('/vehicle-requests'),
  create: (data: VehicleRequestPayload) => apiClient.post('/vehicle-requests', data),
  approve: (id: string, vehicleId: string, adminNote?: string) =>
    apiClient.put(`/vehicle-requests/${id}/approve`, { vehicleId, adminNote }),
  reject: (id: string, adminNote?: string) =>
    apiClient.put(`/vehicle-requests/${id}/reject`, { adminNote }),
  returnVehicle: (id: string) =>
    apiClient.put(`/vehicle-requests/${id}/return`, {}),
};
