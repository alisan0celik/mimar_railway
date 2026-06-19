# Faz 4 — Mobil Tamamlama ve UX Düzeltmeleri

> **Tarih:** 2026-06-11  
> **Kapsam:** Stub ekranlar, dead code aktivasyonu, proje ekranları

---

## Hedef

Mobil uygulamada API'ye bağlanmayan veya mock kalan kritik ekranları gerçek backend'e bağlamak.

---

## Yapılan Değişiklikler

### 1. Görev oluşturma ekranı

**Dosya:** `apps/mobile/src/features/projects/screens/CreateTaskScreen.tsx`

**Önceki:** `router.back()` — API çağrısı yok  
**Sonraki:** `projectApi.addTask(projectId, { title, description, status, priority })`

---

### 2. Şifremi unuttum ekranı

**Dosya:** `apps/mobile/src/features/auth/screens/ForgotPasswordScreen.tsx`

**Önceki:** Yerel `setSent(true)`  
**Sonraki:** `authApi.forgotPassword(email)` çağrısı

> Backend hâlâ stub — API çağrısı yapılır ama e-posta gönderilmez. Kullanıcıya standart başarı mesajı gösterilir.

---

### 3. Proje detay — deep link desteği

**Dosya:** `apps/mobile/src/features/projects/screens/ProjectDetailScreen.tsx`

**Sorunlar:**
- `ProjectTeamDTO` import eksikti (TS hatası)
- Proje yalnızca store'dan okunuyordu
- Complete/restore yanlış permission (`ROLE_CREATE`)

**Çözümler:**
- Store'da yoksa `projectApi.getProject(id)` fetch
- `canManageStatus` → `PROJECT_COMPLETE` \| `PROJECT_RESTORE`
- `todo.text` → `todo.title` (DTO uyumu)

---

### 4. Tamamlanan proje restore

**Dosya:** `apps/mobile/src/features/completed-projects/screens/CompletedProjectDetailScreen.tsx`

**Önceki:** `Alert.alert("Mock", ...)`  
**Sonraki:** `projectApi.updateProject(id, { status: "active" })` + proje listesi yenileme

---

### 5. Bildirimler — hook aktivasyonu

**Dosyalar:**
- `apps/mobile/src/features/notifications/NotificationsBootstrap.tsx` (yeni)
- `apps/mobile/app/(main)/_layout.tsx`

**Sorun:** `useNotifications` hiçbir yerde mount edilmiyordu.

**Çözüm:** Main layout'ta `<NotificationsBootstrap />` — WebSocket bağlantısı + bildirim store yüklemesi.

---

### 6. WebSocket güvenli bağlantı

**Dosya:** `apps/mobile/src/services/websocket/socket.service.ts` (Faz 2 ile birlikte)

`auth: { token }` — query string'de userId yok.

---

### 7. Route düzeltmesi

**Dosya:** `apps/mobile/app/(main)/_layout.tsx`

`completed-projects` → `completed` (expo-router dosya yapısı ile uyumlu)

---

## Hâlâ Mock / Eksik Ekranlar

| Ekran | Durum | Öneri |
|-------|-------|-------|
| `DocumentsScreen` | Tamamen mock | Backend modülü gerekli |
| `CompanyPendingScreen` | Mock data | Kullanıcı başvuru durumu API'si gerekli |
| `CompaniesScreen` (tab) | Mock data | Admin join request UI |
| `CompanyJoinScreen` | Stub navigation | JoinRequestScreen'e yönlendir |
| Invite code join | Boş handler | Backend endpoint gerekli |

---

## Doğrulama

```bash
cd apps/mobile
npx tsc --noEmit   # ✅
```

---

## Derleme

Backend:
```bash
cd apps/backend && npm run build
```

Mobile (TypeScript):
```bash
cd apps/mobile && npx tsc --noEmit
```

> Expo native build (`eas build`) bu faz kapsamında çalıştırılmadı; TypeScript doğrulaması yapıldı.
