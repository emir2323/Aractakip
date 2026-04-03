import type { Region, Station, Vehicle, FaultLog, Personnel, PrivateService } from '../types';
import { addDays, format } from 'date-fns';

const today = new Date();
const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export const sampleRegions: Region[] = [
  { id: 'r1', name: '1. Bölge' },
  { id: 'r2', name: '2. Bölge' },
  { id: 'r3', name: '3. Bölge' },
];

export const sampleStations: Station[] = [
  { id: 's1', regionId: 'r1', name: 'Merkez İstasyonu' },
  { id: 's2', regionId: 'r1', name: 'Çankaya İstasyonu' },
  { id: 's3', regionId: 'r2', name: 'Keçiören İstasyonu' },
  { id: 's4', regionId: 'r2', name: 'Mamak İstasyonu' },
  { id: 's5', regionId: 'r3', name: 'Etimesgut İstasyonu' },
  { id: 's6', regionId: 'r3', name: 'Sincan İstasyonu' },
];

export const sampleVehicles: Vehicle[] = [
  {
    id: 'v1',
    plate: '06 AGAH 6438',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2020,
    regionId: 'r1',
    stationId: 's1',
    status: 'Aktif',
    materials: ['Telsiz', 'İlk Yardım Çantası', 'Yangın Söndürücü'],
    insuranceExpiry: fmt(addDays(today, 45)),
    kaskoExpiry: fmt(addDays(today, 120)),
    muayeneExpiry: fmt(addDays(today, 20)), // Yellow alert
    notes: 'Düzenli bakım yapılıyor.',
    createdAt: fmt(addDays(today, -200)),
  },
  {
    id: 'v2',
    plate: '06 BKT 2210',
    brand: 'Ford',
    model: 'Transit',
    year: 2019,
    regionId: 'r1',
    stationId: 's2',
    status: 'Arızalı',
    materials: ['Telsiz', 'Ekipman Kutusu'],
    insuranceExpiry: fmt(addDays(today, 10)), // Red alert
    kaskoExpiry: fmt(addDays(today, 90)),
    muayeneExpiry: fmt(addDays(today, 60)),
    notes: 'Motor arızası mevcut.',
    createdAt: fmt(addDays(today, -300)),
  },
  {
    id: 'v3',
    plate: '06 CHT 9981',
    brand: 'Volkswagen',
    model: 'Crafter',
    year: 2021,
    regionId: 'r2',
    stationId: 's3',
    status: 'Parça Bekliyor',
    materials: ['Telsiz', 'Kurtarma Ekipmanı', 'Jeneratör'],
    insuranceExpiry: fmt(addDays(today, 55)),
    kaskoExpiry: fmt(addDays(today, 28)), // Yellow alert
    muayeneExpiry: fmt(addDays(today, 180)),
    notes: 'Parça siparişi verildi.',
    createdAt: fmt(addDays(today, -150)),
  },
  {
    id: 'v4',
    plate: '06 DKY 4455',
    brand: 'Mercedes',
    model: 'Sprinter',
    year: 2018,
    regionId: 'r2',
    stationId: 's4',
    status: 'Görevli',
    dutyRegionId: 'r3',
    dutyStationId: 's5',
    materials: ['Telsiz', 'Sedye', 'Defibrilatör'],
    insuranceExpiry: fmt(addDays(today, 200)),
    kaskoExpiry: fmt(addDays(today, 150)),
    muayeneExpiry: fmt(addDays(today, 100)),
    notes: 'Etimesgut\'ta görev yapıyor.',
    createdAt: fmt(addDays(today, -400)),
  },
  {
    id: 'v5',
    plate: '06 ELM 7730',
    brand: 'Renault',
    model: 'Master',
    year: 2022,
    regionId: 'r3',
    stationId: 's6',
    status: 'Aktif',
    materials: ['Telsiz', 'İlk Yardım Çantası'],
    insuranceExpiry: fmt(addDays(today, 300)),
    kaskoExpiry: fmt(addDays(today, 250)),
    muayeneExpiry: fmt(addDays(today, 5)), // Red alert
    notes: 'Yeni araç.',
    createdAt: fmt(addDays(today, -30)),
  },
];

export const sampleFaultLogs: FaultLog[] = [
  {
    id: 'f1',
    vehicleId: 'v2',
    faultType: 'Motor',
    description: 'Motor ısınma sorunu, soğutma sistemi arızası tespit edildi.',
    location: 'Çankaya İstasyonu',
    startDate: fmt(addDays(today, -15)),
    status: 'Devam Ediyor',
    serviceId: 'srv1',
    serviceName: 'Şimşek Oto Servis',
    createdAt: fmt(addDays(today, -15)),
  },
  {
    id: 'f2',
    vehicleId: 'v3',
    faultType: 'Şanzıman',
    description: 'Şanzıman vites geçişinde problem, vites kutusu değişimi gerekiyor.',
    location: 'Keçiören İstasyonu',
    startDate: fmt(addDays(today, -30)),
    status: 'Devam Ediyor',
    serviceId: 'srv2',
    serviceName: 'Ankara Oto Bakım',
    createdAt: fmt(addDays(today, -30)),
  },
  {
    id: 'f3',
    vehicleId: 'v1',
    faultType: 'Lastik',
    description: 'Ön sol lastik patlaması, yedek lastik takıldı.',
    location: 'Ankara Bulvarı No:45',
    startDate: fmt(addDays(today, -60)),
    endDate: fmt(addDays(today, -59)),
    status: 'Çözüldü',
    serviceName: 'Lastik Dünyası',
    createdAt: fmt(addDays(today, -60)),
  },
];

export const samplePersonnel: Personnel[] = [
  // Region 1 - Merkez İstasyonu
  { id: 'p1', firstName: 'Ahmet', lastName: 'Yılmaz', title: 'Amir', regionId: 'r1', stationId: 's1', phone: '0532 111 2233', notes: '', createdAt: fmt(today) },
  { id: 'p2', firstName: 'Mehmet', lastName: 'Kaya', title: 'Şoför', regionId: 'r1', stationId: 's1', phone: '0533 222 3344', notes: '', createdAt: fmt(today) },
  { id: 'p3', firstName: 'Ali', lastName: 'Demir', title: 'Teknisyen', regionId: 'r1', stationId: 's1', phone: '0534 333 4455', notes: '', createdAt: fmt(today) },
  // Region 1 - Çankaya İstasyonu
  { id: 'p4', firstName: 'Hasan', lastName: 'Çelik', title: 'Amir', regionId: 'r1', stationId: 's2', phone: '0535 444 5566', notes: '', createdAt: fmt(today) },
  { id: 'p5', firstName: 'Ayşe', lastName: 'Şahin', title: 'İşçi', regionId: 'r1', stationId: 's2', phone: '0536 555 6677', notes: '', createdAt: fmt(today) },
  { id: 'p6', firstName: 'Fatma', lastName: 'Arslan', title: 'Çavuş', regionId: 'r1', stationId: 's2', phone: '0537 666 7788', notes: '', createdAt: fmt(today) },
  // Region 2 - Keçiören İstasyonu
  { id: 'p7', firstName: 'Mustafa', lastName: 'Koç', title: 'Amir', regionId: 'r2', stationId: 's3', phone: '0538 777 8899', notes: '', createdAt: fmt(today) },
  { id: 'p8', firstName: 'İbrahim', lastName: 'Kurt', title: 'Şoför', regionId: 'r2', stationId: 's3', phone: '0539 888 9900', notes: '', createdAt: fmt(today) },
  { id: 'p9', firstName: 'Zeynep', lastName: 'Aydın', title: 'İşçi', regionId: 'r2', stationId: 's3', phone: '0530 999 0011', notes: '', createdAt: fmt(today) },
  // Region 2 - Mamak İstasyonu
  { id: 'p10', firstName: 'Ömer', lastName: 'Çakmak', title: 'Amir', regionId: 'r2', stationId: 's4', phone: '0531 100 1122', notes: '', createdAt: fmt(today) },
  { id: 'p11', firstName: 'Elif', lastName: 'Doğan', title: 'Teknisyen', regionId: 'r2', stationId: 's4', phone: '0532 200 2233', notes: '', createdAt: fmt(today) },
  { id: 'p12', firstName: 'Serkan', lastName: 'Yıldız', title: 'Çavuş', regionId: 'r2', stationId: 's4', phone: '0533 300 3344', notes: '', createdAt: fmt(today) },
  // Region 3 - Etimesgut İstasyonu
  { id: 'p13', firstName: 'Burak', lastName: 'Güler', title: 'Amir', regionId: 'r3', stationId: 's5', phone: '0534 400 4455', notes: '', createdAt: fmt(today) },
  { id: 'p14', firstName: 'Derya', lastName: 'Polat', title: 'Şoför', regionId: 'r3', stationId: 's5', phone: '0535 500 5566', notes: '', createdAt: fmt(today) },
  { id: 'p15', firstName: 'Canan', lastName: 'Erdoğan', title: 'İşçi', regionId: 'r3', stationId: 's5', phone: '0536 600 6677', notes: '', createdAt: fmt(today) },
  // Region 3 - Sincan İstasyonu
  { id: 'p16', firstName: 'Kemal', lastName: 'Altın', title: 'Amir', regionId: 'r3', stationId: 's6', phone: '0537 700 7788', notes: '', createdAt: fmt(today) },
  { id: 'p17', firstName: 'Seda', lastName: 'Özkan', title: 'Teknisyen', regionId: 'r3', stationId: 's6', phone: '0538 800 8899', notes: '', createdAt: fmt(today) },
  { id: 'p18', firstName: 'Taner', lastName: 'Bulut', title: 'Çavuş', regionId: 'r3', stationId: 's6', phone: '0539 900 9900', notes: '', createdAt: fmt(today) },
];

export const sampleServices: PrivateService[] = [
  { id: 'srv1', name: 'Şimşek Oto Servis', address: 'Çankaya Mah. Atatürk Cad. No:12 Ankara', phone: '0312 456 7890' },
  { id: 'srv2', name: 'Ankara Oto Bakım', address: 'Keçiören Mah. İnönü Sok. No:5 Ankara', phone: '0312 567 8901' },
  { id: 'srv3', name: 'Lastik Dünyası', address: 'Mamak İş Merkezi Ankara', phone: '0312 678 9012' },
];
