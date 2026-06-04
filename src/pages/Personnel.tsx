import { useState } from 'react';
import { Users, Plus, Search, Phone, Edit2, Trash2, Loader2, Printer } from 'lucide-react';
import type { Personnel as PersonnelType } from '../types';
import { usePersonnel, useAddPersonnel, useUpdatePersonnel, useDeletePersonnel } from '../hooks/usePersonnel';
import { useRegions } from '../hooks/useRegions';
import { useSettings } from '../hooks/useSettings';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormField';
import { FormField } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

const titleColors: Record<string, any> = {
  'Amir': 'blue', 'Çavuş': 'purple', 'İşçi': 'gray',
  'Şoför': 'green', 'Teknisyen': 'orange', 'Diğer': 'gray',
};

function PersonnelForm({ person, onClose }: { person?: PersonnelType; onClose: () => void }) {
  const { data: regionsRaw = [] } = useRegions();
  const { data: settings } = useSettings();
  const addPersonnel    = useAddPersonnel();
  const updatePersonnel = useUpdatePersonnel();
  const isPending = addPersonnel.isPending || updatePersonnel.isPending;

  const regions  = (regionsRaw as any[]).map((r: any) => ({ id: r.id, name: r.name }));
  const stations = (regionsRaw as any[]).flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );
  const personnelTitles = (settings as any)?.personnelTitles ?? ['Amir', 'Çavuş', 'İşçi', 'Şoför', 'Teknisyen', 'Diğer'];

  const [form, setForm] = useState({
    firstName: person?.firstName ?? '',
    lastName:  person?.lastName  ?? '',
    title:     person?.title     ?? personnelTitles[0] ?? 'Amir',
    regionId:  person?.regionId  ?? (regions[0]?.id ?? ''),
    stationId: person?.stationId ?? '',
    phone:     person?.phone     ?? '',
    notes:     person?.notes     ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const filteredStations = stations.filter(s => s.regionId === form.regionId);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'Ad zorunludur';
    if (!form.lastName.trim())  e.lastName  = 'Soyad zorunludur';
    if (!form.regionId)         e.regionId  = 'Bölge zorunludur';
    if (!form.stationId)        e.stationId = 'İstasyon zorunludur';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      title:     form.title,
      stationId: form.stationId,
      phone:     form.phone.trim(),
      notes:     form.notes.trim(),
    };
    if (person) {
      updatePersonnel.mutate({ id: person.id, data }, { onSuccess: onClose });
    } else {
      addPersonnel.mutate(data, { onSuccess: onClose });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Ad" required error={errors.firstName}>
          <Input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Ad" />
        </FormField>
        <FormField label="Soyad" required error={errors.lastName}>
          <Input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Soyad" />
        </FormField>
      </div>
      <FormField label="Unvan">
        <Select value={form.title} onChange={e => set('title', e.target.value)}>
          {personnelTitles.map((t: string) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Bölge" required error={errors.regionId}>
          <Select value={form.regionId}
            onChange={e => setForm(f => ({ ...f, regionId: e.target.value, stationId: '' }))}>
            <option value="">Bölge seçin</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </FormField>
        <FormField label="İstasyon" required error={errors.stationId}>
          <Select value={form.stationId} onChange={e => set('stationId', e.target.value)}>
            <option value="">İstasyon seçin</option>
            {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormField>
      </div>
      <FormField label="Telefon">
        <Input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0532 000 0000" />
      </FormField>
      <FormField label="Notlar">
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ek notlar..." />
      </FormField>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>İptal</Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending
            ? <><Loader2 size={14} className="animate-spin" /> Kaydediliyor...</>
            : person ? 'Güncelle' : 'Kaydet'
          }
        </Button>
      </div>
    </div>
  );
}

export function Personnel() {
  const { data: personnelList = [], isLoading } = usePersonnel();
  const { data: regionsRaw = [] } = useRegions();
  const deletePersonnel = useDeletePersonnel();

  const [showForm, setShowForm]           = useState(false);
  const [editingPerson, setEditingPerson] = useState<PersonnelType | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<PersonnelType | undefined>();
  const [search, setSearch]              = useState('');
  const [filterRegion, setFilterRegion]  = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterTitle, setFilterTitle]    = useState('');

  const regions  = (regionsRaw as any[]).map((r: any) => ({ id: r.id, name: r.name }));
  const stations = (regionsRaw as any[]).flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );
  const filteredStations = filterRegion ? stations.filter(s => s.regionId === filterRegion) : stations;
  const allTitles = [...new Set((personnelList as PersonnelType[]).map(p => p.title))];

  const filtered = (personnelList as PersonnelType[]).filter(p => {
    if (filterRegion  && p.regionId  !== filterRegion)  return false;
    if (filterStation && p.stationId !== filterStation)  return false;
    if (filterTitle   && p.title     !== filterTitle)    return false;
    if (search) {
      const sl = search.toLowerCase();
      if (!p.firstName.toLowerCase().includes(sl) &&
          !p.lastName.toLowerCase().includes(sl) &&
          !p.phone.includes(sl)) return false;
    }
    return true;
  });

  const grouped = regions.map(region => {
    const regionStations = stations.filter(s => s.regionId === region.id);
    const stationGroups = regionStations.map(station => ({
      station,
      people: filtered.filter(p => p.regionId === region.id && p.stationId === station.id),
    })).filter(sg => sg.people.length > 0);
    return { region, stationGroups };
  }).filter(rg => rg.stationGroups.length > 0);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 fade-in">
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #personnel-print-area { display: block !important; }
          #personnel-print-area { position: fixed; top: 0; left: 0; width: 100%; }
          .fade-in, nav, header, aside, button, .no-print { display: none !important; }
          #personnel-print-table { display: block !important; }
        }
        #personnel-print-table { display: none; }
      `}</style>

      {/* Hidden print table */}
      <div id="personnel-print-table" style={{position:'fixed',top:0,left:0,width:'100%',background:'white',zIndex:9999,padding:'20px'}}>
        <h1 style={{fontSize:'18px',fontWeight:'bold',marginBottom:'4px',color:'#000'}}>Personel Listesi</h1>
        <p style={{fontSize:'12px',color:'#555',marginBottom:'12px'}}>Toplam: {filtered.length} personel · {new Date().toLocaleDateString('tr-TR')}</p>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
          <thead>
            <tr style={{background:'#f3f4f6'}}>
              {['Ad Soyad','Unvan','İstasyon','Bölge','Telefon'].map(h => (
                <th key={h} style={{border:'1px solid #e5e7eb',padding:'6px 8px',textAlign:'left',fontWeight:'600',color:'#111'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const st = stations.find(s => s.id === p.stationId);
              const rg = regions.find(r => r.id === p.regionId);
              return (
                <tr key={p.id} style={{background: i % 2 === 0 ? '#fff' : '#f9fafb'}}>
                  <td style={{border:'1px solid #e5e7eb',padding:'5px 8px',color:'#111'}}>{p.firstName} {p.lastName}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'5px 8px',color:'#111'}}>{p.title}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'5px 8px',color:'#111'}}>{st?.name ?? '—'}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'5px 8px',color:'#111'}}>{rg?.name ?? '—'}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'5px 8px',color:'#111'}}>{p.phone ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PageHeader
        title="Personel"
        subtitle={`${(personnelList as any[]).length} kayıtlı personel`}
        icon={<Users size={20} />}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
              Yazdır
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => { setEditingPerson(undefined); setShowForm(true); }}>
              Personel Ekle
            </Button>
          </div>
        }
      />

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex-1 min-w-0 sm:min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input className="pl-9" placeholder="Ad, soyad, telefon ara..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterRegion} className="w-full sm:w-40"
          onChange={e => { setFilterRegion(e.target.value); setFilterStation(''); }}>
          <option value="">Tüm Bölgeler</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
        <Select value={filterStation} className="w-full sm:w-44" onChange={e => setFilterStation(e.target.value)}>
          <option value="">Tüm İstasyonlar</option>
          {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={filterTitle} className="w-full sm:w-36" onChange={e => setFilterTitle(e.target.value)}>
          <option value="">Tüm Unvanlar</option>
          {allTitles.map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 gap-3">
          <Loader2 size={24} className="text-blue-400 animate-spin" />
          <span className="text-gray-500 text-sm">Personel yükleniyor...</span>
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState title="Personel bulunamadı" icon={<Users size={28} />}
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>Personel Ekle</Button>}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(({ region, stationGroups }) => (
            <div key={region.id}>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                {region.name}
              </h2>
              <div className="space-y-4">
                {stationGroups.map(({ station, people }) => (
                  <div key={station.id}>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 ml-4">{station.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {people.map(person => (
                        <Card key={person.id} hover className="group">
                          <CardBody className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-white font-semibold">{person.firstName} {person.lastName}</div>
                                <Badge variant={titleColors[person.title] ?? 'gray'} size="sm">{person.title}</Badge>
                              </div>
                            </div>
                            {person.phone && (
                              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                                <Phone size={11} /><span>{person.phone}</span>
                              </div>
                            )}
                            {person.notes && (
                              <p className="text-gray-500 text-xs mb-3 line-clamp-2">{person.notes}</p>
                            )}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" icon={<Edit2 size={12} />}
                                className="flex-1"
                                onClick={() => { setEditingPerson(person); setShowForm(true); }}>
                                Düzenle
                              </Button>
                              <Button variant="ghost" size="sm" icon={<Trash2 size={12} />}
                                className="hover:text-red-400"
                                onClick={() => setConfirmDelete(person)}>{''}</Button>
                            </div>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editingPerson ? 'Personel Düzenle' : 'Personel Ekle'} size="md">
        <PersonnelForm person={editingPerson} onClose={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(undefined)} title="Personel Sil" size="sm">
        <p className="text-gray-300 mb-5">
          <strong className="text-white">{confirmDelete?.firstName} {confirmDelete?.lastName}</strong> isimli personeli silmek istediğinize emin misiniz?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(undefined)}>İptal</Button>
          <Button variant="danger" disabled={deletePersonnel.isPending}
            onClick={() => confirmDelete && deletePersonnel.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(undefined),
            })}>
            {deletePersonnel.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Sil'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
