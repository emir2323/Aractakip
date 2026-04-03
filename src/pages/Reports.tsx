import { useRef, useState } from 'react';
import { FileText, Printer, AlertTriangle, MapPin, Filter, Loader2 } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { useFaults } from '../hooks/useFaults';
import { useRegions } from '../hooks/useRegions';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/FormField';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { formatDate, faultTypeColors } from '../utils/helpers';
import { differenceInDays, parseISO } from 'date-fns';

export function Reports() {
  const [selectedRegion, setSelectedRegion] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles();
  const { data: faultLogs = [], isLoading: loadingFaults } = useFaults();
  const { data: regionsRaw = [], isLoading: loadingRegions } = useRegions();

  const regions = regionsRaw;
  const stations = regionsRaw.flatMap(r => r.stations.map(s => ({ ...s, regionId: r.id })));

  const isLoading = loadingVehicles || loadingFaults || loadingRegions;

  const filterRegionObj = regions.find(r => r.id === selectedRegion);
  const relevantVehicles = selectedRegion
    ? vehicles.filter(v => v.regionId === selectedRegion)
    : vehicles;

  const faultyVehicles = relevantVehicles.filter(v =>
    v.status === 'Arızalı' || v.status === 'Parça Bekliyor' ||
    faultLogs.some(f => f.vehicleId === v.id && f.status === 'Devam Ediyor')
  );

  const vehiclesWithFaults = faultyVehicles.map(v => {
    const activeFaults = faultLogs.filter(f => f.vehicleId === v.id && f.status === 'Devam Ediyor');
    const station = stations.find(s => s.id === v.stationId);
    const region = regions.find(r => r.id === v.regionId);
    return { vehicle: v, faults: activeFaults, station, region };
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Raporlar"
        subtitle="Yazdırılabilir arıza raporları"
        icon={<FileText size={20} />}
        actions={
          <Button icon={<Printer size={16} />} onClick={handlePrint} variant="secondary">
            Yazdır / PDF
          </Button>
        }
      />

      {/* Filter */}
      <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4 no-print">
        <Filter size={16} className="text-gray-500" />
        <span className="text-gray-400 text-sm">Bölge filtrele:</span>
        <Select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} className="w-48">
          <option value="">Tüm Bölgeler</option>
          {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </div>

      {/* Report Section */}
      <div ref={printRef} className="print-section">
        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Arızalı Araçlar Raporu</h1>
          <p className="text-gray-600">
            {filterRegionObj ? filterRegionObj.name : 'Tüm Bölgeler'} ·
            Tarih: {new Date().toLocaleDateString('tr-TR')}
          </p>
          <hr className="mt-2" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-400" />
                <h2 className="text-white font-semibold">
                  Arızalı Araçlar Raporu
                  {filterRegionObj && ` — ${filterRegionObj.name}`}
                </h2>
              </div>
              <Badge variant="red">{vehiclesWithFaults.length} araç</Badge>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {vehiclesWithFaults.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle size={32} className="mx-auto mb-2 text-green-400" />
                <p>Bu bölgede arızalı araç bulunmuyor</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {vehiclesWithFaults.map(({ vehicle, faults, station, region }) => (
                  <div key={vehicle.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold text-lg">{vehicle.plate}</span>
                          <StatusBadge status={vehicle.status} />
                        </div>
                        <div className="text-gray-400 text-sm">{vehicle.brand} {vehicle.model} · {vehicle.year}</div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                          <MapPin size={11} />
                          {region?.name} › {station?.name}
                        </div>
                      </div>
                    </div>
                    {faults.length > 0 && (
                      <div className="space-y-2 ml-4">
                        {faults.map(fault => {
                          const days = differenceInDays(new Date(), parseISO(fault.startDate));
                          return (
                            <div key={fault.id} className="bg-gray-800 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${faultTypeColors[fault.faultType] ?? 'text-gray-400 bg-gray-400/10'}`}>
                                  {fault.faultType}
                                </span>
                                <span className="text-red-400 text-xs font-semibold">{days} gün</span>
                                <span className="text-gray-500 text-xs">·</span>
                                <span className="text-gray-500 text-xs">{formatDate(fault.startDate)}</span>
                              </div>
                              <p className="text-gray-300 text-sm">{fault.description}</p>
                              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><MapPin size={10} />{fault.location}</span>
                                {fault.serviceName && <span>Servis: {fault.serviceName}</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {faults.length === 0 && (
                      <div className="text-gray-500 text-sm ml-4">Aktif arıza kaydı yok (durum: {vehicle.status})</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Summary Table */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-white font-semibold">Bölge Özet Tablosu</h2>
          </CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-5 py-3 text-left text-gray-500 font-medium">Bölge</th>
                  <th className="px-5 py-3 text-center text-gray-500 font-medium">Toplam</th>
                  <th className="px-5 py-3 text-center text-gray-500 font-medium">Aktif</th>
                  <th className="px-5 py-3 text-center text-gray-500 font-medium">Arızalı</th>
                  <th className="px-5 py-3 text-center text-gray-500 font-medium">Parça Bekliyor</th>
                  <th className="px-5 py-3 text-center text-gray-500 font-medium">Görevli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {regions.map(region => {
                  const rv = vehicles.filter(v => v.regionId === region.id);
                  return (
                    <tr key={region.id} className="hover:bg-gray-800/50">
                      <td className="px-5 py-3 text-gray-300 font-medium">{region.name}</td>
                      <td className="px-5 py-3 text-center text-white font-bold">{rv.length}</td>
                      <td className="px-5 py-3 text-center text-green-400">{rv.filter(v => v.status === 'Aktif').length}</td>
                      <td className="px-5 py-3 text-center text-red-400">{rv.filter(v => v.status === 'Arızalı').length}</td>
                      <td className="px-5 py-3 text-center text-yellow-400">{rv.filter(v => v.status === 'Parça Bekliyor').length}</td>
                      <td className="px-5 py-3 text-center text-blue-400">{rv.filter(v => v.status === 'Görevli').length}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-gray-700 bg-gray-800/50">
                  <td className="px-5 py-3 text-white font-bold">TOPLAM</td>
                  <td className="px-5 py-3 text-center text-white font-bold">{vehicles.length}</td>
                  <td className="px-5 py-3 text-center text-green-400 font-bold">{vehicles.filter(v => v.status === 'Aktif').length}</td>
                  <td className="px-5 py-3 text-center text-red-400 font-bold">{vehicles.filter(v => v.status === 'Arızalı').length}</td>
                  <td className="px-5 py-3 text-center text-yellow-400 font-bold">{vehicles.filter(v => v.status === 'Parça Bekliyor').length}</td>
                  <td className="px-5 py-3 text-center text-blue-400 font-bold">{vehicles.filter(v => v.status === 'Görevli').length}</td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>

        <div className="hidden print:block mt-6 text-xs text-gray-500 text-center border-t pt-3">
          Araç Takip Sistemi — Rapor oluşturma tarihi: {new Date().toLocaleDateString('tr-TR')}
        </div>
      </div>
    </div>
  );
}
