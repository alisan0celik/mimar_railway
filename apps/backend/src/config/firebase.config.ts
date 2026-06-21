import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";

@Injectable()
export class FirebaseConfig implements OnModuleInit {
  private readonly logger = new Logger(FirebaseConfig.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>("FIREBASE_PROJECT_ID");
      const clientEmail = this.configService.get<string>("FIREBASE_CLIENT_EMAIL");
      const privateKey = this.configService
        .get<string>("FIREBASE_PRIVATE_KEY")
        ?.replace(/\\n/g, "\n");

      if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log("Firebase Admin SDK initialized");
      } else {
        this.logger.warn("Firebase credentials not found, running without Firebase");
      }
    }
  }

  get messaging(): admin.messaging.Messaging | null {
    if (admin.apps.length) {
      return admin.messaging();
    }
    return null;
  }

  get auth(): admin.auth.Auth | null {
    if (admin.apps.length) {
      return admin.auth();
    }
    return null;
  }
}
