# Faz Planı — Genel Bakış

> Mimar Platform staff engineer düzeltme planı  
> **Tarih:** 2026-06-11

---

## Faz Özeti

| Faz | Başlık | Odak | Doküman |
|:---:|--------|------|---------|
| 1 | Güvenlik ve Auth | WebSocket, notifications, permissions, JWT, pending guard | [FAZ-1](./FAZ-1-GUVENLIK-VE-AUTH.md) |
| 2 | Mobil Entegrasyon | Join flow, onay API, routing, API client | [FAZ-2](./FAZ-2-MOBIL-ENTEGRASYON.md) |
| 3 | Veri Bütünlüğü | Role schema, IDOR, bildirim tetikleyicileri | [FAZ-3](./FAZ-3-VERI-BUTUNLUGU.md) |
| 4 | Mobil Tamamlama | Stub wire-up, notifications mount, proje ekranları | [FAZ-4](./FAZ-4-MOBIL-TAMAMLAMA.md) |
| 5 | Kalan Sorunlar | Password reset, mock wire-up, CORS, WS mark_read | [FAZ-5](./FAZ-5-TAMAMLAMA.md) |
| 6 | Kapsam Dışı (plan) | RLS, throttler, davet kodu, belgeler, e-posta | [FAZ-6 Plan](./FAZ-6-KAPSAM-DISI-UYGULAMA-PLANI.md) |

---

## Derleme Sonuçları

| Paket | Komut | Sonuç |
|-------|-------|-------|
| `@mimar/backend` | `npm run typecheck` | ✅ |
| `@mimar/backend` | `npm run build` | ✅ |
| `@mimar/mobile` | `npx tsc --noEmit` | ✅ |

---

## Faz 6 — Kapsam Dışı (Planlama)

Detaylı uygulama planı: [FAZ-6-KAPSAM-DISI-UYGULAMA-PLANI.md](./FAZ-6-KAPSAM-DISI-UYGULAMA-PLANI.md)

| Öncelik | Konu | Durum |
|---------|------|-------|
| P0 | E-posta gönderimi | Planlandı |
| P1 | `@nestjs/throttler` | Planlandı |
| P1 | Davet kodu endpoint | Planlandı |
| P2 | Şirket belge modülü | Planlandı |
| P2 | PostgreSQL RLS | Planlandı |

---

## Faz 5+ Öneriler (Uygulanmadı — Faz 6'ya taşındı)

| Öncelik | Konu |
|---------|------|
| P1 | Şifre sıfırlama — token modeli + e-posta |
| P1 | LoginScreen approvalStatus routing |
| P2 | PostgreSQL RLS |
| P2 | Rate limiting (`@nestjs/throttler`) |
| P2 | Documents modülü (backend + mobile) |
| P3 | Calendar CRUD API |
| P3 | Mock ekranların temizlenmesi |

---

## Migration Notu

Role.code migration dosyası oluşturuldu:

```
apps/backend/prisma/migrations/20260611180000_role_code_per_company/migration.sql
```

DB drift nedeniyle otomatik migrate başarısız olabilir. Manuel uygulama:

```bash
cd apps/backend
npx prisma migrate deploy
# veya
psql -d mimar_db -f prisma/migrations/20260611180000_role_code_per_company/migration.sql
```
