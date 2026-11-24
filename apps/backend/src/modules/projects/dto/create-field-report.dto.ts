import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateFieldReportDto {
  /**
   * Uygulamanın rapora verdiği kimlik. İnternet yokken yazılan rapor sonradan
   * gönderiliyor; gönderim yarıda kalıp tekrarlanırsa ikinci kayıt oluşmaz.
   */
  @Matches(/^[A-Za-z0-9_-]{8,64}$/)
  clientId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  note!: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  /** Raporun sahada yazıldığı an. */
  @IsDateString()
  observedAt!: string;
}

export class AddFieldReportPhotoDto {
  /** Uygulamanın fotoğrafa verdiği kimlik; aynı fotoğraf iki kez eklenmez. */
  @Matches(/^[A-Za-z0-9_-]{8,64}$/)
  clientPhotoId!: string;
}
