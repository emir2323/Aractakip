import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600/20 border border-blue-600/30 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
