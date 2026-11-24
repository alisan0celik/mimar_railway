import { IsIn, IsString, IsOptional } from "class-validator";
import { BUSINESS_TYPES } from "../../projects/work-item-templates";

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  /** Mimarlık ofisi, müteahhit ya da belediye — şablonu ve terimleri belirler. */
  @IsOptional()
  @IsIn([...BUSINESS_TYPES])
  businessType?: string;
}
