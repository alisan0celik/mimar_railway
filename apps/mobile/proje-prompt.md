# Mimarlık Ofisi Proje Yönetimi Mobil Uygulaması  
## Tek Dosyalık Mobile UI/UX + Product + Frontend Implementation Plan

> Rol: Senior Product Manager + Senior Mobile UI/UX Designer + Senior React Native Developer  
> Hedef: Orta ölçekli mimarlık ofisleri için dark premium mobil proje yönetimi uygulaması  
> Kapsam: Sadece mobil frontend. Backend entegrasyonu yok. Tüm sayfalar mock data ile gezilebilir olacak.  
> Teknoloji önerisi: React Native + Expo + TypeScript + Expo Router  
> Tasarım hedefi: Referans görsellerdeki koyu lacivert/mor premium SaaS dashboard kalitesiyle uyumlu ekranlar.

---

## 1. Ürün Tanımı

Bu uygulama, orta ölçekli mimarlık ofislerinin proje, ekip, finans, rol, dosya ve bildirim süreçlerini mobil ortamda yönetmesini sağlar.

Uygulama şu ana işleri çözer:

- Mimarlık ofisine kullanıcı katılım talebi gönderme
- Kullanıcı onaylama ve rol atama
- Proje oluşturma ve takip etme
- Proje bölümlerini izleme: mimari, statik, mekanik, elektrik, harita, izolasyon
- Ekip üyelerini görüntüleme
- Proje dosyalarını yönetme
- Proje mesajlarını / yorumlarını takip etme
- Finansal anlaşma, alınan ödeme, kalan alacak ve kâr takibi
- Bildirim ve hatırlatma yönetimi
- Profil, şirket, güvenlik ve uygulama ayarları

---

## 2. Temel Kullanıcı Rolleri

### 2.1 Proje Yöneticisi

Yetkileri:

- Proje oluşturabilir
- Proje detaylarını görebilir
- Bölüm ilerlemelerini takip edebilir
- Ekip üyelerini yönetebilir
- Finans bilgilerini görebilir
- Katılım taleplerini onaylayabilir
- Rol atayabilir

### 2.2 Mimar

Yetkileri:

- Atandığı projeleri görebilir
- Mimari bölüm ilerlemesini takip edebilir
- Dosya yükleyebilir
- Proje mesajlarına katılabilir

### 2.3 Statik Mühendisi

Yetkileri:

- Atandığı projelerde statik bölümünü görebilir
- Statik dosyaları ve yorumları takip edebilir

### 2.4 Elektrik Mühendisi

Yetkileri:

- Elektrik bölümüne ait görevleri ve dosyaları takip edebilir

### 2.5 Mekanik Mühendisi

Yetkileri:

- Mekanik bölüm süreçlerini takip edebilir

### 2.6 Finans Yetkilisi

Yetkileri:

- Finans ekranlarını görebilir
- Ödeme ekleyebilir
- Finans detaylarını takip edebilir

### 2.7 Görüntüleyici

Yetkileri:

- Sadece izin verilen projeleri ve temel bilgileri görüntüler
- Düzenleme yapamaz

---

## 3. Uygulama Teknoloji Kararları

### 3.1 Mobil Teknoloji

```txt
React Native
Expo
TypeScript
Expo Router
React Hook Form
Zod
Zustand
Lucide React Native
React Native SVG
Expo Linear Gradient
```

### 3.2 Kurulum ve Çalıştırma Hedefi

```bash
npm install
npx expo start
```

### 3.3 Uygulama Çalışma Mantığı

Bu aşamada backend olmayacak.

Bu nedenle:

- Login mock çalışacak
- Register mock çalışacak
- Company select mock data kullanacak
- Dashboard mock data kullanacak
- Projeler mock data kullanacak
- Finans mock data kullanacak
- Roller mock data kullanacak
- Bildirimler mock data kullanacak
- Dosyalar mock data kullanacak
- Mesajlar mock data kullanacak

---

## 4. Global Tasarım Sistemi

### 4.1 Tasarım Dili

Uygulama dark premium, profesyonel ve kurumsal bir SaaS panel hissi vermelidir.

Tasarım özellikleri:

- Koyu lacivert arka plan
- Mor/mavi primary aksan
- Cam efekti hissi veren kartlar
- İnce border çizgileri
- Yuvarlatılmış köşeler
- Soft shadow
- Gradient button
- Duruma göre renklenen badge yapısı
- Minimal ama bilgi yoğun dashboard düzeni
- Mobilde okunabilir kart tabanlı yapı

---

## 5. Renk Paleti

```ts
export const colors = {
  background: "#07111F",
  backgroundSoft: "#0B1628",
  backgroundDeep: "#050B14",

  surface: "#101B2D",
  surfaceSoft: "#162238",
  surfaceMuted: "#0E192B",

  card: "#111D30",
  cardElevated: "#17243A",
  cardSoft: "#132033",

  primary: "#6255F6",
  primaryLight: "#7C6BFF",
  primaryDark: "#4236D9",

  secondary: "#2F80ED",
  cyan: "#37B7FF",

  success: "#22C55E",
  successSoft: "rgba(34,197,94,0.14)",

  warning: "#F59E0B",
  warningSoft: "rgba(245,158,11,0.14)",

  danger: "#EF4444",
  dangerSoft: "rgba(239,68,68,0.16)",

  info: "#38BDF8",
  infoSoft: "rgba(56,189,248,0.14)",

  text: "#F8FAFC",
  textSoft: "#CBD5E1",
  textMuted: "#94A3B8",
  textDisabled: "#64748B",

  border: "rgba(148,163,184,0.16)",
  borderStrong: "rgba(148,163,184,0.28)",

  input: "#101B2D",
  inputBorder: "rgba(148,163,184,0.18)",

  white: "#FFFFFF",
  black: "#000000",
};
```

---

## 6. Tipografi Sistemi

### 6.1 Font

Önerilen font:

```txt
Inter
```

Expo için alternatif:

```txt
Sistem fontu / SF Pro benzeri görünüm
```

### 6.2 Font Ölçeği

```ts
export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 21,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 21,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  tiny: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
  },
};
```

---

## 7. Spacing Sistemi

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
};
```

---

## 8. Radius Sistemi

```ts
export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 30,
  full: 999,
};
```

---

## 9. Shadow / Elevation Sistemi

```ts
export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  button: {
    shadowColor: "#6255F6",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
};
```

---

## 10. Icon Set

Kullanılacak kütüphane:

```bash
npm install lucide-react-native
```

Kullanılacak ikonlar:

```txt
Home
FolderKanban
Briefcase
Users
Bell
Settings
User
Shield
Lock
Building2
FileText
CreditCard
CalendarDays
Search
Plus
ChevronRight
ChevronLeft
Check
X
Clock
AlertTriangle
Upload
Download
MessageCircle
HelpCircle
LogOut
Wallet
Receipt
BarChart3
PieChart
UserCheck
UserX
KeyRound
Globe
Moon
Languages
Folder
Paperclip
Send
Filter
Eye
EyeOff
Mail
Apple
Chrome
Monitor
```

---

## 11. Önerilen Klasör Yapısı

```txt
app/
  _layout.tsx
  index.tsx

  auth/
    welcome.tsx
    login.tsx
    register.tsx
    company-select.tsx
    join-request.tsx
    approval-pending.tsx

  tabs/
    _layout.tsx
    dashboard.tsx
    projects.tsx
    finance.tsx
    roles.tsx
    profile.tsx

  projects/
    create.tsx
    detail/[id].tsx
    departments/[id].tsx
    team/[id].tsx
    files/[id].tsx
    messages/[id].tsx

  finance/
    detail/[id].tsx
    add-payment.tsx
    payment-history/[id].tsx

  users/
    pending.tsx
    review/[id].tsx
    assign-role/[id].tsx

  roles/
    detail/[id].tsx

  notifications/
    index.tsx
    preferences.tsx

  settings/
    index.tsx
    profile-info.tsx
    company-info.tsx
    security.tsx
    language.tsx
    theme.tsx
    support.tsx

  states/
    no-permission.tsx
    empty.tsx
    error.tsx
    loading.tsx
    search-results.tsx

src/
  components/
    ui/
      AppScreen.tsx
      AppText.tsx
      AppButton.tsx
      AppInput.tsx
      AppCard.tsx
      AppBadge.tsx
      AppAvatar.tsx
      AppHeader.tsx
      AppSearchInput.tsx
      AppSwitchRow.tsx
      AppProgressBar.tsx
      AppEmptyState.tsx
      AppErrorState.tsx
      AppLoadingState.tsx
      AppDivider.tsx
      AppIconButton.tsx
      AppSelect.tsx
      AppSectionTitle.tsx

    business/
      CompanyCard.tsx
      DashboardStatCard.tsx
      DashboardQuickAction.tsx
      ProjectCard.tsx
      ProjectStatusBadge.tsx
      ProjectPriorityBadge.tsx
      DepartmentProgressItem.tsx
      TeamMemberRow.tsx
      FinanceProjectCard.tsx
      PaymentHistoryItem.tsx
      RoleCard.tsx
      PermissionRow.tsx
      PendingUserCard.tsx
      NotificationItem.tsx
      FileItem.tsx
      MessageBubble.tsx
      ScheduleItem.tsx

  theme/
    colors.ts
    spacing.ts
    typography.ts
    radius.ts
    shadows.ts
    index.ts

  mock/
    companies.ts
    users.ts
    projects.ts
    finance.ts
    roles.ts
    notifications.ts
    files.ts
    messages.ts
    calendar.ts

  types/
    company.ts
    user.ts
    project.ts
    finance.ts
    role.ts
    notification.ts
    file.ts
    message.ts
    calendar.ts

  utils/
    formatCurrency.ts
    formatDate.ts
    getStatusColor.ts
    getPriorityColor.ts
    search.ts

  store/
    authStore.ts
    appStore.ts
```

---

## 12. Global Component Standartları

### 12.1 AppScreen

Her ekranın ana kapsayıcısıdır.

İçermesi gerekenler:

- SafeAreaView
- Dark background
- Optional ScrollView
- Horizontal padding
- Status bar ayarı
- Bottom padding

Todo:

```txt
[ ] SafeAreaView kullan
[ ] Arka planı colors.background yap
[ ] Scroll edilebilir prop ekle
[ ] Padding değerlerini theme üzerinden al
[ ] Klavye olan formlar için KeyboardAvoidingView desteği ekle
```

---

### 12.2 AppHeader

Standart üst başlık componentidir.

İçermesi gerekenler:

- Geri butonu
- Başlık
- Sağ aksiyon alanı
- Alt açıklama opsiyonu

Todo:

```txt
[ ] Back button desteği ekle
[ ] Title alanı ekle
[ ] Right action slot ekle
[ ] Header spacing değerlerini sabitle
```

---

### 12.3 AppButton

Primary, secondary, danger ve ghost varyantları olmalıdır.

Varyantlar:

```txt
primary
secondary
danger
ghost
outline
```

Todo:

```txt
[ ] Gradient primary button oluştur
[ ] Loading state ekle
[ ] Disabled state ekle
[ ] Icon left/right desteği ekle
[ ] Full width desteği ekle
```

---

### 12.4 AppInput

Form input componentidir.

İçermesi gerekenler:

- Label
- Placeholder
- Error text
- Left icon
- Right icon
- Secure text desteği

Todo:

```txt
[ ] Label alanı ekle
[ ] Hata mesajı alanı ekle
[ ] Password visibility toggle ekle
[ ] Border focus state ekle
```

---

### 12.5 AppCard

Tüm kartlarda kullanılacak ortak component.

Todo:

```txt
[ ] Dark elevated card background kullan
[ ] Border ekle
[ ] Radius lg/xl kullan
[ ] Padding prop desteği ekle
[ ] Pressable versiyon desteği ekle
```

---

### 12.6 AppBadge

Durum göstergeleri için kullanılır.

Varyantlar:

```txt
success
warning
danger
info
primary
neutral
```

Todo:

```txt
[ ] Badge renklerini varyanta göre ayarla
[ ] Small ve medium size desteği ekle
[ ] Icon desteği ekle
```

---

### 12.7 AppBottomTabBar

Alt tab navigasyonudur.

Tablar:

```txt
Ana Panel
Projeler
Finans
Roller
Diğer/Profile
```

Todo:

```txt
[ ] Dark floating tab görünümü oluştur
[ ] Aktif tab için primary renk kullan
[ ] Pasif tab için muted renk kullan
[ ] Icon + label göster
[ ] Safe area bottom padding ekle
```

---

## 13. Mock Data Standartları

### 13.1 Company Model

```ts
export interface Company {
  id: string;
  name: string;
  location: string;
  memberCount: number;
  status: "active" | "pending";
}
```

### 13.2 User Model

```ts
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  companyName: string;
  status: "active" | "pending" | "rejected";
}
```

### 13.3 Project Model

```ts
export type ProjectStatus = "active" | "planned" | "completed" | "waiting";
export type ProjectPriority = "low" | "medium" | "high";

export interface Project {
  id: string;
  name: string;
  client: string;
  type: string;
  location: string;
  responsiblePerson: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: string;
  deliveryDate: string;
  contractAmount: number;
  description: string;
}
```

### 13.4 Department Model

```ts
export interface Department {
  id: string;
  projectId: string;
  name: string;
  responsiblePerson: string;
  progress: number;
  color: string;
}
```

### 13.5 Finance Model

```ts
export interface ProjectFinance {
  id: string;
  projectId: string;
  projectName: string;
  contractAmount: number;
  architectPayment: number;
  receivedAmount: number;
  remainingAmount: number;
  profit: number;
  payments: Payment[];
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: "cash" | "bank_transfer" | "credit_card";
  description?: string;
}
```

### 13.6 Role Model

```ts
export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  label: string;
  enabled: boolean;
}
```

### 13.7 Notification Model

```ts
export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: "project" | "finance" | "user" | "system" | "comment";
  isRead: boolean;
  createdAt: string;
}
```

### 13.8 File Model

```ts
export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: "pdf" | "dwg" | "zip" | "docx" | "image";
  size: string;
  uploadedAt: string;
}
```

### 13.9 Message Model

```ts
export interface ProjectMessage {
  id: string;
  projectId: string;
  senderName: string;
  message: string;
  createdAt: string;
  isMine: boolean;
  attachment?: {
    name: string;
    type: string;
    size: string;
  };
}
```

---

# 14. Ekran Bazlı Detaylı Uygulama Planı

---

## 14.1 Welcome Screen

Route:

```txt
app/auth/welcome.tsx
```

Amaç:

Kullanıcının uygulamaya ilk giriş yaptığı tanıtım ekranıdır.

Hiyerarşi:

```txt
WelcomeScreen
 ├─ AppScreen
 ├─ ArchitecturalBackground
 ├─ LogoBlock
 │   ├─ LogoIcon
 │   ├─ AppName
 │   └─ Subtitle
 └─ StartButton
```

Componentler:

```txt
AppScreen
AppText
AppButton
AppCard
Building2 icon
```

Tasarım:

- Arka planda koyu mimari bina atmosferi
- Ortada logo
- Alt kısımda “Başlayalım” butonu
- Premium ve sakin giriş hissi

Todo:

```txt
[ ] Welcome route oluştur
[ ] Dark gradient background ekle
[ ] Mimarlık logo icon alanı oluştur
[ ] Başlık: MİMARLIK
[ ] Alt başlık: Proje Yönetim Platformu
[ ] Açıklama metni ekle
[ ] Başlayalım butonunu alta sabitle
[ ] Butona basınca /auth/login route’una yönlendir
```

---

## 14.2 Login Screen

Route:

```txt
app/auth/login.tsx
```

Amaç:

Kullanıcının e-posta ve şifre ile giriş yapması.

Hiyerarşi:

```txt
LoginScreen
 ├─ AppHeader
 ├─ TitleBlock
 ├─ LoginForm
 │   ├─ EmailInput
 │   ├─ PasswordInput
 │   └─ ForgotPasswordLink
 ├─ PrimaryButton
 ├─ Divider
 ├─ SocialLoginRow
 │   ├─ GoogleButton
 │   ├─ AppleButton
 │   └─ MicrosoftButton
 └─ RegisterLink
```

Componentler:

```txt
AppScreen
AppHeader
AppInput
AppButton
AppText
AppIconButton
```

Todo:

```txt
[ ] Login ekranını oluştur
[ ] AppHeader ile geri butonu ekle
[ ] E-posta inputu ekle
[ ] Şifre inputu ekle
[ ] Şifre göster/gizle iconu ekle
[ ] Şifremi unuttum linki ekle
[ ] Giriş Yap butonu ekle
[ ] Google, Apple, Microsoft social button tasarla
[ ] Kayıt Ol linki ekle
[ ] Mock login sonrası /tabs/dashboard route’una yönlendir
```

---

## 14.3 Register Screen

Route:

```txt
app/auth/register.tsx
```

Amaç:

Yeni kullanıcı hesabı oluşturmak.

Hiyerarşi:

```txt
RegisterScreen
 ├─ AppHeader
 ├─ TitleBlock
 ├─ RegisterForm
 │   ├─ FullNameInput
 │   ├─ EmailInput
 │   ├─ PasswordInput
 │   ├─ ConfirmPasswordInput
 │   └─ TermsCheckbox
 ├─ RegisterButton
 └─ LoginLink
```

Todo:

```txt
[ ] Register route oluştur
[ ] Ad Soyad inputu ekle
[ ] E-posta inputu ekle
[ ] Şifre inputu ekle
[ ] Şifre tekrar inputu ekle
[ ] Kullanım şartları checkbox ekle
[ ] Kayıt Ol butonu ekle
[ ] Mock kayıt sonrası /auth/company-select route’una yönlendir
```

---

## 14.4 Company Select Screen

Route:

```txt
app/auth/company-select.tsx
```

Amaç:

Kullanıcının katılacağı mimarlık ofisini seçmesi.

Hiyerarşi:

```txt
CompanySelectScreen
 ├─ AppHeader
 ├─ SearchInput
 ├─ CompanyList
 │   └─ CompanyCard[]
 └─ ContinueButton
```

Componentler:

```txt
AppSearchInput
CompanyCard
AppButton
Building2 icon
Check icon
```

Todo:

```txt
[ ] Company select ekranını oluştur
[ ] companies mock datasını oluştur
[ ] Search input ile şirket filtreleme yap
[ ] CompanyCard componenti oluştur
[ ] Seçili şirkette primary border ve check icon göster
[ ] Devam Et butonu ekle
[ ] Devam Et sonrası /auth/join-request route’una yönlendir
```

---

## 14.5 Join Request Screen

Route:

```txt
app/auth/join-request.tsx
```

Amaç:

Seçilen şirkete katılım talebi göndermek.

Hiyerarşi:

```txt
JoinRequestScreen
 ├─ AppHeader
 ├─ IllustrationBlock
 ├─ SelectedCompanyInfo
 ├─ MessageTextarea
 └─ SubmitButton
```

Todo:

```txt
[ ] Join request ekranını oluştur
[ ] Paper plane icon/illustration alanı ekle
[ ] Seçili şirket bilgisini göster
[ ] Mesaj textarea alanı ekle
[ ] Talep Gönder butonu ekle
[ ] Talep gönderilince /auth/approval-pending route’una yönlendir
```

---

## 14.6 Approval Pending Screen

Route:

```txt
app/auth/approval-pending.tsx
```

Amaç:

Kullanıcıya talebin şirket yöneticisine gönderildiğini göstermek.

Hiyerarşi:

```txt
ApprovalPendingScreen
 ├─ CenteredIllustration
 ├─ Title
 ├─ Description
 └─ DoneButton
```

Todo:

```txt
[ ] Approval pending ekranını oluştur
[ ] Kum saati icon alanı ekle
[ ] “Onay Bekleniyor” başlığı ekle
[ ] Açıklama metni ekle
[ ] Tamam butonu ekle
[ ] Tamam ile login veya dashboard route’una yönlendir
```

---

## 14.7 Dashboard Screen

Route:

```txt
app/tabs/dashboard.tsx
```

Amaç:

Kullanıcının proje ve şirket durumunu hızlıca görmesi.

Hiyerarşi:

```txt
DashboardScreen
 ├─ DashboardHeader
 │   ├─ Greeting
 │   ├─ CompanyName
 │   └─ NotificationButton
 ├─ StatsGrid
 │   ├─ ActiveProjects
 │   ├─ PendingApprovals
 │   ├─ TotalContract
 │   └─ RemainingReceivable
 ├─ QuickActionsGrid
 │   ├─ NewProject
 │   ├─ Projects
 │   ├─ Finance
 │   ├─ PendingUsers
 │   ├─ Roles
 │   └─ Notifications
 ├─ RecentUpdatesPreview
 └─ BottomTabs
```

Componentler:

```txt
DashboardStatCard
DashboardQuickAction
NotificationItem
AppCard
AppAvatar
```

Todo:

```txt
[ ] Dashboard route oluştur
[ ] Kullanıcı selamlama alanı ekle
[ ] Şirket adını göster
[ ] Bildirim icon butonu ekle
[ ] 4 adet istatistik kartı oluştur
[ ] Hızlı işlem grid yapısı oluştur
[ ] Yeni Proje butonunu /projects/create route’una bağla
[ ] Projeler butonunu /tabs/projects route’una bağla
[ ] Finans butonunu /tabs/finance route’una bağla
[ ] Roller butonunu /tabs/roles route’una bağla
[ ] Bildirimler butonunu /notifications route’una bağla
```

---

## 14.8 Recent Updates Screen

Route:

```txt
app/dashboard/recent-updates.tsx
```

Amaç:

Son proje aktivitelerini ve ilerleme özetlerini gösterir.

Hiyerarşi:

```txt
RecentUpdatesScreen
 ├─ AppHeader
 ├─ UpdateList
 │   └─ NotificationItem[]
 └─ ProjectProgressSection
     └─ ProjectProgressCard[]
```

Todo:

```txt
[ ] Son güncellemeler ekranını oluştur
[ ] Notification mock datasından update listesi üret
[ ] Proje ilerleme kartları oluştur
[ ] “Tümünü Gör” aksiyonu ekle
```

---

## 14.9 Calendar Screen

Route:

```txt
app/dashboard/calendar.tsx
```

Amaç:

Proje teslimleri, toplantılar ve hatırlatmaları göstermek.

Hiyerarşi:

```txt
CalendarScreen
 ├─ AppHeader
 ├─ MonthSelector
 ├─ WeekCalendarStrip
 ├─ DailyScheduleList
 └─ ReminderSummaryCard
```

Todo:

```txt
[ ] Calendar route oluştur
[ ] calendar mock datası oluştur
[ ] Ay başlığı ekle
[ ] Haftalık gün strip componenti oluştur
[ ] Seçili günü primary daire ile göster
[ ] Günlük plan kartlarını listele
[ ] Hatırlatma özet kartı ekle
```

---

## 14.10 Notifications Screen

Route:

```txt
app/notifications/index.tsx
```

Amaç:

Kullanıcı bildirimlerini listelemek.

Hiyerarşi:

```txt
NotificationsScreen
 ├─ AppHeader
 │   └─ MarkAllAsReadButton
 ├─ FilterTabs
 │   ├─ All
 │   ├─ Unread
 │   └─ Read
 ├─ NotificationList
 └─ MarkAllButton
```

Todo:

```txt
[ ] Notifications route oluştur
[ ] notifications mock datası oluştur
[ ] All/Unread/Read filtrelerini ekle
[ ] NotificationItem componenti oluştur
[ ] Okunmamış bildirimlerde küçük primary dot göster
[ ] Tümünü Okundu Yap butonu ekle
```

---

## 14.11 Profile Screen

Route:

```txt
app/tabs/profile.tsx
```

Amaç:

Kullanıcı profil ve hesap ayarlarına erişim.

Hiyerarşi:

```txt
ProfileScreen
 ├─ ProfileHeaderCard
 │   ├─ Avatar
 │   ├─ Name
 │   ├─ Email
 │   └─ Role
 ├─ ProfileMenuList
 │   ├─ ProfileInfo
 │   ├─ CompanyInfo
 │   ├─ RolesAndPermissions
 │   ├─ NotificationPreferences
 │   ├─ Security
 │   └─ Settings
 └─ LogoutButton
```

Todo:

```txt
[ ] Profile tab ekranını oluştur
[ ] Avatar, isim, e-posta ve rol bilgisini göster
[ ] Menü listesi oluştur
[ ] Profil Bilgileri route’una bağla
[ ] Şirket Bilgileri route’una bağla
[ ] Rol ve İzinler route’una bağla
[ ] Bildirim Tercihleri route’una bağla
[ ] Güvenlik route’una bağla
[ ] Çıkış Yap butonunu danger olarak tasarla
```

---

## 14.12 Projects List Screen

Route:

```txt
app/tabs/projects.tsx
```

Amaç:

Tüm projeleri listelemek ve filtrelemek.

Hiyerarşi:

```txt
ProjectsScreen
 ├─ AppHeader
 ├─ SearchInput
 ├─ StatusFilterTabs
 │   ├─ All
 │   ├─ Active
 │   ├─ Planned
 │   └─ Completed
 ├─ ProjectList
 │   └─ ProjectCard[]
 └─ FloatingAddButton
```

ProjectCard içeriği:

```txt
Project Name
Client Name
Project Type
Status Badge
Priority Badge
Progress
Due Date
```

Todo:

```txt
[ ] Projects tab ekranını oluştur
[ ] projects mock datasını oluştur
[ ] Search input ekle
[ ] Status filter tabs ekle
[ ] ProjectCard componenti oluştur
[ ] Proje ilerleme barı göster
[ ] Status ve priority badge göster
[ ] Kart tıklanınca /projects/detail/[id] route’una git
[ ] Floating Yeni Proje butonu ekle
```

---

## 14.13 Project Create Screen

Route:

```txt
app/projects/create.tsx
```

Amaç:

Yeni proje oluşturma formu.

Hiyerarşi:

```txt
ProjectCreateScreen
 ├─ AppHeader
 ├─ StepIndicator
 ├─ ProjectForm
 │   ├─ ProjectNameInput
 │   ├─ ClientNameInput
 │   ├─ ProjectTypeSelect
 │   ├─ LocationInput
 │   └─ ResponsiblePersonSelect
 └─ ContinueButton
```

Todo:

```txt
[ ] Project create route oluştur
[ ] 4 adımlı form step indicator oluştur
[ ] Proje adı inputu ekle
[ ] Müşteri adı inputu ekle
[ ] Proje türü select alanı ekle
[ ] Lokasyon inputu ekle
[ ] Sorumlu kişi select alanı ekle
[ ] Devam Et butonu ekle
[ ] Mock submit sonrası proje detayına yönlendir
```

---

## 14.14 Project Detail Screen

Route:

```txt
app/projects/detail/[id].tsx
```

Amaç:

Seçilen projenin genel durumunu göstermek.

Hiyerarşi:

```txt
ProjectDetailScreen
 ├─ AppHeader
 ├─ ProjectSummaryCard
 │   ├─ ProjectName
 │   ├─ Client
 │   ├─ StatusBadge
 │   ├─ PriorityBadge
 │   ├─ ResponsiblePerson
 │   ├─ StartDate
 │   └─ DeliveryDate
 ├─ ProgressSection
 ├─ ShortcutGrid
 │   ├─ Departments
 │   ├─ Team
 │   ├─ Files
 │   └─ Messages
 └─ ProjectDescriptionCard
```

Todo:

```txt
[ ] Dynamic project detail route oluştur
[ ] Route id parametresine göre mock project bul
[ ] Proje bulunamazsa ErrorState göster
[ ] ProjectSummaryCard oluştur
[ ] Genel ilerleme barı göster
[ ] Bölümler, Ekip, Dosyalar, Mesajlar kısa yollarını ekle
[ ] Açıklama kartı ekle
```

---

## 14.15 Departments Screen

Route:

```txt
app/projects/departments/[id].tsx
```

Amaç:

Proje bölümlerinin ilerleme durumunu göstermek.

Hiyerarşi:

```txt
DepartmentsScreen
 ├─ AppHeader
 ├─ DepartmentList
 │   └─ DepartmentProgressItem[]
 └─ AddDepartmentButton
```

Bölümler:

```txt
Mimari
Statik
Mekanik
Elektrik
Harita
İzolasyon
```

Todo:

```txt
[ ] Departments route oluştur
[ ] Department mock datası oluştur
[ ] DepartmentProgressItem componenti oluştur
[ ] Her bölüm için icon, sorumlu kişi, progress bar ve yüzde göster
[ ] Yeni Bölüm Ekle butonu ekle
```

---

## 14.16 Project Team Screen

Route:

```txt
app/projects/team/[id].tsx
```

Amaç:

Proje ekibini görüntülemek.

Hiyerarşi:

```txt
ProjectTeamScreen
 ├─ AppHeader
 │   └─ InviteMemberAction
 ├─ TeamMemberList
 │   └─ TeamMemberRow[]
```

Todo:

```txt
[ ] Project team route oluştur
[ ] Team member mock datası oluştur
[ ] TeamMemberRow componenti oluştur
[ ] Avatar, isim, unvan ve rol göster
[ ] Üye davet et aksiyonu ekle
```

---

## 14.17 Project Files Screen

Route:

```txt
app/projects/files/[id].tsx
```

Amaç:

Projeye ait dosyaları listelemek.

Hiyerarşi:

```txt
FilesScreen
 ├─ AppHeader
 │   └─ FilterButton
 ├─ FileList
 │   └─ FileItem[]
 └─ UploadFileButton
```

Dosya türleri:

```txt
PDF
DWG
ZIP
DOCX
IMAGE
```

Todo:

```txt
[ ] Files route oluştur
[ ] files mock datası oluştur
[ ] FileItem componenti oluştur
[ ] Dosya türüne göre renkli icon göster
[ ] Dosya adı, tür, boyut ve tarih göster
[ ] Dosya yükle butonu ekle
```

---

## 14.18 Project Messages Screen

Route:

```txt
app/projects/messages/[id].tsx
```

Amaç:

Proje içi mesaj ve yorum akışını göstermek.

Hiyerarşi:

```txt
MessagesScreen
 ├─ AppHeader
 ├─ MessageList
 │   └─ MessageBubble[]
 ├─ AttachmentPreview
 └─ MessageInputBar
```

Todo:

```txt
[ ] Messages route oluştur
[ ] messages mock datası oluştur
[ ] MessageBubble componenti oluştur
[ ] Benim mesajlarımı sağda, diğerlerini solda göster
[ ] Dosya ekli mesaj görünümü ekle
[ ] Mesaj input alanı oluştur
[ ] Gönder butonu ekle
[ ] Mock state ile yeni mesaj ekleme simülasyonu yap
```

---

## 14.19 Finance Overview Screen

Route:

```txt
app/tabs/finance.tsx
```

Amaç:

Genel finans özetini göstermek.

Hiyerarşi:

```txt
FinanceOverviewScreen
 ├─ AppHeader
 ├─ FinanceSummaryCards
 │   ├─ TotalContract
 │   ├─ ReceivedMoney
 │   ├─ RemainingReceivable
 │   └─ TotalProfit
 ├─ ProjectFinanceList
 │   └─ FinanceProjectCard[]
 └─ BottomTabs
```

Todo:

```txt
[ ] Finance tab ekranını oluştur
[ ] finance mock datasını oluştur
[ ] Toplam Anlaşma kartı ekle
[ ] Alınan Para kartı ekle
[ ] Kalan Alacak kartı ekle
[ ] Toplam Kâr kartı ekle
[ ] Proje bazlı finans kartlarını listele
[ ] Kart tıklanınca /finance/detail/[id] route’una git
```

---

## 14.20 Finance Detail Screen

Route:

```txt
app/finance/detail/[id].tsx
```

Amaç:

Seçilen projenin finans detaylarını göstermek.

Hiyerarşi:

```txt
FinanceDetailScreen
 ├─ AppHeader
 ├─ ProjectStatusBadge
 ├─ FinanceInfoCard
 │   ├─ ContractAmount
 │   ├─ ArchitectPayment
 │   ├─ ReceivedAmount
 │   ├─ RemainingAmount
 │   └─ Profit
 ├─ PaymentHistoryList
 └─ AddPaymentButton
```

Todo:

```txt
[ ] Finance detail route oluştur
[ ] Finance id parametresine göre mock finance bul
[ ] Finans bulunamazsa ErrorState göster
[ ] Anlaşma tutarı göster
[ ] Müelliflere ödenecek tutarı göster
[ ] Alınan para göster
[ ] Kalan alacak göster
[ ] Kâr göster
[ ] Ödeme geçmişi listesini göster
[ ] Ödeme Ekle butonunu /finance/add-payment route’una bağla
```

---

## 14.21 Payment History Screen

Route:

```txt
app/finance/payment-history/[id].tsx
```

Amaç:

Bir projenin ödeme geçmişini listelemek.

Hiyerarşi:

```txt
PaymentHistoryScreen
 ├─ AppHeader
 ├─ PaymentHistoryList
 │   └─ PaymentHistoryItem[]
 └─ TotalReceivedCard
```

Todo:

```txt
[ ] Payment history route oluştur
[ ] PaymentHistoryItem componenti oluştur
[ ] Ödeme tarihi, yöntem ve tutar göster
[ ] Toplam alınan tutar kartı ekle
```

---

## 14.22 Add Payment Screen

Route:

```txt
app/finance/add-payment.tsx
```

Amaç:

Yeni ödeme eklemek.

Hiyerarşi:

```txt
AddPaymentScreen
 ├─ AppHeader
 ├─ PaymentForm
 │   ├─ ProjectSelect
 │   ├─ AmountInput
 │   ├─ PaymentDateInput
 │   ├─ PaymentMethodSelect
 │   └─ DescriptionTextarea
 └─ SaveButton
```

Todo:

```txt
[ ] Add payment route oluştur
[ ] Proje select alanı ekle
[ ] Tutar inputu ekle
[ ] Ödeme tarihi inputu ekle
[ ] Ödeme yöntemi select alanı ekle
[ ] Açıklama textarea alanı ekle
[ ] Kaydet butonu ekle
[ ] Mock submit sonrası finance detail ekranına dön
```

---

## 14.23 Pending Users Screen

Route:

```txt
app/users/pending.tsx
```

Amaç:

Şirkete katılmak isteyen kullanıcıları listelemek.

Hiyerarşi:

```txt
PendingUsersScreen
 ├─ AppHeader
 ├─ FilterTabs
 │   ├─ All
 │   ├─ Pending
 │   └─ Rejected
 ├─ PendingUserList
 │   └─ PendingUserCard[]
```

Todo:

```txt
[ ] Pending users route oluştur
[ ] pending users mock datası oluştur
[ ] Filter tabs ekle
[ ] PendingUserCard componenti oluştur
[ ] Kullanıcı adı, e-posta, talep edilen rol ve tarih göster
[ ] Kart tıklanınca /users/review/[id] route’una git
```

---

## 14.24 User Review Screen

Route:

```txt
app/users/review/[id].tsx
```

Amaç:

Katılım talebini detaylı incelemek.

Hiyerarşi:

```txt
UserReviewScreen
 ├─ AppHeader
 ├─ UserProfileCard
 ├─ RequestInfoCard
 └─ BottomActions
     ├─ RejectButton
     └─ ApproveButton
```

Todo:

```txt
[ ] User review route oluştur
[ ] User id parametresine göre mock user bul
[ ] Kullanıcı bulunamazsa ErrorState göster
[ ] Avatar, isim, e-posta, telefon göster
[ ] Talep bilgilerini göster
[ ] Reddet butonu ekle
[ ] Onayla butonu ekle
[ ] Onayla sonrası /users/assign-role/[id] route’una git
```

---

## 14.25 Assign Role Screen

Route:

```txt
app/users/assign-role/[id].tsx
```

Amaç:

Onaylanan kullanıcıya rol atamak.

Hiyerarşi:

```txt
AssignRoleScreen
 ├─ AppHeader
 ├─ UserSummaryCard
 ├─ RoleSelectionList
 │   └─ RoleCheckboxRow[]
 └─ ContinueButton
```

Todo:

```txt
[ ] Assign role route oluştur
[ ] Kullanıcı özet kartı göster
[ ] roles mock datasını listele
[ ] Çoklu rol seçimi için checkbox row oluştur
[ ] Seçili rolleri state’te tut
[ ] Devam Et butonu ile işlem tamamlandı simülasyonu yap
```

---

## 14.26 Roles List Screen

Route:

```txt
app/tabs/roles.tsx
```

Amaç:

Sistemdeki rolleri listelemek.

Hiyerarşi:

```txt
RolesScreen
 ├─ AppHeader
 ├─ RoleList
 │   └─ RoleCard[]
 └─ AddRoleButton
```

Todo:

```txt
[ ] Roles tab ekranını oluştur
[ ] roles mock datası oluştur
[ ] RoleCard componenti oluştur
[ ] Role icon, name ve user count göster
[ ] RoleCard tıklanınca /roles/detail/[id] route’una git
[ ] Yeni Rol Ekle butonu ekle
```

---

## 14.27 Role Detail Screen

Route:

```txt
app/roles/detail/[id].tsx
```

Amaç:

Bir rolün açıklamasını ve izinlerini göstermek.

Hiyerarşi:

```txt
RoleDetailScreen
 ├─ AppHeader
 ├─ RoleTitle
 ├─ Tabs
 │   ├─ Permissions
 │   └─ Users
 ├─ RoleInfoCard
 ├─ PermissionList
 │   └─ PermissionRow[]
 └─ EditButton
```

Todo:

```txt
[ ] Role detail route oluştur
[ ] Role id parametresine göre mock role bul
[ ] Rol bulunamazsa ErrorState göster
[ ] Rol açıklama kartı oluştur
[ ] İzinler ve kullanıcılar tab yapısı ekle
[ ] PermissionRow componenti oluştur
[ ] İzinleri checkbox/switch ile göster
[ ] Düzenle butonu ekle
```

---

## 14.28 Settings Screen

Route:

```txt
app/settings/index.tsx
```

Amaç:

Hesap, uygulama ve destek ayarlarını göstermek.

Hiyerarşi:

```txt
SettingsScreen
 ├─ AppHeader
 ├─ AccountSection
 │   ├─ ProfileInfo
 │   ├─ CompanyInfo
 │   └─ TwoFactorAuth
 ├─ AppSection
 │   ├─ NotificationPreferences
 │   ├─ Theme
 │   └─ Language
 ├─ SupportSection
 │   ├─ Help
 │   └─ About
 └─ BottomTabs
```

Todo:

```txt
[ ] Settings route oluştur
[ ] Bölümlü ayar listesi oluştur
[ ] Hesap bölümü ekle
[ ] Uygulama bölümü ekle
[ ] Destek bölümü ekle
[ ] Menü satırlarında icon + title + chevron kullan
[ ] Tema ve dil gibi değerleri sağ tarafta göster
```

---

## 14.29 Notification Preferences Screen

Route:

```txt
app/notifications/preferences.tsx
```

Amaç:

Bildirim tercihlerini yönetmek.

Hiyerarşi:

```txt
NotificationPreferencesScreen
 ├─ AppHeader
 ├─ SwitchList
 │   ├─ AllNotifications
 │   ├─ ProjectNotifications
 │   ├─ ProjectUpdates
 │   ├─ DepartmentUpdates
 │   ├─ CommentNotifications
 │   ├─ FinanceNotifications
 │   ├─ PaymentReminders
 │   ├─ DeliveryNotifications
 │   └─ SystemAnnouncements
```

Todo:

```txt
[ ] Notification preferences route oluştur
[ ] AppSwitchRow componenti oluştur
[ ] Tüm bildirimler switch’i ekle
[ ] Proje bildirimleri switch’i ekle
[ ] Bölüm güncellemeleri switch’i ekle
[ ] Yorum ve mesaj bildirimleri switch’i ekle
[ ] Finans bildirimleri switch’i ekle
[ ] Ödeme hatırlatmaları switch’i ekle
[ ] Sistem duyuruları switch’i ekle
[ ] Switch durumlarını local state ile yönet
```

---

## 14.30 No Permission Screen

Route:

```txt
app/states/no-permission.tsx
```

Amaç:

Yetkisiz erişim durumunda gösterilir.

Hiyerarşi:

```txt
NoPermissionScreen
 ├─ ShieldLockIcon
 ├─ Title
 ├─ Description
 └─ GoHomeButton
```

Todo:

```txt
[ ] No permission route oluştur
[ ] Büyük Shield/Lock icon göster
[ ] Başlık: Bu alana erişim yetkiniz yok
[ ] Açıklama metni ekle
[ ] Ana Sayfaya Dön butonu ekle
```

---

## 14.31 Empty State Screen

Route:

```txt
app/states/empty.tsx
```

Amaç:

İçerik olmayan durumlarda gösterilir.

Hiyerarşi:

```txt
EmptyStateScreen
 ├─ FolderIcon
 ├─ Title
 ├─ Description
 └─ CreateButton
```

Todo:

```txt
[ ] Empty state route oluştur
[ ] Folder icon göster
[ ] Başlık: Henüz veri yok
[ ] Açıklama metni ekle
[ ] Yeni Oluştur butonu ekle
```

---

## 14.32 Error State Screen

Route:

```txt
app/states/error.tsx
```

Amaç:

Hata durumunda gösterilir.

Hiyerarşi:

```txt
ErrorStateScreen
 ├─ AlertTriangleIcon
 ├─ Title
 ├─ Description
 └─ RetryButton
```

Todo:

```txt
[ ] Error state route oluştur
[ ] AlertTriangle icon göster
[ ] Başlık: Bir şeyler ters gitti
[ ] Açıklama metni ekle
[ ] Tekrar Dene butonu ekle
```

---

## 14.33 Loading State Screen

Route:

```txt
app/states/loading.tsx
```

Amaç:

Veri yüklenirken gösterilir.

Hiyerarşi:

```txt
LoadingScreen
 ├─ ActivityIndicator
 ├─ Title
 └─ Description
```

Todo:

```txt
[ ] Loading state route oluştur
[ ] Primary renkli spinner göster
[ ] Başlık: Yükleniyor
[ ] Açıklama: Lütfen bekleyiniz
```

---

## 14.34 Search Results Screen

Route:

```txt
app/states/search-results.tsx
```

Amaç:

Kullanıcının proje, kişi veya dosya aramasını göstermek.

Hiyerarşi:

```txt
SearchResultScreen
 ├─ SearchInput
 ├─ CancelButton
 ├─ ResultSections
 │   ├─ Projects
 │   ├─ Users
 │   └─ Files
 └─ ResultList
```

Todo:

```txt
[ ] Search results route oluştur
[ ] Search input ekle
[ ] Mock data içinde proje, kişi ve dosya araması yap
[ ] Sonuçları kategori bazlı göster
[ ] Sonuç yoksa EmptyState göster
```

---

## 14.35 Help & Support Screen

Route:

```txt
app/settings/support.tsx
```

Amaç:

Yardım ve destek seçeneklerini göstermek.

Hiyerarşi:

```txt
HelpSupportScreen
 ├─ AppHeader
 ├─ SupportMenu
 │   ├─ FAQ
 │   ├─ UserGuide
 │   ├─ LiveSupport
 │   └─ ContactUs
 └─ AppVersion
```

Todo:

```txt
[ ] Help support route oluştur
[ ] Sıkça Sorulan Sorular satırı ekle
[ ] Kullanım Kılavuzu satırı ekle
[ ] Canlı Destek satırı ekle
[ ] Bize Ulaşın satırı ekle
[ ] Uygulama sürümünü göster
```

---

# 15. Geliştirme Fazları

## Faz 1 — Proje Altyapısı

```txt
[ ] Expo + TypeScript projesini hazırla
[ ] Expo Router kurulumunu doğrula
[ ] app klasörünü oluştur
[ ] src klasörünü oluştur
[ ] theme dosyalarını oluştur
[ ] types dosyalarını oluştur
[ ] mock data dosyalarını oluştur
[ ] utils dosyalarını oluştur
[ ] global UI componentlerini oluştur
[ ] bottom tab navigation oluştur
```

Çıktı:

```txt
Çalışan boş uygulama
Dark theme aktif
Ana navigasyon hazır
Global component altyapısı hazır
```

---

## Faz 2 — Auth Flow

```txt
[ ] Welcome screen
[ ] Login screen
[ ] Register screen
[ ] Company Select screen
[ ] Join Request screen
[ ] Approval Pending screen
```

Çıktı:

```txt
Kullanıcı welcome → login → register → company select → join request → approval pending akışında gezinebilmeli.
Mock login ile dashboard açılmalı.
```

---

## Faz 3 — Main Tabs

```txt
[ ] Dashboard tab
[ ] Projects tab
[ ] Finance tab
[ ] Roles tab
[ ] Profile tab
[ ] Custom bottom tab bar
```

Çıktı:

```txt
Alt tablar arasında gezilebilir uygulama.
Dashboard, projeler, finans, roller ve profil ana ekranları görsel olarak tamam.
```

---

## Faz 4 — Project Flow

```txt
[ ] Projects List
[ ] Project Create
[ ] Project Detail
[ ] Departments
[ ] Project Team
[ ] Project Files
[ ] Project Messages
```

Çıktı:

```txt
Kullanıcı proje listesinden proje detayına gidebilmeli.
Bölümler, ekip, dosyalar ve mesajlar görüntülenebilmeli.
```

---

## Faz 5 — Finance Flow

```txt
[ ] Finance Overview
[ ] Finance Detail
[ ] Payment History
[ ] Add Payment
```

Çıktı:

```txt
Kullanıcı proje finanslarını görebilmeli.
Ödeme geçmişini inceleyebilmeli.
Mock ödeme ekleme ekranı çalışmalı.
```

---

## Faz 6 — Users & Roles Flow

```txt
[ ] Pending Users
[ ] User Review
[ ] Assign Role
[ ] Roles List
[ ] Role Detail
```

Çıktı:

```txt
Kullanıcı talepleri incelenebilmeli.
Rol atama ve rol detay ekranları mock data ile çalışmalı.
```

---

## Faz 7 — Settings & Support

```txt
[ ] Settings
[ ] Notification Preferences
[ ] Profile Info
[ ] Company Info
[ ] Security
[ ] Language
[ ] Theme
[ ] Help & Support
```

Çıktı:

```txt
Ayarlar ve destek akışı çalışmalı.
Bildirim tercihleri switch state ile yönetilmeli.
```

---

## Faz 8 — State Screens

```txt
[ ] No Permission
[ ] Empty State
[ ] Error State
[ ] Loading State
[ ] Search Results
```

Çıktı:

```txt
Uygulamanın boş, hata, yükleniyor, yetkisiz ve arama durumları hazır olmalı.
```

---

# 16. Sayfa Uygulama Sırasında Uyulacak Kurallar

Her sayfa geliştirilirken şu sıra izlenmelidir:

```txt
1. Route dosyasını oluştur.
2. Gerekli mock data var mı kontrol et.
3. Gerekli business component var mı kontrol et.
4. Yoksa componenti oluştur.
5. Ekran hiyerarşisini kur.
6. Theme renklerini kullan.
7. Iconları lucide-react-native’den al.
8. Navigation bağlantılarını ekle.
9. Empty/loading/error state düşün.
10. TypeScript hatası olmadığını kontrol et.
11. Expo’da ekranı test et.
12. Değişen dosyaları özetle.
```

---

# 17. Her Sayfa İçin Standart Kontrol Listesi

```txt
[ ] Ekran Expo’da açılıyor
[ ] TypeScript hatası yok
[ ] Navigation çalışıyor
[ ] Mock data doğru bağlandı
[ ] SafeArea doğru kullanıldı
[ ] Scroll taşması yok
[ ] Dark theme tutarlı
[ ] Card yapıları referans görselle uyumlu
[ ] Iconlar doğru
[ ] Button state’leri doğru
[ ] Text hierarchy okunabilir
[ ] Empty state düşünüldü
[ ] Error state düşünüldü
[ ] Loading state düşünüldü
[ ] Küçük telefon ekranında taşma yok
```

---

# 18. Cursor / Copilot / Codex İçin Ana Prompt

Aşağıdaki prompt doğrudan agent’a verilebilir.

```txt
Sen senior React Native mobile developer, senior product manager ve senior mobile UI/UX designer gibi davran.

Bu proje orta ölçekli mimarlık ofisleri için geliştirilecek mobil proje yönetimi uygulamasıdır. Şu anda sadece mobil frontend geliştirilecek. Backend entegrasyonu yapılmayacak. Tüm ekranlar mock data ile çalışmalıdır.

Teknoloji:
- React Native
- Expo
- TypeScript
- Expo Router
- lucide-react-native
- react-native-svg
- expo-linear-gradient
- Zustand veya local state
- React Hook Form ve Zod gerekirse kullanılabilir

Tasarım hedefi:
- Dark premium SaaS dashboard görünümü
- Koyu lacivert arka plan
- Mor/mavi primary aksan
- Yuvarlatılmış kartlar
- İnce borderlar
- Modern icon kullanımı
- Referans görsellerdeki mobil UI kalitesine yaklaşılmalı

Renkler:
- background: #07111F
- surface: #101B2D
- card: #111D30
- cardElevated: #17243A
- primary: #6255F6
- primaryLight: #7C6BFF
- success: #22C55E
- warning: #F59E0B
- danger: #EF4444
- text: #F8FAFC
- textMuted: #94A3B8
- border: rgba(148,163,184,0.16)

Önce şunları yap:
1. Mevcut proje klasör yapısını analiz et.
2. Eksikse app ve src klasörlerini oluştur.
3. Expo Router yapısını kur.
4. Theme dosyalarını oluştur.
5. Type dosyalarını oluştur.
6. Mock data dosyalarını oluştur.
7. Global UI componentlerini oluştur.
8. Custom bottom tab navigation oluştur.
9. Sonra ekranları faz faz geliştir.

Geliştirme sırası:
Faz 1: Proje altyapısı
Faz 2: Auth flow
Faz 3: Main tabs
Faz 4: Project flow
Faz 5: Finance flow
Faz 6: Users & Roles flow
Faz 7: Settings & Support
Faz 8: State screens

Kurallar:
- Önce todo list çıkar.
- Sonra küçük adımlarla uygula.
- Her ekranı tek tek geliştir.
- Mevcut mimariyi bozma.
- Tekrarlı kod yazma.
- Componentleri reusable tasarla.
- Mock data ile tüm sayfalar gezilebilir olsun.
- npm install ve npx expo start sonrası uygulama çalışmalı.
- Her işlem sonunda değişen dosyaları ve neden değiştiğini özetle.
```

---

# 19. Tek Sayfa Uygulama Prompt Şablonu

Her ekran için ayrı ayrı kullanılabilir.

```txt
Şimdi sadece [SAYFA ADI] ekranını geliştir.

Kurallar:
- Mevcut mimariyi bozma.
- Var olan theme ve component yapısını kullan.
- Gerekirse yalnızca eksik componentleri ekle.
- Mock data kullan.
- Görseldeki dark premium mimarlık ofisi uygulaması tasarımına sadık kal.
- Ekranda başlık, içerik, kart yapısı, iconlar, butonlar ve spacing profesyonel olmalı.
- Navigation bağlantıları çalışmalı.
- TypeScript hatası bırakma.

İş bittikten sonra şunları raporla:
1. Değişen dosyalar
2. Eklenen componentler
3. Kullanılan mock data
4. Sayfanın hangi route ile açıldığı
5. Bir sonraki önerilen adım
```

---

# 20. Görsel Kalite Standardı

Uygulama tamamlandığında şu kalite hedefleri sağlanmalıdır:

```txt
[ ] Her sayfa koyu premium tasarım çizgisinde
[ ] Kartlar rounded ve borderlı
[ ] Primary aksiyonlar gradient veya güçlü mor tonda
[ ] Başlıklar okunabilir
[ ] Sayfa içi hiyerarşi net
[ ] Status badge renkleri tutarlı
[ ] Finans alanlarında yeşil/kırmızı anlamlı kullanılmış
[ ] Bildirim ve uyarı durumları net
[ ] Bottom tab bar modern ve sade
[ ] Ekranlar mock data ile dolu
[ ] Boş görünen sayfa yok
[ ] Her route çalışıyor
[ ] Görsellerdeki ekran kalitesine yakın mobil UI elde edilmiş
```

---

# 21. Nihai Kabul Kriterleri

Proje tamamlandığında aşağıdaki maddeler sağlanmalıdır:

```txt
[ ] npm install sorunsuz çalışıyor
[ ] npx expo start sorunsuz çalışıyor
[ ] Auth flow gezilebilir
[ ] Dashboard açılıyor
[ ] Bottom tabs çalışıyor
[ ] Projeler listeleniyor
[ ] Proje detayına gidiliyor
[ ] Proje bölümleri görüntüleniyor
[ ] Proje ekibi görüntüleniyor
[ ] Proje dosyaları görüntüleniyor
[ ] Proje mesajları görüntüleniyor
[ ] Finans ekranları çalışıyor
[ ] Ödeme ekleme ekranı açılıyor
[ ] Kullanıcı talepleri listeleniyor
[ ] Kullanıcı inceleme ekranı çalışıyor
[ ] Rol atama ekranı çalışıyor
[ ] Roller listeleniyor
[ ] Rol detayları görüntüleniyor
[ ] Bildirimler listeleniyor
[ ] Bildirim tercihleri çalışıyor
[ ] Profil ekranı çalışıyor
[ ] Ayarlar ekranı çalışıyor
[ ] Destek ekranı çalışıyor
[ ] Empty/loading/error/no permission ekranları mevcut
[ ] TypeScript hatası yok
[ ] Tasarım referans görseller ile aynı premium seviyeye yakın
```

---

# 22. Önerilen Çalışma Stratejisi

Bu proje tek seferde tüm ekranlar yaptırılarak geliştirilmemelidir. En sağlıklı yol:

```txt
1. Theme + component sistemi
2. Mock data
3. Auth flow
4. Dashboard + bottom tabs
5. Project flow
6. Finance flow
7. User & role flow
8. Settings + support
9. State screens
10. Son görsel kalite iyileştirmesi
```

Her fazdan sonra:

```txt
[ ] Expo çalıştır
[ ] Ekranları gez
[ ] Görsel bozulma var mı kontrol et
[ ] TypeScript hatalarını temizle
[ ] Component tekrarlarını azalt
[ ] Sonra bir sonraki faza geç
```

---

# 23. Son Not

Bu dokümanın amacı, mimarlık ofisi proje yönetimi uygulamasını yalnızca görsel olarak değil, ürün yapısı, ekran akışı, component mimarisi, mock data düzeni ve frontend geliştirme süreci açısından da tamamlanabilir hale getirmektir.

Bu plana sadık kalındığında uygulama:

- Profesyonel görünecek
- Mock data ile gezilebilir olacak
- Backend’e bağlanmaya hazır olacak
- Component bazlı büyüyebilecek
- Orta ölçekli mimarlık ofisleri için anlamlı bir MVP seviyesine ulaşacaktır
