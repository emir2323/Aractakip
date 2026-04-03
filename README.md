# Araç Takip Sistemi

Filo yönetimi için full-stack web uygulaması. React + TypeScript frontend, Node.js + Express backend, SQLite veritabanı.

## Özellikler

- Bölge / istasyon / araç yönetimi
- Arıza kaydı ve takibi
- Personel yönetimi
- Özel servis takibi
- Dashboard: belge uyarıları, özet istatistikler
- Yazdırılabilir raporlar
- JWT kimlik doğrulama
- Koyu tema

## Gereksinimler

- Node.js 18+
- npm 9+

## Kurulum

### 1. Bağımlılıkları yükle

```bash
# Frontend bağımlılıkları
npm install

# Backend bağımlılıkları
cd backend
npm install
cd ..
```

### 2. Backend ortam dosyasını oluştur

`backend/.env` dosyasını oluştur:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="supersecret-change-me-in-production"
PORT=3001
```

### 3. Veritabanını oluştur ve migrate et

```bash
cd backend
npx prisma migrate dev --name init
```

### 4. Örnek verileri yükle

```bash
cd backend
npx tsx prisma/seed.ts
```

Bu komut şunları oluşturur:
- 3 bölge, 6 istasyon
- 5 araç, 3 arıza kaydı
- 18 personel, 3 servis
- Admin kullanıcı: **admin / admin123**

### 5. Uygulamayı başlat

Her iki sunucuyu aynı anda başlatmak için (proje kökünden):

```bash
npm run dev:all
```

Veya ayrı terminallerde:

```bash
# Terminal 1 — Backend (port 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
npm run dev
```

### 6. Tarayıcıda aç

```
http://localhost:5173
```

Giriş bilgileri:
- Kullanıcı adı: `admin`
- Şifre: `admin123`

## Proje Yapısı

```
├── src/                    # Frontend (React + TypeScript + Vite)
│   ├── api/                # Axios API istemcisi ve endpoint fonksiyonları
│   ├── components/         # UI bileşenleri
│   ├── contexts/           # Auth ve Toast context'leri
│   ├── hooks/              # React Query hook'ları (useVehicles, useFaults, vb.)
│   ├── pages/              # Sayfa bileşenleri
│   └── types/              # TypeScript tip tanımları
├── backend/                # Backend (Node.js + Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma   # Veritabanı şeması
│   │   ├── seed.ts         # Örnek veri
│   │   └── dev.db          # SQLite veritabanı (migrate sonrası oluşur)
│   └── src/
│       ├── routes/         # Express route handler'ları
│       ├── middleware/      # JWT auth middleware
│       └── index.ts        # Express uygulama giriş noktası
├── package.json            # Frontend bağımlılıkları + dev:all script
└── README.md
```

## API Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/login` | Giriş |
| GET | `/api/auth/me` | Mevcut kullanıcı |
| GET | `/api/regions` | Bölgeler (istasyonlar dahil) |
| GET/POST | `/api/vehicles` | Araç listesi / ekleme |
| GET/PUT/DELETE | `/api/vehicles/:id` | Araç detay / güncelleme / silme |
| GET/POST | `/api/faults` | Arıza kayıtları |
| GET/POST | `/api/personnel` | Personel |
| GET/POST | `/api/services` | Servisler |
| GET/PUT | `/api/settings` | Ayarlar |
| GET | `/api/reports/*` | Raporlar |
| GET | `/api/backup/export` | Tam veri yedeği |

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Query, React Router v6, Axios, Lucide React

**Backend:** Node.js, Express, TypeScript, Prisma ORM, SQLite, JWT, Zod, bcryptjs
