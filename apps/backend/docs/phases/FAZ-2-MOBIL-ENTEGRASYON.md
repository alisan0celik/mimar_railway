# Faz 2 — Mobil Entegrasyon ve Auth Akışları

> **Tarih:** 2026-06-11  
> **Kapsam:** Şirket katılma, onay, routing, API client, WebSocket client

---

## Hedef

Backend ile mobil arasındaki kırık entegrasyon noktalarını düzeltmek; kullanıcıların join → pending → approved akışını uçtan uca çalışır hale getirmek.

---

## Yapılan Değişiklikler

### 1. Katılım talebi sonrası token kaydı

**Dosya:** `apps/mobile/src/features/company-join/screens/JoinRequestScreen.tsx`

**Sorun:** `requestJoin` API çağrılıyordu ama dönen token'lar kaydedilmiyordu.

**Çözüm:**
```typescript
const { accessToken, refreshToken, user } = response.data;
await setTokens(accessToken, refreshToken);
setUser(user);
```

---

### 2. Routing — approvalStatus kontrolü

**Dosya:** `apps/mobile/app/index.tsx`

**Sorun:** Yalnızca `companyId` kontrol ediliyordu; pending kullanıcılar dashboard'a düşüyordu.

**Çözüm:**

| Durum | Yönlendirme |
|-------|-------------|
| `companyId` + `pending` | `/(auth)/approval-pending` |
| `companyId` + `approved` | `/(main)/(tabs)/dashboard` |
| `companyId` + diğer | `/(auth)/login` |
| `companyId` yok | `/(auth)/company-select` |

---

### 3. Kullanıcı onay/red — doğru API

**Dosya:** `apps/mobile/src/features/users/screens/UserDetailScreen.tsx`

| İşlem | Önceki | Sonraki |
|-------|--------|---------|
| Onay | `usersApi.updateStatus("approved")` | `companiesApi.approveMember(companyId, userId)` |
| Red | `usersApi.updateStatus("rejected")` | `companiesApi.rejectMember(companyId, userId)` |

**Etki:** Onaylanan kullanıcıya varsayılan rol + permission'lar atanır.

---

### 4. Rol atama ekranı

**Dosya:** `apps/mobile/src/features/users/screens/AssignRoleScreen.tsx`

**Akış:**
1. `companiesApi.approveMember()` — onay + varsayılan rol
2. `rolesApi.assignRole(selectedRoleId, userId)` — seçilen rol eklenir

---

### 5. API client — refresh ve logout

**Dosya:** `apps/mobile/src/services/api/client.ts`

**Sorunlar:**
- Refresh başarılı olunca `authStore.user` güncellenmiyordu
- Refresh fail olunca token silinir ama store "authenticated" kalıyordu

**Çözüm:**
- Refresh response'taki `user` → `useAuthStore.getState().setUser(user)`
- Refresh fail → `forceLogout()` (tokens + store temizliği)

---

### 6. WebSocket client — güvenli auth

**Dosya:** `apps/mobile/src/services/websocket/socket.service.ts`

**Önceki:** `query: { userId, token }`  
**Sonraki:** `auth: { token }` — userId sunucu tarafından JWT'den türetilir

---

### 7. companies.api.ts tip güncellemesi

**Dosya:** `apps/mobile/src/services/api/companies.api.ts`

`requestJoin` response tipi: `{ message, accessToken?, refreshToken?, user?: UserDTO }`

---

## Etkilenen Kullanıcı Akışları

```
Kayıt → Şirket Seç → Join Request
  → Token kaydedilir
  → approval-pending ekranı
  → (Yönetici onaylar)
  → Uygulama restart / hydrate
  → approvalStatus === approved
  → Dashboard ✅
```

---

## Doğrulama

```bash
cd apps/mobile
npx tsc --noEmit   # ✅
```

---

## Bilinen Kalanlar

- Refresh fail sonrası otomatik login ekranına yönlendirme yok (store temizlenir, routing ayrı tetiklenmeli)
- LoginScreen/RegisterScreen hâlâ yalnızca companyId ile yönlendiriyor (index.tsx ana gate olarak yeterli)
