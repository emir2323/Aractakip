import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Clock, MessageSquare, MapPin, Car } from 'lucide-react';
import { useSubmitFaultReport, useMyFaultReports } from '../../hooks/useFaultReports';
import { useSettings } from '../../hooks/useSettings';
import { useRegions } from '../../hooks/useRegions';
import { useVehicles } from '../../hooks/useVehicles';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  reviewed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  converted: 'text-green-400 bg-green-400/10 border-green-400/20',
  rejected: 'text-red-400 bg-red-400/10 border-red-400/20',
};
const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', reviewed: 'İncelendi', converted: 'Resmi Arıza', rejected: 'Reddedildi',
};

export function DriverFaultReport() {
  const { user } = useAuth();
  const assignedVehicleId: string = (user as any)?.vehicleId ?? '';

  const { data: settings } = useSettings();
  const { data: regionsRaw = [] } = useRegions();
  const { data: allVehicles = [] } = useVehicles();
  const { data: history = [], isLoading } = useMyFaultReports();
  const submitMutation = useSubmitFaultReport();

  const [selectedStation, setSelectedStation] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const faultTypes = settings?.faultTypes ?? ['Motor', 'Elektrik', 'Fren', 'Lastik', 'Şanzıman', 'Diğer'];

  const stations = useMemo(() =>
    (regionsRaw as any[]).flatMap(r =>
      (r.stations ?? []).map((s: any) => ({ id: s.id, name: s.name, regionName: r.name }))
    ), [regionsRaw]);

  // Atanmış araç varsa default seç
  useEffect(() => {
    if (!initialized && (allVehicles as any[]).length > 0 && stations.length > 0) {
      if (assignedVehicleId) {
        const av = (allVehicles as any[]).find((v: any) => v.id === assignedVehicleId);
        if (av?.stationId) {
          setSelectedStation(av.stationId);
          setSelectedVehicleId(assignedVehicleId);
        }
      }
      setInitialized(true);
    }
  }, [allVehicles, stations, assignedVehicleId, initialized]);

  const stationVehicles = useMemo(() =>
    (allVehicles as any[]).filter((v: any) => v.stationId === selectedStation),
    [allVehicles, selectedStation]);

  const handleStationChange = (stationId: string) => {
    setSelectedStation(stationId);
    const assignedInStation = (allVehicles as any[]).find(
      (v: any) => v.id === assignedVehicleId && v.stationId === stationId
    );
    setSelectedVehicleId(assignedInStation ? assignedVehicleId : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !description || !selectedVehicleId) return;
    await submitMutation.mutateAsync({
      vehicleId: selectedVehicleId,
      type,
      description,
      location: location || undefined,
    });
    setType('');
    setDescription('');
    setLocation('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="text-red-400 shrink-0" size={24} />
          Arıza Bildir
        </h1>
        <p className="text-gray-500 text-sm mt-1">Araçtaki arızayı admin'e bildirin</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-white font-semibold">Yeni Arıza Bildirimi</h2>
        </CardHeader>
        <CardBody>
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-bold text-lg">Arıza Bildirimi Alındı!</p>
              <p className="text-gray-500 text-sm mt-1">Admin inceleyecek ve size dönüş yapacak.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. İstasyon */}
              <div>
                <label className="flex items-center gap-1.5 text-gray-400 text-sm mb-1.5">
                  <MapPin size={13} className="text-gray-500" />
                  İstasyon <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedStation}
                  onChange={e => handleStationChange(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="">İstasyon seçiniz...</option>
                  {stations.map(s => (
                    <option key={s.id} value={s.id}>{s.regionName} — {s.name}</option>
                  ))}
                </select>
              </div>

              {/* 2. Araç */}
              <div>
                <label className="flex items-center gap-1.5 text-gray-400 text-sm mb-1.5">
                  <Car size={13} className="text-gray-500" />
                  Araç <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  required
                  disabled={!selectedStation}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                >
                  <option value="">{selectedStation ? 'Araç seçiniz...' : 'Önce istasyon seçin'}</option>
                  {stationVehicles.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} — {v.brand} {v.model}
                      {v.id === assignedVehicleId ? ' ★ Atanan Araç' : ''}
                    </option>
                  ))}
                </select>
                {selectedStation && stationVehicles.length === 0 && (
                  <p className="text-gray-600 text-xs mt-1">Bu istasyonda kayıtlı araç bulunamadı.</p>
                )}
              </div>

              {/* 3. Arıza Türü */}
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">
                  Arıza Türü <span className="text-red-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  required
                  disabled={!selectedVehicleId}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Seçiniz...</option>
                  {faultTypes.map(ft => <option key={ft} value={ft}>{ft}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1.5">
                  Açıklama <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Arızayı ayrıntılı açıklayın..."
                  rows={4}
                  required
                  disabled={!selectedVehicleId}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Konum (opsiyonel)</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Araçın bulunduğu yer..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full !bg-red-600 hover:!bg-red-500"
                disabled={!type || !description || !selectedVehicleId || submitMutation.isPending}
                icon={submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              >
                {submitMutation.isPending ? 'Gönderiliyor...' : 'Arıza Bildir'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      {/* Geçmiş */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <h2 className="text-white font-semibold">Bildirim Geçmişi</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-gray-500" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Henüz bildirim gönderilmemiş.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {(history as any[]).map(report => (
              <div key={report.id} className="px-3 sm:px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="text-white font-medium">{report.type}</span>
                      {report.vehicle && (
                        <span className="text-gray-500 text-xs ml-2">· {report.vehicle.plate}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColors[report.status]}`}>
                      {statusLabels[report.status]}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{report.description}</p>
                  {report.location && <p className="text-gray-600 text-xs mt-1">📍 {report.location}</p>}
                  {report.adminNote && (
                    <div className="mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 flex items-start gap-2">
                      <MessageSquare size={13} className="text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-blue-300 text-xs">{report.adminNote}</p>
                    </div>
                  )}
                  <p className="text-gray-600 text-xs mt-2 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(report.reportedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
