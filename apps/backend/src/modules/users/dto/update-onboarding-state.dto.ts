import { IsObject } from "class-validator";

export class UpdateOnboardingStateDto {
  @IsObject()
  onboardingState!: Record<string, unknown>;
}
