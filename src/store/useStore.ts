/**
 * API-backed store — replaces the old localStorage/Zustand store.
 * Pages use the same useStore() interface, but data now comes from the backend.
 * We use React Query under the hood and expose a thin Zustand slice for
 * non-server state (loading flags, optimistic UI).
 *
 * The old Zustand persist middleware is removed; we no longer write to localStorage.
 */

import { create } from 'zustand';
import type {
  Region, Station, Vehicle, FaultLog, Personnel, PrivateService, AppSettings
} from '../types';
import {
  regionsApi, stationsApi, vehiclesApi, faultsApi,
  personnelApi, servicesApi, settingsApi,
  type VehiclePayload, type FaultPayload, type PersonnelPayload,
} from '../api';

function isoToDateStr(val: string | null | undefined): string {
  if (!val) return '';
  return val.split('T')[0];
}

/** Transform API vehicle into frontend Vehicle type */
function mapVehicle(v: any): Vehicle {
  return {
    id: v.id,
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: v.year,
    regionId: v.regionId ?? v.station?.regionId ?? '',
    stationId: v.stationId,
    status: v.status,
    dutyRegionId: v.dutyRegionId ?? v.dutyStation?.regionId ?? undefined,
    dutyStationId: v.dutyStationId ?? undefined,
    materials: Array.isArray(v.materials) ? v.materials : [],
    insuranceExpiry: isoToDateStr(v.insuranceExpiry),
    kaskoExpiry: isoToDateStr(v.kaskoExpiry),
    muayeneExpiry: isoToDateStr(v.muayeneExpiry),
    notes: v.notes ?? '',
    createdAt: isoToDateStr(v.createdAt),
  };
}

function mapFault(f: any): FaultLog {
  return {
    id: f.id,
    vehicleId: f.vehicleId,
    faultType: f.type,
    description: f.description,
    location: f.location ?? '',
    startDate: isoToDateStr(f.startDate),
    endDate: f.endDate ? isoToDateStr(f.endDate) : undefined,
    status: f.status,
    serviceId: f.serviceId ?? undefined,
    serviceName: f.serviceName ?? undefined,
    createdAt: isoToDateStr(f.createdAt),
  };
}

function mapPersonnel(p: any): Personnel {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    regionId: p.regionId ?? p.station?.regionId ?? '',
    stationId: p.stationId,
    phone: p.phone ?? '',
    notes: p.notes ?? '',
    createdAt: isoToDateStr(p.createdAt),
  };
}

interface AppState {
  // Data
  regions: Region[];
  stations: Station[];
  vehicles: Vehicle[];
  faultLogs: FaultLog[];
  personnel: Personnel[];
  services: PrivateService[];
  settings: AppSettings;

  // Status
  initialized: boolean;
  isLoading: boolean;
  error: string | null;

  // Bootstrap — fetch all data from API
  fetchAll: () => Promise<void>;

  // Region actions
  addRegion: (region: Omit<Region, 'id'>) => Promise<void>;
  updateRegion: (id: string, data: Partial<Region>) => Promise<void>;
  deleteRegion: (id: string) => Promise<void>;

  // Station actions
  addStation: (station: Omit<Station, 'id'>) => Promise<void>;
  updateStation: (id: string, data: Partial<Station>) => Promise<void>;
  deleteStation: (id: string) => Promise<void>;

  // Vehicle actions
  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;

  // Fault log actions
  addFaultLog: (log: Omit<FaultLog, 'id' | 'createdAt'>) => Promise<void>;
  updateFaultLog: (id: string, data: Partial<FaultLog>) => Promise<void>;
  deleteFaultLog: (id: string) => Promise<void>;

  // Personnel actions
  addPersonnel: (p: Omit<Personnel, 'id' | 'createdAt'>) => Promise<void>;
  updatePersonnel: (id: string, data: Partial<Personnel>) => Promise<void>;
  deletePersonnel: (id: string) => Promise<void>;

  // Service actions
  addService: (s: Omit<PrivateService, 'id'>) => Promise<void>;
  updateService: (id: string, data: Partial<PrivateService>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // Settings actions
  updateSettings: (data: Partial<AppSettings>) => Promise<void>;
}

export const useStore = create<AppState>()((set, get) => ({
  regions: [],
  stations: [],
  vehicles: [],
  faultLogs: [],
  personnel: [],
  services: [],
  settings: { faultTypes: [], personnelTitles: [] },
  initialized: false,
  isLoading: false,
  error: null,

  // ── Bootstrap ────────────────────────────────────────────────────────────
  fetchAll: async () => {
    if (get().initialized) return;
    set({ isLoading: true, error: null });
    try {
      const [regionsRes, vehiclesRes, faultsRes, personnelRes, servicesRes, settingsRes] = await Promise.all([
        regionsApi.list(),
        vehiclesApi.list(),
        faultsApi.list(),
        personnelApi.list(),
        servicesApi.list(),
        settingsApi.get(),
      ]);

      const regionsData = regionsRes.data;
      const regions: Region[] = regionsData.map((r: any) => ({ id: r.id, name: r.name }));
      const stations: Station[] = regionsData.flatMap((r: any) =>
        (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
      );

      set({
        regions,
        stations,
        vehicles: vehiclesRes.data.map(mapVehicle),
        faultLogs: faultsRes.data.map(mapFault),
        personnel: personnelRes.data.map(mapPersonnel),
        services: servicesRes.data,
        settings: {
          faultTypes: settingsRes.data.faultTypes ?? [],
          personnelTitles: settingsRes.data.personnelTitles ?? [],
        },
        initialized: true,
        isLoading: false,
      });
    } catch (e: any) {
      set({ error: e.message ?? 'Veri yüklenemedi', isLoading: false });
    }
  },

  // ── Regions ───────────────────────────────────────────────────────────────
  addRegion: async (data) => {
    const res = await regionsApi.create({ name: data.name });
    set(s => ({ regions: [...s.regions, { id: res.data.id, name: res.data.name }] }));
  },
  updateRegion: async (id, data) => {
    await regionsApi.update(id, { name: data.name! });
    set(s => ({ regions: s.regions.map(r => r.id === id ? { ...r, ...data } : r) }));
  },
  deleteRegion: async (id) => {
    await regionsApi.delete(id);
    set(s => ({
      regions: s.regions.filter(r => r.id !== id),
      stations: s.stations.filter(st => st.regionId !== id),
    }));
  },

  // ── Stations ──────────────────────────────────────────────────────────────
  addStation: async (data) => {
    const res = await stationsApi.create({ name: data.name, regionId: data.regionId });
    set(s => ({ stations: [...s.stations, { id: res.data.id, regionId: data.regionId, name: res.data.name }] }));
  },
  updateStation: async (id, data) => {
    await stationsApi.update(id, data);
    set(s => ({ stations: s.stations.map(st => st.id === id ? { ...st, ...data } : st) }));
  },
  deleteStation: async (id) => {
    await stationsApi.delete(id);
    set(s => ({ stations: s.stations.filter(st => st.id !== id) }));
  },

  // ── Vehicles ──────────────────────────────────────────────────────────────
  addVehicle: async (vehicle) => {
    const payload: VehiclePayload = {
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      stationId: vehicle.stationId,
      status: vehicle.status,
      dutyStationId: vehicle.dutyStationId ?? null,
      materials: vehicle.materials,
      insuranceExpiry: vehicle.insuranceExpiry || null,
      kaskoExpiry: vehicle.kaskoExpiry || null,
      muayeneExpiry: vehicle.muayeneExpiry || null,
      notes: vehicle.notes,
    };
    const res = await vehiclesApi.create(payload);
    set(s => ({ vehicles: [...s.vehicles, mapVehicle(res.data)] }));
  },
  updateVehicle: async (id, data) => {
    const payload: Partial<VehiclePayload> = {
      ...(data.plate !== undefined && { plate: data.plate }),
      ...(data.brand !== undefined && { brand: data.brand }),
      ...(data.model !== undefined && { model: data.model }),
      ...(data.year !== undefined && { year: data.year }),
      ...(data.stationId !== undefined && { stationId: data.stationId }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.dutyStationId !== undefined && { dutyStationId: data.dutyStationId ?? null }),
      ...(data.materials !== undefined && { materials: data.materials }),
      ...(data.insuranceExpiry !== undefined && { insuranceExpiry: data.insuranceExpiry || null }),
      ...(data.kaskoExpiry !== undefined && { kaskoExpiry: data.kaskoExpiry || null }),
      ...(data.muayeneExpiry !== undefined && { muayeneExpiry: data.muayeneExpiry || null }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
    const res = await vehiclesApi.update(id, payload);
    const updated = mapVehicle(res.data);
    set(s => ({ vehicles: s.vehicles.map(v => v.id === id ? updated : v) }));
  },
  deleteVehicle: async (id) => {
    await vehiclesApi.delete(id);
    set(s => ({ vehicles: s.vehicles.filter(v => v.id !== id) }));
  },

  // ── Fault Logs ────────────────────────────────────────────────────────────
  addFaultLog: async (log) => {
    const payload: FaultPayload = {
      vehicleId: log.vehicleId,
      type: log.faultType,
      description: log.description,
      location: log.location,
      serviceId: log.serviceId ?? null,
      serviceName: log.serviceName ?? null,
      startDate: log.startDate,
      endDate: log.endDate ?? null,
      status: log.status,
    };
    const res = await faultsApi.create(payload);
    set(s => ({ faultLogs: [...s.faultLogs, mapFault(res.data)] }));
  },
  updateFaultLog: async (id, data) => {
    const payload: Partial<FaultPayload> = {
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId }),
      ...(data.faultType !== undefined && { type: data.faultType }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.serviceId !== undefined && { serviceId: data.serviceId ?? null }),
      ...(data.serviceName !== undefined && { serviceName: data.serviceName ?? null }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate ?? null }),
      ...(data.status !== undefined && { status: data.status }),
    };
    const res = await faultsApi.update(id, payload);
    const updated = mapFault(res.data);
    set(s => ({ faultLogs: s.faultLogs.map(f => f.id === id ? updated : f) }));
  },
  deleteFaultLog: async (id) => {
    await faultsApi.delete(id);
    set(s => ({ faultLogs: s.faultLogs.filter(f => f.id !== id) }));
  },

  // ── Personnel ─────────────────────────────────────────────────────────────
  addPersonnel: async (p) => {
    const payload: PersonnelPayload = {
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      stationId: p.stationId,
      phone: p.phone,
      notes: p.notes,
    };
    const res = await personnelApi.create(payload);
    set(s => ({ personnel: [...s.personnel, mapPersonnel(res.data)] }));
  },
  updatePersonnel: async (id, data) => {
    const payload: Partial<PersonnelPayload> = {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.title !== undefined && { title: data.title }),
      ...(data.stationId !== undefined && { stationId: data.stationId }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
    const res = await personnelApi.update(id, payload);
    set(s => ({ personnel: s.personnel.map(p => p.id === id ? mapPersonnel(res.data) : p) }));
  },
  deletePersonnel: async (id) => {
    await personnelApi.delete(id);
    set(s => ({ personnel: s.personnel.filter(p => p.id !== id) }));
  },

  // ── Services ──────────────────────────────────────────────────────────────
  addService: async (sv) => {
    const res = await servicesApi.create(sv);
    set(s => ({ services: [...s.services, res.data] }));
  },
  updateService: async (id, data) => {
    const res = await servicesApi.update(id, data);
    set(s => ({ services: s.services.map(sv => sv.id === id ? res.data : sv) }));
  },
  deleteService: async (id) => {
    await servicesApi.delete(id);
    set(s => ({ services: s.services.filter(sv => sv.id !== id) }));
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  updateSettings: async (data) => {
    const updates: Promise<any>[] = [];
    if (data.faultTypes) updates.push(settingsApi.update('faultTypes', data.faultTypes));
    if (data.personnelTitles) updates.push(settingsApi.update('personnelTitles', data.personnelTitles));
    await Promise.all(updates);
    set(s => ({ settings: { ...s.settings, ...data } }));
  },
}));
