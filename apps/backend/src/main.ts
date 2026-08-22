import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { join } from "path";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { setupSwagger } from "./config/swagger.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger("Bootstrap");

  // Şifre sıfırlama sayfası e-postadaki bağlantıdan açılıyor; insanlara giden
  // bir adres olduğu için /api önekinin dışında tutulur.
  app.setGlobalPrefix("api", { exclude: ["reset-password"] });
  app.useWebSocketAdapter(new IoAdapter(app));
  app.useStaticAssets(process.env.UPLOAD_DIR || join(process.cwd(), "uploads"), {
    prefix: "/api/uploads/",
  });

  const corsOrigins = process.env.CORS_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins?.length
      ? corsOrigins
      : process.env.NODE_ENV === "production"
        ? false
        : true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  if (process.env.NODE_ENV !== "production" || process.env.ENABLE_SWAGGER === "true") {
    setupSwagger(app);
    logger.log("Swagger UI: /api/docs");
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
// Triggered restart for CORS fix
