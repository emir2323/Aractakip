import { Link } from 'react-router-dom';
import {
  Car, AlertTriangle, MapPin, Bell, Droplets, ShieldAlert,
  TrendingUp, CheckCircle, XCircle, Package, Navigation, Loader2
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useVehicles } from '../hooks/useVehicles';
import { useFaults } from '../hooks/useFaults';
import { useRegions } from '../hooks/useRegions';
import { useOilMaintenance } from '../hooks/useOilMaintenance';
import { usePendingFaultReportCount } from '../hooks/useFaultReports';
import { getAlerts, formatDate } from '../utils/helpers';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const statusIcons: Record<string, React.ReactNode> = {
  'Aktif':          <CheckCircle size={20} className="text-green-400" />,
  'Arızalı':        <XCircle    size={20} className="text-red-400" />,
  'Parça Bekliyor': <Package    size={20} className="text-yellow-400" />,
  'Görevli':        <Navigation size={20} className="text-blue-400" />,
};

const statusBg: Record<string, string> = {
  'Aktif':          'border-green-500/30  bg-green-500/5',
  'Arızalı':        'border-red-500/30    bg-red-500/5',
  'Parça Bekliyor': 'border-yellow-500/30 bg-yellow-500/5',
  'Görevli':        'border-blue-500/30   bg-blue-500/5',
};

export function Dashboard() {
  const { data: regionsRaw = [], isLoading: loadingRegions } = useRegions();
  const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles();
  const { data: faultLogs = [], isLoading: loadingFaults } = useFaults();
  const { data: oilData } = useOilMaintenance();
  const { data: pendingReportsCount = 0 } = usePendingFaultReportCount();

  const isLoading = loadingRegions || loadingVehicles || loadingFaults;

  const today = new Date();
  const isWednesday = today.getDay() === 3;
  const notSubmittedThisWeek = oilData?.notSubmitted ?? [];

  // Flatten stations from regions response
  const regions = regionsRaw.map((r: any) => ({ id: r.id, name: r.name }));
  const stations = regionsRaw.flatMap((r: any) =>
    (r.stations ?? []).map((s: any) => ({ id: s.id, regionId: r.id, name: s.name }))
  );

  const alerts = getAlerts(vehicles, regions, stations);
  const activeFaults = faultLogs.filter((f: any) => f.status === 'Devam Ediyor');

  const statusCounts: Record<string, number> = {
    'Aktif': 0, 'Arızalı': 0, 'Parça Bekliyor': 0, 'Görevli': 0,
  };
  vehicles.forEach((v: any) => { statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1; });

  const regionStats = regions.map((r: any) => ({
    region: r,
    count: vehicles.filter((v: any) => v.regionId === r.id).length,
    active: vehicles.filter((v: any) => v.regionId === r.id && v.status === 'Aktif').length,
    faulty: vehicles.filter((v: any) => v.regionId === r.id && (v.status === 'Arızalı' || v.status === 'Parça Bekliyor')).length,
  }));

  const redAlerts    = alerts.filter(a => a.severity === 'red');
  const yellowAlerts = alerts.filter(a => a.severity === 'yellow');
  const greenAlerts  = alerts.filter(a => a.severity === 'green');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={32} className="text-blue-400 animate-spin" />
        <p className="text-gray-500 text-sm">Veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Wednesday oil maintenance reminder */}
      {isWednesday && notSubmittedThisWeek.length > 0 && (
        <Link to="/yag-bakimi">
          <div className="bg-orange-500/10 border border-orange-500/40 rounded-xl px-5 py-4 flex items-center gap-3 hover:bg-orange-500/15 transition-colors cursor-pointer">
            <Droplets size={20} className="text-orange-400 shrink-0" />
            <div className="flex-1">
              <p className="text-orange-300 font-semibold">Bugün yağ bakım günü!</p>
              <p className="text-orange-400/70 text-sm">
                KM bildirimi yapılmamış {notSubmittedThisWeek.length} araç var →
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Pending driver fault reports */}
      {pendingReportsCount > 0 && (
        <Link to="/arizalar">
          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-5 py-4 flex items-center gap-3 hover:bg-yellow-500/15 transition-colors cursor-pointer">
            <ShieldAlert size={20} className="text-yellow-400 shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-300 font-semibold">
                {pendingReportsCount} bekleyen şoför arıza bildirimi
              </p>
              <p className="text-yellow-400/70 text-sm">İncelemek için tıklayın →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white">Ana Sayfa</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Sistem Aktif</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['Aktif', 'Arızalı', 'Parça Bekliyor', 'Görevli'] as const).map(status => (
          <Link to="/araclar" key={status}>
            <Card hover className={`border ${statusBg[status]}`}>
              <CardBody className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-gray-400 text-xs sm:text-sm font-medium">{status}</span>
                  {statusIcons[status]}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{statusCounts[status]}</div>
                <div className="text-gray-500 text-xs mt-1">araç</div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Expiry Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-yellow-400" />
                  <h2 className="text-white font-semibold">Yaklaşan Son Tarihler</h2>
                </div>
                <div className="flex items-center gap-2">
                  {redAlerts.length    > 0 && <Badge variant="red">{redAlerts.length} Kritik</Badge>}
                  {yellowAlerts.length > 0 && <Badge variant="yellow">{yellowAlerts.length} Uyarı</Badge>}
                  {greenAlerts.length  > 0 && <Badge variant="green">{greenAlerts.length} Yakın</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                  <p>Tüm belgeler güncel</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {alerts.slice(0, 10).map((alert, i) => {
                    const leftBorder = alert.severity === 'red'
                      ? 'border-l-4 border-l-red-500 bg-red-500/5'
                      : alert.severity === 'yellow'
                      ? 'border-l-4 border-l-yellow-500 bg-yellow-500/5'
                      : 'border-l-4 border-l-green-500 bg-green-500/5';
                    const dayText = alert.daysRemaining <= 0
                      ? 'Süresi doldu!'
                      : `${alert.daysRemaining} gün kaldı`;
                    return (
                      <div key={i} className={`px-5 py-3 ${leftBorder}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{alert.plate}</span>
                              <Badge variant={alert.severity === 'red' ? 'red' : alert.severity === 'yellow' ? 'yellow' : 'green'}>
                                {alert.type}
                              </Badge>
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">
                              {alert.regionName} › {alert.stationName}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${alert.severity === 'red' ? 'text-red-400' : alert.severity === 'yellow' ? 'text-yellow-400' : 'text-green-400'}`}>
                              {dayText}
                            </div>
                            <div className="text-gray-600 text-xs">{formatDate(alert.expiryDate)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Active Faults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                <h2 className="text-white font-semibold">Aktif Arızalar</h2>
                {activeFaults.length > 0 && <Badge variant="red">{activeFaults.length}</Badge>}
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {activeFaults.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                  <p>Aktif arıza yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {activeFaults.map((fault: any) => {
                    const vehicle = vehicles.find((v: any) => v.id === fault.vehicleId);
                    const station = stations.find(s => s.id === vehicle?.stationId);
                    const region  = regions.find(r => r.id === vehicle?.regionId);
                    const days    = differenceInDays(new Date(), parseISO(fault.startDate));
                    return (
                      <div key={fault.id} className="px-5 py-3 hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-white font-medium text-sm">{vehicle?.plate}</span>
                              <Badge variant="red">{fault.faultType}</Badge>
                            </div>
                            <p className="text-gray-400 text-xs line-clamp-1">{fault.description}</p>
                            <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs">
                              <MapPin size={10} />
                              <span>{fault.location}</span>
                              {fault.serviceName && <><span>·</span><span>{fault.serviceName}</span></>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-red-400 text-sm font-semibold">{days} gün</div>
                            <div className="text-gray-600 text-xs">{region?.name} › {station?.name}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" />
                <h2 className="text-white font-semibold">Bölge İstatistikleri</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {regionStats.map(({ region, count, active, faulty }) => (
                <div key={region.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm font-medium">{region.name}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mb-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: vehicles.length ? `${(count / vehicles.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="text-green-400">{active} aktif</span>
                    {faulty > 0 && <span className="text-red-400">{faulty} arızalı</span>}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car size={18} className="text-blue-400" />
                <h2 className="text-white font-semibold">Özet</h2>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {[
                { label: 'Toplam Araç',    value: vehicles.length,          color: 'text-white' },
                { label: 'Aktif Arıza',    value: activeFaults.length,      color: 'text-red-400' },
                { label: 'Kritik Belge',   value: redAlerts.length,         color: 'text-red-400' },
                { label: 'Uyarı Belge',    value: yellowAlerts.length,      color: 'text-yellow-400' },
                { label: 'Toplam Bölge',   value: regions.length,           color: 'text-blue-400' },
                { label: 'Toplam İstasyon', value: stations.length,         color: 'text-purple-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-gray-400 text-sm">{label}</span>
                  <span className={`font-bold text-lg ${color}`}>{value}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
