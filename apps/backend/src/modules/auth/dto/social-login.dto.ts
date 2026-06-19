import { IsString, IsIn } from "class-validator";

export class SocialLoginDto {
  @IsString()
  @IsIn(["GOOGLE", "APPLE"], { message: "Sağlayıcı GOOGLE veya APPLE olmalıdır" })
  provider!: "GOOGLE" | "APPLE";

  @IsString()
  idToken!: string;
}
