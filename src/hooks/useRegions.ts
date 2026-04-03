import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regionsApi, stationsApi } from '../api';
import { useToast } from '../contexts/ToastContext';

export const REGIONS_KEY = ['regions'] as const;

export function useRegions() {
  return useQuery({
    queryKey: REGIONS_KEY,
    queryFn: async () => {
      const res = await regionsApi.list();
      return res.data;
    },
  });
}

export function useAddRegion() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (name: string) => regionsApi.create({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: REGIONS_KEY }); toast.success('Bölge eklendi'); },
    onError: () => toast.error('Bölge eklenemedi'),
  });
}

export function useUpdateRegion() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => regionsApi.update(id, { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: REGIONS_KEY }); toast.success('Bölge güncellendi'); },
    onError: () => toast.error('Bölge güncellenemedi'),
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => regionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: REGIONS_KEY }); toast.success('Bölge silindi'); },
    onError: () => toast.error('Bölge silinemedi'),
  });
}

export function useAddStation() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: { name: string; regionId: string }) => stationsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: REGIONS_KEY }); toast.success('İstasyon eklendi'); },
    onError: () => toast.error('İstasyon eklenemedi'),
  });
}

export function useDeleteStation() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => stationsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: REGIONS_KEY }); toast.success('İstasyon silindi'); },
    onError: () => toast.error('İstasyon silinemedi'),
  });
}
