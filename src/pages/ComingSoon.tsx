import { Clock } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoon({
  title = 'Yakında',
  description = 'Bu modül şu anda geliştirme aşamasındadır. Yakında kullanıma sunulacaktır.',
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6 fade-in">
      <div className="w-20 h-20 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center">
        <Clock size={36} className="text-blue-400" />
      </div>
      <div className="text-center space-y-2 max-w-sm">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      </div>
      <span className="inline-flex items-center gap-2 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full font-medium">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
        Geliştirme Aşamasında
      </span>
    </div>
  );
}
