# Faz 3 — Veri Bütünlüğü ve Backend Sertleştirme

> **Tarih:** 2026-06-11  
> **Kapsam:** Prisma şema, proje alt kaynak IDOR, bildirim tetikleyicileri

---

## Hedef

Multi-tenant veri modelini düzeltmek; aynı şirket içi kaynak manipülasyonu açıklarını kapatmak; bildirim altyapısını iş mantığına bağlamak.

---

## Yapılan Değişiklikler

### 1. Role.code — şirket bazlı benzersizlik

**Dosya:** `apps/backend/prisma/schema.prisma`

**Sorun:** `code String @unique` global benzersizlik — farklı şirketler aynı rol kodunu kullanamazdı.

**Çözüm:**
```prisma
code String
@@unique([companyId, code])
```

**Migration:** `prisma/migrations/20260611180000_role_code_per_company/migration.sql`

```sql
DROP INDEX IF EXISTS "Role_code_key";
CREATE UNIQUE INDEX "Role_companyId_code_key" ON "Role"("companyId", "code");
```

> **Not:** DB drift varsa migration manuel uygulanmalı: `npx prisma migrate deploy`

---

### 2. Proje alt kaynak IDOR düzeltmeleri

**Dosya:** `apps/backend/src/modules/projects/projects.service.ts`

**Sorun:** Parent proje doğrulandıktan sonra child silme/güncelleme yalnızca child ID ile yapılıyordu.

**Çözüm:** Tüm mutasyonlarda `projectId` filtresi:

| Metod | Değişiklik |
|-------|------------|
| `updateSection` | `updateMany({ id, projectId })` |
| `removeNote` | `deleteMany({ id, projectId })` |
| `removeMessage` | `deleteMany({ id, projectId })` |
| `updateTask` | Önce `findFirst({ id, projectId })` |
| `removeTask` | `deleteMany({ id, projectId })` |
| `removeFile` | `deleteMany({ id, projectId })` |
| `removeTeamMember` | `deleteMany({ id, projectId })` |

Kayıt bulunamazsa `NotFoundException` fırlatılır (bilgi sızıntısı önlenir).

---

### 3. Bildirim tetikleyicileri

**Dosya:** `apps/backend/src/modules/companies/companies.service.ts`

| Olay | Alıcı | Mesaj |
|------|-------|-------|
| Katılım talebi | Şirket sahibi | "X şirketine katılmak istiyor" |
| Üye onayı | Onaylanan kullanıcı | "Üyeliğiniz onaylandı" |

**Modül bağımlılığı:** `CompaniesModule` → `NotificationsModule` import

---

### 4. PermissionService — rol senkronizasyonu

**Dosyalar:**
- `roles.service.ts` — assignRole / removeRole sonrası sync
- `users.service.ts` — assignRole sonrası sync

Rol atandığında veya kaldırıldığında `UserPermission` tablosu kullanıcının tüm rollerinden yeniden hesaplanır.

---

### 5. CompanyGuard sertleştirme

**Dosya:** `apps/backend/src/common/tenant/company.guard.ts`

- `user` yokken artık `true` dönmek yerine `UnauthorizedException`
- `@RequireApproved()` desteği

---

## Güvenlik Matrisi (Faz 3 Sonrası)

| Tehdit | Durum |
|--------|-------|
| Cross-company veri erişimi | ✅ Kapalı |
| Pending user → roles/calendar | ✅ Kapalı |
| Same-company project child IDOR | ✅ Kapalı |
| Global Role.code collision | ✅ Kapalı |
| WebSocket impersonation | ✅ Faz 1'de kapalı |

---

## Doğrulama

```bash
cd apps/backend
npm run typecheck   # ✅
npm run build       # ✅
npx prisma generate # ✅
```

---

## Bilinen Kalanlar

- Task create/update DTO validasyonu eksik (`Record<string, unknown>`)
- Password reset stub
- Calendar write API yok
