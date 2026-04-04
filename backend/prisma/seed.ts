import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

async function main() {
  // ── Admin user ──────────────────────────────────────────────────────────────
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: hashedAdmin, role: 'admin', name: 'Sistem Yöneticisi' },
  });

  // ── Settings ────────────────────────────────────────────────────────────────
  await prisma.setting.upsert({
    where: { key: 'faultTypes' },
    update: {},
    create: { key: 'faultTypes', value: JSON.stringify(['Motor', 'Elektrik', 'Fren', 'Lastik', 'Şanzıman', 'Diğer']) },
  });
  await prisma.setting.upsert({
    where: { key: 'personnelTitles' },
    update: {},
    create: { key: 'personnelTitles', value: JSON.stringify(['Amir', 'Çavuş', 'İşçi', 'Şoför', 'Teknisyen', 'Diğer']) },
  });

  // ── Regions ─────────────────────────────────────────────────────────────────
  const r1 = await prisma.region.upsert({ where: { id: 'r1' }, update: {}, create: { id: 'r1', name: '1. Bölge' } });
  const r2 = await prisma.region.upsert({ where: { id: 'r2' }, update: {}, create: { id: 'r2', name: '2. Bölge' } });
  const r3 = await prisma.region.upsert({ where: { id: 'r3' }, update: {}, create: { id: 'r3', name: '3. Bölge' } });

  // ── Stations ─────────────────────────────────────────────────────────────────
  const s1 = await prisma.station.upsert({ where: { id: 's1' }, update: {}, create: { id: 's1', name: 'Merkez İstasyonu', regionId: r1.id } });
  const s2 = await prisma.station.upsert({ where: { id: 's2' }, update: {}, create: { id: 's2', name: 'Çankaya İstasyonu', regionId: r1.id } });
  const s3 = await prisma.station.upsert({ where: { id: 's3' }, update: {}, create: { id: 's3', name: 'Keçiören İstasyonu', regionId: r2.id } });
  const s4 = await prisma.station.upsert({ where: { id: 's4' }, update: {}, create: { id: 's4', name: 'Mamak İstasyonu', regionId: r2.id } });
  const s5 = await prisma.station.upsert({ where: { id: 's5' }, update: {}, create: { id: 's5', name: 'Etimesgut İstasyonu', regionId: r3.id } });
  const s6 = await prisma.station.upsert({ where: { id: 's6' }, update: {}, create: { id: 's6', name: 'Sincan İstasyonu', regionId: r3.id } });

  // ── Services ─────────────────────────────────────────────────────────────────
  const srv1 = await prisma.service.upsert({ where: { id: 'srv1' }, update: {}, create: { id: 'srv1', name: 'Şimşek Oto Servis', address: 'Çankaya Mah. Atatürk Cad. No:12 Ankara', phone: '0312 456 7890' } });
  const srv2 = await prisma.service.upsert({ where: { id: 'srv2' }, update: {}, create: { id: 'srv2', name: 'Ankara Oto Bakım', address: 'Keçiören Mah. İnönü Sok. No:5 Ankara', phone: '0312 567 8901' } });
  await prisma.service.upsert({ where: { id: 'srv3' }, update: {}, create: { id: 'srv3', name: 'Lastik Dünyası', address: 'Mamak İş Merkezi Ankara', phone: '0312 678 9012' } });

  const today = new Date();
  const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  const v1 = await prisma.vehicle.upsert({
    where: { id: 'v1' }, update: {},
    create: {
      id: 'v1', plate: '06 AGAH 6438', brand: 'Toyota', model: 'Hilux', year: 2020,
      stationId: s1.id, status: 'Aktif',
      materials: JSON.stringify(['Telsiz', 'İlk Yardım Çantası', 'Yangın Söndürücü']),
      insuranceExpiry: addDays(today, 45), kaskoExpiry: addDays(today, 120),
      muayeneExpiry: addDays(today, 20), notes: 'Düzenli bakım yapılıyor.',
    },
  });
  const v2 = await prisma.vehicle.upsert({
    where: { id: 'v2' }, update: {},
    create: {
      id: 'v2', plate: '06 BKT 2210', brand: 'Ford', model: 'Transit', year: 2019,
      stationId: s2.id, status: 'Arızalı',
      materials: JSON.stringify(['Telsiz', 'Ekipman Kutusu']),
      insuranceExpiry: addDays(today, 10), kaskoExpiry: addDays(today, 90),
      muayeneExpiry: addDays(today, 60), notes: 'Motor arızası mevcut.',
    },
  });
  const v3 = await prisma.vehicle.upsert({
    where: { id: 'v3' }, update: {},
    create: {
      id: 'v3', plate: '06 CHT 9981', brand: 'Volkswagen', model: 'Crafter', year: 2021,
      stationId: s3.id, status: 'Parça Bekliyor',
      materials: JSON.stringify(['Telsiz', 'Kurtarma Ekipmanı', 'Jeneratör']),
      insuranceExpiry: addDays(today, 55), kaskoExpiry: addDays(today, 28),
      muayeneExpiry: addDays(today, 180), notes: 'Parça siparişi verildi.',
    },
  });
  await prisma.vehicle.upsert({
    where: { id: 'v4' }, update: {},
    create: {
      id: 'v4', plate: '06 DKY 4455', brand: 'Mercedes', model: 'Sprinter', year: 2018,
      stationId: s4.id, status: 'Görevli', dutyStationId: s5.id,
      materials: JSON.stringify(['Telsiz', 'Sedye', 'Defibrilatör']),
      insuranceExpiry: addDays(today, 200), kaskoExpiry: addDays(today, 150),
      muayeneExpiry: addDays(today, 100), notes: "Etimesgut'ta görev yapıyor.",
    },
  });
  await prisma.vehicle.upsert({
    where: { id: 'v5' }, update: {},
    create: {
      id: 'v5', plate: '06 ELM 7730', brand: 'Renault', model: 'Master', year: 2022,
      stationId: s6.id, status: 'Aktif',
      materials: JSON.stringify(['Telsiz', 'İlk Yardım Çantası']),
      insuranceExpiry: addDays(today, 300), kaskoExpiry: addDays(today, 250),
      muayeneExpiry: addDays(today, 5), notes: 'Yeni araç.',
    },
  });

  // ── Faults ────────────────────────────────────────────────────────────────────
  await prisma.fault.upsert({
    where: { id: 'f1' }, update: {},
    create: {
      id: 'f1', vehicleId: v2.id, type: 'Motor',
      description: 'Motor ısınma sorunu, soğutma sistemi arızası tespit edildi.',
      location: 'Çankaya İstasyonu', startDate: addDays(today, -15),
      status: 'Devam Ediyor', serviceId: srv1.id, serviceName: 'Şimşek Oto Servis',
    },
  });
  await prisma.fault.upsert({
    where: { id: 'f2' }, update: {},
    create: {
      id: 'f2', vehicleId: v3.id, type: 'Şanzıman',
      description: 'Şanzıman vites geçişinde problem, vites kutusu değişimi gerekiyor.',
      location: 'Keçiören İstasyonu', startDate: addDays(today, -30),
      status: 'Devam Ediyor', serviceId: srv2.id, serviceName: 'Ankara Oto Bakım',
    },
  });
  await prisma.fault.upsert({
    where: { id: 'f3' }, update: {},
    create: {
      id: 'f3', vehicleId: v1.id, type: 'Lastik',
      description: 'Ön sol lastik patlaması, yedek lastik takıldı.',
      location: 'Ankara Bulvarı No:45', startDate: addDays(today, -60), endDate: addDays(today, -59),
      status: 'Çözüldü', serviceName: 'Lastik Dünyası',
    },
  });

  // ── Personnel ────────────────────────────────────────────────────────────────
  const personnelData = [
    { id: 'p1', firstName: 'Ahmet', lastName: 'Yılmaz', title: 'Amir', stationId: s1.id, phone: '0532 111 2233' },
    { id: 'p2', firstName: 'Mehmet', lastName: 'Kaya', title: 'Şoför', stationId: s1.id, phone: '0533 222 3344' },
    { id: 'p3', firstName: 'Ali', lastName: 'Demir', title: 'Teknisyen', stationId: s1.id, phone: '0534 333 4455' },
    { id: 'p4', firstName: 'Hasan', lastName: 'Çelik', title: 'Amir', stationId: s2.id, phone: '0535 444 5566' },
    { id: 'p5', firstName: 'Ayşe', lastName: 'Şahin', title: 'İşçi', stationId: s2.id, phone: '0536 555 6677' },
    { id: 'p6', firstName: 'Fatma', lastName: 'Arslan', title: 'Çavuş', stationId: s2.id, phone: '0537 666 7788' },
    { id: 'p7', firstName: 'Mustafa', lastName: 'Koç', title: 'Amir', stationId: s3.id, phone: '0538 777 8899' },
    { id: 'p8', firstName: 'İbrahim', lastName: 'Kurt', title: 'Şoför', stationId: s3.id, phone: '0539 888 9900' },
    { id: 'p9', firstName: 'Zeynep', lastName: 'Aydın', title: 'İşçi', stationId: s3.id, phone: '0530 999 0011' },
    { id: 'p10', firstName: 'Ömer', lastName: 'Çakmak', title: 'Amir', stationId: s4.id, phone: '0531 100 1122' },
    { id: 'p11', firstName: 'Elif', lastName: 'Doğan', title: 'Teknisyen', stationId: s4.id, phone: '0532 200 2233' },
    { id: 'p12', firstName: 'Serkan', lastName: 'Yıldız', title: 'Çavuş', stationId: s4.id, phone: '0533 300 3344' },
    { id: 'p13', firstName: 'Burak', lastName: 'Güler', title: 'Amir', stationId: s5.id, phone: '0534 400 4455' },
    { id: 'p14', firstName: 'Derya', lastName: 'Polat', title: 'Şoför', stationId: s5.id, phone: '0535 500 5566' },
    { id: 'p15', firstName: 'Canan', lastName: 'Erdoğan', title: 'İşçi', stationId: s5.id, phone: '0536 600 6677' },
    { id: 'p16', firstName: 'Kemal', lastName: 'Altın', title: 'Amir', stationId: s6.id, phone: '0537 700 7788' },
    { id: 'p17', firstName: 'Seda', lastName: 'Özkan', title: 'Teknisyen', stationId: s6.id, phone: '0538 800 8899' },
    { id: 'p18', firstName: 'Taner', lastName: 'Bulut', title: 'Çavuş', stationId: s6.id, phone: '0539 900 9900' },
  ];
  for (const p of personnelData) {
    await prisma.personnel.upsert({ where: { id: p.id }, update: {}, create: { ...p, notes: '' } });
  }

  // ── Driver accounts ───────────────────────────────────────────────────────────
  const hashedDriver = await bcrypt.hash('sofor123', 10);
  const sofor1 = await prisma.user.upsert({
    where: { username: 'sofor1' },
    update: {},
    create: {
      username: 'sofor1',
      password: hashedDriver,
      role: 'driver',
      name: 'Mehmet Kaya',
      vehicleId: v1.id,
      phone: '0533 222 3344',
    },
  });
  const sofor2 = await prisma.user.upsert({
    where: { username: 'sofor2' },
    update: {},
    create: {
      username: 'sofor2',
      password: hashedDriver,
      role: 'driver',
      name: 'Ali Demir',
      vehicleId: v2.id,
      phone: '0534 333 4455',
    },
  });

  // ── Oil maintenance sample records (current week) ────────────────────────────
  const { week: currentWeek, year: currentYear } = getISOWeek(today);

  await prisma.oilMaintenance.upsert({
    where: { id: 'oil1' },
    update: {},
    create: {
      id: 'oil1',
      vehicleId: v1.id,
      driverId: sofor1.id,
      km: 45230,
      weekNumber: currentWeek,
      year: currentYear,
      notes: 'Normal',
      status: 'pending',
    },
  });
  await prisma.oilMaintenance.upsert({
    where: { id: 'oil2' },
    update: {},
    create: {
      id: 'oil2',
      vehicleId: v2.id,
      driverId: sofor2.id,
      km: 78450,
      weekNumber: currentWeek,
      year: currentYear,
      notes: 'Yağ değişimi gerekiyor',
      status: 'pending',
    },
  });
  await prisma.oilMaintenance.upsert({
    where: { id: 'oil3' },
    update: {},
    create: {
      id: 'oil3',
      vehicleId: v1.id,
      driverId: sofor1.id,
      km: 44800,
      weekNumber: currentWeek - 1 > 0 ? currentWeek - 1 : 52,
      year: currentWeek - 1 > 0 ? currentYear : currentYear - 1,
      status: 'done',
    },
  });

  // ── Sample pending fault report from sofor1 ──────────────────────────────────
  await prisma.faultReport.upsert({
    where: { id: 'fr1' },
    update: {},
    create: {
      id: 'fr1',
      driverId: sofor1.id,
      vehicleId: v1.id,
      type: 'Elektrik',
      description: 'Far lambası yanmıyor, akşam görüşü tehlikeli.',
      location: 'Merkez İstasyonu önü',
      status: 'pending',
    },
  });

  console.log('✅ Seed completed');
}

main().catch(console.error).finally(() => prisma.$disconnect());
