# Faz 1 — Kritik Güvenlik ve Auth Altyapısı

> **Tarih:** 2026-06-11  
> **Kapsam:** Backend güvenlik açıkları, permission sistemi, bildirim modülü, JWT sertleştirme

---

## Hedef

Production'da veri sızıntısına veya yetkisiz erişime yol açan kritik backend sorunlarını kapatmak; permission ve tenant guard'larını tutarlı hale getirmek.

---

## Yapılan Değişiklikler

### 1. NotificationsController kaydı

**Dosya:** `apps/backend/src/modules/notifications/notifications.module.ts`

**Sorun:** Controller tanımlıydı ama modüle eklenmemişti → tüm `/api/notifications/*` endpoint'leri 404 dönüyordu.

**Çözüm:** `controllers: [NotificationsController]` eklendi. `NotificationsService` oluşturuldu.

---

### 2. WebSocket JWT doğrulaması

**Dosya:** `apps/backend/src/modules/notifications/notifications.gateway.ts`

**Sorun:** `?userId=` query parametresi doğrudan güveniliyordu → kullanıcı taklit edilebilirdi.

**Çözüm:**
- Handshake `auth.token` veya `Authorization` header'dan JWT okunur
- `JwtService.verify()` ile doğrulanır
- `userId` yalnızca token payload'ından (`sub`) türetilir
- Geçersiz bağlantılar `disconnect(true)` ile kapatılır

---

### 3. NotificationsService — bildirim üretimi

**Dosya:** `apps/backend/src/modules/notifications/notifications.service.ts`

**Sorun:** Hiçbir yerde `notification.create` çağrılmıyordu.

**Çözüm:** Merkezi `createForUser()` metodu:
- DB'ye kayıt
- WebSocket push
- Unread count güncelleme
- FCM push (`DeviceToken` tablosundan)

**Tetikleyiciler:**
- Katılım talebi → şirket sahibine bildirim
- Üye onayı → onaylanan kullanıcıya bildirim

---

### 4. PermissionService — efektif izin çözümlemesi

**Dosya:** `apps/backend/src/common/permissions/permission.service.ts`

**Sorun:** `PermissionsGuard` yalnızca `UserPermission` tablosuna bakıyordu; rol izinleri API'de geçersiz sayılıyordu.

**Çözüm:**
- `getEffectivePermissions(userId)` → `UserPermission` + `RolePermission` (UserRole üzerinden) birleşimi
- `syncUserPermissionsFromRoles(userId)` → rol değişikliklerinde `UserPermission` senkronizasyonu

---

### 5. PermissionsGuard yeniden yazımı

**Dosya:** `apps/backend/src/common/guards/permissions.guard.ts`

- `PermissionService.getEffectivePermissions()` kullanır
- `@PermissionsAny()` dekoratörü destekler (OR mantığı)

**Dosya:** `apps/backend/src/common/decorators/permissions-any.decorator.ts`

**Düzeltilen bug:** `@Permissions("user.approve", "user.reject")` artık AND değil OR — en az biri yeterli.

---

### 6. RequireApproved guard

**Dosya:** `apps/backend/src/common/tenant/require-approved.decorator.ts`  
**Dosya:** `apps/backend/src/common/tenant/company.guard.ts`

**Sorun:** `approvalStatus: pending` kullanıcılar `@RequireCompany()` endpoint'lerine erişebiliyordu.

**Çözüm:** `@RequireApproved()` → `approvalStatus === "approved"` zorunlu.

**Uygulanan controller'lar:**
- Projects, Finance, Roles, Calendar (sınıf seviyesi)
- Companies yönetim endpoint'leri (join-requests, approve, reject, update)

---

### 7. JWT secret fallback kaldırıldı

**Dosya:** `apps/backend/src/config/jwt.config.ts`

**Sorun:** Env yoksa `"fallback-secret-dev-only"` kullanılıyordu.

**Çözüm:** `getJwtAccessSecret()` / `getJwtRefreshSecret()` — env yoksa startup'ta hata.

**Güncellenen dosyalar:**
- `auth.module.ts`
- `jwt.strategy.ts`
- `auth.service.ts`
- `notifications.module.ts`

---

### 8. JwtPayload genişletildi

**Dosya:** `apps/backend/src/common/interfaces/jwt-payload.interface.ts`

`approvalStatus` alanı eklendi. `JwtStrategy` her istekte DB'den okur.

---

### 9. Katılım talebi → fresh token

**Dosya:** `apps/backend/src/modules/companies/companies.service.ts`

**Sorun:** Join request sonrası JWT'de `companyId` güncellenmiyordu.

**Çözüm:** `requestJoin()` sonunda `authService.refreshTokensForUser()` çağrılır; access + refresh token + user döndürülür.

---

### 10. Rol atama permission sync

**Dosya:** `apps/backend/src/modules/roles/roles.service.ts`  
**Dosya:** `apps/backend/src/modules/users/users.service.ts`

Rol atama/kaldırma sonrası `permissionService.syncUserPermissionsFromRoles()` çağrılır.

---

## Etkilenen API Davranışları

| Endpoint | Önceki | Sonraki |
|----------|--------|---------|
| `GET /notifications` | 404 | ✅ Çalışır |
| `POST /companies/:id/join-request` | Sadece message | + tokens + user |
| `PATCH /users/:id/status` | Her iki izin gerekli | approve VEYA reject yeterli |
| `GET /roles` (pending user) | Erişilebilir | 403 |
| WebSocket `/notifications` | userId spoof | JWT zorunlu |

---

## Doğrulama

```bash
cd apps/backend
npm run typecheck   # ✅
npm run build       # ✅
```

---

## Bilinen Kalanlar (Sonraki Fazlar)

- Şifre sıfırlama hâlâ stub (e-posta gönderimi yok)
- PostgreSQL RLS yok
- Rate limiting yok
