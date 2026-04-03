import { useState } from 'react';
import type { Vehicle, VehicleStatus } from '../../types';
import { useAddVehicle, useUpdateVehicle } from '../../hooks/useVehicles';
import { FormField, Input, Select, Textarea } from '../ui/FormField';
import { Button } from '../ui/Button';
import { X, Plus, Loader2 } from 'lucide-react';

const STATUSES: VehicleStatus[] = ['Aktif', 'Arızalı', 'Parça Bekliyor', 'Görevli'];

interface Region  { id: string; name: string }
interface Station { id: string; regionId: string; name: string }

interface Props {
  vehicle?: Vehicle;
  regions?: Region[];
  stations?: Station[];
  onClose: () => void;
}

export function VehicleForm({ vehicle, regions = [], stations = [], onClose }: Props) {
  const addVehicle    = useAddVehicle();
  const updateVehicle = useUpdateVehicle();
  const isPending = addVehicle.isPending || updateVehicle.isPending;

  const [form, setForm] = useState({
    plate:          vehicle?.plate ?? '',
    brand:          vehicle?.brand ?? '',
    model:          vehicle?.model ?? '',
    year:           vehicle?.year?.toString() ?? new Date().getFullYear().toString(),
    regionId:       vehicle?.regionId ?? (regions[0]?.id ?? ''),
    stationId:      vehicle?.stationId ?? '',
    status:         (vehicle?.status ?? 'Aktif') as VehicleStatus,
    dutyRegionId:   vehicle?.dutyRegionId ?? '',
    dutyStationId:  vehicle?.dutyStationId ?? '',
    insuranceExpiry: vehicle?.insuranceExpiry ?? '',
    kaskoExpiry:    vehicle?.kaskoExpiry ?? '',
    muayeneExpiry:  vehicle?.muayeneExpiry ?? '',
    notes:          vehicle?.notes ?? '',
    materials:      vehicle?.materials ?? [] as string[],
    newMaterial:    '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredStations  = stations.filter(s => s.regionId === form.regionId);
  const dutyStations      = stations.filter(s => s.regionId === form.dutyRegionId);

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const addMaterial = () => {
    if (!form.newMaterial.trim()) return;
    setForm(f => ({ ...f, materials: [...f.materials, f.newMaterial.trim()], newMaterial: '' }));
  };

  const removeMaterial = (i: number) =>
    setForm(f => ({ ...f, materials: f.materials.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.plate.trim())   errs.plate    = 'Plaka zorunludur';
    if (!form.brand.trim())   errs.brand    = 'Marka zorunludur';
    if (!form.model.trim())   errs.model    = 'Model zorunludur';
    if (!form.regionId)       errs.regionId  = 'Bölge zorunludur';
    if (!form.stationId)      errs.stationId = 'İstasyon zorunludur';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      plate:          form.plate.trim().toUpperCase(),
      brand:          form.brand.trim(),
      model:          form.model.trim(),
      year:           parseInt(form.year) || new Date().getFullYear(),
      regionId:       form.regionId,
      stationId:      form.stationId,
      status:         form.status,
      dutyRegionId:   form.status === 'Görevli' ? form.dutyRegionId : undefined,
      dutyStationId:  form.status === 'Görevli' ? (form.dutyStationId || undefined) : undefined,
      materials:      form.materials,
      insuranceExpiry: form.insuranceExpiry,
      kaskoExpiry:    form.kaskoExpiry,
      muayeneExpiry:  form.muayeneExpiry,
      notes:          form.notes,
    };

    if (vehicle) {
      updateVehicle.mutate({ id: vehicle.id, data }, { onSuccess: onClose });
    } else {
      addVehicle.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Plaka" required error={errors.plate}>
          <Input value={form.plate} onChange={e => set('plate', e.target.value)} placeholder="06 AGAH 0000" />
        </FormField>
        <FormField label="Durum" required>
          <Select value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Marka" required error={errors.brand}>
          <Input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Toyota" />
        </FormField>
        <FormField label="Model" required error={errors.model}>
          <Input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Hilux" />
        </FormField>
        <FormField label="Yıl">
          <Input type="number" value={form.year} onChange={e => set('year', e.target.value)} min="1990" max="2030" />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Ana Bölge" required error={errors.regionId}>
          <Select value={form.regionId}
            onChange={e => setForm(f => ({ ...f, regionId: e.target.value, stationId: '' }))}>
            <option value="">Bölge seçin</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Ana İstasyon" required error={errors.stationId}>
          <Select value={form.stationId} onChange={e => set('stationId', e.target.value)}>
            <option value="">İstasyon seçin</option>
            {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormField>
      </div>

      {form.status === 'Görevli' && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <FormField label="Görev Bölgesi">
            <Select value={form.dutyRegionId}
              onChange={e => setForm(f => ({ ...f, dutyRegionId: e.target.value, dutyStationId: '' }))}>
              <option value="">Bölge seçin</option>
              {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Görev İstasyonu">
            <Select value={form.dutyStationId} onChange={e => set('dutyStationId', e.target.value)}>
              <option value="">İstasyon seçin</option>
              {dutyStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FormField>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <FormField label="Sigorta Bitiş">
          <Input type="date" value={form.insuranceExpiry} onChange={e => set('insuranceExpiry', e.target.value)} />
        </FormField>
        <FormField label="Kasko Bitiş">
          <Input type="date" value={form.kaskoExpiry} onChange={e => set('kaskoExpiry', e.target.value)} />
        </FormField>
        <FormField label="Muayene Bitiş">
          <Input type="date" value={form.muayeneExpiry} onChange={e => set('muayeneExpiry', e.target.value)} />
        </FormField>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Üzerindeki Malzemeler</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={form.newMaterial}
              onChange={e => setForm(f => ({ ...f, newMaterial: e.target.value }))}
              placeholder="Malzeme ekle..."
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
            />
            <Button size="sm" onClick={addMaterial} icon={<Plus size={14} />}>Ekle</Button>
          </div>
          {form.materials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.materials.map((m, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full">
                  {m}
                  <button onClick={() => removeMaterial(i)} className="text-gray-500 hover:text-red-400">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <FormField label="Notlar">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ek notlar..." />
      </FormField>

      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>İptal</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</>
            : vehicle ? 'Güncelle' : 'Kaydet'
          }
        </Button>
      </div>
    </div>
  );
}
