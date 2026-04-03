import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faultsApi, type FaultPayload } from '../api';
import { useToast } from '../contexts/ToastContext';
import { VEHICLES_KEY, vehicleKey } from './useVehicles';

export const FAULTS_KEY = ['faults'] as const;

function mapFault(f: any) {
  return {
    id: f.id,
    vehicleId: f.vehicleId,
    faultType: f.type ?? f.faultType,
    description: f.description,
    location: f.location ?? '',
    startDate: f.startDate ? f.startDate.split('T')[0] : '',
    endDate: f.endDate ? f.endDate.split('T')[0] : undefined,
    status: f.status,
    serviceId: f.serviceId ?? undefined,
    serviceName: f.serviceName ?? undefined,
    createdAt: f.createdAt ? f.createdAt.split('T')[0] : '',
  };
}

export function useFaults(params?: Record<string, string>) {
  return useQuery({
    queryKey: params ? [...FAULTS_KEY, params] : FAULTS_KEY,
    queryFn: async () => {
      const res = await faultsApi.list(params);
      return res.data.map(mapFault);
    },
  });
}

export function useAddFault() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: FaultPayload) => faultsApi.create(data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: FAULTS_KEY });
      qc.invalidateQueries({ queryKey: vehicleKey(vars.vehicleId) });
      qc.invalidateQueries({ queryKey: VEHICLES_KEY });
      toast.success('Arıza kaydı eklendi');
    },
    onError: () => toast.error('Arıza kaydı eklenemedi'),
  });
}

export function useUpdateFault() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FaultPayload> }) => faultsApi.update(id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: FAULTS_KEY });
      if (res.data?.vehicleId) qc.invalidateQueries({ queryKey: vehicleKey(res.data.vehicleId) });
      toast.success('Arıza güncellendi');
    },
    onError: () => toast.error('Arıza güncellenemedi'),
  });
}

export function useDeleteFault() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => faultsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAULTS_KEY });
      qc.invalidateQueries({ queryKey: VEHICLES_KEY });
      toast.success('Arıza silindi');
    },
    onError: () => toast.error('Arıza silinemedi'),
  });
}
