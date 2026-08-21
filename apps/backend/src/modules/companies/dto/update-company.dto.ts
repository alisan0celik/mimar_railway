import { IsIn, IsString, IsOptional } from "class-validator";

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

  /** Mimarlık ofisi mi, müteahhit mi — varsayılan imalat şablonunu belirler. */
  @IsOptional()
  @IsIn(["architecture", "contractor", "both"])
  businessType?: string;
}
