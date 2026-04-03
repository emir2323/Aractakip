import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesApi } from '../api';
import { useToast } from '../contexts/ToastContext';

export const SERVICES_KEY = ['services'] as const;

export function useServices() {
  return useQuery({
    queryKey: SERVICES_KEY,
    queryFn: async () => {
      const res = await servicesApi.list();
      return res.data;
    },
  });
}

export function useAddService() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: { name: string; address?: string; phone?: string; notes?: string }) =>
      servicesApi.create(data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: SERVICES_KEY }); toast.success('Servis eklendi'); },
    onError: () => toast.error('Servis eklenemedi'),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; address?: string; phone?: string; notes?: string }> }) =>
      servicesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: SERVICES_KEY }); toast.success('Servis güncellendi'); },
    onError: () => toast.error('Servis güncellenemedi'),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => servicesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: SERVICES_KEY }); toast.success('Servis silindi'); },
    onError: () => toast.error('Servis silinemedi'),
  });
}
