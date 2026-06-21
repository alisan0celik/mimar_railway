import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export const SWAGGER_BEARER_AUTH = "access-token";

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle("Mimar Platform API")
    .setDescription(
      [
        "Mimar Platform backend REST API dokümantasyonu.",
        "",
        "**Kimlik doğrulama:** Korumalı endpoint'ler için `Authorization: Bearer <accessToken>` header'ı gönderin.",
        "Access token `POST /api/auth/login` veya `POST /api/auth/register` yanıtından alınır.",
        "Token süresi dolduğunda `POST /api/auth/refresh` ile yenileyin.",
        "",
        "**Çoklu kiracı:** Birçok endpoint aktif şirket bağlamı (`companyId`) ve onay durumu gerektirir.",
        "**Yetkilendirme:** Rol tabanlı izinler (`PermissionsGuard`) endpoint bazında uygulanır.",
      ].join("\n"),
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT access token — login/register yanıtındaki accessToken değeri",
      },
      SWAGGER_BEARER_AUTH,
    )
    .addTag("Auth", "Kayıt, giriş, token yenileme ve şifre sıfırlama")
    .addTag("Users", "Kullanıcı profili ve şirket üyeleri")
    .addTag("Companies", "Şirket yönetimi ve katılım talepleri")
    .addTag("Projects", "Proje, görev, dosya ve ekip yönetimi")
    .addTag("Roles", "Rol ve izin yönetimi")
    .addTag("Notifications", "Bildirimler ve cihaz token kaydı")
    .addTag("Calendar", "Takvim etkinlikleri")
    .addTag("Finance", "Finans kayıtları ve bütçe")
    .addTag("Support", "Destek talepleri")
    .addTag("Sync", "Çevrimdışı senkronizasyon (pull/push)")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup("api/docs", app, document, {
    jsonDocumentUrl: "api/docs-json",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "Mimar Platform API Docs",
  });
}
