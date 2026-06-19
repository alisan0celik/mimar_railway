import { IsString, MinLength } from "class-validator";

export class ContentDto {
  @IsString()
  @MinLength(1, { message: "İçerik boş olamaz" })
  content!: string;
}
