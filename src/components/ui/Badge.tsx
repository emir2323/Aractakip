import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'purple' | 'orange' | 'pink';
  size?: 'sm' | 'md';
}

const variantClass = {
  green: 'text-green-400 bg-green-400/10 border-green-400/30',
  red: 'text-red-400 bg-red-400/10 border-red-400/30',
  yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  blue: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  gray: 'text-gray-400 bg-gray-400/10 border-gray-400/30',
  purple: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  orange: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  pink: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
};

export function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center border rounded-full font-medium ${variantClass[variant]} ${sizeClass}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    'Aktif': 'green',
    'Arızalı': 'red',
    'Parça Bekliyor': 'yellow',
    'Görevli': 'blue',
    'Devam Ediyor': 'red',
    'Çözüldü': 'green',
  };
  return <Badge variant={map[status] ?? 'gray'}>{status}</Badge>;
}
