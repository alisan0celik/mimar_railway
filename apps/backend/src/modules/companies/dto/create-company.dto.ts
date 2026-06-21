import { IsString, MinLength, IsOptional } from "class-validator";

export class CreateCompanyDto {
  @IsString()
  @MinLength(2, { message: "Şirket adı en az 2 karakter olmalıdır" })
  name!: string;

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
}
