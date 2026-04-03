import { useState } from 'react';
import { Wrench, Plus, Phone, MapPin, Edit2, Trash2, Loader2 } from 'lucide-react';
import type { PrivateService } from '../types';
import { useServices, useAddService, useUpdateService, useDeleteService } from '../hooks/useServices';
import { useFaults } from '../hooks/useFaults';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { FormField, Input, Textarea } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

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

export function Services() {
  const { data: services = [], isLoading } = useServices();
  const { data: faultLogs = [] } = useFaults();
  const deleteService = useDeleteService();

  const [showForm, setShowForm]           = useState(false);
  const [editingService, setEditingService] = useState<PrivateService | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<PrivateService | undefined>();

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
            return (
              <Card key={svc.id} hover className="group">
                <CardBody className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center">
                      <Wrench size={18} className="text-orange-400" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" icon={<Edit2 size={13} />}
                        onClick={() => { setEditingService(svc); setShowForm(true); }}>{''}</Button>
                      <Button variant="ghost" size="sm" icon={<Trash2 size={13} />}
                        className="hover:text-red-400" onClick={() => setConfirmDelete(svc)}>{''}</Button>
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
                  <div className="pt-3 border-t border-gray-800 text-xs text-gray-500">
                    {usageCount} arıza kaydında kullanıldı
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editingService ? 'Servis Düzenle' : 'Servis Ekle'} size="md">
        <ServiceForm service={editingService} onClose={() => setShowForm(false)} />
      </Modal>

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
