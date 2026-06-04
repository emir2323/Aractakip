import { useState } from 'react';
import {
  ClipboardList, CheckCircle, XCircle, RotateCcw, Clock,
  Car, User, Loader2, AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleRequestsApi, vehiclesApi } from '../api';
import type { VehicleRequest, Vehicle } from '../types';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { Select } from '../components/ui/FormField';
import { formatDate } from '../utils/helpers';

const statusConfig: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Bekliyor',     color: 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' },
  approved: { label: 'Onaylandı',    color: 'text-green-400  bg-green-400/10  border border-green-400/20'  },
  rejected: { label: 'Reddedildi',   color: 'text-red-400    bg-red-400/10    border border-red-400/20'    },
  returned: { label: 'İade Edildi',  color: 'text-gray-400   bg-gray-400/10   border border-gray-400/20'   },
};

export function VehicleRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<VehicleRequest[]>({
    queryKey: ['vehicle-requests'],
    queryFn: async () => (await vehicleRequestsApi.list()).data,
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['vehicles'],
    queryFn: async () => (await vehiclesApi.list()).data,
  });

  // Modals
  const [approveModal, setApproveModal] = useState<VehicleRequest | null>(null);
  const [rejectModal,  setRejectModal]  = useState<VehicleRequest | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicle-requests'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, vehicleId }: { id: string; vehicleId: string }) =>
      vehicleRequestsApi.approve(id, vehicleId, adminNote || undefined),
    onSuccess: () => { invalidate(); setApproveModal(null); setSelectedVehicleId(''); setAdminNote(''); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => vehicleRequestsApi.reject(id, adminNote || undefined),
    onSuccess: () => { invalidate(); setRejectModal(null); setAdminNote(''); },
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => vehicleRequestsApi.returnVehicle(id),
    onSuccess: () => invalidate(),
  });

  // Stats
  const pending  = requests.filter(r => r.status === 'pending').length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;

  // Available vehicles (Aktif only)
  const availableVehicles = (vehicles as any[]).filter((v: any) => v.status === 'Aktif');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Araç Talepleri"
        subtitle="Önleme birimi araç talep yönetimi"
        icon={<ClipboardList size={20} />}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Bekleyen</span>
          </div>
          <p className="text-3xl font-bold text-white">{pending}</p>
        </div>
        <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-green-400 text-sm font-medium">Onaylanan</span>
          </div>
          <p className="text-3xl font-bold text-white">{approved}</p>
        </div>
        <div className="bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={16} className="text-red-400" />
            <span className="text-red-400 text-sm font-medium">Reddedilen</span>
          </div>
          <p className="text-3xl font-bold text-white">{rejected}</p>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-400" />
            <h2 className="text-white font-semibold">Tüm Talepler</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Henüz araç talebi bulunmuyor.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Talep Eden</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Amaç</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Talep Tarihi</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">İade Tarihi</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Durum</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Araç</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {requests.map(req => {
                  const cfg = statusConfig[req.status] ?? statusConfig.pending;
                  return (
                    <tr key={req.id} className="hover:bg-gray-800/30 transition-colors">
                      {/* Requester */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-600/30 flex items-center justify-center shrink-0">
                            <User size={13} className="text-orange-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs">
                              {req.requester?.name ?? req.requester?.username ?? '—'}
                            </p>
                            {req.requester?.name && (
                              <p className="text-gray-600 text-xs">{req.requester.username}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Purpose */}
                      <td className="px-5 py-3.5">
                        <p className="text-gray-300 max-w-48 line-clamp-2 text-xs">{req.purpose}</p>
                      </td>

                      {/* Request date */}
                      <td className="px-5 py-3.5">
                        <p className="text-gray-300 text-xs whitespace-nowrap">{formatDate(req.requestDate)}</p>
                      </td>

                      {/* Return date */}
                      <td className="px-5 py-3.5">
                        <p className="text-gray-500 text-xs whitespace-nowrap">
                          {req.returnDate ? formatDate(req.returnDate) : '—'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Vehicle */}
                      <td className="px-5 py-3.5">
                        {req.vehicle ? (
                          <div className="flex items-center gap-1.5">
                            <Car size={12} className="text-blue-400 shrink-0" />
                            <span className="text-blue-300 text-xs font-medium">{req.vehicle.plate}</span>
                          </div>
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => { setApproveModal(req); setSelectedVehicleId(''); setAdminNote(''); }}
                                icon={<CheckCircle size={13} />}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => { setRejectModal(req); setAdminNote(''); }}
                                icon={<XCircle size={13} />}
                                className="hover:text-red-400"
                              >
                                Reddet
                              </Button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={returnMutation.isPending}
                              onClick={() => returnMutation.mutate(req.id)}
                              icon={returnMutation.isPending
                                ? <Loader2 size={13} className="animate-spin" />
                                : <RotateCcw size={13} />}
                            >
                              İade Al
                            </Button>
                          )}
                          {(req.status === 'rejected' || req.status === 'returned') && (
                            <span className="text-gray-700 text-xs">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={!!approveModal}
        onClose={() => setApproveModal(null)}
        title="Talebi Onayla"
        size="sm"
      >
        <div className="space-y-4">
          {approveModal && (
            <div className="bg-gray-800 rounded-lg p-3 text-sm">
              <p className="text-gray-400 mb-1">Talep Eden:</p>
              <p className="text-white font-medium">
                {approveModal.requester?.name ?? approveModal.requester?.username}
              </p>
              <p className="text-gray-400 mt-2 mb-1">Amaç:</p>
              <p className="text-gray-300">{approveModal.purpose}</p>
            </div>
          )}

          <FormField label="Araç Seç" required>
            <Select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
            >
              <option value="">Müsait araç seçin...</option>
              {availableVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.brand} {v.model}
                </option>
              ))}
            </Select>
            {availableVehicles.length === 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 text-yellow-400 text-xs">
                <AlertCircle size={12} />
                Şu an müsait (Aktif) araç bulunmuyor.
              </div>
            )}
          </FormField>

          <FormField label="Admin Notu (Opsiyonel)">
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Onay notu ekleyin..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
                placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                resize-none transition-all"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setApproveModal(null)}>İptal</Button>
            <Button
              disabled={!selectedVehicleId || approveMutation.isPending}
              onClick={() => approveModal && approveMutation.mutate({
                id: approveModal.id,
                vehicleId: selectedVehicleId,
              })}
              icon={approveMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCircle size={14} />}
            >
              Onayla
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={!!rejectModal}
        onClose={() => setRejectModal(null)}
        title="Talebi Reddet"
        size="sm"
      >
        <div className="space-y-4">
          {rejectModal && (
            <div className="bg-gray-800 rounded-lg p-3 text-sm">
              <p className="text-gray-400 mb-1">Talep Eden:</p>
              <p className="text-white font-medium">
                {rejectModal.requester?.name ?? rejectModal.requester?.username}
              </p>
              <p className="text-gray-400 mt-2 mb-1">Amaç:</p>
              <p className="text-gray-300">{rejectModal.purpose}</p>
            </div>
          )}

          <FormField label="Red Nedeni (Opsiyonel)">
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Red nedenini açıklayın..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm
                placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                resize-none transition-all"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="secondary" onClick={() => setRejectModal(null)}>İptal</Button>
            <Button
              disabled={rejectMutation.isPending}
              onClick={() => rejectModal && rejectMutation.mutate(rejectModal.id)}
              className="bg-red-600 hover:bg-red-500"
              icon={rejectMutation.isPending
                ? <Loader2 size={14} className="animate-spin" />
                : <XCircle size={14} />}
            >
              Reddet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
