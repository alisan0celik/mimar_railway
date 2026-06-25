import { IsIn, IsString } from "class-validator";

export type SocialProvider = "GOOGLE" | "APPLE" | "MICROSOFT";

export class SocialLoginDto {
  @IsString()
  @IsIn(["GOOGLE", "APPLE", "MICROSOFT"], {
    message: "Saglayici GOOGLE, APPLE veya MICROSOFT olmalidir",
  })
  provider!: SocialProvider;

  @IsString()
  idToken!: string;
}
