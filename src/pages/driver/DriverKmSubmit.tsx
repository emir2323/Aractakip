import { useState } from 'react';
import { Droplets, CheckCircle, Loader2, Clock } from 'lucide-react';
import { useSubmitOilKm, useMyOilSubmissions } from '../../hooks/useOilMaintenance';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../utils/helpers';

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  printed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  done: 'text-green-400 bg-green-400/10 border-green-400/20',
};
const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', printed: 'Yazdırıldı', done: 'Tamamlandı',
};

function getCurrentWeek(): number {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function DriverKmSubmit() {
  const [km, setKm] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: history = [], isLoading } = useMyOilSubmissions();
  const submitMutation = useSubmitOilKm();

  const currentWeek = getCurrentWeek();
  const alreadySubmittedThisWeek = history.some(h => h.weekNumber === currentWeek);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const kmNum = parseInt(km);
    if (!kmNum || kmNum <= 0) return;

    await submitMutation.mutateAsync({ km: kmNum, notes: notes || undefined });
    setKm('');
    setNotes('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="space-y-6 fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Droplets className="text-emerald-400" size={28} />
          KM Bildirimi Gönder
        </h1>
        <p className="text-gray-500 text-sm mt-1">Hafta {currentWeek} · Yağ bakım kilometresi</p>
      </div>

      {/* Already submitted banner */}
      {alreadySubmittedThisWeek && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={18} className="text-green-400 shrink-0" />
          <p className="text-green-300 text-sm">Bu hafta için KM bildirimi zaten gönderildi. Yeni bir bildirim gönderebilirsiniz.</p>
        </div>
      )}

      {/* Submission form */}
      <Card>
        <CardHeader>
          <h2 className="text-white font-semibold">Yeni KM Bildirimi</h2>
        </CardHeader>
        <CardBody>
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
              <p className="text-green-400 font-bold text-lg">Bildirim Gönderildi!</p>
              <p className="text-gray-500 text-sm mt-1">Admin inceleyecek.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1.5">
                  Güncel Kilometre <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={km}
                  onChange={e => setKm(e.target.value)}
                  placeholder="Örn: 45230"
                  min={1}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <p className="text-gray-600 text-xs mt-1">Araç saatindeki mevcut kilometreyi girin</p>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1.5">Notlar (opsiyonel)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Varsa eklemek istediğiniz notlar..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white resize-none focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full !bg-emerald-600 hover:!bg-emerald-500"
                disabled={!km || submitMutation.isPending}
                icon={submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Droplets size={16} />}
              >
                {submitMutation.isPending ? 'Gönderiliyor...' : 'KM Bildir'}
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
            <h2 className="text-white font-semibold">Geçmiş Bildirimler</h2>
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
              {history.map(record => (
                <div key={record.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{record.km.toLocaleString('tr-TR')} km</p>
                    <p className="text-gray-500 text-xs">
                      Hafta {record.weekNumber}/{record.year} · {formatDate(record.submittedAt)}
                    </p>
                    {record.notes && <p className="text-gray-600 text-xs mt-0.5">{record.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusColors[record.status]}`}>
                    {statusLabels[record.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
