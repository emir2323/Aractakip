import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faultReportsApi } from '../api';
import { useToast } from '../contexts/ToastContext';

export const FAULT_REPORTS_KEY = ['fault-reports'] as const;

export function useFaultReports(params?: { status?: string }) {
  return useQuery({
    queryKey: [...FAULT_REPORTS_KEY, params],
    queryFn: async () => {
      const res = await faultReportsApi.list(params);
      return res.data;
    },
  });
}

export function useMyFaultReports() {
  return useQuery({
    queryKey: [...FAULT_REPORTS_KEY, 'my'],
    queryFn: async () => {
      const res = await faultReportsApi.my();
      return res.data;
    },
  });
}

export function usePendingFaultReportCount() {
  return useQuery({
    queryKey: [...FAULT_REPORTS_KEY, 'pending-count'],
    queryFn: async () => {
      const res = await faultReportsApi.pendingCount();
      return res.data.count;
    },
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useSubmitFaultReport() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: { vehicleId?: string; type: string; description: string; location?: string }) =>
      faultReportsApi.submit(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAULT_REPORTS_KEY });
      toast.success('Arıza bildiriminiz alındı, admin inceleyecek');
    },
    onError: () => toast.error('Bildirim gönderilemedi'),
  });
}

export function useReviewFaultReport() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      faultReportsApi.review(id, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAULT_REPORTS_KEY });
      toast.success('Bildirim incelendi');
    },
    onError: () => toast.error('İşlem başarısız'),
  });
}

export function useRejectFaultReport() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      faultReportsApi.reject(id, adminNote),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAULT_REPORTS_KEY });
      toast.success('Bildirim reddedildi');
    },
    onError: () => toast.error('İşlem başarısız'),
  });
}

export function useConvertFaultReport() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => faultReportsApi.convert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAULT_REPORTS_KEY });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['faults'] });
      toast.success('Resmi arıza kaydı oluşturuldu');
    },
    onError: () => toast.error('Dönüştürme başarısız'),
  });
}

export function useDeleteFaultReport() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => faultReportsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAULT_REPORTS_KEY });
      toast.success('Bildirim silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });
}
