import { IsIn, IsString } from "class-validator";
import { SUPPORT_STATUSES } from "../support.constants";

export class UpdateTicketStatusDto {
  @IsString()
  @IsIn([...SUPPORT_STATUSES])
  status!: string;
}
