# Faz 5 — Kalan Sorunların Tamamlanması

Bu faz, önceki fazlarda ertelenen backend ve mobile maddelerini kapatır.

## Backend

| Konu | Çözüm |
|------|--------|
| Şifre sıfırlama stub | `PasswordResetToken` modeli + `forgotPassword` / `resetPassword` gerçek token akışı |
| Rol güncelleme izin senkronu | `PermissionService.syncPermissionsForRoleUsers()` — rol `update` sonrası tüm kullanıcılar |
| Task DTO doğrulama | `CreateTaskDto` / `UpdateTaskDto` — projects controller |
| Support / device token DTO | `CreateSupportTicketDto`, `RegisterDeviceTokenDto` |
| Takvim yazma API | `POST /calendar` + `CreateCalendarEventDto` |
| CORS `origin: "*"` | `CORS_ORIGINS` env (virgülle ayrılmış); prod'da tanımsızsa kapalı |
| Rate limiting | `AuthRateLimitGuard` — auth endpoint'leri (30/dk/IP) |
| WebSocket `mark_read` | DB'de `isRead` güncelleme + unread count |
| Users `mapUser` izinleri | `getEffectivePermissions` ile rol + doğrudan izinler |
| 500 hata detayı | Production'da generic mesaj (`HttpExceptionFilter`) |

### Migration

```bash
cd apps/backend
npx prisma migrate deploy   # veya migrate dev
npx prisma generate
```

Yeni migration: `20260611190000_password_reset_tokens`

### Ortam değişkenleri

```env
CORS_ORIGINS=http://localhost:8081,https://app.example.com
NODE_ENV=production
```

Development'ta şifre sıfırlama token'ı server log'unda görünür (e-posta entegrasyonu yok).

## Mobile

| Konu | Çözüm |
|------|--------|
| Mock şirket ekranları | `CompaniesScreen`, `CompanyJoinScreen`, `CompanyPendingScreen` → API + auth state |
| `DocumentsScreen` mock | “Yakında” empty state (proje dosyaları proje detayında) |
| Refresh fail redirect | `auth-session` event + `app/_layout.tsx` login yönlendirmesi |
| Finance consultant-payment | `AddPaymentScreen` gider / danışman ödemesi seçici |
| `useAuth` redirect | `getPostAuthRoute()` kullanımı |
| Bildirim prefs hydrate | `hydrateNotificationPrefs` — login/hydrate/setUser |
| `NotificationsScreen` UX | loading / error / empty state |
| `completed-projects` nav | `/(main)/completed/[projectId]` |
| notificationStore hataları | mark read/all read hata mesajı |

## Bilinçli olarak kapsam dışı

- PostgreSQL RLS (uygulama katmanı tenant guard yeterli)
- `@nestjs/throttler` paketi (hafif in-memory guard tercih edildi)
- `ResponseTransformInterceptor` global wrap
- Davet kodu ile katılım (backend endpoint yok — UI disabled)
- Şirket geneli belge modülü (backend modülü yok)
- E-posta gönderimi (reset token dev log)

## Doğrulama

```bash
# Backend
cd apps/backend && npm run typecheck && npm run build

# Mobile
cd apps/mobile && npx tsc --noEmit
```

### Manuel test checklist

- [ ] Forgot password → log'daki token ile reset-password
- [ ] Rol izinleri güncelle → o roldeki kullanıcı API izinleri güncellenir
- [ ] WS `mark_read` → DB + unread count
- [ ] 401 refresh fail → otomatik login ekranı
- [ ] Şirket listesi / join / pending akışı
- [ ] Tamamlanan proje → completed detail sayfası
