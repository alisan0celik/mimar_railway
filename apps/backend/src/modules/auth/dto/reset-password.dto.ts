import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6, { message: "Şifre en az 6 karakter olmalıdır" })
  newPassword!: string;
}
