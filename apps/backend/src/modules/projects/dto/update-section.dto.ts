import { IsOptional, IsString } from "class-validator";

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
