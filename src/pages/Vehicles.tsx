import { useState, useMemo, useCallback } from 'react';
import { Car, Plus, Search, Loader2, FileDown, AlertTriangle, Wrench, Droplets, MessageSquareWarning, Image, User } from 'lucide-react';
import type { VehicleStatus } from '../types';
import { apiClient } from '../api/client';
import { useVehicles, useDeleteVehicle } from '../hooks/useVehicles';
import { useRegions } from '../hooks/useRegions';
import { Modal } from '../components/ui/Modal';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { VehicleCard } from '../components/vehicles/VehicleCard';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate } from '../utils/helpers';

const VEHICLES_PRINT_STYLES = `
@media print {
  * { box-sizing: border-box; }
  body { background: #fff !important; color: #000 !important; font-family: Arial, sans-serif; font-size: 10px; }
  .no-print { display: none !important; }
  .vehicles-print-section { display: block !important; }

  .vehicles-print-header { margin-bottom: 8px; }
  .vehicles-print-header h1 { font-size: 14px; font-weight: 700; margin: 0 0 2px; }
  .vehicles-print-header p { font-size: 9px; color: #555; margin: 0; }

  .vehicles-print-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .vehicles-print-table th {
    background: #eee !important;
    color: #000 !important;
    font-weight: 700;
    text-align: left;
    padding: 4px 5px;
    border: 1px solid #bbb;
    white-space: nowrap;
  }
  .vehicles-print-table td {
    padding: 3px 5px;
    border: 1px solid #ddd;
    line-height: 1.3;
    vertical-align: middle;
  }
  .vehicles-print-table tr:nth-child(even) td { background: #fafafa !important; }
  .print-status-aktif    { color: #166534; font-weight: 600; }
  .print-status-arızalı  { color: #991b1b; font-weight: 600; }
  .print-status-default  { color: #92400e; font-weight: 600; }
  .print-status-görevli  { color: #1e40af; font-weight: 600; }

  .vehicles-print-footer {
    font-size: 8px; color: #777; text-align: center;
    margin-top: 6px; border-top: 1px solid #ccc; padding-top: 3px;
  }
  @page { size: A4 landscape; margin: 10mm; }
}

@media screen {
  .vehicles-print-section { display: none !important; }
}
`;

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

function statusPrintClass(status: string) {
  if (status === 'Aktif') return 'print-status-aktif';
  if (status === 'Arızalı') return 'print-status-arızalı';
  if (status === 'Görevli') return 'print-status-görevli';
  return 'print-status-default';
}

export function Vehicles() {
  const { data: regionsRaw = [], isLoading: loadingRegions } = useRegions();
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles();
  const deleteVehicle = useDeleteVehicle();

  const [showForm, setShowForm]           = useState(false);
  const [editingVehicle, setEditing]      = useState<VehicleRow | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<VehicleRow | undefined>();

  // Delete summary state
  interface VehicleSummary {
    faultCount: number;
    oilCount: number;
    faultReportCount: number;
    photoCount: number;
    hasDriver: boolean;
    driverName: string | null;
  }
  const [deleteSummary, setDeleteSummary]       = useState<VehicleSummary | null>(null);
  const [deleteSummaryLoading, setDeleteSummaryLoading] = useState(false);
  const [deleteSummaryError, setDeleteSummaryError]     = useState<string | null>(null);

  const openDeleteModal = useCallback(async (v: VehicleRow) => {
    setConfirmDelete(v);
    setDeleteSummary(null);
    setDeleteSummaryError(null);
    setDeleteSummaryLoading(true);
    try {
      const data = await apiClient.get(`/vehicles/${v.id}/summary`).then(r => r.data);
      setDeleteSummary(data);
    } catch {
      setDeleteSummaryError('Kayıt özeti alınamadı.');
    } finally {
      setDeleteSummaryLoading(false);
    }
  }, []);

  const [search, setSearch]             = useState('');
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

  // Lookup maps for print
  const regionMap = useMemo(() =>
    Object.fromEntries(regions.map(r => [r.id, r.name])), [regions]);
  const stationMap = useMemo(() =>
    Object.fromEntries(stations.map(s => [s.id, s.name])), [stations]);

  const isLoading = loadingRegions || loadingVehicles;

  const handlePrint = () => {
    window.print();
  };

  // Build a summary label for the active filters (used in print header)
  const filterLabel = [
    filterRegion ? `Bölge: ${regionMap[filterRegion] ?? ''}` : '',
    filterStation ? `İstasyon: ${stationMap[filterStation] ?? ''}` : '',
    filterStatus ? `Durum: ${filterStatus}` : '',
    search ? `Arama: "${search}"` : '',
  ].filter(Boolean).join(' · ') || 'Tüm Araçlar';

  return (
    <div className="space-y-6 fade-in">
      <style dangerouslySetInnerHTML={{ __html: VEHICLES_PRINT_STYLES }} />

      <PageHeader
        title="Araçlar"
        subtitle={`${(vehicles as any[]).length} araç kayıtlı`}
        icon={<Car size={20} />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              icon={<FileDown size={16} />}
              onClick={handlePrint}
              variant="secondary"
              disabled={filtered.length === 0}
            >
              PDF İndir
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => { setEditing(undefined); setShowForm(true); }}>
              Yeni Araç
            </Button>
          </div>
        }
      />

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 no-print">
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

      {/* ── PRINT ONLY: Kompakt araç tablosu ── */}
      <div className="vehicles-print-section">
        <div className="vehicles-print-header">
          <h1>ARAÇ LİSTESİ</h1>
          <p>
            {filterLabel} &nbsp;·&nbsp; {filtered.length} araç &nbsp;·&nbsp;
            Tarih: {new Date().toLocaleDateString('tr-TR')}
          </p>
        </div>
        <table className="vehicles-print-table">
          <thead>
            <tr>
              <th>Plaka</th>
              <th>Marka / Model</th>
              <th>Yıl</th>
              <th>Bölge</th>
              <th>İstasyon</th>
              <th>Durum</th>
              <th>Muayene</th>
              <th>Sigorta</th>
              <th>Kasko</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 700 }}>{v.plate}</td>
                <td>{v.brand} {v.model}</td>
                <td>{v.year}</td>
                <td>{regionMap[v.regionId] ?? '—'}</td>
                <td>{stationMap[v.stationId] ?? '—'}</td>
                <td className={statusPrintClass(v.status)}>{v.status}</td>
                <td>{v.muayeneExpiry ? formatDate(v.muayeneExpiry) : '—'}</td>
                <td>{v.insuranceExpiry ? formatDate(v.insuranceExpiry) : '—'}</td>
                <td>{v.kaskoExpiry ? formatDate(v.kaskoExpiry) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="vehicles-print-footer">
          Araç Takip Sistemi — {new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>

      {/* ── SCREEN: Normal kart görünümü ── */}
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
          <p className="text-gray-500 text-sm mb-4 no-print">{filtered.length} araç gösteriliyor</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v as any}
                regions={regions}
                stations={stations}
                onEdit={v => { setEditing(v as any); setShowForm(true); }}
                onDelete={v => openDeleteModal(v as any)}
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

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => { setConfirmDelete(undefined); setDeleteSummary(null); }}
        title="Araç Sil"
        size="sm"
      >
        {/* Araç başlığı */}
        <p className="text-gray-300 mb-4">
          <strong className="text-white">{confirmDelete?.plate}</strong> plakalı aracı silmek istediğinize emin misiniz?
        </p>

        {/* Özet alanı */}
        {deleteSummaryLoading ? (
          <div className="flex items-center gap-2 py-4 justify-center text-gray-400 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Kayıt bilgileri yükleniyor...
          </div>
        ) : deleteSummaryError ? (
          <p className="text-red-400 text-sm mb-4">{deleteSummaryError}</p>
        ) : deleteSummary ? (
          (() => {
            const hasAny = deleteSummary.faultCount > 0 || deleteSummary.oilCount > 0 ||
              deleteSummary.faultReportCount > 0 || deleteSummary.photoCount > 0 || deleteSummary.hasDriver;
            return hasAny ? (
              <div className="mb-5 rounded-xl border border-yellow-600/40 bg-yellow-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={15} className="text-yellow-400 shrink-0" />
                  <span className="text-yellow-300 text-sm font-medium">
                    Bu araç silindiğinde aşağıdaki kayıtlar da kalıcı olarak silinecektir:
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {deleteSummary.faultCount > 0 && (
                    <li className="flex items-center gap-2 text-gray-300 text-sm">
                      <Wrench size={13} className="text-red-400 shrink-0" />
                      <span><strong className="text-white">{deleteSummary.faultCount}</strong> arıza kaydı</span>
                    </li>
                  )}
                  {deleteSummary.oilCount > 0 && (
                    <li className="flex items-center gap-2 text-gray-300 text-sm">
                      <Droplets size={13} className="text-amber-400 shrink-0" />
                      <span><strong className="text-white">{deleteSummary.oilCount}</strong> yağ bakımı kaydı</span>
                    </li>
                  )}
                  {deleteSummary.faultReportCount > 0 && (
                    <li className="flex items-center gap-2 text-gray-300 text-sm">
                      <MessageSquareWarning size={13} className="text-orange-400 shrink-0" />
                      <span><strong className="text-white">{deleteSummary.faultReportCount}</strong> şoför bildirimi</span>
                    </li>
                  )}
                  {deleteSummary.photoCount > 0 && (
                    <li className="flex items-center gap-2 text-gray-300 text-sm">
                      <Image size={13} className="text-blue-400 shrink-0" />
                      <span><strong className="text-white">{deleteSummary.photoCount}</strong> fotoğraf</span>
                    </li>
                  )}
                  {deleteSummary.hasDriver && (
                    <li className="flex items-center gap-2 text-gray-300 text-sm">
                      <User size={13} className="text-purple-400 shrink-0" />
                      <span>
                        Atanan şoför: <strong className="text-white">{deleteSummary.driverName}</strong>
                        <span className="text-gray-500 text-xs ml-1">(araç ataması kaldırılacak)</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-gray-700 bg-gray-800/50 px-4 py-3">
                <p className="text-gray-400 text-sm">✓ Bu araça ait ek kayıt bulunmuyor.</p>
              </div>
            );
          })()
        ) : null}

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => { setConfirmDelete(undefined); setDeleteSummary(null); }}>İptal</Button>
          <Button
            variant="danger"
            disabled={deleteVehicle.isPending || deleteSummaryLoading}
            onClick={() => {
              if (confirmDelete) {
                deleteVehicle.mutate(confirmDelete.id, {
                  onSuccess: () => { setConfirmDelete(undefined); setDeleteSummary(null); },
                });
              }
            }}
            style={{ minWidth: 140 }}
          >
            {deleteVehicle.isPending
              ? <><Loader2 size={14} className="animate-spin" /><span className="ml-1.5">Siliniyor...</span></>
              : '🗑 Kalıcı Olarak Sil'
            }
          </Button>
        </div>
      </Modal>
    </div>
  );
}
