import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateSectionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  /** "work" imalat kalemi, "extra" imalata bağlı olmayan alacak/borç. */
  @IsOptional()
  @IsIn(["work", "extra"])
  kind?: string;

  /** İşverene satış bedeli (TL). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  /** Taşerona maliyeti (TL). */
  @IsOptional()
  @IsNumber()
  @Min(0)
  costAmount?: number;

  /**
   * Tamamlanma yüzdesi. Uygulamadan kaldırıldı; yalnızca eski sürümler
   * gönderiyor. Kabul edilmeye devam ediyor ki o sürümlerde kalem kaydetmek
   * (bilinmeyen alan reddedildiği için) bozulmasın.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
