import { differenceInDays, parseISO } from 'date-fns';
import type { AlertItem, Vehicle, Region, Station } from '../types';

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getAlerts(
  vehicles: Vehicle[],
  regions: Region[],
  stations: Station[]
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const today = new Date();

  vehicles.forEach((v) => {
    const regionName = regions.find(r => r.id === v.regionId)?.name ?? '';
    const stationName = stations.find(s => s.id === v.stationId)?.name ?? '';

    const checks: { type: 'Muayene' | 'Sigorta' | 'Kasko'; date: string }[] = [
      { type: 'Muayene', date: v.muayeneExpiry },
      { type: 'Sigorta', date: v.insuranceExpiry },
      { type: 'Kasko', date: v.kaskoExpiry },
    ];

    checks.forEach(({ type, date }) => {
      if (!date) return;
      const days = differenceInDays(parseISO(date), today);
      if (days <= 60) {
        const severity = days <= 15 ? 'red' : days <= 30 ? 'yellow' : 'green';
        alerts.push({
          vehicleId: v.id,
          plate: v.plate,
          type,
          expiryDate: date,
          daysRemaining: days,
          severity,
          stationName,
          regionName,
        });
      }
    });
  });

  return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export const statusColors: Record<string, string> = {
  'Aktif': 'text-green-400 bg-green-400/10 border-green-400/30',
  'Arızalı': 'text-red-400 bg-red-400/10 border-red-400/30',
  'Parça Bekliyor': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  'Görevli': 'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

export const statusDotColors: Record<string, string> = {
  'Aktif': 'bg-green-400',
  'Arızalı': 'bg-red-400',
  'Parça Bekliyor': 'bg-yellow-400',
  'Görevli': 'bg-blue-400',
};

export const faultTypeColors: Record<string, string> = {
  'Motor': 'text-red-400 bg-red-400/10',
  'Elektrik': 'text-yellow-400 bg-yellow-400/10',
  'Fren': 'text-orange-400 bg-orange-400/10',
  'Lastik': 'text-purple-400 bg-purple-400/10',
  'Şanzıman': 'text-pink-400 bg-pink-400/10',
  'Diğer': 'text-gray-400 bg-gray-400/10',
};

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = parseISO(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getDaysRemaining(dateStr: string): number {
  if (!dateStr) return 999;
  return differenceInDays(parseISO(dateStr), new Date());
}

export function getDateStatusClass(days: number): string {
  if (days <= 15) return 'text-red-400';
  if (days <= 30) return 'text-yellow-400';
  if (days <= 60) return 'text-green-400';
  return 'text-slate-400';
}
