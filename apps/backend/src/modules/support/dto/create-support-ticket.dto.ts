import { IsIn, IsString, MinLength } from "class-validator";
import { SUPPORT_CATEGORIES } from "../support.constants";

export class CreateSupportTicketDto {
  @IsString()
  @MinLength(3)
  subject!: string;

  @IsIn([...SUPPORT_CATEGORIES])
  category!: string;

  @IsString()
  @MinLength(10)
  message!: string;
}
