import { useState } from 'react';
import { Wrench, Plus, Phone, MapPin, Edit2, Trash2, Loader2, BarChart2, AlertTriangle, CheckCircle, ChevronRight, X } from 'lucide-react';
import type { PrivateService } from '../types';
import { useServices, useAddService, useUpdateService, useDeleteService } from '../hooks/useServices';
import { useFaults } from '../hooks/useFaults';
import { useVehicles } from '../hooks/useVehicles';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { FormField, Input, Textarea } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/Badge';
import { formatDate } from '../utils/helpers';
import { differenceInDays, parseISO } from 'date-fns';

function ServiceForm({ service, onClose }: { service?: PrivateService; onClose: () => void }) {
  const addService    = useAddService();
  const updateService = useUpdateService();
  const isPending = addService.isPending || updateService.isPending;

  const [form, setForm] = useState({
    name:    service?.name    ?? '',
    address: service?.address ?? '',
    phone:   service?.phone   ?? '',
    notes:   service?.notes   ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Servis adı zorunludur';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = { name: form.name.trim(), address: form.address.trim(), phone: form.phone.trim(), notes: form.notes.trim() };
    if (service) {
      updateService.mutate({ id: service.id, data }, { onSuccess: onClose });
    } else {
      addService.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="space-y-4">
      <FormField label="Servis Adı" required error={errors.name}>
        <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Şimşek Oto Servis" />
      </FormField>
      <FormField label="Adres">
        <Input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Adres" />
      </FormField>
      <FormField label="Telefon">
        <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0312 000 0000" />
      </FormField>
      <FormField label="Notlar">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ek notlar..." />
      </FormField>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>İptal</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</>
            : service ? 'Güncelle' : 'Kaydet'
          }
        </Button>
      </div>
    </div>
  );
}

function ServiceDetailModal({ service, onClose }: { service: PrivateService; onClose: () => void }) {
  const { data: faultLogs = [] } = useFaults();
  const { data: vehicles = [] } = useVehicles();
  const [tab, setTab] = useState<'active' | 'history'>('active');

  const serviceFaults = (faultLogs as any[]).filter(f => f.serviceId === service.id);
  const activeFaults  = serviceFaults.filter(f => f.status === 'Devam Ediyor');
  const history       = serviceFaults.filter(f => f.status === 'Çözüldü');

  const getVehicle = (vehicleId: string) =>
    (vehicles as any[]).find(v => v.id === vehicleId);

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="bg-gray-800/60 rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-500/15 border border-orange-500/30 rounded-xl flex items-center justify-center shrink-0">
            <Wrench size={18} className="text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight">{service.name}</h3>
            {service.notes && <p className="text-gray-500 text-sm mt-0.5">{service.notes}</p>}
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-300 shrink-0">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {service.address && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <MapPin size={13} className="text-gray-500 shrink-0" />
              <span>{service.address}</span>
            </div>
          )}
          {service.phone && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Phone size={13} className="text-gray-500 shrink-0" />
              <a href={`tel:${service.phone}`} className="hover:text-white transition-colors">{service.phone}</a>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/40 rounded-xl p-3 text-center border border-gray-700/50">
          <div className="text-2xl font-bold text-white">{serviceFaults.length}</div>
          <div className="text-gray-500 text-xs mt-0.5">Toplam Arıza</div>
        </div>
        <div className="bg-red-500/5 rounded-xl p-3 text-center border border-red-500/20">
          <div className="text-2xl font-bold text-red-400">{activeFaults.length}</div>
          <div className="text-gray-500 text-xs mt-0.5">Aktif</div>
        </div>
        <div className="bg-green-500/5 rounded-xl p-3 text-center border border-green-500/20">
          <div className="text-2xl font-bold text-green-400">{history.length}</div>
          <div className="text-gray-500 text-xs mt-0.5">Çözüldü</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800/60 border border-gray-700 rounded-xl p-1">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'active' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <AlertTriangle size={13} />
          Aktif Arızalar
          {activeFaults.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {activeFaults.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <CheckCircle size={13} />
          Geçmiş
        </button>
      </div>

      {/* Fault list */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {(tab === 'active' ? activeFaults : history).length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {tab === 'active' ? 'Aktif arıza bulunmuyor' : 'Geçmiş arıza bulunmuyor'}
          </div>
        ) : (
          (tab === 'active' ? activeFaults : history).map(fault => {
            const v = getVehicle(fault.vehicleId);
            const days = differenceInDays(new Date(), parseISO(fault.startDate));
            return (
              <div key={fault.id} className={`rounded-xl p-3.5 border ${fault.status === 'Devam Ediyor' ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-800/40 border-gray-700/50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-white font-bold text-sm">{v?.plate ?? '—'}</span>
                      <span className="text-gray-400 text-xs">{v?.brand} {v?.model}</span>
                      <StatusBadge status={fault.status} />
                    </div>
                    <p className="text-gray-300 text-sm truncate">{fault.description}</p>
                    {fault.location && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                        <MapPin size={10} />{fault.location}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-semibold ${fault.status === 'Devam Ediyor' ? 'text-red-400' : 'text-green-400'}`}>
                      {fault.status === 'Devam Ediyor' ? `${days} gün` : 'Çözüldü'}
                    </div>
                    <div className="text-gray-600 text-xs">{formatDate(fault.startDate)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Services() {
  const { data: services = [], isLoading } = useServices();
  const { data: faultLogs = [] } = useFaults();
  const deleteService = useDeleteService();

  const [showForm, setShowForm]           = useState(false);
  const [editingService, setEditingService] = useState<PrivateService | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<PrivateService | undefined>();
  const [detailService, setDetailService] = useState<PrivateService | undefined>();

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Özel Servisler"
        subtitle={`${(services as any[]).length} kayıtlı servis`}
        icon={<Wrench size={20} />}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => { setEditingService(undefined); setShowForm(true); }}>
            Servis Ekle
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-40 gap-3">
          <Loader2 size={24} className="text-blue-400 animate-spin" />
          <span className="text-gray-500 text-sm">Servisler yükleniyor...</span>
        </div>
      ) : (services as PrivateService[]).length === 0 ? (
        <EmptyState title="Servis bulunamadı"
          description="Araç arızalarında kullanılan özel servisleri ekleyin"
          icon={<Wrench size={28} />}
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>Servis Ekle</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(services as PrivateService[]).map(svc => {
            const usageCount = (faultLogs as any[]).filter(f => f.serviceId === svc.id).length;
            const activeCount = (faultLogs as any[]).filter(f => f.serviceId === svc.id && f.status === 'Devam Ediyor').length;
            return (
              <Card key={svc.id} hover className="group cursor-pointer" onClick={() => setDetailService(svc)}>
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
                      <Wrench size={18} className="text-orange-400" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" icon={<Edit2 size={13} />}
                        onClick={(e) => { e.stopPropagation(); setEditingService(svc); setShowForm(true); }}>{''}</Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={13} />}
                        className="hover:text-red-400" onClick={(e) => { e.stopPropagation(); setConfirmDelete(svc); }}>{''}</Button>
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{svc.name}</h3>
                  {svc.address && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
                      <MapPin size={11} /><span>{svc.address}</span>
                    </div>
                  )}
                  {svc.phone && (
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2">
                      <Phone size={11} /><span>{svc.phone}</span>
                    </div>
                  )}
                  {svc.notes && <p className="text-gray-600 text-xs mb-2">{svc.notes}</p>}
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BarChart2 size={11} /> {usageCount} arıza
                      </span>
                      {activeCount > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertTriangle size={11} /> {activeCount} aktif
                        </span>
                      )}
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Servis Form Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editingService ? 'Servis Düzenle' : 'Servis Ekle'} size="md">
        <ServiceForm service={editingService} onClose={() => setShowForm(false)} />
      </Modal>

      {/* Servis Detay Modal */}
      <Modal isOpen={!!detailService} onClose={() => setDetailService(undefined)}
        title="" size="md">
        {detailService && (
          <ServiceDetailModal service={detailService} onClose={() => setDetailService(undefined)} />
        )}
      </Modal>

      {/* Silme onayı */}
      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(undefined)} title="Servis Sil" size="sm">
        <p className="text-gray-300 mb-5">
          <strong className="text-white">{confirmDelete?.name}</strong> servisini silmek istediğinize emin misiniz?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(undefined)}>İptal</Button>
          <Button variant="danger" disabled={deleteService.isPending}
            onClick={() => confirmDelete && deleteService.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(undefined),
            })}>
            {deleteService.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Sil'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
