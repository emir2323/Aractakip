import { useState } from 'react';
import { Car, Plus, Search, Loader2 } from 'lucide-react';
import type { VehicleStatus } from '../types';
import { useVehicles, useDeleteVehicle } from '../hooks/useVehicles';
import { useRegions } from '../hooks/useRegions';
import { Modal } from '../components/ui/Modal';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';

interface VehicleRow {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  regionId: string;
  stationId: string;
  status: VehicleStatus;
  dutyRegionId?: string;
  dutyStationId?: string;
  materials: string[];
  insuranceExpiry: string;
  kaskoExpiry: string;
  muayeneExpiry: string;
  notes: string;
  createdAt: string;
}

export function Vehicles() {
  const { data: regionsRaw = [], isLoading: loadingRegions } = useRegions();
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles();
  const deleteVehicle = useDeleteVehicle();

  const [showForm, setShowForm]         = useState(false);
  const [editingVehicle, setEditing]    = useState<VehicleRow | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<VehicleRow | undefined>();

  const [search, setSearch]           = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStation, setFilterStation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const regions  = regionsRaw.map((r: any) => ({ id: r.id, name: r.name }));
  const stations = regionsRaw.flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );
  const filteredStations = filterRegion
    ? stations.filter(s => s.regionId === filterRegion)
    : stations;

  const filtered = (vehicles as VehicleRow[]).filter(v => {
    const sl = search.toLowerCase();
    if (search && !v.plate.toLowerCase().includes(sl) &&
        !v.brand.toLowerCase().includes(sl) && !v.model.toLowerCase().includes(sl)) return false;
    if (filterRegion && v.regionId !== filterRegion) return false;
    if (filterStation && v.stationId !== filterStation) return false;
    if (filterStatus && v.status !== filterStatus) return false;
    return true;
  });

  const isLoading = loadingRegions || loadingVehicles;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Araçlar"
        subtitle={`${(vehicles as any[]).length} araç kayıtlı`}
        icon={<Car size={20} />}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => { setEditing(undefined); setShowForm(true); }}>
            Yeni Araç
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4">
        <div className="flex-1 min-w-0 sm:min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input className="pl-9" placeholder="Plaka, marka, model ara..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterRegion} className="w-full sm:w-40"
          onChange={e => { setFilterRegion(e.target.value); setFilterStation(''); }}>
          <option value="">Tüm Bölgeler</option>
          {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
        <Select value={filterStation} className="w-full sm:w-44" onChange={e => setFilterStation(e.target.value)}>
          <option value="">Tüm İstasyonlar</option>
          {filteredStations.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <Select value={filterStatus} className="w-full sm:w-44" onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {['Aktif', 'Arızalı', 'Parça Bekliyor', 'Görevli'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        {(search || filterRegion || filterStation || filterStatus) && (
          <Button variant="ghost" size="sm"
            onClick={() => { setSearch(''); setFilterRegion(''); setFilterStation(''); setFilterStatus(''); }}>
            Temizle
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 gap-3">
          <Loader2 size={24} className="text-blue-400 animate-spin" />
          <span className="text-gray-500 text-sm">Araçlar yükleniyor...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Araç bulunamadı" description="Filtrelerinizi değiştirin veya yeni araç ekleyin"
          icon={<Car size={28} />}
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>Yeni Araç Ekle</Button>}
        />
      ) : (
        <div>
          <p className="text-gray-500 text-sm mb-4">{filtered.length} araç gösteriliyor</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v as any}
                regions={regions}
                stations={stations}
                onEdit={v => { setEditing(v as any); setShowForm(true); }}
                onDelete={v => setConfirmDelete(v as any)}
              />
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editingVehicle ? 'Araç Düzenle' : 'Yeni Araç Ekle'} size="lg">
        <VehicleForm
          vehicle={editingVehicle as any}
          regions={regions}
          stations={stations}
          onClose={() => setShowForm(false)}
        />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(undefined)} title="Araç Sil" size="sm">
        <p className="text-gray-300 mb-5">
          <strong className="text-white">{confirmDelete?.plate}</strong> plakalı aracı silmek istediğinize emin misiniz?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(undefined)}>İptal</Button>
          <Button
            variant="danger"
            disabled={deleteVehicle.isPending}
            onClick={() => {
              if (confirmDelete) {
                deleteVehicle.mutate(confirmDelete.id, {
                  onSuccess: () => setConfirmDelete(undefined),
                });
              }
            }}
          >
            {deleteVehicle.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Sil'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
