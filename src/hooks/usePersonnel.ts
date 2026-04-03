import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personnelApi, type PersonnelPayload } from '../api';
import { useToast } from '../contexts/ToastContext';

export const PERSONNEL_KEY = ['personnel'] as const;

function mapPerson(p: any) {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    title: p.title,
    regionId: p.regionId ?? p.station?.regionId ?? '',
    stationId: p.stationId,
    phone: p.phone ?? '',
    notes: p.notes ?? '',
    createdAt: p.createdAt ? p.createdAt.split('T')[0] : '',
  };
}

export function usePersonnel(params?: Record<string, string>) {
  return useQuery({
    queryKey: params ? [...PERSONNEL_KEY, params] : PERSONNEL_KEY,
    queryFn: async () => {
      const res = await personnelApi.list(params);
      return res.data.map(mapPerson);
    },
  });
}

export function useAddPersonnel() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: PersonnelPayload) => personnelApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PERSONNEL_KEY }); toast.success('Personel eklendi'); },
    onError: () => toast.error('Personel eklenemedi'),
  });
}

export function useUpdatePersonnel() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonnelPayload> }) => personnelApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PERSONNEL_KEY }); toast.success('Personel güncellendi'); },
    onError: () => toast.error('Personel güncellenemedi'),
  });
}

export function useDeletePersonnel() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => personnelApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PERSONNEL_KEY }); toast.success('Personel silindi'); },
    onError: () => toast.error('Personel silinemedi'),
  });
}
