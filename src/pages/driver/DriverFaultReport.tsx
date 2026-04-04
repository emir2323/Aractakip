import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Clock, MessageSquare } from 'lucide-react';
import { useSubmitFaultReport, useMyFaultReports } from '../../hooks/useFaultReports';
import { useSettings } from '../../hooks/useSettings';
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
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: settings } = useSettings();
  const { data: history = [], isLoading } = useMyFaultReports();
  const submitMutation = useSubmitFaultReport();

  const faultTypes = settings?.faultTypes ?? ['Motor', 'Elektrik', 'Fren', 'Lastik', 'Şanzıman', 'Diğer'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !description) return;
    await submitMutation.mutateAsync({ type, description, location: location || undefined });
    setType('');
    setDescription('');
    setLocation('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <AlertTriangle className="text-red-400" size={28} />
          Arıza Bildir
        </h1>
        <p className="text-gray-500 text-sm mt-1">Aracınızdaki arızayı admin'e bildirin</p>
      </div>

      {/* Form */}
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
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">
                  Arıza Türü <span className="text-red-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-red-500 transition-colors"
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
                disabled={!type || !description || submitMutation.isPending}
                icon={submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              >
                {submitMutation.isPending ? 'Gönderiliyor...' : 'Arıza Bildir'}
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      {/* History */}
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
              {history.map(report => (
                <div key={report.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-medium">{report.type}</span>
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
