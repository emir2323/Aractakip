import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, type CreateUserPayload } from '../api';
import type { AppUser } from '../types';
import { useToast } from '../contexts/ToastContext';

export const USERS_KEY = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: async () => {
      const res = await usersApi.list();
      return res.data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (data: CreateUserPayload) => usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Kullanıcı oluşturuldu');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error ?? 'Oluşturulamadı'),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<AppUser, 'id' | 'username' | 'createdAt' | 'vehicle'>> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Kullanıcı güncellendi');
    },
    onError: () => toast.error('Güncellenemedi'),
  });
}

export function useResetUserPassword() {
  const toast = useToast();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      usersApi.resetPassword(id, password),
    onSuccess: () => toast.success('Şifre güncellendi'),
    onError: () => toast.error('Şifre güncellenemedi'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      toast.success('Kullanıcı silindi');
    },
    onError: () => toast.error('Silinemedi'),
  });
}
