import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { oilMaintenanceApi } from '../api';
import { useToast } from '../contexts/ToastContext';

export const OIL_KEY = ['oil-maintenance'] as const;

export function useOilMaintenance(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...OIL_KEY, params],
    queryFn: async () => {
      const res = await oilMaintenanceApi.list(params);
      return res.data;
    },
  });
}

export function useOilWeek(weekNumber: number, year?: number) {
  return useQuery({
    queryKey: [...OIL_KEY, 'week', weekNumber, year],
    queryFn: async () => {
      const res = await oilMaintenanceApi.getWeek(weekNumber, year);
      return res.data;
    },
    enabled: weekNumber > 0,
  });
}

export function useMyOilSubmissions() {
  return useQuery({
    queryKey: [...OIL_KEY, 'my'],
    queryFn: async () => {
      const res = await oilMaintenanceApi.my();
      return res.data;
    },
  });
}

export function useSubmitOilKm() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: { vehicleId?: string; km: number; notes?: string }) =>
      oilMaintenanceApi.submit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OIL_KEY });
      toast.success('KM bildirimi gönderildi');
    },
    onError: () => toast.error('KM bildirimi gönderilemedi'),
  });
}

export function useUpdateOilStatus() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'pending' | 'printed' | 'done' }) =>
      oilMaintenanceApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OIL_KEY });
      toast.success('Durum güncellendi');
    },
    onError: () => toast.error('Durum güncellenemedi'),
  });
}

export function useDeleteOilRecord() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => oilMaintenanceApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OIL_KEY });
      toast.success('Kayıt silindi');
    },
    onError: () => toast.error('Kayıt silinemedi'),
  });
}
