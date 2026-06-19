import { IsEmail, IsString } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Geçerli bir e-posta adresi giriniz" })
  email!: string;

  @IsString()
  password!: string;
}
