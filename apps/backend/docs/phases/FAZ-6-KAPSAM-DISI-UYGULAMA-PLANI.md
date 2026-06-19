# Faz 6 — Kapsam Dışı Maddeler Uygulama Planı

> **Durum:** Planlama (henüz uygulanmadı)  
> **Tarih:** 2026-06-11  
> **Bağımlılık:** Faz 1–5 tamamlandı

Bu doküman, Faz 5’te bilinçli olarak ertelenen beş konunun uygulama planını tanımlar:

1. PostgreSQL Row Level Security (RLS)
2. `@nestjs/throttler` (global rate limiting)
3. Davet kodu backend endpoint’i
4. Şirket geneli belge modülü
5. E-posta gönderimi

---

## Özet ve Öncelik Matrisi

| # | Konu | Öncelik | Efor | Bağımlılık |
|---|------|:-------:|:----:|------------|
| 5 | E-posta gönderimi | **P0** | M | Yok (temel altyapı) |
| 2 | `@nestjs/throttler` | **P1** | S | Yok |
| 3 | Davet kodu | **P1** | M | E-posta (opsiyonel bildirim) |
| 4 | Belge modülü | **P2** | L | Object storage (S3/R2) |
| 1 | PostgreSQL RLS | **P2** | L | Tüm tenant sorguları stabilize |

**Önerilen sıra:** E-posta → Throttler → Davet kodu → Belgeler → RLS

```mermaid
flowchart LR
  A[E-posta Altyapısı] --> B[Şifre Sıfırlama Prod]
  A --> C[Davet Kodu Bildirimi]
  D[Throttler] --> E[Prod Rate Limit]
  F[Belge Modülü] --> G[DocumentsScreen API]
  H[PostgreSQL RLS] --> I[Defense in Depth]
  B --> H
  G --> H
```

---

## Mevcut Durum (Baseline)

| Konu | Şu an ne var? | Eksik |
|------|---------------|-------|
| Tenant izolasyonu | `CompanyGuard`, `CompanyScopeService`, `@RequireCompany()` | DB seviyesinde zorunluluk yok |
| Rate limit | `AuthRateLimitGuard` — in-memory, sadece `/auth/*`, tek instance | Cluster-safe değil, global API kapsamı yok |
| Davet kodu | Mobile UI disabled; `POST /companies/:id/join-request` mesaj ile | Kod üretimi, doğrulama, süre/limit yok |
| Belgeler | `ProjectFile` (proje bazlı); mobile `DocumentsScreen` empty state | Şirket geneli arşiv, kategori, arama yok |
| E-posta | Reset token dev log’da; generic success response | SMTP/transactional provider entegrasyonu yok |

---

## 6.1 E-posta Gönderimi

### Hedef

Production ortamında şifre sıfırlama, davet kodu ve (ileride) bildirim e-postalarının güvenilir şekilde iletilmesi.

### Mimari Karar

**Öneri:** `@nestjs-modules/mailer` + Nodemailer (SMTP) veya **Resend / SendGrid / AWS SES** HTTP API.

| Seçenek | Artı | Eksi |
|---------|------|------|
| Resend | Kolay API, iyi deliverability | Vendor lock-in |
| SendGrid | Olgun, template desteği | Fiyat/karmaşıklık |
| SMTP (Nodemailer) | Herhangi bir mail sunucusu | Deliverability sizin sorumluluğunuzda |

**Başlangıç önerisi:** Resend veya SendGrid — transactional mail için yeterli.

### Uygulama Adımları

#### Adım 1 — Modül iskeleti

```
apps/backend/src/modules/mail/
  mail.module.ts
  mail.service.ts
  templates/
    password-reset.hbs
    company-invite.hbs
  interfaces/mail-options.interface.ts
```

- `MailService.send(options: { to, subject, template, context })`
- Template engine: Handlebars veya inline HTML (MVP için inline yeterli)
- Hata durumunda log + `false` dön; auth akışında kullanıcıya her zaman generic mesaj (enumeration koruması)

#### Adım 2 — Ortam değişkenleri

```env
MAIL_PROVIDER=resend          # resend | sendgrid | smtp
MAIL_FROM=noreply@mimar.app
MAIL_FROM_NAME=Mimar Platform

# Resend
RESEND_API_KEY=re_...

# veya SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Deep link (mobile/web reset sayfası)
APP_RESET_PASSWORD_URL=https://app.mimar.app/reset-password
```

#### Adım 3 — Auth entegrasyonu

`AuthService.forgotPassword()` içinde:

1. Token oluştur (mevcut akış)
2. `MailService.sendPasswordReset(email, rawToken, resetUrl)`
3. Production’da token log’lama **kapat**
4. Dev’de `MAIL_PROVIDER=console` ile log’a yaz (test kolaylığı)

#### Adım 4 — Kuyruk (opsiyonel, P2)

Yüksek trafikte `@nestjs/bull` + Redis ile async mail queue. MVP’de senkron gönderim yeterli.

#### Adım 5 — Test

- Unit: `MailService` mock provider
- E2E: Mailtrap / Ethereal test inbox
- Manuel: forgot-password → inbox → reset-password → login

### Kabul Kriterleri

- [ ] Production’da reset token log’a yazılmıyor
- [ ] Geçersiz e-posta için aynı generic response
- [ ] Mail gönderim hatası kullanıcıya sızmıyor (500 değil, 200 + generic mesaj veya internal retry)
- [ ] Mobile `ForgotPasswordScreen` deep link veya token paste akışı çalışıyor

### Tahmini Efor

**3–5 gün** (provider seçimi + template + auth entegrasyonu + test)

---

## 6.2 `@nestjs/throttler` — Global Rate Limiting

### Hedef

In-memory `AuthRateLimitGuard` yerine cluster-safe, yapılandırılabilir, tüm public endpoint’leri kapsayan rate limiting.

### Neden Geçilmeli?

| Mevcut guard | Throttler |
|--------------|-----------|
| Tek process Map | Redis storage ile multi-instance |
| Sadece auth | Global + route bazlı limit |
| Sabit 30/dk | Env ile yapılandırılabilir |
| Restart’ta sıfırlanır | Kalıcı bucket (Redis) |

### Uygulama Adımları

#### Adım 1 — Paket kurulumu

```bash
cd apps/backend
npm install @nestjs/throttler
# Prod cluster için:
npm install @nestjs/throttler-storage-redis ioredis
```

#### Adım 2 — `app.module.ts`

```typescript
ThrottlerModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    throttlers: [
      { name: "default", ttl: 60_000, limit: 100 },
      { name: "auth", ttl: 60_000, limit: 10 },
    ],
    storage: config.get("REDIS_URL")
      ? new ThrottlerStorageRedisService(config.get("REDIS_URL"))
      : undefined,
  }),
}),
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

#### Adım 3 — Route bazlı limit

```typescript
// auth.controller.ts
@Throttle({ auth: { limit: 10, ttl: 60_000 } })
@Controller("auth")
export class AuthController { ... }
```

`@SkipThrottle()` — health check, internal webhook’lar.

#### Adım 4 — Mevcut guard’ı kaldır

- `AuthRateLimitGuard` sil veya deprecated bırak
- `auth.module.ts` provider listesinden çıkar

#### Adım 5 — Ortam değişkenleri

```env
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT_DEFAULT=100
THROTTLE_LIMIT_AUTH=10
REDIS_URL=redis://localhost:6379   # opsiyonel
```

### Kabul Kriterleri

- [ ] 11. auth login denemesi → `429 Too Many Requests`
- [ ] Multi-instance deploy’da limit paylaşımlı (Redis varsa)
- [ ] Swagger/health endpoint throttle dışı

### Tahmini Efor

**1–2 gün**

---

## 6.3 Davet Kodu Backend Endpoint’i

### Hedef

Şirket yöneticilerinin tek kullanımlık veya süreli davet kodu üretmesi; kullanıcıların kod ile şirkete katılması (`CompanyJoinScreen` aktif).

### Veri Modeli

```prisma
model CompanyInviteCode {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  code        String    @unique          // normalize: uppercase, no ambiguous chars
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  maxUses     Int       @default(1)
  usedCount   Int       @default(0)
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  @@index([companyId])
  @@index([code])
}
```

**Kod formatı:** 8 karakter, `A-Z2-9` (0/O, 1/I hariç) — örn. `K7M3XP2R`

### API Tasarımı

| Method | Endpoint | Yetki | Açıklama |
|--------|----------|-------|----------|
| `POST` | `/companies/:id/invite-codes` | `company.update` | Kod üret |
| `GET` | `/companies/:id/invite-codes` | `company.update` | Aktif kodları listele |
| `DELETE` | `/companies/:id/invite-codes/:codeId` | `company.update` | Kodu iptal et |
| `POST` | `/companies/join-by-code` | `company.join` | `{ code: string }` ile katıl |

**`join-by-code` akışı:**

1. Kodu normalize et (uppercase, trim)
2. `CompanyInviteCode` bul — süre, revoke, maxUses kontrol
3. Kullanıcı zaten şirkette mi? → Conflict
4. `requestJoin` ile aynı mantık: `companyId` ata, `approvalStatus: pending` veya kod `autoApprove: true` ise direkt `approved`
5. `usedCount++`
6. Fresh token dön (mevcut join-request pattern)
7. Admin’e bildirim (mevcut `NotificationsService`)

### Mobile Değişiklikleri

- `CompanyJoinScreen`: invite code input → `companiesApi.joinByCode({ code })`
- `companies.api.ts`: yeni endpoint
- Admin panel (ileride): kod üretme ekranı — MVP’de sadece API yeterli

### Güvenlik

- Brute force: `@Throttle` auth benzeri limit `join-by-code` üzerinde (5/dk/IP)
- Kod entropy: min 8 karakter ≈ 32 bit — yeterli tek kullanımlık için
- Rate limit + maxUses=1 kombinasyonu

### Kabul Kriterleri

- [ ] Geçerli kod → pending/approved join + token refresh
- [ ] Süresi dolmuş / iptal / limit dolmuş kod → anlamlı hata
- [ ] Mobile “Kod ile Katıl” butonu aktif
- [ ] (Opsiyonel) E-posta ile kod paylaşım linki

### Tahmini Efor

**4–6 gün** (schema + API + mobile + test)

---

## 6.4 Şirket Geneli Belge Modülü

### Hedef

Proje dosyalarından (`ProjectFile`) ayrı, şirket düzeyinde merkezi belge arşivi — sözleşmeler, kurumsal dokümanlar, paylaşılan şablonlar.

### Mevcut vs Hedef

| | `ProjectFile` (var) | `CompanyDocument` (yeni) |
|--|---------------------|----------------------------|
| Kapsam | Tek proje | Tüm şirket |
| Erişim | Proje ekibi | Şirket izinleri |
| Kategori | `type` string | `project` / `contract` / `other` |
| Mobile | Proje detayı | `DocumentsScreen` |

### Veri Modeli

```prisma
model CompanyDocument {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name        String
  description String?
  category    String   @default("other")   // project | contract | other
  url         String
  storageKey  String                     // S3 object key
  size        Int
  mimeType    String
  extension   String
  uploadedById String
  uploadedBy  User     @relation(fields: [uploadedById], references: [id])
  projectId   String?                    // opsiyonel proje bağlantısı
  project     Project? @relation(fields: [projectId], references: [id], onDelete: SetNull)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId])
  @@index([category])
  @@index([projectId])
}
```

### Storage Kararı

**Öneri:** Cloudflare R2 veya AWS S3 + presigned URL

```
Upload akışı:
1. POST /documents/upload-url → { uploadUrl, documentId, storageKey }
2. Client PUT dosyayı doğrudan storage’a
3. POST /documents/:id/confirm → metadata kaydı finalize
```

Alternatif MVP: Multer ile backend upload (küçük dosyalar, tek region).

### API Tasarımı

| Method | Endpoint | Yetki |
|--------|----------|-------|
| `GET` | `/documents` | `document.view` |
| `GET` | `/documents/:id` | `document.view` |
| `POST` | `/documents/upload-url` | `document.create` |
| `POST` | `/documents/:id/confirm` | `document.create` |
| `DELETE` | `/documents/:id` | `document.delete` |
| `GET` | `/documents/:id/download-url` | `document.view` |

Query params: `category`, `search`, `page`, `limit`, `projectId`

### Backend Modül Yapısı

```
apps/backend/src/modules/documents/
  documents.module.ts
  documents.controller.ts
  documents.service.ts
  storage/
    storage.interface.ts
    s3-storage.service.ts
  dto/
    create-document.dto.ts
    document-query.dto.ts
```

### İzinler (seed güncellemesi)

- `document.view`
- `document.create`
- `document.delete`

Admin / owner rolüne varsayılan atama.

### Mobile Değişiklikleri

- `DocumentsScreen`: mock kaldır → `documentsApi.getAll({ category })`
- Upload: expo-document-picker + presigned PUT
- Download: presigned GET veya Linking.openURL
- Tab filtreleri mevcut UI ile uyumlu

### Kabul Kriterleri

- [ ] Tenant izolasyonu: A şirketi B belgelerini göremez
- [ ] Kategori filtresi çalışır
- [ ] 10MB+ dosya presigned upload ile yüklenir
- [ ] Silme soft-delete veya hard-delete (karar: hard-delete + storage cleanup)

### Tahmini Efor

**8–12 gün** (storage + API + mobile upload/download + izinler)

---

## 6.5 PostgreSQL Row Level Security (RLS)

### Hedef

Uygulama katmanı tenant guard’larına ek olarak, veritabanı seviyesinde `companyId` izolasyonunu zorunlu kılmak (defense in depth).

### Neden Son Sırada?

- RLS, tüm sorgu yollarının doğru `companyId` context’i set etmesini gerektirir
- Prisma + RLS birlikte kullanımı ek karmaşıklık getirir
- Önce uygulama katmanı stabilize edilmeli (Faz 1–5 tamamlandı)

### Strateji

**Session variable pattern:**

```sql
-- Her request başında (Prisma middleware veya interceptor):
SET LOCAL app.current_company_id = 'cuid...';
SET LOCAL app.current_user_id = 'cuid...';
```

RLS policy:

```sql
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_company_isolation ON "Project"
  USING ("companyId" = current_setting('app.current_company_id', true));
```

### Etkilenecek Tablolar (öncelik sırası)

| P0 — Kritik | P1 — Yüksek | P2 — Orta |
|-------------|-------------|-----------|
| Project | Task | Notification |
| FinanceRecord | Section | DeviceToken |
| User (company scope) | ProjectTeam | CalendarEvent |
| Role | ProjectFile | SupportTicket |
| | CompanyDocument (yeni) | |

**RLS uygulanmayacak:** `PasswordResetToken`, global lookup tabloları.

### Prisma Entegrasyonu

```typescript
// prisma.service.ts — $extends veya $use middleware
async function withTenantContext<T>(
  companyId: string,
  userId: string,
  fn: () => Promise<T>,
): Promise<T> {
  return this.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_company_id', ${companyId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn();
  });
}
```

**Alternatif:** `$executeRaw` her servis metodunda — daha explicit, daha verbose.

### Migration Planı

1. **Faz A — Read-only policy:** Policy ekle, `FORCE ROW LEVEL SECURITY` kapalı; log-only mod
2. **Faz B — Staging’de enforce:** Tüm E2E testler
3. **Faz C — Production enforce:** `ALTER TABLE ... FORCE ROW LEVEL SECURITY`

### Bypass Rolü

Migration ve admin script’ler için ayrı DB rolü (`mimar_admin`) — RLS bypass. Uygulama runtime rolü (`mimar_app`) — RLS zorunlu.

```env
DATABASE_URL=postgresql://mimar_app:...@host/mimar_db
DATABASE_ADMIN_URL=postgresql://mimar_admin:...@host/mimar_db  # sadece migration
```

### Test Stratejisi

- Integration: company A token ile company B projectId → 404/empty (DB seviyesinde 0 row)
- Regression: join, approve, finance CRUD
- Penetration: raw SQL injection ile başka tenant verisi erişilemez

### Riskler

| Risk | Azaltma |
|------|---------|
| Prisma `$transaction` dışı sorgular context kaybeder | Middleware zorunlu kıl |
| `companyId` null kullanıcılar (onay bekleyen) | Ayrı policy: sadece kendi user row |
| Performans | Policy’lerde index’li kolon kullan (`companyId` zaten indexed) |

### Kabul Kriterleri

- [ ] En az P0 tablolarında RLS aktif
- [ ] Uygulama normal akışları bozulmuyor
- [ ] Bilinçli bypass sadece admin migration rolünde
- [ ] Dokümante edilmiş rollback prosedürü

### Tahmini Efor

**10–15 gün** (policy yazımı + Prisma entegrasyonu + kapsamlı test + staging rollout)

---

## Uygulama Takvimi (Öneri)

| Sprint | Konu | Çıktı |
|--------|------|-------|
| S1 | E-posta + Throttler | Prod-ready auth mail, global rate limit |
| S2 | Davet kodu | Mobile join-by-code aktif |
| S3–S4 | Belge modülü | DocumentsScreen + S3 upload |
| S5–S6 | PostgreSQL RLS | P0 tablolar enforce |

**Toplam tahmini:** 6–8 hafta (1 backend + 1 mobile developer)

---

## Ortam Değişkenleri Özeti (Faz 6 sonrası)

```env
# E-posta
MAIL_PROVIDER=resend
MAIL_FROM=noreply@mimar.app
RESEND_API_KEY=
APP_RESET_PASSWORD_URL=

# Rate limiting
THROTTLE_LIMIT_DEFAULT=100
THROTTLE_LIMIT_AUTH=10
REDIS_URL=

# Storage (belgeler)
STORAGE_PROVIDER=s3
S3_BUCKET=mimar-documents
S3_REGION=eu-central-1
S3_ACCESS_KEY=
S3_SECRET_KEY=

# RLS (opsiyonel ayrı connection)
DATABASE_URL=postgresql://mimar_app:...
DATABASE_ADMIN_URL=postgresql://mimar_admin:...
```

---

## Rollback Planı

| Konu | Rollback |
|------|----------|
| E-posta | `MAIL_PROVIDER=console` → log moduna dön |
| Throttler | `ThrottlerModule` devre dışı; eski guard geri al |
| Davet kodu | Endpoint’leri feature flag ile kapat; UI disabled |
| Belgeler | Modülü unregister et; mobile empty state geri |
| RLS | `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` migration |

---

## İlgili Dosyalar

| Dosya | Konu |
|-------|------|
| `src/common/guards/auth-rate-limit.guard.ts` | Throttler ile değiştirilecek |
| `src/modules/auth/auth.service.ts` | E-posta entegrasyonu |
| `src/features/companies/screens/CompanyJoinScreen.tsx` | Davet kodu UI |
| `src/features/documents/screens/DocumentsScreen.tsx` | Belge modülü UI |
| `src/common/tenant/company-scope.service.ts` | RLS ile paralel çalışır |
| `prisma/schema.prisma` | Yeni modeller |

---

## Onay Checklist (Uygulamaya Başlamadan Önce)

- [ ] Mail provider seçildi (Resend / SendGrid / SMTP)
- [ ] Object storage seçildi (R2 / S3)
- [ ] Redis prod’da mevcut mu? (throttler + ileride queue)
- [ ] Deep link / reset password URL domain’i hazır
- [ ] RLS için ayrı DB rolleri oluşturuldu
- [ ] Staging ortamı tüm fazları test edecek şekilde hazır
