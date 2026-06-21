# Project Instructions

Bu proje Expo + React Native + TypeScript + Expo Router ile geliştirilen mobil-first bir mimarlık ofisleri proje yönetim uygulamasıdır.

Uygulama mantığı:
- Kullanıcı kayıt olur.
- Kullanıcı katılmak istediği mimarlık ofisini/şirketi seçer.
- Kullanıcı şirkete katılım talebi gönderir.
- Şirket/ofis yetkilisi kullanıcıyı onaylar veya reddeder.
- Onaylanan kullanıcıya rol atanır.
- Kullanıcı sadece permission bazlı yetkili olduğu ekranları görür.
- Ana modüller: Auth, Company Join, Dashboard, Projects, Finance, Completed Projects, Users, Roles, Notifications, Settings.

Teknik yapı:
- Expo
- TypeScript
- Expo Router
- Feature-based architecture
- Mock data ile geliştirme
- Backend entegrasyonu daha sonra yapılacak

Klasör kuralları:
- app/ klasörü sadece Expo Router route dosyaları için kullanılmalı.
- Asıl ekran componentleri src/features altında olmalı.
- Ortak UI componentleri src/shared/ui altında olmalı.
- Tema değerleri src/shared/theme altında olmalı.
- Mock datalar src/shared/mocks altında olmalı.
- Permission sistemi src/shared/permissions altında olmalı.

Tasarım dili:
- Koyu tema
- Modern kurumsal görünüm
- Mavi/mor accent renk
- Yuvarlak kartlar
- Tutarlı typography
- Tutarlı spacing
- Tutarlı radius
- Mobil-first layout
- Web’de mobil container korunmalı
- Finans ve kullanıcı yönetimi ekranları sade, güven veren ve kurumsal olmalı

Kurallar:
- app-ui klasöründeki görseller sadece tasarım referansıdır.
- Görselleri doğrudan image/background olarak kullanma.
- Figma veya app-ui referanslarını React Native componentlerine çevir.
- Inline style minimum olsun.
- TypeScript strict uyumlu yaz.
- any kullanma.
- Role adına göre değil, permission koduna göre görünürlük sağla.
- Backend bağlantısı yapma.
- Paketleri gereksiz yükseltme.
- npm audit fix --force çalıştırma