export type VehicleStatus = 'Aktif' | 'Arızalı' | 'Parça Bekliyor' | 'Görevli';

export type FaultType = 'Motor' | 'Elektrik' | 'Fren' | 'Lastik' | 'Şanzıman' | 'Diğer';

export type FaultStatus = 'Devam Ediyor' | 'Çözüldü';

export type PersonnelTitle = 'Amir' | 'Çavuş' | 'İşçi' | 'Şoför' | 'Teknisyen' | 'Diğer';

export interface Region {
  id: string;
  name: string;
}

export interface Station {
  id: string;
  regionId: string;
  name: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  regionId: string;
  stationId: string;
  status: VehicleStatus;
  dutyRegionId?: string;
  dutyStationId?: string;
  materials: string[];
  insuranceExpiry: string; // ISO date string
  kaskoExpiry: string;
  muayeneExpiry: string;
  notes: string;
  createdAt: string;
  faults?: FaultLog[];
}

export interface FaultLog {
  id: string;
  vehicleId: string;
  faultType: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  status: FaultStatus;
  serviceId?: string;
  serviceName?: string;
  createdAt: string;
}

export interface PrivateService {
  id: string;
  name: string;
  address: string;
  phone: string;
  notes?: string;
}

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  regionId: string;
  stationId: string;
  phone: string;
  notes: string;
  createdAt: string;
}

export interface AlertItem {
  vehicleId: string;
  plate: string;
  type: 'Muayene' | 'Sigorta' | 'Kasko';
  expiryDate: string;
  daysRemaining: number;
  severity: 'red' | 'yellow' | 'green';
  stationName: string;
  regionName: string;
}

export interface AppSettings {
  faultTypes: string[];
  personnelTitles: string[];
}

export interface AppUser {
  id: string;
  username: string;
  name?: string;
  role: 'admin' | 'driver';
  vehicleId?: string | null;
  phone?: string;
  active: boolean;
  createdAt: string;
  vehicle?: { plate: string } | null;
}

export interface OilMaintenance {
  id: string;
  vehicleId: string;
  driverId?: string | null;
  km: number;
  submittedAt: string;
  weekNumber: number;
  year: number;
  notes?: string;
  status: 'pending' | 'printed' | 'done';
  vehicle?: { plate: string; brand?: string; model?: string };
  driver?: { name?: string; username: string } | null;
}

export interface OilMaintenanceListResponse {
  records: OilMaintenance[];
  notSubmitted: { id: string; plate: string; brand: string; model: string }[];
  currentWeek: number;
  currentYear: number;
}

export interface FaultReport {
  id: string;
  driverId: string;
  vehicleId: string;
  type: string;
  description: string;
  location?: string;
  photoUrl?: string;
  reportedAt: string;
  status: 'pending' | 'reviewed' | 'converted' | 'rejected';
  adminNote?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  convertedToFaultId?: string;
  vehicle?: { plate: string; brand?: string; model?: string };
  driver?: { name?: string; username: string } | null;
}
