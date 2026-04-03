import { Link } from 'react-router-dom';
import { MapPin, Edit2, Trash2, Eye } from 'lucide-react';
import type { Vehicle } from '../../types';
import { statusColors, statusDotColors, formatDate, getDaysRemaining, getDateStatusClass } from '../../utils/helpers';
import { Card, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';

interface Region  { id: string; name: string }
interface Station { id: string; regionId: string; name: string }

interface Props {
  vehicle: Vehicle;
  regions?: Region[];
  stations?: Station[];
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
}

export function VehicleCard({ vehicle, regions = [], stations = [], onEdit, onDelete }: Props) {
  const region      = regions.find(r => r.id === vehicle.regionId);
  const station     = stations.find(s => s.id === vehicle.stationId);
  const dutyRegion  = regions.find(r => r.id === vehicle.dutyRegionId);
  const dutyStation = stations.find(s => s.id === vehicle.dutyStationId);

  const muayeneDays = getDaysRemaining(vehicle.muayeneExpiry);
  const sigortaDays = getDaysRemaining(vehicle.insuranceExpiry);
  const kaskoDays   = getDaysRemaining(vehicle.kaskoExpiry);
  const worstDays   = Math.min(muayeneDays, sigortaDays, kaskoDays);
  const hasDocAlert = worstDays <= 60;

  return (
    <Card hover className="group">
      <CardBody className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-white font-bold text-base tracking-wide">{vehicle.plate}</div>
            <div className="text-gray-400 text-sm">{vehicle.brand} {vehicle.model} · {vehicle.year}</div>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[vehicle.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[vehicle.status]}`} />
            {vehicle.status}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <MapPin size={11} />
          <span>{region?.name ?? '—'} › {station?.name ?? '—'}</span>
        </div>

        {vehicle.status === 'Görevli' && dutyStation && (
          <div className="text-xs text-blue-400 mb-3 bg-blue-400/5 border border-blue-400/20 rounded px-2 py-1">
            Görev yeri: {dutyRegion?.name} › {dutyStation?.name}
          </div>
        )}

        {hasDocAlert && (
          <div className="space-y-1 mb-3 p-2 bg-gray-800 rounded-lg">
            {[
              { label: 'Muayene', days: muayeneDays, date: vehicle.muayeneExpiry },
              { label: 'Sigorta', days: sigortaDays, date: vehicle.insuranceExpiry },
              { label: 'Kasko',   days: kaskoDays,   date: vehicle.kaskoExpiry },
            ].filter(d => d.days <= 60).map(({ label, days, date }) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className={getDateStatusClass(days)}>
                  {days <= 0 ? 'Süresi doldu' : `${days} gün · ${formatDate(date)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {vehicle.materials.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {vehicle.materials.slice(0, 3).map((m, i) => (
              <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{m}</span>
            ))}
            {vehicle.materials.length > 3 && (
              <span className="text-xs text-gray-600">+{vehicle.materials.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link to={`/araclar/${vehicle.id}`} className="flex-1">
            <Button variant="secondary" size="sm" icon={<Eye size={13} />} className="w-full">Detay</Button>
          </Link>
          <Button variant="ghost" size="sm" icon={<Edit2 size={13} />} onClick={() => onEdit(vehicle)}>{''}</Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} className="hover:text-red-400" onClick={() => onDelete(vehicle)}>{''}</Button>
        </div>
      </CardBody>
    </Card>
  );
}
