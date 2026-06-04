import { useState } from 'react';
import { ClipboardList, Car, Clock, Loader2, ChevronRight, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { vehicleRequestsApi } from '../../api';
import type { VehicleRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { formatDate } from '../../utils/helpers';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Bekliyor',
    color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    icon: <Clock size={13} />,
  },
  approved: {
    label: 'Onaylandı',
    color: 'text-green-400 bg-green-400/10 border-green-400/20',
    icon: <CheckCircle size={13} />,
  },
  rejected: {
    label: 'Reddedildi',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    icon: <XCircle size={13} />,
  },
  returned: {
    label: 'İade Edildi',
    color: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
    icon: <RotateCcw size={13} />,
  },
};

export function OnlemeHome() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<VehicleRequest | null>(null);

  const { data: requests = [], isLoading } = useQuery<VehicleRequest[]>({
    queryKey: ['vehicle-requests', 'my'],
    queryFn: async () => {
      const res = await vehicleRequestsApi.list();
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-400" />
      </div>
    );
  }

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    returned: requests.filter(r => r.status === 'returned').length,
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Hoş Geldiniz, {user?.name ?? user?.username}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Araç Talep Geçmişiniz</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Bekleyen', count: counts.pending, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Onaylanan', count: counts.approved, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Reddedilen', count: counts.rejected, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'İade Edilen', count: counts.returned, color: 'text-gray-400', bg: 'bg-gray-700' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-gray-400 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-orange-400" />
            <h2 className="text-white font-semibold">Taleplerim</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Henüz araç talebiniz bulunmuyor.</p>
              <p className="text-gray-600 text-sm mt-1">Sol menüden "Araç Talep Et" ile yeni talep oluşturun.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {requests.map(req => {
                const cfg = statusConfig[req.status] ?? statusConfig.pending;
                return (
                  <div
                    key={req.id}
                    className="px-5 py-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(selected?.id === req.id ? null : req)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm line-clamp-2">{req.purpose}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-gray-500 text-xs flex items-center gap-1">
                            <Clock size={11} />
                            {formatDate(req.requestDate)}
                          </span>
                          {req.returnDate && (
                            <span className="text-gray-600 text-xs">
                              → {formatDate(req.returnDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1 ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                        <ChevronRight
                          size={14}
                          className={`text-gray-600 transition-transform ${selected?.id === req.id ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selected?.id === req.id && (
                      <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-2">
                        {req.status === 'approved' && req.vehicle && (
                          <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
                            <Car size={15} className="text-green-400 shrink-0" />
                            <div>
                              <p className="text-green-400 text-sm font-semibold">{req.vehicle.plate}</p>
                              {req.vehicle.brand && (
                                <p className="text-green-300 text-xs">{req.vehicle.brand} {req.vehicle.model}</p>
                              )}
                            </div>
                          </div>
                        )}
                        {req.adminNote && (
                          <div className="bg-gray-800 rounded-lg px-3 py-2">
                            <p className="text-gray-400 text-xs font-medium mb-0.5">Admin Notu:</p>
                            <p className="text-gray-300 text-sm">{req.adminNote}</p>
                          </div>
                        )}
                        <p className="text-gray-600 text-xs">
                          Talep oluşturuldu: {formatDate(req.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
