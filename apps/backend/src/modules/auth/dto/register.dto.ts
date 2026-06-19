import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Şifre en az 6 karakter olmalıdır" })
  password!: string;

  @IsString()
  @MinLength(2, { message: "Ad soyad en az 2 karakter olmalıdır" })
  fullName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
