import { IsNumber, Min, Max } from "class-validator";
import { FINANCE_MAX_AMOUNT } from "./create-finance-record.dto";

export class UpdateBudgetDto {
  @IsNumber()
  @Min(0)
  @Max(FINANCE_MAX_AMOUNT)
  budget!: number;
}
