import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProgressPaymentDto {
  @IsOptional()
  @IsIn(["draft", "paid", "cancelled"])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsISO8601()
  issueDate?: string;
}
