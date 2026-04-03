import { useState } from 'react';
import { Settings as SettingsIcon, Plus, X, MapPin, Building, Wrench, Tag, Download, Loader2 } from 'lucide-react';
import { backupApi } from '../api';
import { useRegions, useAddRegion, useUpdateRegion, useDeleteRegion, useAddStation, useDeleteStation } from '../hooks/useRegions';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/FormField';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { Select } from '../components/ui/FormField';

function TagList({ items, onRemove, minCount = 0 }: {
  items: string[]; onRemove: (item: string) => void; minCount?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <span key={item} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full">
          {item}
          {items.length > minCount && (
            <button onClick={() => onRemove(item)} className="text-gray-600 hover:text-red-400 transition-colors">
              <X size={12} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export function Settings() {
  const { data: regionsRaw = [], isLoading: loadingRegions } = useRegions();
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const addRegion    = useAddRegion();
  const updateRegion = useUpdateRegion();
  const deleteRegion = useDeleteRegion();
  const addStation   = useAddStation();
  const deleteStation = useDeleteStation();
  const updateSettings = useUpdateSettings();

  const regions  = (regionsRaw as any[]).map((r: any) => ({ id: r.id, name: r.name }));
  const stations = (regionsRaw as any[]).flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );

  const faultTypes      = (settings as any)?.faultTypes       ?? [];
  const personnelTitles = (settings as any)?.personnelTitles  ?? [];

  const [newRegionName, setNewRegionName] = useState('');
  const [newStation, setNewStation]       = useState({ regionId: '', name: '' });
  const [newFaultType, setNewFaultType]   = useState('');
  const [newTitle, setNewTitle]           = useState('');
  const [editingRegion, setEditingRegion] = useState<{ id: string; name: string } | null>(null);

  const handleAddRegion = () => {
    if (!newRegionName.trim()) return;
    addRegion.mutate(newRegionName.trim(), { onSuccess: () => setNewRegionName('') });
  };

  const handleAddStation = () => {
    if (!newStation.name.trim() || !newStation.regionId) return;
    addStation.mutate(
      { name: newStation.name.trim(), regionId: newStation.regionId },
      { onSuccess: () => setNewStation(s => ({ ...s, name: '' })) }
    );
  };

  const handleAddFaultType = () => {
    if (!newFaultType.trim() || faultTypes.includes(newFaultType.trim())) return;
    updateSettings.mutate(
      { key: 'faultTypes', value: [...faultTypes, newFaultType.trim()] },
      { onSuccess: () => setNewFaultType('') }
    );
  };

  const handleRemoveFaultType = (type: string) => {
    updateSettings.mutate({ key: 'faultTypes', value: faultTypes.filter((t: string) => t !== type) });
  };

  const handleAddTitle = () => {
    if (!newTitle.trim() || personnelTitles.includes(newTitle.trim())) return;
    updateSettings.mutate(
      { key: 'personnelTitles', value: [...personnelTitles, newTitle.trim()] },
      { onSuccess: () => setNewTitle('') }
    );
  };

  const handleRemoveTitle = (title: string) => {
    updateSettings.mutate({ key: 'personnelTitles', value: personnelTitles.filter((t: string) => t !== title) });
  };

  if (loadingRegions || loadingSettings) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 size={28} className="text-blue-400 animate-spin" />
        <span className="text-gray-500">Ayarlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Ayarlar" subtitle="Sistem yapılandırması" icon={<SettingsIcon size={20} />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold">Bölgeler</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              {regions.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                  <span className="text-gray-300 text-sm">{r.name}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingRegion({ id: r.id, name: r.name })}>
                      Düzenle
                    </Button>
                    {regions.length > 1 && (
                      <Button variant="ghost" size="sm" className="hover:text-red-400" icon={<X size={13} />}
                        disabled={deleteRegion.isPending}
                        onClick={() => deleteRegion.mutate(r.id)}>{''}</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newRegionName} onChange={e => setNewRegionName(e.target.value)}
                placeholder="Yeni bölge adı..." onKeyDown={e => e.key === 'Enter' && handleAddRegion()} />
              <Button size="sm" icon={addRegion.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                onClick={handleAddRegion} disabled={addRegion.isPending}>Ekle</Button>
            </div>
          </CardBody>
        </Card>

        {/* Stations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold">İstasyonlar</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {regions.map(region => {
              const regionStations = stations.filter(s => s.regionId === region.id);
              return (
                <div key={region.id}>
                  <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">{region.name}</h3>
                  <div className="space-y-1 mb-2">
                    {regionStations.length === 0 && <p className="text-gray-600 text-xs">İstasyon yok</p>}
                    {regionStations.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-1.5">
                        <span className="text-gray-300 text-sm">{s.name}</span>
                        <Button variant="ghost" size="sm" className="hover:text-red-400" icon={<X size={12} />}
                          disabled={deleteStation.isPending}
                          onClick={() => deleteStation.mutate(s.id)}>{''}</Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="flex gap-2 pt-2 border-t border-gray-700">
              <Select value={newStation.regionId} className="w-36"
                onChange={e => setNewStation(s => ({ ...s, regionId: e.target.value }))}>
                <option value="">Bölge seç</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
              <Input value={newStation.name} onChange={e => setNewStation(s => ({ ...s, name: e.target.value }))}
                placeholder="İstasyon adı..." onKeyDown={e => e.key === 'Enter' && handleAddStation()} />
              <Button size="sm" icon={addStation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                onClick={handleAddStation} disabled={addStation.isPending}>Ekle</Button>
            </div>
          </CardBody>
        </Card>

        {/* Fault Types */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold">Arıza Tipleri</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <TagList items={faultTypes} onRemove={handleRemoveFaultType} minCount={1} />
            <div className="flex gap-2">
              <Input value={newFaultType} onChange={e => setNewFaultType(e.target.value)}
                placeholder="Yeni tip ekle..." onKeyDown={e => e.key === 'Enter' && handleAddFaultType()} />
              <Button size="sm" icon={<Plus size={14} />} onClick={handleAddFaultType}>Ekle</Button>
            </div>
          </CardBody>
        </Card>

        {/* Personnel Titles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Tag size={16} className="text-blue-400" />
              <h2 className="text-white font-semibold">Personel Unvanları</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <TagList items={personnelTitles} onRemove={handleRemoveTitle} minCount={1} />
            <div className="flex gap-2">
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="Yeni unvan ekle..." onKeyDown={e => e.key === 'Enter' && handleAddTitle()} />
              <Button size="sm" icon={<Plus size={14} />} onClick={handleAddTitle}>Ekle</Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Backup */}
      <Card className="border-blue-500/20">
        <CardHeader><h2 className="text-white font-semibold">Veri Yönetimi</h2></CardHeader>
        <CardBody>
          <p className="text-gray-500 text-sm mb-4">
            Tüm veriler SQLite veritabanında saklanmaktadır. Tam yedek almak için butonu kullanın.
          </p>
          <Button variant="secondary" icon={<Download size={15} />}
            onClick={async () => {
              const res = await backupApi.export();
              const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement('a');
              a.href     = url;
              a.download = `aractakip-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
            Veritabanı Yedeği Al (JSON)
          </Button>
        </CardBody>
      </Card>

      {editingRegion && (
        <Modal isOpen onClose={() => setEditingRegion(null)} title="Bölge Düzenle" size="sm">
          <div className="space-y-4">
            <FormField label="Bölge Adı" required>
              <Input value={editingRegion.name}
                onChange={e => setEditingRegion(r => r ? { ...r, name: e.target.value } : r)} />
            </FormField>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditingRegion(null)}>İptal</Button>
              <Button disabled={updateRegion.isPending}
                onClick={() => updateRegion.mutate(
                  { id: editingRegion.id, name: editingRegion.name },
                  { onSuccess: () => setEditingRegion(null) }
                )}>
                {updateRegion.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Kaydet'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
