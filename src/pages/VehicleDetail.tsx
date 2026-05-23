import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Car, MapPin, Package, Calendar, Edit2, Plus,
  CheckCircle, AlertTriangle, RotateCcw, Navigation, Loader2
} from 'lucide-react';
import { useVehicle, useRenewVehicleDate } from '../hooks/useVehicles';
import { useRegions } from '../hooks/useRegions';
import { formatDate, getDaysRemaining, getDateStatusClass, statusColors, statusDotColors, faultTypeColors } from '../utils/helpers';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input } from '../components/ui/FormField';
import { VehicleForm } from '../components/vehicles/VehicleForm';
import { FaultForm } from '../components/faults/FaultForm';

function RenewDateModal({ type, current, onSave, onClose }: {
  type: string; current: string; onSave: (d: string) => void; onClose: () => void;
}) {
  const [date, setDate] = useState(current || '');
  return (
    <div className="space-y-4">
      <FormField label={`Yeni ${type} Tarihi`} required>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      </FormField>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>İptal</Button>
        <Button onClick={() => { onSave(date); onClose(); }} disabled={!date}>Kaydet</Button>
      </div>
    </div>
  );
}

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: regionsRaw = [] } = useRegions();
  const { data: vehicle, isLoading, isError } = useVehicle(id!);
  const renewDate = useRenewVehicleDate();

  const [showEdit, setShowEdit]         = useState(false);
  const [showAddFault, setShowAddFault] = useState(false);
  const [renewModal, setRenewModal]     = useState<'muayene' | 'sigorta' | 'kasko' | null>(null);

  const regions  = (regionsRaw as any[]).map((r: any) => ({ id: r.id, name: r.name }));
  const stations = (regionsRaw as any[]).flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <Loader2 size={28} className="text-blue-400 animate-spin" />
        <span className="text-gray-500">Araç bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">Araç bulunamadı</p>
        <Button onClick={() => navigate('/araclar')}>Araçlara Dön</Button>
      </div>
    );
  }

  const region      = regions.find(r => r.id === vehicle.regionId);
  const station     = stations.find(s => s.id === vehicle.stationId);
  const dutyRegion  = regions.find(r => r.id === vehicle.dutyRegionId);
  const dutyStation = stations.find(s => s.id === vehicle.dutyStationId);

  const vehicleFaults = (vehicle as any).faults ?? [];
  const muayeneDays   = getDaysRemaining(vehicle.muayeneExpiry);
  const sigortaDays   = getDaysRemaining(vehicle.insuranceExpiry);
  const kaskoDays     = getDaysRemaining(vehicle.kaskoExpiry);

  const renewLabels = { muayene: 'Muayene', sigorta: 'Sigorta', kasko: 'Kasko' };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} />} onClick={() => navigate('/araclar')}>
          Araçlar
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{vehicle.plate}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${statusColors[vehicle.status]}`}>
              <span className={`w-2 h-2 rounded-full ${statusDotColors[vehicle.status]}`} />
              {vehicle.status}
            </span>
          </div>
          <p className="text-gray-500">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Edit2 size={14} />} onClick={() => setShowEdit(true)}>
          Düzenle
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">Araç Bilgileri</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">Bölge</div>
                  <div className="text-gray-200 text-sm">{region?.name ?? '—'}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-0.5">İstasyon</div>
                  <div className="text-gray-200 text-sm">{station?.name ?? '—'}</div>
                </div>
                {vehicle.status === 'Görevli' && (
                  <>
                    <div>
                      <div className="text-gray-500 text-xs mb-0.5">Görev Bölgesi</div>
                      <div className="text-blue-400 text-sm flex items-center gap-1">
                        <Navigation size={12} /> {dutyRegion?.name ?? '—'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs mb-0.5">Görev İstasyonu</div>
                      <div className="text-blue-400 text-sm">{dutyStation?.name ?? '—'}</div>
                    </div>
                  </>
                )}
                {vehicle.notes && (
                  <div className="col-span-2">
                    <div className="text-gray-500 text-xs mb-0.5">Notlar</div>
                    <div className="text-gray-200 text-sm">{vehicle.notes}</div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">Belgeler</h2>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {([
                  { key: 'muayene', label: 'Muayene', date: vehicle.muayeneExpiry, days: muayeneDays },
                  { key: 'sigorta', label: 'Sigorta', date: vehicle.insuranceExpiry, days: sigortaDays },
                  { key: 'kasko',   label: 'Kasko',   date: vehicle.kaskoExpiry,    days: kaskoDays },
                ] as const).map(({ key, label, date, days }) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-gray-300 text-sm font-medium">{label}</div>
                      <div className="text-gray-500 text-xs">{formatDate(date)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${getDateStatusClass(days)}`}>
                        {days <= 0 ? 'Süresi doldu' : `${days} gün kaldı`}
                      </span>
                      <Button variant="secondary" size="sm" icon={<RotateCcw size={12} />}
                        disabled={renewDate.isPending}
                        onClick={() => setRenewModal(key)}>
                        Yenile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Fault History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h2 className="text-white font-semibold">Arıza Geçmişi</h2>
                  {vehicleFaults.length > 0 && <Badge variant="gray">{vehicleFaults.length}</Badge>}
                </div>
                <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowAddFault(true)}>
                  Arıza Ekle
                </Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {vehicleFaults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                  <p>Arıza kaydı yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {vehicleFaults.map((fault: any) => (
                    <div key={fault.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div className={`w-1 rounded-full ${fault.status === 'Devam Ediyor' ? 'bg-red-500' : 'bg-green-500'}`} />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded font-medium ${faultTypeColors[fault.faultType] ?? 'text-gray-400 bg-gray-400/10'}`}>
                                {fault.faultType}
                              </span>
                              <StatusBadge status={fault.status} />
                            </div>
                            <p className="text-gray-300 text-sm mb-1">{fault.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><MapPin size={10} />{fault.location}</span>
                              {fault.serviceName && <span>· {fault.serviceName}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 text-xs text-gray-500">
                          <div>{formatDate(fault.startDate)}</div>
                          {fault.endDate && <div className="text-green-400">{formatDate(fault.endDate)}</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-blue-400" />
                <h2 className="text-white font-semibold">Malzemeler</h2>
              </div>
            </CardHeader>
            <CardBody>
              {(vehicle.materials ?? []).length === 0 ? (
                <p className="text-gray-500 text-sm">Kayıtlı malzeme yok</p>
              ) : (
                <ul className="space-y-2">
                  {(vehicle.materials ?? []).map((m: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h2 className="text-white font-semibold">İstatistikler</h2></CardHeader>
            <CardBody className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Toplam Arıza</span>
                <span className="text-white font-bold">{vehicleFaults.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Aktif Arıza</span>
                <span className="text-red-400 font-bold">{vehicleFaults.filter((f: any) => f.status === 'Devam Ediyor').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Çözülen Arıza</span>
                <span className="text-green-400 font-bold">{vehicleFaults.filter((f: any) => f.status === 'Çözüldü').length}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Araç Düzenle" size="lg">
        <VehicleForm vehicle={vehicle as any} regions={regions} stations={stations}
          onClose={() => setShowEdit(false)} />
      </Modal>

      <Modal isOpen={showAddFault} onClose={() => setShowAddFault(false)} title="Arıza Kaydı Ekle" size="lg">
        <FaultForm vehicleId={vehicle.id} onClose={() => setShowAddFault(false)} />
      </Modal>

      {renewModal && (
        <Modal isOpen onClose={() => setRenewModal(null)}
          title={`${renewLabels[renewModal]} Yenile`} size="sm">
          <RenewDateModal
            type={renewLabels[renewModal]}
            current={
              renewModal === 'muayene' ? vehicle.muayeneExpiry :
              renewModal === 'sigorta' ? vehicle.insuranceExpiry :
              vehicle.kaskoExpiry
            }
            onSave={(date) => {
              renewDate.mutate({ id: vehicle.id, type: renewModal, date });
            }}
            onClose={() => setRenewModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}
