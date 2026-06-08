import { useNavigate } from 'react-router-dom';
import { Droplets, AlertTriangle, Car, Clock, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useVehicle } from '../../hooks/useVehicles';
import { useMyOilSubmissions } from '../../hooks/useOilMaintenance';
import { useMyFaultReports } from '../../hooks/useFaultReports';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/helpers';

const oilStatusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  printed: 'text-blue-400 bg-blue-400/10',
  done: 'text-green-400 bg-green-400/10',
};
const oilStatusLabels: Record<string, string> = {
  pending: 'Bekliyor', printed: 'Yazdırıldı', done: 'Tamamlandı',
};
const reportStatusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  reviewed: 'text-blue-400 bg-blue-400/10',
  converted: 'text-green-400 bg-green-400/10',
  rejected: 'text-red-400 bg-red-400/10',
};
const reportStatusLabels: Record<string, string> = {
  pending: 'Bekliyor', reviewed: 'İncelendi', converted: 'Resmi Arıza', rejected: 'Reddedildi',
};

export function DriverDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const vehicleId = (user as any)?.vehicleId ?? '';

  const { data: vehicle, isLoading: vLoading } = useVehicle(vehicleId);
  const { data: oilHistory = [], isLoading: oilLoading } = useMyOilSubmissions();
  const { data: myReports = [], isLoading: rLoading } = useMyFaultReports();

  const isLoading = vLoading || oilLoading || rLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-400" />
      </div>
    );
  }

  const pendingReports = myReports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Hoş Geldiniz, {user?.name ?? user?.username}</h1>
        <p className="text-gray-500 text-sm mt-1">Şoför Paneli</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/sofor/km-gonder')}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-3 py-4 sm:p-5 flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-700 rounded-xl flex items-center justify-center group-hover:bg-emerald-600 transition-colors shrink-0">
            <Droplets size={22} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-bold text-base sm:text-lg">KM Gönder</p>
            <p className="text-emerald-200 text-xs sm:text-sm">Haftalık yağ bakım bildirimi</p>
          </div>
          <ChevronRight size={18} className="ml-auto opacity-70 shrink-0" />
        </button>

        <button
          onClick={() => navigate('/sofor/ariza-bildir')}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-xl px-3 py-4 sm:p-5 flex items-center gap-3 transition-all group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-700 rounded-xl flex items-center justify-center group-hover:bg-red-600 transition-colors shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-bold text-base sm:text-lg">Arıza Bildir</p>
            <p className="text-red-200 text-xs sm:text-sm">Arıza raporu gönder</p>
          </div>
          <ChevronRight size={18} className="ml-auto opacity-70 shrink-0" />
        </button>
      </div>

      {/* Vehicle Info */}
      {vehicle ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Car size={18} className="text-blue-400" />
              <h2 className="text-white font-semibold">Atanan Araç</h2>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white text-xl sm:text-2xl font-bold break-words">{vehicle.plate}</p>
                <p className="text-gray-400 text-sm truncate">{vehicle.brand} {vehicle.model} · {vehicle.year}</p>
              </div>
              <StatusBadge status={vehicle.status} />
            </div>
            {vehicle.notes && (
              <p className="text-gray-500 text-sm mt-3 border-t border-gray-800 pt-3">{vehicle.notes}</p>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <p className="text-gray-500 text-center py-4">Henüz araç ataması yapılmamış.</p>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent KM Submissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-emerald-400" />
              <h2 className="text-white font-semibold">Son KM Bildirimleri</h2>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {oilHistory.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Henüz bildirim gönderilmemiş.</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {oilHistory.slice(0, 5).map(record => (
                  <div key={record.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{record.km.toLocaleString('tr-TR')} km</p>
                      <p className="text-gray-500 text-xs">
                        Hafta {record.weekNumber} · {formatDate(record.submittedAt)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${oilStatusColors[record.status]}`}>
                      {oilStatusLabels[record.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Fault Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-400" />
              <h2 className="text-white font-semibold">Arıza Bildirimlerim</h2>
              {pendingReports > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingReports} bekliyor
                </span>
              )}
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {myReports.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Henüz bildirim gönderilmemiş.</p>
            ) : (
              <div className="divide-y divide-gray-800">
                {myReports.slice(0, 5).map(report => (
                  <div key={report.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium text-sm">{report.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${reportStatusColors[report.status]}`}>
                        {reportStatusLabels[report.status]}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-1">{report.description}</p>
                    {report.status === 'reviewed' && report.adminNote && (
                      <div className="mt-1 flex items-start gap-1">
                        <CheckCircle size={12} className="text-blue-400 mt-0.5 shrink-0" />
                        <p className="text-blue-400 text-xs">{report.adminNote}</p>
                      </div>
                    )}
                    <p className="text-gray-600 text-xs mt-1 flex items-center gap-1">
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
    </div>
  );
}
