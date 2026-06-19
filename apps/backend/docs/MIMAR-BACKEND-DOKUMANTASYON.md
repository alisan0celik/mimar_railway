# Mimar Platform — Backend Dokümantasyonu

> **Versiyon:** 1.0  
> **Stack:** NestJS 11 · Prisma 6 · PostgreSQL · Socket.IO · Firebase (FCM)  
> **Base URL:** `http://localhost:3000/api`

Bu doküman iki ana bölümden oluşur:

1. **Şirket Bazlı Veri İzolasyonu (Multi-Tenant)** — güvenlik mimarisi ve uygulama detayları  
2. **Backend Proje Yapısı** — dizin ağacı, modüller, API uç noktaları ve veritabanı modeli

---

## İçindekiler

- [1. Şirket Bazlı Veri İzolasyonu](#1-şirket-bazlı-veri-i̇zolasyonu)
  - [1.1 Problem ve Hedef](#11-problem-ve-hedef)
  - [1.2 Mimari: Üç Katmanlı Savunma](#12-mimari-üç-katmanlı-savunma)
  - [1.3 Tenant Altyapı Bileşenleri](#13-tenant-altyapı-bileşenleri)
  - [1.4 Global Guard Zinciri](#14-global-guard-zinciri)
  - [1.5 Modül Bazında İzolasyon Matrisi](#15-modül-bazında-i̇zolasyon-matrisi)
  - [1.6 JWT ve companyId Güvenliği](#16-jwt-ve-companyid-güvenliği)
  - [1.7 Varsayılan Kullanıcı İzinleri (Onboarding)](#17-varsayılan-kullanıcı-i̇zinleri-onboarding)
  - [1.8 Public vs Korumalı Veri](#18-public-vs-korumalı-veri)
  - [1.9 Gelecek İyileştirme: PostgreSQL RLS](#19-gelecek-i̇yileştirme-postgresql-rls)
- [2. Backend Proje Yapısı](#2-backend-proje-yapısı)
  - [2.1 Dizin Ağacı](#21-dizin-ağacı)
  - [2.2 Uygulama Giriş Noktası](#22-uygulama-giriş-noktası)
  - [2.3 Ortak Katman (common/)](#23-ortak-katman-common)
  - [2.4 Modül Özeti Tablosu](#24-modül-özeti-tablosu)
- [3. Modül Detayları](#3-modül-detayları)
  - [3.1 Auth Modülü](#31-auth-modülü)
  - [3.2 Companies Modülü](#32-companies-modülü)
  - [3.3 Users Modülü](#33-users-modülü)
  - [3.4 Roles Modülü](#34-roles-modülü)
  - [3.5 Projects Modülü](#35-projects-modülü)
  - [3.6 Finance Modülü](#36-finance-modülü)
  - [3.7 Notifications Modülü](#37-notifications-modülü)
  - [3.8 Calendar Modülü](#38-calendar-modülü)
  - [3.9 Support Modülü](#39-support-modülü)
- [4. Veritabanı Modeli (Prisma)](#4-veritabanı-modeli-prisma)
- [5. İzin (Permission) Sistemi](#5-i̇zin-permission-sistemi)
- [6. Ortam Değişkenleri ve Çalıştırma](#6-ortam-değişkenleri-ve-çalıştırma)

---

# 1. Şirket Bazlı Veri İzolasyonu

## 1.1 Problem ve Hedef

Mimar Platform'da birden fazla mimarlık ofisi (şirket) aynı veritabanını paylaşır. Her şirketin verisi — **projeler, ekip üyeleri, finans kayıtları, roller, takvim olayları** — yalnızca kendi şirketinde görünmelidir; başka şirketler bu verilere erişememelidir.

**Hedef:** Uygulama katmanında merkezi, tutarlı ve zorunlu tenant (kiracı) izolasyonu.

## 1.2 Mimari: Üç Katmanlı Savunma

Her HTTP isteği aşağıdaki sırayla guard'lardan geçer:

```
HTTP Request
    │
    ▼
┌─────────────────┐
│  JwtAuthGuard   │  Kimlik doğrulama (Bearer token)
└────────┬────────┘
         ▼
┌─────────────────┐
│  CompanyGuard   │  Şirket üyeliği & route param eşleşmesi
└────────┬────────┘
         ▼
┌─────────────────┐
│PermissionsGuard │  İşlem bazlı yetki kontrolü
└────────┬────────┘
         ▼
┌─────────────────┐
│   Controller    │
└────────┬────────┘
         ▼
┌─────────────────┐
│CompanyScopeService│  Servis katmanında tenant doğrulaması
└────────┬────────┘
         ▼
    PostgreSQL
```

## 1.3 Tenant Altyapı Bileşenleri

Tüm tenant bileşenleri `src/common/tenant/` altında toplanmıştır.

| Dosya | Açıklama |
|-------|----------|
| `require-company.decorator.ts` | `@RequireCompany()` — endpoint'in aktif şirket üyeliği gerektirmesini işaretler |
| `company-scoped.decorator.ts` | `@CompanyScoped('id')` — route parametresinin kullanıcının `companyId`'si ile eşleşmesini zorlar |
| `company.guard.ts` | Yukarıdaki dekoratörleri okuyup global uygular |
| `company-scope.service.ts` | Servis katmanında ortak tenant doğrulama yardımcıları |
| `index.ts` | Barrel export |

### CompanyScopeService Metodları

```typescript
requireCompanyId(companyId)     // null ise ForbiddenException fırlatır
assertSameCompany(userCo, resCo) // iki companyId eşleşmezse ForbiddenException
findUserInCompany(userId, coId)  // şirkette kullanıcı yoksa NotFoundException
findRoleInCompany(roleId, coId)  // şirkette rol yoksa NotFoundException
findProjectInCompany(projId, coId) // şirkette proje yoksa NotFoundException
```

## 1.4 Global Guard Zinciri

`app.module.ts` içinde üç global guard kayıtlıdır:

```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: CompanyGuard },
{ provide: APP_GUARD, useClass: PermissionsGuard },
```

### Dekoratör Kullanım Örnekleri

```typescript
// Tüm controller şirket üyeliği gerektirir
@RequireCompany()
@Controller('projects')
export class ProjectsController { ... }

// Sadece belirli endpoint — route :id kullanıcının şirketi olmalı
@Patch(':id')
@CompanyScoped('id')
@Permissions('company.update')
async update(@Param('id') id: string) { ... }

// Herkese açık endpoint (guard'lar atlanır)
@Public()
@Post('login')
async login() { ... }
```

## 1.5 Modül Bazında İzolasyon Matrisi

| Modül | `@RequireCompany` | `@CompanyScoped` | Servis Filtresi | Permission Guard |
|-------|:-----------------:|:----------------:|:---------------:|:----------------:|
| **Projects** | Controller seviyesi | — | `where: { companyId }` | ✅ |
| **Finance** | Controller seviyesi | — | `where: { companyId }` | ✅ |
| **Users** | Endpoint seviyesi | — | `where: { companyId }` | ✅ |
| **Roles** | Controller seviyesi | — | `where: { companyId }` | ✅ |
| **Companies** | Kısmi | Yönetim endpoint'leri | Servis + guard | ✅ |
| **Calendar** | Controller seviyesi | — | `companyId` filtresi | — |
| **Support** | Ticket oluşturma | — | `userId` filtresi | — |
| **Notifications** | — | — | `userId` filtresi | Kısmi |
| **Auth** | — | — | — | `@Public()` |

### Kapatılan Güvenlik Açıkları

| Önceki Durum | Sonraki Durum |
|--------------|---------------|
| `GET /users/:id` → herhangi bir kullanıcı okunabiliyordu | Sadece aynı şirketteki kullanıcı |
| `PATCH /users/:id/status` → başka şirkette onay/red | Sadece kendi şirketi |
| `GET /roles/:id` → başka şirketin rolü ve üyeleri | Sadece kendi şirketi |
| `PATCH /companies/:id` → herhangi bir şirket düzenlenebiliyordu | `@CompanyScoped('id')` zorunlu |
| `GET /companies/:id/join-requests` → başka şirketin talepleri | `@CompanyScoped('id')` zorunlu |
| Proje ekibine başka şirketten kullanıcı eklenebiliyordu | `findUserInCompany` doğrulaması |
| `@Permissions` dekoratörü birçok modülde çalışmıyordu | Global `PermissionsGuard` |

## 1.6 JWT ve companyId Güvenliği

**Önceki davranış:** JWT payload'ındaki `companyId` doğrudan kullanılıyordu — kullanıcı şirket değiştirdiğinde eski token geçerli kalabiliyordu.

**Güncel davranış:** `JwtStrategy.validate()` her istekte veritabanından güncel kullanıcıyı okur:

```typescript
// jwt.strategy.ts
return {
  sub: user.id,
  email: user.email,
  companyId: user.companyId, // DB'den — token'dan değil
};
```

## 1.7 Varsayılan Kullanıcı İzinleri (Onboarding)

Şirketi olmayan yeni kayıtlı kullanıcılar şirket oluşturma / katılma akışını kullanabilmeli. Bu nedenle kayıt ve sosyal giriş sırasında otomatik izinler verilir:

```typescript
const DEFAULT_USER_PERMISSIONS = ["company.join", "notification.view"];
```

## 1.8 Public vs Korumalı Veri

### Herkese Açık (Authenticated)

| Endpoint | Dönen Veri |
|----------|------------|
| `GET /companies` | Şirket dizini: ad, şehir, açıklama, logo, durum, **üye sayısı** |
| `GET /companies/:id` | Şirket profili: ad, adres, telefon, logo (sahip e-postası ve proje sayısı **dönülmez**) |

### Tamamen Korumalı (Şirket Scoped)

- Projeler ve alt kaynakları (not, mesaj, görev, dosya, ekip)
- Finans kayıtları ve özetleri
- Şirket kullanıcı listesi ve detayları
- Roller ve rol atamaları
- Katılım talepleri (sadece kendi şirketi)
- Takvim olayları

## 1.9 Gelecek İyileştirme: PostgreSQL RLS

Uygulama katmanındaki izolasyon güçlüdür; ancak en üst seviye güvenlik için **Row Level Security (RLS)** eklenebilir. RLS, uygulama kodunda bir filtre unutulsa bile veritabanının sızıntıyı engellemesini sağlar.

Önerilen yaklaşım:
1. Her tenant-scoped tabloya RLS policy ekle
2. Her DB connection'da `SET app.current_company_id = '...'` session variable set et
3. Policy: `companyId = current_setting('app.current_company_id')`

---

# 2. Backend Proje Yapısı

## 2.1 Dizin Ağacı

```
apps/backend/
├── docs/
│   └── MIMAR-BACKEND-DOKUMANTASYON.md    ← Bu dosya
├── prisma/
│   ├── schema.prisma                      ← Veritabanı şeması
│   ├── seed.ts                            ← Demo veri (admin@mimar.com / 123456)
│   └── migrations/                        ← Prisma migration dosyaları
├── src/
│   ├── main.ts                            ← Bootstrap (CORS, ValidationPipe, prefix)
│   ├── app.module.ts                      ← Root modül + global guard'lar
│   ├── config/
│   │   └── firebase.config.ts             ← Firebase Admin SDK yapılandırması
│   ├── common/
│   │   ├── common.module.ts               ← @Global() — PrismaService + CompanyScopeService
│   │   ├── prisma.service.ts              ← Prisma Client wrapper
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts  ← @CurrentUser() — JWT payload enjeksiyonu
│   │   │   ├── public.decorator.ts        ← @Public() — auth bypass
│   │   │   └── permissions.decorator.ts   ← @Permissions('perm.code')
│   │   ├── dto/
│   │   │   └── pagination.dto.ts          ← page, limit query parametreleri
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts   ← Global hata formatı
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts          ← JWT + @Public() desteği
│   │   │   └── permissions.guard.ts       ← İzin kontrolü
│   │   ├── interceptors/
│   │   │   └── response-transform.interceptor.ts
│   │   ├── interfaces/
│   │   │   └── jwt-payload.interface.ts   ← { sub, email, companyId }
│   │   └── tenant/                        ← Multi-tenant izolasyon katmanı
│   │       ├── company.guard.ts
│   │       ├── company-scope.service.ts
│   │       ├── company-scoped.decorator.ts
│   │       ├── require-company.decorator.ts
│   │       └── index.ts
│   ├── types/
│   │   └── passport-apple.d.ts            ← Apple OAuth tip tanımları
│   └── modules/
│       ├── auth/                          ← Kimlik doğrulama
│       ├── companies/                     ← Şirket yönetimi
│       ├── users/                         ← Kullanıcı yönetimi
│       ├── roles/                         ← Rol & izin yönetimi
│       ├── projects/                      ← Proje yönetimi (ana modül)
│       ├── finance/                       ← Finans yönetimi
│       ├── notifications/                 ← Bildirimler + WebSocket + FCM
│       ├── calendar/                      ← Takvim olayları
│       └── support/                       ← Destek talepleri
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Modül İç Yapısı (Standart Pattern)

Her feature modülü aşağıdaki yapıyı izler:

```
modules/<feature>/
├── <feature>.module.ts       ← NestJS modül tanımı
├── <feature>.controller.ts   ← HTTP route'ları
├── <feature>.service.ts      ← İş mantığı + Prisma sorguları
└── dto/
    ├── create-*.dto.ts         ← Oluşturma validasyonu (class-validator)
    └── update-*.dto.ts         ← Güncelleme validasyonu
```

Auth modülü ek olarak `strategies/`, `social/` alt dizinlerine sahiptir.

## 2.2 Uygulama Giriş Noktası

**`main.ts`** uygulamayı ayağa kaldırır:

| Ayar | Değer |
|------|-------|
| Global prefix | `/api` |
| CORS | `*` (tüm origin'ler) |
| ValidationPipe | `whitelist`, `forbidNonWhitelisted`, `transform` |
| Exception filter | `HttpExceptionFilter` (tutarlı hata JSON'u) |
| Varsayılan port | `3000` |

## 2.3 Ortak Katman (common/)

### CommonModule (`@Global()`)

Tüm modüllerde enjekte edilebilir paylaşımlı servisler:

- `PrismaService` — PostgreSQL erişimi
- `CompanyScopeService` — Tenant doğrulama yardımcıları

### Dekoratörler

| Dekoratör | Kullanım |
|-----------|----------|
| `@Public()` | Guard'ları atla (login, register vb.) |
| `@CurrentUser()` | Request'ten JWT payload al |
| `@Permissions('x.y')` | Gerekli izinleri belirt |
| `@RequireCompany()` | Aktif şirket üyeliği zorunlu |
| `@CompanyScoped('id')` | Route param = user.companyId |

## 2.4 Modül Özeti Tablosu

| Modül | Route Prefix | Bağımlılıklar | Gerçek Zamanlı |
|-------|-------------|---------------|:--------------:|
| Auth | `/auth` | JWT, Passport, bcrypt, Google/Apple OAuth | — |
| Companies | `/companies` | AuthService (token yenileme) | — |
| Users | `/users` | CompanyScopeService | — |
| Roles | `/roles` | CompanyScopeService | — |
| Projects | `/projects` | CompanyScopeService | — |
| Finance | `/finance` | CompanyScopeService | — |
| Notifications | `/notifications` | Firebase FCM, Socket.IO | ✅ WebSocket |
| Calendar | `/calendar` | — | — |
| Support | `/support` | CompanyScopeService | — |

---

# 3. Modül Detayları

## 3.1 Auth Modülü

**Konum:** `src/modules/auth/`  
**Route prefix:** `/api/auth`  
**Amaç:** Kullanıcı kaydı, giriş, token yönetimi, sosyal giriş ve profil.

### Dosyalar

| Dosya | Görev |
|-------|-------|
| `auth.controller.ts` | HTTP endpoint'leri |
| `auth.service.ts` | İş mantığı, token üretimi, kullanıcı haritalama |
| `strategies/jwt.strategy.ts` | Access token doğrulama (DB'den companyId) |
| `strategies/jwt-refresh.strategy.ts` | Refresh token stratejisi |
| `strategies/google.strategy.ts` | Google OAuth Passport stratejisi |
| `strategies/apple.strategy.ts` | Apple Sign-In Passport stratejisi |
| `social/google-auth.service.ts` | Google ID token doğrulama |
| `social/apple-auth.service.ts` | Apple ID token doğrulama |

### API Endpoint'leri

| Method | Path | Auth | Açıklama |
|--------|------|:----:|----------|
| POST | `/auth/register` | Public | E-posta ile kayıt |
| POST | `/auth/login` | Public | E-posta/şifre girişi |
| POST | `/auth/social` | Public | Google / Apple sosyal giriş |
| POST | `/auth/refresh` | Public | Access token yenileme |
| POST | `/auth/forgot-password` | Public | Şifre sıfırlama talebi |
| POST | `/auth/reset-password` | Public | Şifre sıfırlama |
| POST | `/auth/logout` | JWT | Refresh token silme |
| GET | `/auth/me` | JWT | Oturum açmış kullanıcı profili |

### Token Yapısı

```json
{
  "sub": "cuid-user-id",
  "email": "user@example.com",
  "companyId": "cuid-company-id | null"
}
```

- **Access token süresi:** `JWT_ACCESS_EXPIRATION` (varsayılan `15m`)
- **Refresh token süresi:** `7d`

### Kayıt Akışı

1. E-posta benzersizlik kontrolü
2. Şifre bcrypt hash
3. Kullanıcı oluştur (`approvalStatus: approved`)
4. Varsayılan izinler: `company.join`, `notification.view`
5. JWT çifti üret ve döndür

---

## 3.2 Companies Modülü

**Konum:** `src/modules/companies/`  
**Route prefix:** `/api/companies`  
**Amaç:** Şirket CRUD, katılım talepleri, üye onay/red.

### İş Kuralları

- Bir kullanıcı **aynı anda yalnızca bir şirkete** üye olabilir
- Şirket oluşturulduğunda otomatik 3 rol yaratılır:
  - **Sahip** — tüm izinler
  - **Ofis Yöneticisi** — tüm izinler
  - **Ofis Çalışanı** — finans ve kullanıcı yönetimi hariç
- Şirket oluşturma sonrası **fresh token** döndürülür (`companyId` güncellenmiş)

### API Endpoint'leri

| Method | Path | Guard | Permission | Açıklama |
|--------|------|-------|------------|----------|
| GET | `/companies` | JWT | — | Şirket dizini (public alanlar) |
| GET | `/companies/:id` | JWT | — | Şirket detayı (public alanlar) |
| POST | `/companies` | JWT | `company.join` | Yeni şirket oluştur |
| PATCH | `/companies/:id` | JWT + `@CompanyScoped` | `company.update` | Şirket güncelle |
| POST | `/companies/:id/join-request` | JWT | `company.join` | Katılım talebi gönder |
| GET | `/companies/:id/join-requests` | JWT + `@CompanyScoped` | `user.view` | Bekleyen talepler |
| PATCH | `/companies/:id/approve/:userId` | JWT + `@CompanyScoped` | `user.approve` | Üye onayla |
| PATCH | `/companies/:id/reject/:userId` | JWT + `@CompanyScoped` | `user.reject` | Üye reddet |

### DTO'lar

**CreateCompanyDto:** `name` (zorunlu), `description`, `city`, `address`, `phone`  
**UpdateCompanyDto:** CreateCompanyDto alanlarının tümü opsiyonel  
**JoinRequestDto:** `message` (opsiyonel)

---

## 3.3 Users Modülü

**Konum:** `src/modules/users/`  
**Route prefix:** `/api/users`  
**Amaç:** Şirket içi kullanıcı listeleme, profil güncelleme, onay/red, rol atama.

### Tenant İzolasyonu

- `findByCompany` → `where: { companyId }`
- `findById` → `where: { id, companyId }`
- `updateStatus` → hedef kullanıcı aynı şirkette olmalı
- `assignRole` → hem kullanıcı hem rol aynı şirkette olmalı

### API Endpoint'leri

| Method | Path | Guard | Permission | Açıklama |
|--------|------|-------|------------|----------|
| GET | `/users` | `@RequireCompany` | `user.view` | Şirket kullanıcı listesi (sayfalı) |
| GET | `/users/:id` | `@RequireCompany` | `user.view` | Kullanıcı detayı |
| PATCH | `/users/profile` | JWT | — | Kendi profilini güncelle |
| PATCH | `/users/notification-preferences` | JWT | — | Bildirim tercihleri |
| PATCH | `/users/:id/status` | `@RequireCompany` | `user.approve/reject` | Onay durumu güncelle |
| PATCH | `/users/:id/role` | `@RequireCompany` | `user.role.assign` | Kullanıcıya rol ekle |
| GET | `/users/team` | `@RequireCompany` | `user.role.assign` | Onaylı ofis üyelerini listele |
| PUT | `/users/:id/role` | `@RequireCompany` | `user.role.assign` | Kullanıcı rolünü değiştir (tek rol) |
| DELETE | `/users/:id/membership` | `@RequireCompany` | `user.remove` | Kullanıcıyı ofisten çıkar |

Query parametreleri (`GET /users`): `page`, `limit`, `status` (virgülle ayrılmış: `pending,approved`)

### Ekip yönetimi kuralları

- `GET /users/team`: yalnızca `approvalStatus: approved` üyeler
- `PUT /users/:id/role`: mevcut roller silinir, yeni rol atanır; ofis sahibi rolü başkasına verilemez
- `DELETE /users/:id/membership`: `companyId: null`, `approvalStatus: suspended`, roller/izinler ve proje ekip kayıtları temizlenir, oturum sonlandırılır
- Ofis sahibi çıkarılamaz; yönetici yalnızca sahip tarafından çıkarılabilir

**Not:** Mevcut veritabanındaki Ofis Sahibi / Ofis Yöneticisi rollerine `user.remove` iznini `RolePermission` ve ilgili `UserPermission` kayıtlarına manuel eklemeniz gerekebilir (yeni seed şirketlerinde otomatik).

---

## 3.4 Roles Modülü

**Konum:** `src/modules/roles/`  
**Route prefix:** `/api/roles`  
**Amaç:** Şirket bazlı rol tanımlama, izin atama, kullanıcı-rol eşleştirme.

### Tenant İzolasyonu

- Controller seviyesinde `@RequireCompany()`
- Tüm CRUD işlemleri `where: { companyId }` ile filtrelenir
- Rol kodu (`code`) benzersizlik kontrolü şirket bazlıdır

### API Endpoint'leri

| Method | Path | Permission | Açıklama |
|--------|------|------------|----------|
| GET | `/roles` | — | Şirket rolleri listesi |
| GET | `/roles/:id` | — | Rol detayı + atanmış kullanıcılar |
| POST | `/roles` | `role.create` | Yeni rol oluştur |
| PATCH | `/roles/:id` | `role.update` | Rol güncelle |
| DELETE | `/roles/:id` | `role.update` | Rol sil |
| POST | `/roles/:roleId/assign/:userId` | `user.role.assign` | Kullanıcıya rol ata |
| DELETE | `/roles/:roleId/assign/:userId` | `user.role.assign` | Rol atamasını kaldır |

### DTO'lar

**CreateRoleDto:** `name`, `code`, `description`, `icon`, `color`, `permissions[]`  
**UpdateRoleDto:** Tüm alanlar opsiyonel

---

## 3.5 Projects Modülü

**Konum:** `src/modules/projects/`  
**Route prefix:** `/api/projects`  
**Amaç:** Mimari proje yönetimi — proje CRUD, disiplin bölümleri, notlar, mesajlar, görevler, dosyalar, ekip.

### Proje Yaşam Döngüsü

```
planning → active → waiting → completed
```

### Varsayılan Disiplin Bölümleri (Section)

Proje oluşturulduğunda otomatik 6 bölüm yaratılır:

| Sıra | Tip | Etiket |
|:----:|-----|--------|
| 1 | architecture | Mimari |
| 2 | static | Statik |
| 3 | mechanical | Mekanik |
| 4 | electrical | Elektrik |
| 5 | map | Harita |
| 6 | geology | Jeoloji |

Her bölüm başlangıç durumu: `not-started`, içerik: `"Bekliyor"`.

### Tenant İzolasyonu

- Controller: `@RequireCompany()`
- Her servis metodu `companyId` parametresi alır
- `findOne(companyId, id)` → `where: { id, companyId }` — tüm alt kaynak işlemleri önce bunu çağırır
- `addTeamMember` → eklenen kullanıcı aynı şirkette olmalı

### API Endpoint'leri

#### Proje CRUD

| Method | Path | Permission |
|--------|------|------------|
| POST | `/projects` | `project.create` |
| GET | `/projects` | `project.view` |
| GET | `/projects/:id` | `project.view` |
| PATCH | `/projects/:id` | `project.update` |
| DELETE | `/projects/:id` | `project.update` |
| PATCH | `/projects/:id/sections/:sectionId` | `project.update` |

#### Notlar

| Method | Path | Permission |
|--------|------|------------|
| GET | `/projects/:id/notes` | `project.view` |
| POST | `/projects/:id/notes` | `project.update` |
| DELETE | `/projects/:id/notes/:noteId` | `project.update` |

#### Mesajlar

| Method | Path | Permission |
|--------|------|------------|
| GET | `/projects/:id/messages` | `project.view` |
| POST | `/projects/:id/messages` | `project.update` |
| DELETE | `/projects/:id/messages/:messageId` | `project.update` |

#### Görevler (Tasks)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/projects/:id/tasks` | `project.view` |
| POST | `/projects/:id/tasks` | `project.update` |
| PATCH | `/projects/:id/tasks/:taskId` | `project.update` |
| DELETE | `/projects/:id/tasks/:taskId` | `project.update` |

#### Dosyalar

| Method | Path | Permission |
|--------|------|------------|
| GET | `/projects/:id/files` | `project.view` |
| POST | `/projects/:id/files` | `project.update` |
| DELETE | `/projects/:id/files/:fileId` | `project.update` |

#### Ekip

| Method | Path | Permission |
|--------|------|------------|
| GET | `/projects/:id/team` | `project.view` |
| POST | `/projects/:id/team` | `project.update` |
| DELETE | `/projects/:id/team/:teamId` | `project.update` |

### DTO'lar

**CreateProjectDto:**

| Alan | Tip | Zorunlu |
|------|-----|:-------:|
| name | string | ✅ |
| customerName | string | — |
| projectType | string | — |
| location | string | — |
| description | string | — |
| status | planning \| active \| waiting \| completed | — |
| priority | low \| medium \| high \| urgent | — |
| imageUrl | string | — |
| startDate | ISO date | — |
| endDate | ISO date | — |
| budget | number | — |

---

## 3.6 Finance Modülü

**Konum:** `src/modules/finance/`  
**Route prefix:** `/api/finance`  
**Amaç:** Şirket ve proje bazlı finans kayıtları, bütçe yönetimi, finansal özetler.

### Kayıt Tipleri

| Tip | Açıklama |
|-----|----------|
| `collection` | Tahsilat / gelir |
| `consultant-payment` | Danışman ödemesi |
| `expense` | Gider |

### Finansal Özet Hesaplama (`getSummaries`)

Her proje için:

```
agreedAmount    = project.budget
receivedAmount  = Σ collection kayıtları
expenses        = Σ consultant-payment + expense kayıtları
profitAmount    = receivedAmount - expenses
remainingAmount = max(0, agreedAmount - receivedAmount)
```

### Tenant İzolasyonu

- Controller: `@RequireCompany()`
- Tüm sorgular `where: { companyId }`
- Proje bağlantılı kayıtlar ek olarak `findProjectInCompany` ile doğrulanır

### API Endpoint'leri

| Method | Path | Permission | Açıklama |
|--------|------|------------|----------|
| POST | `/finance` | `finance.payment.create` | Yeni finans kaydı |
| GET | `/finance` | `finance.view` | Tüm kayıtlar |
| GET | `/finance/summary` | `finance.view` | Proje bazlı özetler |
| GET | `/finance/project/:projectId` | `finance.view` | Proje kayıtları |
| PATCH | `/finance/project/:projectId/budget` | `finance.update` | Proje bütçesi güncelle |
| PATCH | `/finance/:id` | `finance.update` | Kayıt güncelle |
| DELETE | `/finance/:id` | `finance.update` | Kayıt sil |

### DTO'lar

**CreateFinanceRecordDto:** `type`, `amount`, `description?`, `category?`, `paidBy?`, `projectId?`, `date?`  
**UpdateFinanceRecordDto:** CreateFinanceRecordDto alanlarının tümü opsiyonel

---

## 3.7 Notifications Modülü

**Konum:** `src/modules/notifications/`  
**Route prefix:** `/api/notifications`  
**Amaç:** Uygulama içi bildirimler, push notification (FCM), gerçek zamanlı WebSocket.

### Bileşenler

| Dosya | Görev |
|-------|-------|
| `notifications.controller.ts` | REST API |
| `notifications.gateway.ts` | Socket.IO WebSocket gateway |
| `fcm.service.ts` | Firebase Cloud Messaging push |

### WebSocket

- **Namespace:** `/notifications`
- **Bağlantı:** `?userId=<id>` query parametresi ile
- **Event'ler:**
  - `notification` — yeni bildirim
  - `unread_count` — okunmamış sayısı güncelleme
  - `mark_read` — istemciden okundu işareti

### Tenant İzolasyonu

- Bildirimler kullanıcı bazlıdır (`where: { userId }`)
- Her kullanıcı yalnızca kendi bildirimlerini görür

### API Endpoint'leri

| Method | Path | Permission | Açıklama |
|--------|------|------------|----------|
| GET | `/notifications` | `notification.view` | Bildirim listesi (sayfalı) |
| PATCH | `/notifications/:id/read` | — | Tek bildirimi okundu işaretle |
| PATCH | `/notifications/read-all` | — | Tümünü okundu işaretle |
| POST | `/notifications/device-token` | — | FCM cihaz token kaydet |
| DELETE | `/notifications/device-token` | — | FCM cihaz token sil |

---

## 3.8 Calendar Modülü

**Konum:** `src/modules/calendar/`  
**Route prefix:** `/api/calendar`  
**Amaç:** Kullanıcı takvim olayları (deadline, toplantı vb.).

### Tenant İzolasyonu

- Controller: `@RequireCompany()`
- Sorgu: `where: { userId, companyId }`

### API Endpoint'leri

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/calendar?year=2026&month=5` | Aylık olay listesi |

Olay tipleri: `deadline`, `meeting`, `other`

---

## 3.9 Support Modülü

**Konum:** `src/modules/support/`  
**Route prefix:** `/api/support`  
**Amaç:** Platform destek talepleri (thread, kategori, agent inbox).

### Tenant İzolasyonu

- Kullanıcı ticket listesi/detayı: `where: { userId }`
- Ticket oluşturma: `@RequireCompany()` — onaylı şirket üyeliği zorunlu
- Tüm endpoint'ler: `@RequireApproved()`
- Agent inbox: `support.manage` izni (ofis rollerine dahil değil; platform destek hesaplarına manuel atanır)

### Veri modeli

- **SupportTicket:** `subject`, `category`, `priority`, `status`, `lastMessageAt`
- **SupportTicketMessage:** thread mesajları (`isStaffReply` ile platform/kullanıcı ayrımı)

### Kullanıcı API

| Method | Path | Guard | Açıklama |
|--------|------|-------|----------|
| GET | `/support` | JWT + approved | Kullanıcının talepleri |
| POST | `/support` | `@RequireCompany` | Yeni talep (`subject`, `category`, `message`) |
| GET | `/support/:id` | JWT + approved | Talep detayı + mesaj thread |
| POST | `/support/:id/messages` | JWT + approved | Kullanıcı takip mesajı |

### Platform agent API

| Method | Path | Guard | Açıklama |
|--------|------|-------|----------|
| GET | `/support/inbox` | `support.manage` | Tüm talepler (filtre: status, category) |
| GET | `/support/inbox/:id` | `support.manage` | Talep detayı |
| PATCH | `/support/inbox/:id/status` | `support.manage` | Durum güncelle |
| POST | `/support/inbox/:id/reply` | `support.manage` | Staff yanıtı |

Ticket durumları: `open`, `in_progress`, `waiting_user`, `resolved`, `closed`  
Kategoriler: `technical`, `account`, `billing`, `feature_request`, `other`

Staff yanıtı ve durum değişikliğinde kullanıcıya `support_ticket` push + uygulama içi bildirim gider.

---

# 4. Veritabanı Modeli (Prisma)

## Entity-Relationship Özeti

```
Company ──┬── User (members)
          ├── Role
          ├── Project ──┬── Section
          │             ├── Task
          │             ├── ProjectNote
          │             ├── ProjectMessage
          │             ├── ProjectFile
          │             ├── ProjectTeam
          │             └── FinanceRecord
          ├── FinanceRecord
          ├── CalendarEvent
          └── SupportTicket

User ──┬── UserRole ── Role ── RolePermission
       ├── UserPermission
       ├── Notification
       ├── DeviceToken
       └── (diğer ilişkiler)
```

## Tenant-Scoped Tablolar

Aşağıdaki tablolarda `companyId` foreign key ile şirket izolasyonu sağlanır:

| Tablo | companyId | Cascade Delete |
|-------|:---------:|:--------------:|
| User | ✅ (nullable) | SetNull |
| Role | ✅ | Cascade |
| Project | ✅ | Cascade |
| FinanceRecord | ✅ | Cascade |
| CalendarEvent | ✅ | Cascade |
| SupportTicket | ✅ | Cascade |

Proje alt kaynakları (Task, Section, ProjectNote, vb.) dolaylı olarak Project üzerinden tenant-scoped'dur.

## Enum'lar

| Enum | Değerler |
|------|----------|
| AuthProvider | EMAIL, GOOGLE, APPLE |
| ApprovalStatus | pending, approved, rejected, suspended |
| CompanyStatus | active, inactive, pending |
| NotificationType | info, success, warning, danger |

---

# 5. İzin (Permission) Sistemi

## Tüm İzin Kodları

| İzin | Açıklama |
|------|----------|
| `project.view` | Proje görüntüleme |
| `project.create` | Proje oluşturma |
| `project.update` | Proje güncelleme |
| `project.complete` | Proje tamamlama |
| `project.restore` | Proje geri yükleme |
| `finance.view` | Finans görüntüleme |
| `finance.update` | Finans güncelleme |
| `finance.payment.create` | Ödeme/tahsilat kaydı |
| `user.view` | Kullanıcı listeleme |
| `user.approve` | Kullanıcı onaylama |
| `user.reject` | Kullanıcı reddetme |
| `user.role.assign` | Rol atama / güncelleme |
| `user.remove` | Onaylı üyeyi ofisten çıkarma |
| `role.view` | Rol görüntüleme |
| `role.create` | Rol oluşturma |
| `role.update` | Rol güncelleme |
| `notification.view` | Bildirim görüntüleme |
| `completed-project.view` | Tamamlanan proje görüntüleme |
| `completed-project.restore` | Tamamlanan proje geri yükleme |
| `company.join` | Şirket oluşturma / katılma |
| `company.update` | Şirket bilgisi güncelleme |

## Varsayılan Roller (Şirket Oluşturulduğunda)

| Rol | Finans | Kullanıcı Yönetimi | Rol Yönetimi |
|-----|:------:|:------------------:|:------------:|
| Sahip | ✅ | ✅ | ✅ |
| Ofis Yöneticisi | ✅ | ✅ | ✅ |
| Ofis Çalışanı | ❌ | ❌ (görüntüleme hariç) | ❌ |

## İzin Kaynağı

Kullanıcının efektif izinleri iki kaynaktan gelir:

1. **UserPermission** — doğrudan kullanıcıya atanmış izinler
2. **RolePermission** — kullanıcının rolleri üzerinden miras alınan izinler

`PermissionsGuard` yalnızca `UserPermission` tablosunu kontrol eder. Rol izinleri, rol atama sırasında `UserPermission`'a kopyalanır.

---

# 6. Ortam Değişkenleri ve Çalıştırma

## Ortam Değişkenleri

`.env.example` dosyasından kopyalayın:

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Değişken | Açıklama | Varsayılan |
|----------|----------|------------|
| `PORT` | Sunucu portu | `3000` |
| `DATABASE_URL` | PostgreSQL bağlantı URL'i | — |
| `JWT_ACCESS_SECRET` | Access token secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `JWT_ACCESS_EXPIRATION` | Access token süresi | `15m` |
| `FIREBASE_PROJECT_ID` | Firebase proje ID | — |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | — |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | — |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | — |
| `APPLE_CLIENT_ID` | Apple Sign-In client ID | — |

## Komutlar

```bash
# Bağımlılıklar
npm install

# Prisma client üret
npm run prisma:generate --workspace=@mimar/backend

# Migration uygula
npm run prisma:migrate --workspace=@mimar/backend

# Demo veri (admin@mimar.com / 123456)
npm run prisma:seed --workspace=@mimar/backend

# Geliştirme sunucusu
npm run start:dev --workspace=@mimar/backend

# TypeScript kontrol
npm run typecheck --workspace=@mimar/backend

# Production build
npm run build --workspace=@mimar/backend
```

## Demo Hesap (Seed)

| Alan | Değer |
|------|-------|
| E-posta | `admin@mimar.com` |
| Şifre | `123456` |
| Şirket | Mimar Yapı Teknoloji |
| Rol | Ofis Sahibi (tüm izinler) |

---

# 7. Sync API (Çevrimdışı Senkronizasyon)

Mobil uygulamanın offline cache ve outbox kuyruğu için kullanılır. PostgreSQL kaynak doğruluk olarak kalır; Firebase yalnızca FCM ile `sync_required` sinyali gönderir.

## Endpoint'ler

| Method | Route | Açıklama |
|--------|-------|----------|
| GET | `/api/sync/pull?since=ISO8601` | Delta sync — değişen projeler, görevler, notlar, mesajlar |
| POST | `/api/sync/push` | Offline kuyruktaki mutation batch'ini uygula |

## Push Mutation Formatı

```json
{
  "mutations": [
    {
      "mutationId": "uuid-v4",
      "entity": "note",
      "action": "create",
      "projectId": "project-id",
      "entityId": "temp_note_xxx",
      "payload": { "content": "Not metni" },
      "clientCreatedAt": "2026-06-12T10:00:00.000Z"
    }
  ]
}
```

## Idempotency

`SyncMutation` tablosu `mutationId` ile tekrar eden push isteklerini engeller. Aynı `mutationId` ile gelen istek `duplicate` status döner.

## FCM Sync Tetikleyici

Push işlemi tamamlandığında şirketteki diğer kullanıcılara FCM data mesajı gönderilir:

```json
{
  "type": "sync_required",
  "entity": "projects",
  "companyId": "company-id"
}
```

Mobil uygulama bu sinyali alınca `SyncEngine.pull()` çalıştırır.

## Migration

```bash
npm run prisma:migrate -w apps/backend
```

`SyncMutation` modeli için migration: `20260612120000_add_sync_mutation`

---

> **Son güncelleme:** Sync API, offline push/pull ve FCM sync tetikleyici eklendi.
