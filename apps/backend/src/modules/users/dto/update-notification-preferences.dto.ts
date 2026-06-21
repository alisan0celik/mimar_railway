import { IsObject } from "class-validator";

export class UpdateNotificationPreferencesDto {
  @IsObject()
  notificationPreferences!: Record<string, boolean>;
}
