import { useState } from 'react';
import { AlertTriangle, Plus, Search, CheckCircle, Filter, MapPin, Wrench, Trash2, Edit2, Loader2 } from 'lucide-react';
import type { FaultLog } from '../types';
import { useFaults, useDeleteFault } from '../hooks/useFaults';
import { useVehicles } from '../hooks/useVehicles';
import { useRegions } from '../hooks/useRegions';
import { useSettings } from '../hooks/useSettings';
import { Modal } from '../components/ui/Modal';
import { FaultForm } from '../components/faults/FaultForm';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, faultTypeColors } from '../utils/helpers';
import { differenceInDays, parseISO } from 'date-fns';

export function Faults() {
  const { data: faultLogs = [], isLoading: loadingFaults } = useFaults();
  const { data: vehicles  = [] } = useVehicles();
  const { data: regionsRaw = [] } = useRegions();
  const { data: settings } = useSettings();
  const deleteFault = useDeleteFault();

  const [showForm, setShowForm]           = useState(false);
  const [editingFault, setEditingFault]   = useState<FaultLog | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<FaultLog | undefined>();

  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  const faultTypes = (settings as any)?.faultTypes ?? ['Motor', 'Elektrik', 'Fren', 'Lastik', 'Şanzıman', 'Diğer'];
  const regions  = (regionsRaw as any[]).map((r: any) => ({ id: r.id, name: r.name }));
  const stations = (regionsRaw as any[]).flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );

  const filtered = (faultLogs as FaultLog[]).filter(f => {
    const v = (vehicles as any[]).find(x => x.id === f.vehicleId);
    if (filterRegion && v?.regionId !== filterRegion) return false;
    if (filterType   && f.faultType !== filterType)   return false;
    if (filterStatus && f.status    !== filterStatus)  return false;
    if (search) {
      const sl = search.toLowerCase();
      if (!v?.plate.toLowerCase().includes(sl) &&
          !f.description.toLowerCase().includes(sl) &&
          !f.location.toLowerCase().includes(sl) &&
          !(f.serviceName ?? '').toLowerCase().includes(sl)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const active   = (faultLogs as FaultLog[]).filter(f => f.status === 'Devam Ediyor').length;
  const resolved = (faultLogs as FaultLog[]).filter(f => f.status === 'Çözüldü').length;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Arıza Kayıtları"
        subtitle={`${(faultLogs as any[]).length} toplam kayıt`}
        icon={<AlertTriangle size={20} />}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => { setEditingFault(undefined); setShowForm(true); }}>
            Arıza Ekle
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardBody className="p-4 flex items-center gap-4">
            <AlertTriangle size={24} className="text-red-400 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-white">{active}</div>
              <div className="text-gray-500 text-sm">Devam Ediyor</div>
            </div>
          </CardBody>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardBody className="p-4 flex items-center gap-4">
            <CheckCircle size={24} className="text-green-400 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-white">{resolved}</div>
              <div className="text-gray-500 text-sm">Çözüldü</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-4 flex items-center gap-4">
            <Filter size={24} className="text-blue-400 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-white">{filtered.length}</div>
              <div className="text-gray-500 text-sm">Gösterilen</div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <Input className="pl-9" placeholder="Plaka, açıklama, yer ara..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterRegion} className="w-40" onChange={e => setFilterRegion(e.target.value)}>
          <option value="">Tüm Bölgeler</option>
          {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
        <Select value={filterType} className="w-40" onChange={e => setFilterType(e.target.value)}>
          <option value="">Tüm Tipler</option>
          {faultTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select value={filterStatus} className="w-40" onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="Devam Ediyor">Devam Ediyor</option>
          <option value="Çözüldü">Çözüldü</option>
        </Select>
        {(search || filterType || filterStatus || filterRegion) && (
          <Button variant="ghost" size="sm"
            onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setFilterRegion(''); }}>
            Temizle
          </Button>
        )}
      </div>

      {loadingFaults ? (
        <div className="flex items-center justify-center h-40 gap-3">
          <Loader2 size={24} className="text-blue-400 animate-spin" />
          <span className="text-gray-500 text-sm">Arızalar yükleniyor...</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Arıza kaydı bulunamadı"
          description="Filtrelerinizi değiştirin veya yeni arıza ekleyin"
          icon={<AlertTriangle size={28} />}
          action={<Button onClick={() => setShowForm(true)} icon={<Plus size={16} />}>Arıza Ekle</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(fault => {
            const vehicle = (vehicles as any[]).find(v => v.id === fault.vehicleId);
            const station = stations.find(s => s.id === vehicle?.stationId);
            const region  = regions.find((r: any) => r.id === vehicle?.regionId);
            const days    = differenceInDays(new Date(), parseISO(fault.startDate));
            return (
              <Card key={fault.id} className={`border-l-4 ${fault.status === 'Devam Ediyor' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="text-white font-bold">{vehicle?.plate ?? 'Bilinmiyor'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${faultTypeColors[fault.faultType] ?? 'text-gray-400 bg-gray-400/10'}`}>
                          {fault.faultType}
                        </span>
                        <StatusBadge status={fault.status} />
                        <span className="text-gray-500 text-xs">{vehicle?.brand} {vehicle?.model}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{fault.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={11} />{fault.location}</span>
                        {fault.serviceName && <span className="flex items-center gap-1"><Wrench size={11} />{fault.serviceName}</span>}
                        <span>{(region as any)?.name} › {station?.name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${fault.status === 'Devam Ediyor' ? 'text-red-400' : 'text-green-400'}`}>
                          {fault.status === 'Devam Ediyor' ? `${days} gün` : 'Çözüldü'}
                        </div>
                        <div className="text-gray-600 text-xs">{formatDate(fault.startDate)}</div>
                        {fault.endDate && <div className="text-green-400 text-xs">{formatDate(fault.endDate)}</div>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" icon={<Edit2 size={13} />}
                          onClick={() => { setEditingFault(fault); setShowForm(true); }}>{''}</Button>
                        <Button variant="ghost" size="sm" icon={<Trash2 size={13} />}
                          className="hover:text-red-400" onClick={() => setConfirmDelete(fault)}>{''}</Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editingFault ? 'Arıza Düzenle' : 'Arıza Ekle'} size="lg">
        <FaultForm fault={editingFault} onClose={() => setShowForm(false)} />
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(undefined)} title="Arıza Sil" size="sm">
        <p className="text-gray-300 mb-5">Bu arıza kaydını silmek istediğinize emin misiniz?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(undefined)}>İptal</Button>
          <Button variant="danger" disabled={deleteFault.isPending}
            onClick={() => confirmDelete && deleteFault.mutate(confirmDelete.id, {
              onSuccess: () => setConfirmDelete(undefined),
            })}>
            {deleteFault.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Sil'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
