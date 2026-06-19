# MimarApp — Mimari Plan ve Tasarım Dokümanı

> Oluşturulma: 10 Haziran 2026
> Proje: Cross-platform mobil uygulama (Android + iOS) — Mimarlık Proje Yönetimi

---

## İçindekiler

1. [Proje Vizyonu ve Kapsam](#1-proje-vizyonu-ve-kapsam)
2. [Mevcut Durum Analizi](#2-mevcut-durum-analizi)
3. [Teknoloji Kararları](#3-teknoloji-kararları)
4. [Monorepo Yapısı](#4-monorepo-yapısı)
5. [Backend Mimarisi (NestJS)](#5-backend-mimarisi-nestjs)
6. [Firebase Altyapısı](#6-firebase-altyapısı)
7. [Bildirim Sistemi (Push + In-App)](#7-bildirim-sistemi-push--in-app)
8. [Frontend Değişiklikleri](#8-frontend-değişiklikleri)
9. [Mimari Şema](#9-mimari-şema)
10. [Deployment Mimarisi (DigitalOcean)](#10-deployment-mimarisi-digitalocean)
11. [Mock'tan API'ye Geçiş Sırası](#11-mocktan-apiye-geçiş-sırası)
12. [Adım Adım Yol Haritası](#12-adım-adım-yol-haritası)

---

## 1. Proje Vizyonu ve Kapsam

**Amaç:** Mimarlık ofisleri için cross-platform (Android + iOS) proje yönetim uygulaması.

**Temel Özellikler:**
- Kullanıcı kimlik doğrulama (email + sosyal giriş)
- Şirket/Ofis yönetimi
- Proje yönetimi (görevler, ekip, bölümler, dosyalar)
- Finans takibi
- Rol tabanlı erişim kontrolü (RBAC)
- Gerçek zamanlı bildirimler (in-app + push)
- Çoklu dil desteği (Türkçe / İngilizce)
- Koyu / Açık tema

---

## 2. Mevcut Durum Analizi

| Alan | Durum | Detay |
|---|---|---|
| **Framework** | ✅ Tamam | React Native + Expo SDK 55, TypeScript strict |
| **Routing** | ✅ Tamam | Expo Router (file-based) |
| **State Management** | ✅ Temel | Zustand (3 store: auth, app, finance) |
| **Tema** | ✅ Tamam | Dark/Light, 95 token, ThemeProvider |
| **i18n** | ✅ Tamam | Türkçe + İngilizce, dot-path resolver |
| **UI Bileşenleri** | ✅ Tamam | 30 paylaşımlı komponent (tasarım sistemi) |
| **RBAC** | ✅ Temel | 17 permission kodu, PermissionGate, useCan |
| **HTTP/API Katmanı** | ❌ Eksik | Axios/fetch yok, servis katmanı yok |
| **Backend** | ❌ Eksik | Tüm veri mock (11 mock dosyası) |
| **Push Notification** | ❌ Eksik | expo-notifications yok, FCM yok |
| **Firebase** | ❌ Eksik | Firebase entegrasyonu yok |
| **Environment** | ❌ Eksik | `.env` dosyası yok |
| **Auth** | ⚠️ Mock | Sadece state flag, token yok, API yok |

---

## 3. Teknoloji Kararları

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| **Frontend** | React Native + Expo (SDK 55) | Cross-platform, mevcut kod tabanı |
| **Backend** | NestJS | TypeScript uyumu, decorator yapısı, modüler |
| **ORM** | Prisma | Type-safe, migration desteği |
| **Veritabanı** | PostgreSQL | İlişkisel veri modeli |
| **Cache/Realtime** | Redis | Socket.IO adapter, önbellek |
| **Auth** | JWT (access + refresh) + Passport | Stateless auth, sosyal giriş desteği |
| **Push Notification** | Firebase Cloud Messaging (FCM) | Cross-platform push |
| **Social Login** | Google + Apple Sign-In | Kullanıcı deneyimi |
| **API Client** | Axios | Interceptor, refresh token desteği |
| **Monorepo** | Turborepo | Paylaşılan tipler, hızlı build |
| **Deployment** | DigitalOcean (App Platform/Droplet) | Maliyet/performa dengesi |

### Paket Kararları

**Backend (NestJS):**
```
@nestjs/core, @nestjs/common, @nestjs/platform-express
@nestjs/config, @nestjs/jwt, @nestjs/passport, @nestjs/websockets
@prisma/client, prisma (dev)
firebase-admin, socket.io
class-validator, class-transformer
bcrypt, passport, passport-jwt, passport-google-oauth20, passport-apple
helmet, compression
```

**Frontend (yeni eklenecek):**
```
axios
expo-notifications
expo-device
expo-secure-store
@react-native-google-signin/google-signin
@invertase/react-native-apple-authentication
```

---

## 4. Monorepo Yapısı

```
mimar-platform/
├── package.json                  # Root (workspaces)
├── turbo.json                    # Turborepo yapılandırması
├── tsconfig.base.json            # Paylaşılan TS config
├── .gitignore
├── .prettierrc
├── .eslintrc.js
│
├── packages/
│   └── shared/                   # Paylaşılan tipler, DTO'lar, sabitler
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/
│           │   ├── user.types.ts
│           │   ├── project.types.ts
│           │   ├── notification.types.ts
│           │   └── api.types.ts
│           ├── enums/
│           │   └── index.ts
│           ├── constants/
│           │   └── permissions.ts
│           └── index.ts
│
├── apps/
│   ├── backend/                  # NestJS API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   ├── .env.example
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── config/
│   │       ├── common/
│   │       │   ├── guards/
│   │       │   ├── decorators/
│   │       │   ├── filters/
│   │       │   └── interceptors/
│   │       └── modules/
│   │           ├── auth/
│   │           ├── users/
│   │           ├── companies/
│   │           ├── projects/
│   │           ├── finance/
│   │           ├── roles/
│   │           └── notifications/
│   │
│   └── mobile/                   # Expo uygulaması (mevcut)
│       ├── package.json
│       ├── app.json
│       ├── tsconfig.json
│       ├── app/
│       └── src/
│
└── .github/
    └── workflows/
        ├── backend-ci.yml
        └── backend-deploy.yml
```

---

## 5. Backend Mimarisi (NestJS)

### Modül Yapısı

```
src/
├── main.ts                            # Bootstrap + Swagger + ValidationPipe
├── app.module.ts                      # Root module
├── config/
│   ├── env.config.ts                  # @nestjs/config yapılandırması
│   └── firebase.config.ts             # Firebase Admin SDK init
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts          # JWT doğrulama
│   │   ├── optional-auth.guard.ts     # İsteğe bağlı auth
│   │   └── permissions.guard.ts       # RBAC kontrolü
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() parameter decorator
│   │   └── permissions.decorator.ts   # @Permissions() method decorator
│   ├── filters/
│   │   └── http-exception.filter.ts   # Global exception handler
│   ├── interceptors/
│   │   └── response-transform.interceptor.ts  # Standart response formatı
│   ├── dto/
│   │   └── pagination.dto.ts          # Sayfalama parametreleri
│   └── interfaces/
│       └── jwt-payload.interface.ts   # JWT payload tipi
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts         # /api/auth/*
    │   ├── auth.service.ts            # İş mantığı
    │   ├── dto/
    │   │   ├── register.dto.ts
    │   │   ├── login.dto.ts
    │   │   └── forgot-password.dto.ts
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts
    │   │   ├── jwt-refresh.strategy.ts
    │   │   ├── google.strategy.ts
    │   │   └── apple.strategy.ts
    │   └── social/
    │       ├── google-auth.service.ts
    │       └── apple-auth.service.ts
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── dto/
    ├── companies/
    ├── projects/
    │   ├── projects.module.ts
    │   ├── projects.controller.ts
    │   ├── projects.service.ts
    │   ├── tasks/
    │   │   ├── tasks.controller.ts
    │   │   ├── tasks.service.ts
    │   │   └── dto/
    │   ├── team/
    │   │   └── team.service.ts
    │   └── dto/
    ├── finance/
    ├── roles/
    └── notifications/
        ├── notifications.module.ts
        ├── notifications.controller.ts
        ├── notifications.service.ts
        ├── notifications.gateway.ts       # Socket.IO
        ├── fcm.service.ts                 # Firebase Cloud Messaging
        └── dto/
```

### API Endpointleri

#### Auth (`/api/auth`)
```
POST   /api/auth/register           → { accessToken, refreshToken, user }
POST   /api/auth/login              → { accessToken, refreshToken, user }
POST   /api/auth/social             → { accessToken, refreshToken, user }  (Google/Apple)
POST   /api/auth/refresh            → { accessToken }
POST   /api/auth/logout             → Token'ı temizle
POST   /api/auth/forgot-password    → E-posta gönder
POST   /api/auth/reset-password     → Şifre sıfırla
GET    /api/auth/me                 → { user, permissions }
```

#### Users (`/api/users`)
```
GET    /api/users                   → Şirket kullanıcı listesi (sayfalı)
GET    /api/users/:id
PATCH  /api/users/:id/status        → Onayla/Reddet
PATCH  /api/users/:id/role          → Rol ata
```

#### Companies (`/api/companies`)
```
GET    /api/companies
POST   /api/companies
GET    /api/companies/:id
PATCH  /api/companies/:id
POST   /api/companies/:id/join-request
PATCH  /api/companies/:id/approve/:userId
```

#### Projects (`/api/projects`)
```
GET    /api/projects                 → Sayfalı, filtreli
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
POST   /api/projects/:id/tasks
PATCH  /api/projects/:id/tasks/:taskId
POST   /api/projects/:id/team
DELETE /api/projects/:id/team/:userId
```

#### Notifications (`/api/notifications`)
```
GET    /api/notifications            → Sayfalı, kullanıcıya ait
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
POST   /api/notifications/device-token
DELETE /api/notifications/device-token
WS     /notifications               → Socket.IO (canlı bildirim)
```

#### Finance (`/api/finance`)
```
GET    /api/finance?projectId=
POST   /api/finance
PATCH  /api/finance/:id
DELETE /api/finance/:id
```

#### Roles (`/api/roles`)
```
GET    /api/roles
POST   /api/roles
PATCH  /api/roles/:id
DELETE /api/roles/:id
GET    /api/roles/:id/permissions
PATCH  /api/roles/:id/permissions
```

### Standart Response Formatı

```typescript
// Başarılı
{
  "statusCode": 200,
  "message": "OK",
  "data": { ... },
  "meta": {                    // sayfalama varsa
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Hata
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "field": "email", "message": "Geçerli bir e-posta adresi giriniz" }
  ]
}
```

---

## 6. Firebase Altyapısı

### Kullanılacak Firebase Servisleri

| Servis | Kullanım Amacı | Backend | Mobile |
|---|---|---|---|
| **FCM** | Push notification | `firebase-admin` (send) | `expo-notifications` (receive) |
| **Auth** | Social login (Google/Apple) | Token doğrulama | Native SDK |
| **Crashlytics** | Hata raporlama | - | `expo-crashlytics` |
| **Analytics** | Kullanıcı davranışı | - | `expo-analytics` |
| **Remote Config** | Feature flag | - | `expo-remote-config` |

### Firebase Entegrasyon Detayı

**Backend (firebase.config.ts):**
```typescript
import * as admin from 'firebase-admin';

export function initializeFirebase(): void {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
}

export { admin };
```

**Mobile (expo-notifications):**
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// Bildirim handler'ları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// FCM token alma
async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getDevicePushTokenAsync();
  return tokenData.data;
}
```

---

## 7. Bildirim Sistemi (Push + In-App)

### Mimari

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBİL UYGULAMA                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  notification.service.ts                  │   │
│  │  ┌──────────────────┐  ┌─────────────────────────────┐  │   │
│  │  │  FCM Token Alma   │  │  Bildirim Dinleyicileri    │  │   │
│  │  │  (expo-notific.)  │  │  - Ön planda (WebSocket)   │  │   │
│  │  │                   │  │  - Arka planda (FCM)       │  │   │
│  │  │                   │  │  - Bildirime tıklama       │  │   │
│  │  └──────────────────┘  └─────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │              notificationStore (Zustand)                   │  │
│  │  notifications[] | unreadCount | addNotification()        │  │
│  │  markAsRead() | markAllAsRead() | loadNotifications()     │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │         WebSocket           │  FCM (Push)
              │         (Socket.IO)         │  (arka plan)
              └──────────────┬──────────────┘
                             │
┌────────────────────────────┴────────────────────────────────────┐
│                        BACKEND                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              notifications.module.ts                      │   │
│  │  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐  │   │
│  │  │ Notifications    │  │ Notification │  │ FCM      │  │   │
│  │  │ Gateway (WS)     │  │ Service (DB) │  │ Service  │  │   │
│  │  └──────────────────┘  └──────────────┘  └──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Bildirim Akışı (Uçtan Uca)

```
1. Kullanıcı login olur
2. Mobil: FCM token alınır (expo-notifications)
3. Mobil: POST /api/notifications/device-token { token, platform }
4. Backend: Token DB'ye kaydedilir (DeviceToken tablosu)
5. Backend: Socket.IO bağlantısı kurulur (/notifications namespace)
6. Bir olay tetiklenir (örn: proje sahibi yeni görev atar)
7. Backend notifications.service.ts:
   a. Bildirimi Notification tablosuna kaydeder
   b. Socket.IO ile bağlı kullanıcıya anlık gönderir
   c. Firebase Admin SDK ile FCM push gönderir (arka plandaki kullanıcılara)
8. Mobil taraf:
   a. Uygulama ön planda: WebSocket olayı → notificationStore güncellenir
   b. Uygulama arka planda: FCM push → bildirim tray'de görünür
   c. Bildirime tıklanınca: ilgili ekrana yönlendirme (deep link)
```

### Bildirim Tipleri

| Tip | Açıklama | Renk |
|---|---|---|
| `info` | Bilgilendirme (yeni üye, güncelleme) | Mavi |
| `success` | Başarılı işlem (onay, tamamlama) | Yeşil |
| `warning` | Uyarı (yaklaşan deadline, limit) | Turuncu |
| `danger` | Kritik (red, silme, hata) | Kırmızı |

### Bildirim Tercihleri (appStore.notificationPrefs)

```
projects: boolean   → Proje bildirimleri (görev ataması, deadline)
finance: boolean    → Finans bildirimleri (ödeme, bütçe)
system: boolean     → Sistem bildirimleri (rol değişikliği, şirket)
```

---

## 8. Frontend Değişiklikleri

### Yeni Dosyalar

```
src/
├── services/
│   ├── api/
│   │   ├── client.ts                    # Axios instance + interceptors
│   │   ├── auth.api.ts                  # Auth API çağrıları
│   │   ├── notifications.api.ts
│   │   ├── projects.api.ts
│   │   ├── users.api.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── auth.service.ts              # Token yönetimi + giriş çıkış
│   │   └── token-storage.ts             # SecureStore ile token saklama
│   ├── notification/
│   │   ├── notification.service.ts      # FCM + notification handler
│   │   └── index.ts
│   └── websocket/
│       ├── socket.service.ts            # Socket.IO client
│       └── index.ts
├── store/
│   ├── authStore.ts                     # GÜNCELLENECEK
│   └── notificationStore.ts             # YENİ
└── hooks/
    ├── useAuth.ts                       # YENİ
    └── useNotifications.ts              # YENİ
```

### Güncellenecek Dosyalar

| Dosya | Değişiklik |
|---|---|
| `package.json` | Yeni bağımlılıklar ekle |
| `app.json` | `plugins`'e expo-notifications, expo-secure-store ekle |
| `.env` | API_URL, Firebase config değişkenleri |
| `app/index.tsx` | Token kontrolü + auto-login |
| `app/_layout.tsx` | Auth guard ekle |
| `src/store/authStore.ts` | Token, user, persist ekle |
| `src/features/auth/screens/LoginScreen.tsx` | Mock → API |
| `src/features/auth/screens/RegisterScreen.tsx` | Mock → API |
| `src/features/notifications/screens/NotificationsScreen.tsx` | Mock → API |

### AuthStore (Güncellenmiş)

```typescript
type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;        // İlk yükleme (token kontrolü)
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  socialLogin: (provider: 'google' | 'apple', idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hydrate: () => Promise<void>; // AsyncStorage/SecureStore'dan token yükle
  clearError: () => void;
};
```

### Auth Guard (Root Layout)

```typescript
// app/_layout.tsx'de auth kontrolü
const { isAuthenticated, isLoading, hydrate } = useAuth();

useEffect(() => {
  hydrate(); // SecureStore'dan token yükle
}, []);

if (isLoading) return <SplashScreen />;

// Auth Stack veya Main Stack göster
// Expo Router'daki (auth) ve (main) grupları conditional render
```

---

## 9. Mimari Şema

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           MOBİL UYGULAMA (Expo)                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Katmanlar                                      │  │
│  │                                                                        │  │
│  │  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │  │
│  │  │  Screens   │  │Navigation│  │Components│  │  Zustand Stores  │   │  │
│  │  │  (app/)    │  │(Expo     │  │(shared/  │  │  (auth, app,     │   │  │
│  │  │            │  │ Router)  │  │  ui/)    │  │   finance, notif) │   │  │
│  │  └────────────┘  └──────────┘  └──────────┘  └──────────────────┘   │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Service Layer (src/services/)                  │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │  │  │
│  │  │  │  api/    │ │  auth/   │ │ notifi-  │ │  websocket/      │  │  │  │
│  │  │  │ (axios)  │ │ (token)  │ │ cation   │ │  (Socket.IO)     │  │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘  │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────────────┘
                              │ HTTPS (REST API) + WebSocket (Socket.IO)
                              │
┌─────────────────────────────┴──────────────────────────────────────────────┐
│                          BACKEND (NestJS)                                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐  │  │
│  │  │ REST API │ │ Auth     │ │ WebSocket│ │  Notification        │  │  │
│  │  │ Modules  │ │ (JWT +   │ │ Gateway  │ │  Module (FCM + WS)   │  │  │
│  │  │          │ │  Social) │ │          │ │                      │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘  │  │
│  │                                                                      │  │
│  │  ┌──────────────┐  ┌──────────┐  ┌────────────────────────────┐  │  │
│  │  │  Guards      │  │Decorators│  │  Interceptors / Filters    │  │  │
│  │  │  (JWT, RBAC) │  │@Current  │  │  (Response transform,     │  │  │
│  │  │              │  │User,     │  │   Exception handling)      │  │  │
│  │  │              │  │@Perm.    │  │                            │  │  │
│  │  └──────────────┘  └──────────┘  └────────────────────────────┘  │  │
│  │                                                                      │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │  Prisma ORM  ──────────────────────────────────► PostgreSQL  │  │  │
│  │  │  Redis       ──────────────────────────────────► Cache/WS    │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Firebase Integration                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │  FCM (Push)  │  │ Auth (Token) │  │  Admin SDK (server)      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Deployment Mimarisi (DigitalOcean)

```
                          ┌─────────────────┐
                          │   GitHub Repo    │
                          │  mimar-platform  │
                          └────────┬────────┘
                                   │ git push
                                   ▼
                          ┌─────────────────┐
                          │  GitHub Actions  │
                          │  CI/CD Pipeline  │
                          │  - Test          │
                          │  - Lint          │
                          │  - Build         │
                          │  - Deploy        │
                          └────────┬────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────────────┐
│                        DIGITALOCEAN                                  │
│                                                                      │
│   ┌─────────────────────┐       ┌─────────────────────────────┐    │
│   │   App Platform      │       │     Managed PostgreSQL      │    │
│   │   veya Droplet      │◄─────►│     Port: 5432              │    │
│   │                     │       │     Otomatik yedekleme      │    │
│   │   NestJS API        │       │     99.95% uptime           │    │
│   │   Port: 3000        │       └─────────────────────────────┘    │
│   │                     │                                          │
│   │   PM2 / Docker      │       ┌─────────────────────────────┐    │
│   │   Nginx/Caddy SSL   │       │     Managed Redis           │    │
│   │   (Let's Encrypt)   │       │     (opsiyonel, Aşama 2)    │    │
│   └──────────┬──────────┘       └─────────────────────────────┘    │
│              │                                                      │
│              ▼                                                      │
│   ┌─────────────────────┐                                          │
│   │   Spaces (S3)       │                                          │
│   │   Dosya yükleme     │                                          │
│   │   (ileriki aşama)   │                                          │
│   └─────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          FIREBASE                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐   │
│  │   FCM    │ │ Firebase │ │Crashlytcs│ │   Remote Config      │   │
│  │(Push)    │ │   Auth   │ │          │ │   (Feature Flag)     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### DigitalOcean Servis Önerisi

| Servis | Seçenek | Maliyet (tahmini) |
|---|---|---|
| **App Platform** | Basic $12/ay (2GB RAM, 1vCPU) veya Pro $24/ay | $12-24/ay |
| **Droplet** | Basic $6/ay (1GB RAM, 1vCPU) + manuel kurulum | $6-12/ay |
| **Managed PostgreSQL** | $15/ay (1GB RAM, 10GB storage) | $15/ay |
| **Managed Redis** | $12/ay (opsiyonel, sonra eklenebilir) | $12/ay |
| **Spaces (S3)** | $5/ay (250GB storage, 1TB transfer) | $5/ay |
| **Toplam** | | **$33-56/ay** |

---

## 11. Mock'tan API'ye Geçiş Sırası

| Sıra | Modül | Süre | Bağımlılık | Açıklama |
|---|---|---|---|---|
| **1** | **Auth** | 1 hafta | Yok | Login, Register, ForgotPassword, Social login, Token refresh, Auto-login |
| 2 | Company & User | 1 hafta | Auth (şirket bağlamı) | Company CRUD, join request, approval, user list, rol atama |
| 3 | Roles & Permissions | 3 gün | Users | Role CRUD, permission assignment, useCan → API |
| 4 | Projects | 1 hafta | Company, Users | Project CRUD, tasks, team, sections |
| 5 | Finance | 3 gün | Projects | Finance kayıtları, raporlar |
| 6 | **Notifications** | 1 hafta | Auth, Projects, Finance | Bildirim listesi, push, WebSocket, preferences |
| 7 | Dashboard & Search | 3 gün | Projects, Finance | Dashboard metrikleri, arama |
| 8 | Settings & Profile | 2 gün | Auth | Profil güncelleme, şifre değiştirme |

### Geçiş Stratejisi

Her modül için:
1. **Önce backend modülü yazılır** (CRUD + iş mantığı)
2. **Frontend API servisi yazılır** (axios endpoint'leri)
3. **Zustand store güncellenir** (mock → API çağrısı)
4. **UI ekranı güncellenir** (mock import → store kullanımı)
5. **Test edilir** (gerçek API ile çalıştığı doğrulanır)

Mock veriler, API hazır olana kadar **fallback** olarak kalabilir:
```typescript
// Örnek: Geçiş stratejisi
export function useUsers() {
  const [users, setUsers] = useState<UserMock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Önce API'yi dene
    usersApi.getUsers()
      .then(setUsers)
      .catch(() => {
        // API yoksa mock'a düş
        setUsers(usersMock);
      })
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}
```

---

## 12. Adım Adım Yol Haritası

### Zaman Çizelgesi

```
Hafta 1:   Hazırlık + Backend Auth
           ├── Monorepo kurulumu (Turborepo + shared package)
           ├── NestJS proje iskeleti
           ├── Prisma şema + migration
           └── Auth modülü (email + JWT + refresh)

Hafta 2:   Social Login + Firebase
           ├── Google Sign-In stratejisi
           ├── Apple Sign-In stratejisi
           ├── Firebase Admin SDK entegrasyonu
           └── Frontend API katmanı (axios, interceptor)

Hafta 3:   Frontend Auth Entegrasyonu
           ├── AuthStore güncelleme (token, persist, user)
           ├── Login/Register ekranları → API
           ├── Social login butonları
           ├── Auto-login + auth guard
           └── Token refresh mekanizması

Hafta 4:   Notification Altyapısı
           ├── Backend Notification modülü
           ├── FCM service (push)
           ├── Socket.IO gateway (canlı)
           ├── Frontend expo-notifications entegrasyonu
           ├── NotificationStore
           └── NotificationService (FCM token + WS)

Hafta 5:   Company + User Modülleri
           ├── Backend CRUD
           ├── Frontend API servisleri
           ├── Mock → API geçişi
           └── Join request + approval flow

Hafta 6:   Roles + Permissions
           ├── Backend CRUD
           ├── Frontend API entegrasyonu
           ├── useCan hook güncellemesi (mock → API)
           └── PermissionGate güncellemesi

Hafta 7:   Projects Modülü
           ├── Backend CRUD (tasks, team, sections)
           ├── Frontend API entegrasyonu
           └── Mock → API geçişi

Hafta 8:   Finance Modülü
           ├── Backend CRUD
           ├── Frontend API entegrasyonu
           └── Mock → API geçişi

Hafta 9:   Dashboard + Settings + Profile
           ├── Dashboard metrikleri API
           ├── Profil güncelleme
           ├── Şifre değiştirme
           └── Kalan ekranların API bağlantısı

Hafta 10:  Deployment + Test
           ├── DigitalOcean App Platform kurulumu
           ├── GitHub Actions CI/CD
           ├── PostgreSQL Managed DB
           ├── SSL (Let's Encrypt)
           ├── Domain yapılandırması
           └── E2E testler
```

### Hazırlık Aşaması (1 gün) — Detaylı

- [x] Monorepo dizin yapısını oluştur
- [x] Root `package.json` (workspaces)
- [x] `turbo.json` yapılandırması
- [x] `tsconfig.base.json`
- [x] `packages/shared` oluştur (paylaşılan tipler, enumlar, permission sabitleri)
- [x] `.gitignore`, `.prettierrc`, `.eslintrc`

### Aşama 1 (2 hafta) — Detaylı

**Backend İskeleti:**
- [x] NestJS projesi oluştur (`apps/backend/`)
- [x] Config modülü (`@nestjs/config`)
- [x] Prisma schema (User, Company, Notification, DeviceToken, Role, Permission)
- [x] Prisma migration
- [x] Docker Compose (PostgreSQL + Redis)
- [x] Common modüller (guards, decorators, filters, interceptors)
- [x] Standart response formatı

**Auth Modülü:**
- [x] Register (email, password, fullName)
- [x] Login (email, password → JWT)
- [x] JWT access token (kısa süreli: 15 dk)
- [x] JWT refresh token (uzun süreli: 7 gün)
- [x] Refresh token endpoint
- [x] Logout endpoint
- [x] Forgot/Reset password
- [x] Get current user (`/auth/me`)
- [x] Google Sign-In stratejisi
- [x] Apple Sign-In stratejisi
- [x] Social login endpoint

**Firebase:**
- [x] Firebase Admin SDK kurulumu
- [x] FCM service (push notification gönderme)
- [x] Firebase Auth token doğrulama (social login için)

---

## Prisma Şeması (Tam)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────────

enum AuthProvider {
  EMAIL
  GOOGLE
  APPLE
}

enum ApprovalStatus {
  pending
  approved
  rejected
  suspended
}

enum CompanyStatus {
  active
  inactive
  pending
}

enum NotificationType {
  info
  success
  warning
  danger
}

// ─── MODELS ──────────────────────────────────────────────

model User {
  id              String         @id @default(cuid())
  email           String         @unique
  passwordHash    String?
  fullName        String
  phone           String?
  avatarUrl       String?
  refreshToken    String?
  fcmToken        String?
  authProvider    AuthProvider   @default(EMAIL)
  socialId        String?
  approvalStatus  ApprovalStatus @default(pending)
  title           String?
  companyId       String?
  company         Company?       @relation(fields: [companyId], references: [id], onDelete: SetNull)
  roles           UserRole[]
  permissions     UserPermission[]
  ownedCompanies  Company[]      @relation("CompanyOwner")
  notifications   Notification[]
  deviceTokens    DeviceToken[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@unique([authProvider, socialId])
  @@index([companyId])
  @@index([email])
}

model Company {
  id                String        @id @default(cuid())
  name              String
  description       String?
  city              String?
  address           String?
  phone             String?
  logoUrl           String?
  logoInitials      String?
  status            CompanyStatus @default(active)
  ownerId           String
  owner             User          @relation("CompanyOwner", fields: [ownerId], references: [id])
  members           User[]
  projects          Project[]
  financeRecords    FinanceRecord[]
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@index([ownerId])
}

model Role {
  id          String       @id @default(cuid())
  name        String
  code        String       @unique
  description String?
  icon        String?
  color       String?
  companyId   String
  company     Company?     @relation(fields: [companyId], references: [id], onDelete: Cascade)
  users       UserRole[]
  permissions RolePermission[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([companyId])
}

model UserRole {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId String
  role   Role   @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
}

model UserPermission {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  permission  String   // PermissionCode string'i
  granted     Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@unique([userId, permission])
  @@index([userId])
}

model RolePermission {
  id         String   @id @default(cuid())
  roleId     String
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission String
  createdAt  DateTime @default(now())

  @@unique([roleId, permission])
  @@index([roleId])
}

model Project {
  id            String         @id @default(cuid())
  name          String
  description   String?
  status        String         @default("active") // active, planned, completed, waiting
  startDate     DateTime?
  endDate       DateTime?
  budget        Float?
  companyId     String
  company       Company        @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdById   String
  createdBy     User           @relation(fields: [createdById], references: [id])
  team          ProjectTeam[]
  tasks         Task[]
  sections      Section[]
  financeRecords FinanceRecord[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([companyId])
  @@index([status])
}

model ProjectTeam {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      String?  // Üyenin projedeki rolü
  joinedAt  DateTime @default(now())

  @@unique([projectId, userId])
  @@index([projectId])
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      String   @default("todo") // todo, in_progress, review, done
  priority    String   @default("medium") // low, medium, high, urgent
  dueDate     DateTime?
  sectionId   String?
  section     Section? @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assigneeId  String?
  assignee    User?    @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([assigneeId])
  @@index([sectionId])
}

model Section {
  id          String   @id @default(cuid())
  name        String
  order       Int      @default(0)
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks       Task[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
}

model FinanceRecord {
  id            String   @id @default(cuid())
  type          String   // income, expense
  amount        Float
  description   String?
  category      String?
  date          DateTime @default(now())
  projectId     String?
  project       Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  companyId     String
  company       Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  createdById   String
  createdBy     User     @relation(fields: [createdById], references: [id])
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([companyId])
  @@index([projectId])
}

model Notification {
  id         String           @id @default(cuid())
  userId     String
  user       User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  title      String
  message    String
  type       NotificationType @default(info)
  targetType String           // project, finance, user, role, company
  targetId   String?
  isRead     Boolean          @default(false)
  createdAt  DateTime         @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

model DeviceToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  platform  String   // ios, android
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```
