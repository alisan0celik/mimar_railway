import { IsIn, IsString } from "class-validator";

export class RegisterDeviceTokenDto {
  @IsString()
  token!: string;

  @IsIn(["ios", "android", "web"])
  platform!: string;
}

export class RemoveDeviceTokenDto {
  @IsString()
  token!: string;
}
