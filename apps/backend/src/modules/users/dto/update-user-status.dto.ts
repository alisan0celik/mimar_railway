import { IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";

export class UpdateUserStatusDto {
  @IsString()
  status!: string;

  @ValidateIf((dto: UpdateUserStatusDto) => dto.status === "approved")
  @IsString()
  @IsNotEmpty()
  roleId?: string;
}
