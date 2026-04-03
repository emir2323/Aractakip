import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../api';
import { useToast } from '../contexts/ToastContext';

export const SETTINGS_KEY = ['settings'] as const;

export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const res = await settingsApi.get();
      return res.data;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => settingsApi.update(key, value),
    onSuccess: () => { qc.invalidateQueries({ queryKey: SETTINGS_KEY }); },
    onError: () => toast.error('Ayar kaydedilemedi'),
  });
}
