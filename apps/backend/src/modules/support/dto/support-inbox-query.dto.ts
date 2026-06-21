import { IsOptional, IsString, IsIn } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from "../support.constants";

export class SupportInboxQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn([...SUPPORT_STATUSES])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn([...SUPPORT_CATEGORIES])
  category?: string;
}
