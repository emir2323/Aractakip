import { useState } from 'react';
import {
  Droplets, Printer, CheckCircle, Loader2, AlertTriangle,
  ChevronLeft, ChevronRight, Filter, Trash2,
} from 'lucide-react';
import {
  useOilMaintenance, useUpdateOilStatus, useDeleteOilRecord,
} from '../hooks/useOilMaintenance';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatDate } from '../utils/helpers';

const PRINT_STYLES = `
@media print {
  * { box-sizing: border-box; }
  body { background: #fff !important; color: #000 !important; font-family: Arial, sans-serif; }
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  .print-table-wrap { display: block !important; }

  /* Reset dark UI */
  .fade-in, .space-y-6 > * { background: transparent !important; color: #000 !important; border: none !important; box-shadow: none !important; }

  /* Compact print table */
  .print-compact-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  .print-compact-table th {
    background: #f0f0f0 !important;
    color: #000 !important;
    font-weight: 700;
    text-align: left;
    padding: 4px 6px;
    border: 1px solid #ccc;
    white-space: nowrap;
  }
  .print-compact-table td {
    padding: 3px 6px;
    border: 1px solid #ddd;
    font-size: 10px;
    line-height: 1.3;
  }
  .print-compact-table tr:nth-child(even) td { background: #fafafa !important; }

  .print-header { margin-bottom: 8px; }
  .print-header h1 { font-size: 14px; font-weight: 700; margin: 0 0 2px; }
  .print-header p { font-size: 10px; color: #555; margin: 0; }
  .print-footer { font-size: 9px; color: #777; text-align: center; margin-top: 8px; border-top: 1px solid #ccc; padding-top: 4px; }

  @page { size: A4 landscape; margin: 12mm; }
}

@media screen {
  .print-only { display: none !important; }
}
`;

function getCurrentWeek(): { week: number; year: number } {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400 bg-yellow-400/10',
  printed: 'text-blue-400 bg-blue-400/10',
  done: 'text-green-400 bg-green-400/10',
};
const statusLabels: Record<string, string> = {
  pending: 'Bekliyor', printed: 'Yazdırıldı', done: 'Tamamlandı',
};

export function YagBakimi() {
  const { week: cw, year: cy } = getCurrentWeek();
  const [selectedWeek, setSelectedWeek] = useState(cw);
  const [selectedYear, setSelectedYear] = useState(cy);

  const params: Record<string, string> = {
    week: selectedWeek.toString(),
    year: selectedYear.toString(),
  };

  const { data, isLoading } = useOilMaintenance(params);
  const updateStatus = useUpdateOilStatus();
  const deleteRecord = useDeleteOilRecord();

  const records = data?.records ?? [];
  const notSubmitted = data?.notSubmitted ?? [];

  const prevWeek = () => {
    if (selectedWeek === 1) { setSelectedWeek(52); setSelectedYear(y => y - 1); }
    else setSelectedWeek(w => w - 1);
  };
  const nextWeek = () => {
    if (selectedWeek >= 52) { setSelectedWeek(1); setSelectedYear(y => y + 1); }
    else setSelectedWeek(w => w + 1);
  };

  const handleMarkDone = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'done' });
  };

  const handleMarkPrinted = async () => {
    const pending = records.filter(r => r.status === 'pending');
    for (const r of pending) {
      await updateStatus.mutateAsync({ id: r.id, status: 'printed' });
    }
    window.print();
  };

  const isCurrentWeek = selectedWeek === cw && selectedYear === cy;

  return (
    <div className="space-y-6 fade-in">
      {/* Kompakt print CSS */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <PageHeader
        title="Yağ Bakımı"
        subtitle="Haftalık KM bildirimleri ve yağ bakım takibi"
        icon={<Droplets size={20} />}
        actions={
          <Button
            icon={<Printer size={16} />}
            onClick={handleMarkPrinted}
            variant="secondary"
            disabled={records.length === 0}
          >
            Yazdır / PDF
          </Button>
        }
      />

      {/* Hafta Seçici */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-gray-900 border border-gray-800 rounded-xl p-3 sm:p-4 no-print">
        <Filter size={16} className="text-gray-500" />
        <span className="text-gray-400 text-sm">Hafta seçin:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-white font-semibold w-32 text-center">
            Hafta {selectedWeek} / {selectedYear}
          </span>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {!isCurrentWeek && (
          <button
            onClick={() => { setSelectedWeek(cw); setSelectedYear(cy); }}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors ml-auto"
          >
            Bu haftaya dön
          </button>
        )}
      </div>

      {/* KM bildirimi yapmayan araçlar */}
      {isCurrentWeek && notSubmitted.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 no-print">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-400" />
            <span className="text-orange-400 font-semibold text-sm">
              Bu hafta KM bildirimi yapmayan {notSubmitted.length} araç
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {notSubmitted.map(v => (
              <span key={v.id} className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-lg px-2 py-1">
                {v.plate} · {v.brand} {v.model}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── PRINT ONLY: Kompakt Tablo ── */}
      <div className="print-only">
        <div className="print-header">
          <h1>YAĞ BAKIMI LİSTESİ</h1>
          <p>Hafta: {selectedWeek} / {selectedYear} &nbsp;·&nbsp; Tarih: {new Date().toLocaleDateString('tr-TR')} &nbsp;·&nbsp; {records.length} kayıt</p>
        </div>
        <table className="print-compact-table">
          <thead>
            <tr>
              <th>Plaka</th>
              <th>Araç</th>
              <th>Şoför</th>
              <th>KM</th>
              <th>Hafta</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th>Notlar</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id}>
                <td style={{ fontWeight: 700 }}>{record.vehicle?.plate}</td>
                <td>{record.vehicle?.brand} {record.vehicle?.model}</td>
                <td>{record.driver?.name ?? record.driver?.username ?? '—'}</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{record.km.toLocaleString('tr-TR')}</td>
                <td>{record.weekNumber ?? selectedWeek}</td>
                <td>{formatDate(record.submittedAt)}</td>
                <td>{statusLabels[record.status] ?? record.status}</td>
                <td>{record.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-footer">
          Araç Takip Sistemi — Hafta {selectedWeek}/{selectedYear} Yağ Bakım Listesi — {new Date().toLocaleDateString('tr-TR')}
        </div>
      </div>

      {/* ── SCREEN: Normal Kart Tablosu ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-emerald-400" />
              <h2 className="text-white font-semibold">
                KM Bildirimleri — Hafta {selectedWeek}
                {isCurrentWeek && <span className="ml-2 text-xs text-emerald-400 font-normal">(Bu hafta)</span>}
              </h2>
            </div>
            <Badge variant="blue">{records.length} bildirim</Badge>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
            </div>
          ) : records.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <Droplets size={32} className="mx-auto mb-2 text-gray-700" />
              <p>Bu hafta için bildirim yok.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Plaka</th>
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Araç</th>
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Şoför</th>
                  <th className="px-5 py-3 text-right text-gray-500 font-medium">KM</th>
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Tarih</th>
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Durum</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {records.map(record => (
                  <tr key={record.id} className="hover:bg-gray-800/50">
                    <td className="px-5 py-3 text-white font-bold">{record.vehicle?.plate}</td>
                    <td className="px-5 py-3 text-gray-300">
                      {record.vehicle?.brand} {record.vehicle?.model}
                    </td>
                    <td className="px-5 py-3 text-gray-300">
                      {record.driver?.name ?? record.driver?.username ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-emerald-400 font-bold text-right">
                      {record.km.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(record.submittedAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[record.status]}`}>
                        {statusLabels[record.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {record.status !== 'done' && (
                          <button
                            onClick={() => handleMarkDone(record.id)}
                            disabled={updateStatus.isPending}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Tamamlandı işaretle"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteRecord.mutate(record.id)}
                          disabled={deleteRecord.isPending}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Özet istatistikler */}
      {records.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 no-print">
          {(['pending', 'printed', 'done'] as const).map(s => (
            <div key={s} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${statusColors[s].split(' ')[0]}`}>
                {records.filter(r => r.status === s).length}
              </p>
              <p className="text-gray-500 text-xs mt-1">{statusLabels[s]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
