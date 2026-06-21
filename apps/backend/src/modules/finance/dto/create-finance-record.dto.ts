import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max } from "class-validator";

export const FINANCE_MAX_AMOUNT = 999_999_999_999;

export class CreateFinanceRecordDto {
  @IsEnum(["collection", "consultant-payment", "expense"])
  type!: string;

  @IsNumber()
  @Min(0)
  @Max(FINANCE_MAX_AMOUNT)
  amount!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  paidBy?: string;

  @IsString()
  @IsOptional()
  projectId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
