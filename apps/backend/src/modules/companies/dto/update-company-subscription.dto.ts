import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class UpdateCompanySubscriptionDto {
  @IsOptional()
  @IsIn(["trial", "active", "expired", "blocked"])
  subscriptionStatus?: string;

  @IsOptional()
  @IsDateString()
  subscriptionEndsAt?: string | null;

  @IsOptional()
  @IsString()
  blockedReason?: string | null;
}
