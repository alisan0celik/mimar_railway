import { IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateSectionDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

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

  /** Tamamlanma yüzdesi. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
