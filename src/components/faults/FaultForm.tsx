import { useState } from 'react';
import type { FaultLog } from '../../types';
import { useAddFault, useUpdateFault } from '../../hooks/useFaults';
import { useVehicles } from '../../hooks/useVehicles';
import { useServices } from '../../hooks/useServices';
import { useSettings } from '../../hooks/useSettings';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Loader2 } from 'lucide-react';

interface Props {
  fault?: FaultLog;
  vehicleId?: string;
  onClose: () => void;
}

export function FaultForm({ fault, vehicleId, onClose }: Props) {
  const { data: vehicles = [] } = useVehicles();
  const { data: services = [] } = useServices();
  const { data: settings } = useSettings();
  const addFault    = useAddFault();
  const updateFault = useUpdateFault();
  const isPending   = addFault.isPending || updateFault.isPending;

  const faultTypes = (settings as any)?.faultTypes ?? ['Motor', 'Elektrik', 'Fren', 'Lastik', 'Şanzıman', 'Diğer'];

  const [form, setForm] = useState({
    vehicleId:        fault?.vehicleId ?? vehicleId ?? '',
    faultType:        fault?.faultType ?? faultTypes[0] ?? 'Motor',
    description:      fault?.description ?? '',
    location:         fault?.location ?? '',
    startDate:        fault?.startDate ?? new Date().toISOString().split('T')[0],
    endDate:          fault?.endDate ?? '',
    status:           fault?.status ?? 'Devam Ediyor',
    serviceId:        fault?.serviceId ?? '',
    serviceName:      fault?.serviceName ?? '',
    customServiceName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleServiceChange = (id: string) => {
    const svc = (services as any[]).find(s => s.id === id);
    setForm(f => ({ ...f, serviceId: id, serviceName: svc?.name ?? '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.vehicleId)          errs.vehicleId   = 'Araç zorunludur';
    if (!form.description.trim()) errs.description = 'Açıklama zorunludur';
    if (!form.location.trim())    errs.location    = 'Yer zorunludur';
    if (!form.startDate)          errs.startDate   = 'Başlangıç tarihi zorunludur';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = {
      vehicleId:   form.vehicleId,
      type:        form.faultType,
      description: form.description.trim(),
      location:    form.location.trim(),
      startDate:   form.startDate,
      endDate:     form.status === 'Çözüldü' ? (form.endDate || new Date().toISOString().split('T')[0]) : null,
      status:      form.status as 'Devam Ediyor' | 'Çözüldü',
      serviceId:   form.serviceId === '__custom' ? null : (form.serviceId || null),
      serviceName: form.serviceId === '__custom'
        ? (form.customServiceName.trim() || null)
        : (form.serviceId ? form.serviceName : null),
    };

    if (fault) {
      updateFault.mutate({ id: fault.id, data: payload }, { onSuccess: onClose });
    } else {
      addFault.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="space-y-4">
      {!vehicleId && (
        <FormField label="Araç" required error={errors.vehicleId}>
          <Select value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
            <option value="">Araç seçin</option>
            {(vehicles as any[]).map(v => (
              <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
            ))}
          </Select>
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Arıza Tipi" required>
          <Select value={form.faultType} onChange={e => set('faultType', e.target.value)}>
            {faultTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FormField>
        <FormField label="Durum">
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="Devam Ediyor">Devam Ediyor</option>
            <option value="Çözüldü">Çözüldü</option>
          </Select>
        </FormField>
      </div>

      <FormField label="Açıklama" required error={errors.description}>
        <Textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Arıza detayı..." rows={3} />
      </FormField>

      <FormField label="Arıza Yeri" required error={errors.location}>
        <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Konum/istasyon adı" />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Başlangıç Tarihi" required error={errors.startDate}>
          <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </FormField>
        {form.status === 'Çözüldü' && (
          <FormField label="Çözülme Tarihi">
            <Input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
          </FormField>
        )}
      </div>

      <FormField label="Servis">
        <Select value={form.serviceId} onChange={e => handleServiceChange(e.target.value)}>
          <option value="">Servis seçin (opsiyonel)</option>
          {(services as any[]).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          <option value="__custom">Diğer (Elle gir)</option>
        </Select>
      </FormField>

      {form.serviceId === '__custom' && (
        <FormField label="Servis Adı">
          <Input value={form.customServiceName}
            onChange={e => setForm(f => ({ ...f, customServiceName: e.target.value }))}
            placeholder="Servis adı..." />
        </FormField>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>İptal</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</>
            : fault ? 'Güncelle' : 'Kaydet'
          }
        </Button>
      </div>
    </div>
  );
}
