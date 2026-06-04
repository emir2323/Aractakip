import { useState } from 'react';
import {
  AlertTriangle, Plus, Search, CheckCircle, Filter, MapPin, Wrench,
  Trash2, Edit2, Loader2, MessageSquare, ShieldAlert, ArrowRightCircle, XCircle, Printer,
} from 'lucide-react';
import type { FaultLog } from '../types';
import { useFaults, useDeleteFault } from '../hooks/useFaults';
import { useVehicles } from '../hooks/useVehicles';
import { useRegions } from '../hooks/useRegions';
import { useSettings } from '../hooks/useSettings';
import { useFaultReports, useReviewFaultReport, useRejectFaultReport, useConvertFaultReport, useDeleteFaultReport } from '../hooks/useFaultReports';
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
import type { FaultReport } from '../types';

const reportStatusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  reviewed: 'text-blue-400 bg-blue-400/10',
  converted: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
};
const reportStatusLabels: Record<string, string> = {
  pending: 'Bekliyor', reviewed: 'İncelendi', converted: 'Resmi Arıza', rejected: 'Reddedildi',
};

function DriverReportsPanel() {
  const { data: reports = [], isLoading } = useFaultReports();
  const reviewMutation = useReviewFaultReport();
  const rejectMutation = useRejectFaultReport();
  const convertMutation = useConvertFaultReport();
  const deleteMutation = useDeleteFaultReport();

  const [reviewingReport, setReviewingReport] = useState<FaultReport | undefined>();
  const [rejectingReport, setRejectingReport] = useState<FaultReport | undefined>();
  const [adminNote, setAdminNote] = useState('');

  const pending = reports.filter(r => r.status === 'pending').length;

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={24} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pending > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
          <ShieldAlert size={16} className="text-yellow-400 shrink-0" />
          <span className="text-yellow-300 text-sm font-medium">{pending} bekleyen şoför bildirimi var</span>
        </div>
      )}

      {reports.length === 0 ? (
        <EmptyState
          title="Şoför bildirimi yok"
          description="Şoförlerden henüz arıza bildirimi gelmedi."
          icon={<ShieldAlert size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <Card key={report.id} className={`border-l-4 ${report.status === 'pending' ? 'border-l-yellow-500' : report.status === 'converted' ? 'border-l-green-500' : report.status === 'rejected' ? 'border-l-red-500' : 'border-l-blue-500'}`}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <span className="text-white font-bold">{report.vehicle?.plate}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${faultTypeColors[report.type] ?? 'text-gray-400 bg-gray-400/10'}`}>
                        {report.type}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reportStatusColors[report.status]}`}>
                        {reportStatusLabels[report.status]}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{report.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span>Şoför: {report.driver?.name ?? report.driver?.username}</span>
                      {report.location && <span className="flex items-center gap-1"><MapPin size={11} />{report.location}</span>}
                      <span>{formatDate(report.reportedAt)}</span>
                    </div>
                    {report.adminNote && (
                      <div className="mt-2 bg-gray-800 rounded-lg px-3 py-2 flex items-start gap-2">
                        <MessageSquare size={12} className="text-gray-500 mt-0.5 shrink-0" />
                        <p className="text-gray-400 text-xs">{report.adminNote}</p>
                      </div>
                    )}
                  </div>

                  {report.status === 'pending' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button
                        size="sm" variant="ghost"
                        icon={<MessageSquare size={13} />}
                        onClick={() => { setReviewingReport(report); setAdminNote(''); }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        İncele
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        icon={<ArrowRightCircle size={13} />}
                        onClick={() => convertMutation.mutate(report.id)}
                        disabled={convertMutation.isPending}
                        className="text-green-400 hover:text-green-300"
                      >
                        Resmi Arıza
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        icon={<XCircle size={13} />}
                        onClick={() => { setRejectingReport(report); setAdminNote(''); }}
                        className="text-red-400 hover:text-red-300"
                      >
                        Reddet
                      </Button>
                    </div>
                  )}

                  {report.status !== 'pending' && (
                    <button
                      onClick={() => deleteMutation.mutate(report.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Review modal */}
      <Modal isOpen={!!reviewingReport} onClose={() => setReviewingReport(undefined)} title="Bildirimi İncele" size="sm">
        <p className="text-gray-400 text-sm mb-3">
          <strong className="text-white">{reviewingReport?.vehicle?.plate}</strong> — {reviewingReport?.type}
        </p>
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          placeholder="Admin notu (opsiyonel)..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-blue-500 mb-4"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReviewingReport(undefined)}>İptal</Button>
          <Button
            disabled={reviewMutation.isPending}
            onClick={() => reviewingReport && reviewMutation.mutate(
              { id: reviewingReport.id, adminNote },
              { onSuccess: () => setReviewingReport(undefined) }
            )}
          >
            {reviewMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'İncele'}
          </Button>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal isOpen={!!rejectingReport} onClose={() => setRejectingReport(undefined)} title="Bildirimi Reddet" size="sm">
        <p className="text-gray-400 text-sm mb-3">
          <strong className="text-white">{rejectingReport?.vehicle?.plate}</strong> — {rejectingReport?.type}
        </p>
        <textarea
          value={adminNote}
          onChange={e => setAdminNote(e.target.value)}
          placeholder="Red gerekçesi..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-red-500 mb-4"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRejectingReport(undefined)}>İptal</Button>
          <Button
            variant="danger"
            disabled={rejectMutation.isPending}
            onClick={() => rejectingReport && rejectMutation.mutate(
              { id: rejectingReport.id, adminNote },
              { onSuccess: () => setRejectingReport(undefined) }
            )}
          >
            {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Reddet'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export function Faults() {
  const { data: faultLogs = [], isLoading: loadingFaults } = useFaults();
  const { data: vehicles  = [] } = useVehicles();
  const { data: regionsRaw = [] } = useRegions();
  const { data: settings } = useSettings();
  const { data: driverReports = [] } = useFaultReports();
  const deleteFault = useDeleteFault();

  const [activeTab, setActiveTab] = useState<'faults' | 'reports'>('faults');
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
  const pendingReports = driverReports.filter(r => r.status === 'pending').length;

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 fade-in">
      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .fade-in, nav, header, aside, button, .no-print { display: none !important; }
          #faults-print-table { display: block !important; }
        }
        #faults-print-table { display: none; }
      `}</style>

      {/* Hidden print table */}
      <div id="faults-print-table" style={{position:'fixed',top:0,left:0,width:'100%',background:'white',zIndex:9999,padding:'20px'}}>
        <h1 style={{fontSize:'18px',fontWeight:'bold',marginBottom:'4px',color:'#000'}}>Arıza Kayıtları</h1>
        <p style={{fontSize:'12px',color:'#555',marginBottom:'12px'}}>Toplam: {filtered.length} kayıt · {new Date().toLocaleDateString('tr-TR')}</p>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px'}}>
          <thead>
            <tr style={{background:'#f3f4f6'}}>
              {['Plaka','Marka/Model','Arıza Tipi','Durum','Başlangıç','Süre (gün)','Servis','Konum'].map(h => (
                <th key={h} style={{border:'1px solid #e5e7eb',padding:'5px 6px',textAlign:'left',fontWeight:'600',color:'#111',fontSize:'10px'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((fault, i) => {
              const v = (vehicles as any[]).find(x => x.id === fault.vehicleId);
              const days = differenceInDays(new Date(), parseISO(fault.startDate));
              return (
                <tr key={fault.id} style={{background: i % 2 === 0 ? '#fff' : '#f9fafb'}}>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#111',fontWeight:'600'}}>{v?.plate ?? '—'}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#555'}}>{v?.brand} {v?.model}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#111'}}>{fault.faultType}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color: fault.status === 'Devam Ediyor' ? '#dc2626' : '#16a34a'}}>{fault.status}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#111'}}>{fault.startDate}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#111',textAlign:'center'}}>{fault.status === 'Devam Ediyor' ? days : '—'}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#111'}}>{fault.serviceName ?? '—'}</td>
                  <td style={{border:'1px solid #e5e7eb',padding:'4px 6px',color:'#111'}}>{fault.location ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PageHeader
        title="Arıza Kayıtları"
        subtitle={`${(faultLogs as any[]).length} toplam kayıt`}
        icon={<AlertTriangle size={20} />}
        actions={
          activeTab === 'faults' ? (
            <div className="flex gap-2">
              <Button variant="secondary" icon={<Printer size={16} />} onClick={handlePrint}>
                Yazdır
              </Button>
              <Button icon={<Plus size={16} />} onClick={() => { setEditingFault(undefined); setShowForm(true); }}>
                Arıza Ekle
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab('faults')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'faults' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Resmi Arıza Kayıtları
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Şoför Bildirimleri
          {pendingReports > 0 && (
            <span className="bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingReports}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'reports' ? (
        <DriverReportsPanel />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4">
            <div className="flex-1 min-w-0 sm:min-w-48 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <Input className="pl-9" placeholder="Plaka, açıklama, yer ara..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterRegion} className="w-full sm:w-40" onChange={e => setFilterRegion(e.target.value)}>
              <option value="">Tüm Bölgeler</option>
              {regions.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
            <Select value={filterType} className="w-full sm:w-40" onChange={e => setFilterType(e.target.value)}>
              <option value="">Tüm Tipler</option>
              {faultTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select value={filterStatus} className="w-full sm:w-40" onChange={e => setFilterStatus(e.target.value)}>
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
        </>
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
