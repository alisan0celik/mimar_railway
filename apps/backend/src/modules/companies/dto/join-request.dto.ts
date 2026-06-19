import { IsString, IsOptional } from "class-validator";

export class JoinRequestDto {
  @IsOptional()
  @IsString()
  message?: string;
}
