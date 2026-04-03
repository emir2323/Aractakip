import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 text-gray-500">
        {icon ?? <Inbox size={28} />}
      </div>
      <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
      {description && <p className="text-gray-500 text-sm max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
