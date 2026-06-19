import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max } from "class-validator";
import { FINANCE_MAX_AMOUNT } from "./create-finance-record.dto";

export class UpdateFinanceRecordDto {
  @IsEnum(["collection", "consultant-payment", "expense"])
  @IsOptional()
  type?: string;

  @IsNumber()
  @Min(0)
  @Max(FINANCE_MAX_AMOUNT)
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  paidBy?: string;

  @IsDateString()
  @IsOptional()
  date?: string;
}
