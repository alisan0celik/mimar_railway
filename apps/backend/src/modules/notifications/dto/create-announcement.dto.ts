import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateAnnouncementDto {
  /** Bildirimin başlığı; kilit ekranında tek satır görünür. */
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  title!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  message!: string;
}
