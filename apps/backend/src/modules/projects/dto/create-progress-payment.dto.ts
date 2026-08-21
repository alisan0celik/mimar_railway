import { IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Tutar bilerek alınmıyor — imalat ilerlemesinden hesaplanır, böylece
 * hakediş ile sahadaki gerçek ilerleme birbirinden ayrışamaz.
 */
export class CreateProgressPaymentDto {
  @IsOptional()
  @IsISO8601()
  issueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
