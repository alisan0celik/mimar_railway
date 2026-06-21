# Mimar Platform

Mimarlık ofisleri için geliştirilmiş, çok kiracılı (multi-tenant) proje yönetim platformu. Monorepo yapısında **NestJS backend API**, **Expo/React Native mobil uygulama** ve paylaşılan tip paketinden oluşur.

## Ekran Görüntüleri

### Mobil Uygulama

| Onboarding | Giriş | Kayıt | Şifremi Unuttum |
|:---:|:---:|:---:|:---:|
| ![Onboarding](docs/screenshots/onboarding.png) | ![Giriş](docs/screenshots/login.png) | ![Kayıt](docs/screenshots/register.png) | ![Şifremi Unuttum](docs/screenshots/forgot-password.png) |

### API Dokümantasyonu (Swagger)

![Swagger API Docs](docs/screenshots/swagger.png)

> Swagger UI: `http://localhost:3000/api/docs` — Tüm endpoint'ler, request/response şemaları ve JWT ile canlı test imkânı.

## Özellikler

- Kullanıcı kaydı, giriş, şifre sıfırlama ve sosyal giriş (Google / Apple)
- Şirket oluşturma, katılım talepleri ve üye onay akışı
- Rol tabanlı yetkilendirme (RBAC) ve şirket bazlı veri izolasyonu
- Proje yönetimi (görevler, notlar, mesajlar, dosyalar, ekip)
- Finans takibi ve bütçe yönetimi
- Takvim etkinlikleri
- Gerçek zamanlı bildirimler (WebSocket + FCM)
- Destek talepleri
- Swagger API dokümantasyonu
- **Çevrimdışı mod** — proje/not/görev/mesaj cache + kuyruklu yazma + otomatik senkronizasyon

## Çevrimdışı Mod (Mobil)

Mobil uygulama offline-first cache ve outbox kuyruğu kullanır:

| Bileşen | Teknoloji |
|---------|-----------|
| Ağ durumu | `@react-native-community/netinfo` |
| Yerel cache | `expo-sqlite` |
| Sync API | `GET /api/sync/pull`, `POST /api/sync/push` |
| Push tetikleyici | Firebase FCM (`sync_required`) |

**Offline desteklenen işlemler:** proje listesi okuma, not/görev/mesaj ekleme ve güncelleme (kuyruğa alınır, online olunca senkronize edilir).

**Oturum davranışı:**
- İlk kurulum → Onboarding → Giriş/Kayıt
- Kayıt/giriş sonrası → uygulama doğrudan ana ekrana açılır
- Çıkış yap → sadece Giriş/Kayıt (onboarding tekrar gösterilmez)
- Offline açılış → cache'lenmiş profil ile oturum korunur

## Proje Yapısı

```
mimar-platform/
├── apps/
│   ├── backend/          # NestJS 11 REST API + Prisma + PostgreSQL
│   └── mobile/           # Expo 55 + React Native mobil uygulama
├── packages/
│   └── shared/           # Ortak TypeScript tipleri, enum'lar ve sabitler
├── package.json          # Monorepo kök yapılandırması (npm workspaces)
└── turbo.json            # Turbo build pipeline
```

## Teknoloji Yığını

| Katman | Teknolojiler |
|--------|--------------|
| Backend | NestJS 11, Prisma 6, PostgreSQL, JWT, Socket.IO, Firebase (FCM) |
| Mobil | Expo 55, React Native, Expo Router, Zustand, React Hook Form, Zod |
| Paylaşılan | TypeScript, `@mimar/shared` workspace paketi |
| Araçlar | Turbo, npm workspaces, Swagger |

## Gereksinimler

- **Node.js** 20+
- **npm** 10+
- **Docker** (PostgreSQL ve Redis için önerilir)
- **Expo Go** veya Android/iOS emülatör (mobil geliştirme)

## Kurulum

### 1. Bağımlılıkları yükle

```bash
git clone <repo-url>
cd mimar-platform
npm install
```

### 2. Veritabanını başlat

```bash
cd apps/backend
docker compose up -d
```

Bu komut şunları ayağa kaldırır:

| Servis | Adres |
|--------|-------|
| PostgreSQL | `localhost:5432` |
| Redis | `localhost:6379` |
| pgAdmin | `http://localhost:5050` |

### 3. Backend ortam değişkenlerini ayarla

```bash
cp apps/backend/.env.example apps/backend/.env
```

`.env` dosyasını düzenleyin. Geliştirme için minimum gerekli alanlar:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://mimar:mimar123@localhost:5432/mimar_db
JWT_ACCESS_SECRET=dev-access-secret
JWT_REFRESH_SECRET=dev-refresh-secret
CORS_ORIGINS=*
```

### 4. Veritabanı migration'larını çalıştır

```bash
npm run prisma:generate -w apps/backend
npm run prisma:migrate -w apps/backend
```

İsteğe bağlı seed:

```bash
npm run prisma:seed -w apps/backend
```

### 5. Mobil ortam değişkenlerini ayarla

`apps/mobile/.env` dosyası oluşturun:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WS_URL=http://localhost:3000
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

> Fiziksel cihazda test ediyorsanız `localhost` yerine bilgisayarınızın yerel IP adresini kullanın (ör. `http://192.168.1.10:3000/api`).

## Çalıştırma

Proje kök dizininden:

```bash
# Backend (geliştirme modu, hot-reload)
npm run dev:backend

# Mobil uygulama (Expo)
npm run dev:mobile
```

### Erişim adresleri

| Servis | URL |
|--------|-----|
| API Base URL | `http://localhost:3000/api` |
| Swagger UI | `http://localhost:3000/api/docs` |
| OpenAPI JSON | `http://localhost:3000/api/docs-json` |
| Prisma Studio | `npm run prisma:studio -w apps/backend` |

### Swagger kullanımı

1. `POST /api/auth/login` ile giriş yapın
2. Yanıttaki `accessToken` değerini kopyalayın
3. Swagger UI'da **Authorize** butonuna tıklayıp token'ı yapıştırın
4. Korumalı endpoint'leri test edin

Production ortamında Swagger varsayılan olarak kapalıdır. Açmak için `ENABLE_SWAGGER=true` ayarlayın.

## NPM Scriptleri

### Kök dizin

| Komut | Açıklama |
|-------|----------|
| `npm run dev:backend` | Backend'i geliştirme modunda başlatır |
| `npm run dev:mobile` | Expo geliştirme sunucusunu başlatır |
| `npm run build:backend` | Backend production build |
| `npm run build:shared` | Paylaşılan paketi derler |
| `npm run lint` | Tüm workspace'lerde lint |
| `npm run typecheck` | TypeScript tip kontrolü |
| `npm run clean` | Build çıktılarını temizler |

### Backend (`apps/backend`)

| Komut | Açıklama |
|-------|----------|
| `npm run start:dev -w apps/backend` | Geliştirme sunucusu |
| `npm run build -w apps/backend` | Production build |
| `npm run prisma:migrate -w apps/backend` | Veritabanı migration |
| `npm run prisma:studio -w apps/backend` | Prisma veritabanı arayüzü |

### Mobil (`apps/mobile`)

| Komut | Açıklama |
|-------|----------|
| `npm run start -w apps/mobile` | Expo başlat |
| `npm run web -w apps/mobile` | Web tarayıcıda çalıştır |

## Paylaşılan Paket (`@mimar/shared`)

Mobil ve backend arasında ortak tip tanımları, enum'lar ve izin sabitleri `packages/shared` altında tutulur.

```typescript
import type { UserDTO, AuthResponse } from "@mimar/shared";
```

Mobil uygulama bu paketi doğrudan workspace bağımlılığı olarak kullanır.

## Backend Modülleri

| Modül | Açıklama |
|-------|----------|
| Auth | Kayıt, giriş, token yenileme, şifre sıfırlama |
| Users | Profil ve şirket üyeleri |
| Companies | Şirket yönetimi, katılım talepleri |
| Projects | Proje, görev, dosya, ekip |
| Roles | Rol ve izin yönetimi |
| Finance | Finans kayıtları ve bütçe |
| Notifications | Bildirimler ve push token |
| Calendar | Takvim etkinlikleri |
| Support | Destek talepleri |

Detaylı backend dokümantasyonu: [`apps/backend/docs/MIMAR-BACKEND-DOKUMANTASYON.md`](apps/backend/docs/MIMAR-BACKEND-DOKUMANTASYON.md)

## Mobil Uygulama

Expo Router ile dosya tabanlı yönlendirme kullanılır:

```
apps/mobile/app/
├── (auth)/       # Giriş, kayıt, şifremi unuttum, onboarding
├── (main)/       # Ana uygulama (dashboard, projeler, finans, ayarlar)
└── index.tsx     # Giriş yönlendirmesi
```

Kaynak kod: `apps/mobile/src/` (features, services, store, components)

## Güvenlik

- JWT tabanlı kimlik doğrulama (access + refresh token)
- Üç katmanlı guard zinciri: `JwtAuthGuard` → `CompanyGuard` → `PermissionsGuard`
- Şirket bazlı veri izolasyonu (`CompanyScopeService`)
- Auth endpoint'lerinde rate limiting

## Geliştirme Notları

- `node_modules/` klasörü Git'e dahil edilmez; `npm install` ile oluşturulur
- `.env` dosyaları gizlidir; örnek için `apps/backend/.env.example` kullanın
- Monorepo npm workspaces ile yönetilir; paketler `apps/*` ve `packages/*` altındadır

## Lisans

Bu proje özel (`private`) bir monorepo'dur.
