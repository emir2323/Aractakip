import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi, type VehiclePayload } from '../api';
import { useToast } from '../contexts/ToastContext';

export const VEHICLES_KEY = ['vehicles'] as const;
export const vehicleKey = (id: string) => ['vehicles', id] as const;

function toPayload(v: Record<string, any>): VehiclePayload {
  return {
    plate: v.plate,
    brand: v.brand,
    model: v.model,
    year: v.year,
    stationId: v.stationId,
    status: v.status,
    dutyStationId: v.dutyStationId ?? null,
    materials: v.materials ?? [],
    insuranceExpiry: v.insuranceExpiry || null,
    kaskoExpiry: v.kaskoExpiry || null,
    muayeneExpiry: v.muayeneExpiry || null,
    notes: v.notes ?? '',
  };
}

function mapVehicle(v: any) {
  return {
    ...v,
    regionId: v.regionId ?? v.station?.regionId ?? '',
    dutyRegionId: v.dutyRegionId ?? v.dutyStation?.regionId ?? undefined,
    materials: Array.isArray(v.materials) ? v.materials : [],
    insuranceExpiry: v.insuranceExpiry ? v.insuranceExpiry.split('T')[0] : '',
    kaskoExpiry: v.kaskoExpiry ? v.kaskoExpiry.split('T')[0] : '',
    muayeneExpiry: v.muayeneExpiry ? v.muayeneExpiry.split('T')[0] : '',
    createdAt: v.createdAt ? v.createdAt.split('T')[0] : '',
  };
}

export function useVehicles(params?: Record<string, string>) {
  return useQuery({
    queryKey: params ? [...VEHICLES_KEY, params] : VEHICLES_KEY,
    queryFn: async () => {
      const res = await vehiclesApi.list(params);
      return res.data.map(mapVehicle);
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKey(id),
    queryFn: async () => {
      const res = await vehiclesApi.get(id);
      const v = mapVehicle(res.data);
      // faults come embedded
      if (res.data.faults) {
        v.faults = res.data.faults.map((f: any) => ({
          id: f.id,
          vehicleId: f.vehicleId,
          faultType: f.type,
          description: f.description,
          location: f.location ?? '',
          startDate: f.startDate ? f.startDate.split('T')[0] : '',
          endDate: f.endDate ? f.endDate.split('T')[0] : undefined,
          status: f.status,
          serviceId: f.serviceId ?? undefined,
          serviceName: f.serviceName ?? undefined,
          createdAt: f.createdAt ? f.createdAt.split('T')[0] : '',
        }));
      }
      return v;
    },
    enabled: !!id,
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: Record<string, any>) => vehiclesApi.create(toPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: VEHICLES_KEY }); toast.success('Araç eklendi'); },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Araç eklenemedi'),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      vehiclesApi.update(id, toPayload(data)),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: VEHICLES_KEY });
      qc.invalidateQueries({ queryKey: vehicleKey(id) });
      toast.success('Araç güncellendi');
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Araç güncellenemedi'),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: VEHICLES_KEY }); toast.success('Araç silindi'); },
    onError: () => toast.error('Araç silinemedi'),
  });
}

export function useRenewVehicleDate() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, type, date }: { id: string; type: 'muayene' | 'sigorta' | 'kasko'; date: string }) => {
      if (type === 'muayene') return vehiclesApi.renewMuayene(id, date);
      if (type === 'sigorta') return vehiclesApi.renewSigorta(id, date);
      return vehiclesApi.renewKasko(id, date);
    },
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: vehicleKey(id) });
      qc.invalidateQueries({ queryKey: VEHICLES_KEY });
      toast.success('Tarih güncellendi');
    },
    onError: () => toast.error('Tarih güncellenemedi'),
  });
}

export function useAddVehiclePhoto() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ vehicleId, data, mimeType, fileName }: {
      vehicleId: string; data: string; mimeType: string; fileName?: string;
    }) => vehiclesApi.addPhoto(vehicleId, data, mimeType, fileName),
    onSuccess: (_res, { vehicleId }) => {
      qc.invalidateQueries({ queryKey: vehicleKey(vehicleId) });
      qc.invalidateQueries({ queryKey: VEHICLES_KEY }); // araç listesi thumbnail'ini güncelle
      toast.success('Fotoğraf yüklendi');
    },
    onError: (e: any) => toast.error(e.response?.data?.error ?? 'Fotoğraf yüklenemedi'),
  });
}

export function useDeleteVehiclePhoto() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ vehicleId, photoId }: { vehicleId: string; photoId: string }) =>
      vehiclesApi.deletePhoto(vehicleId, photoId),
    onSuccess: (_res, { vehicleId }) => {
      qc.invalidateQueries({ queryKey: vehicleKey(vehicleId) });
      qc.invalidateQueries({ queryKey: VEHICLES_KEY }); // araç listesi thumbnail'ini güncelle
      toast.success('Fotoğraf silindi');
    },
    onError: () => toast.error('Fotoğraf silinemedi'),
  });
}
