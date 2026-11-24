import { ArrayMaxSize, IsArray, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsIn, IsInt, Max, MaxLength, Min } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  projectType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  hasInspection?: boolean;

  @IsOptional()
  @IsString()
  inspectionCompany?: string;

  @IsOptional()
  @IsIn(["planning", "active", "waiting", "completed"])
  status?: string;

  @IsOptional()
  @IsIn(["low", "medium", "high", "urgent"])
  priority?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  // --- Kamu ihalesi (belediye modu) ---

  /** İhale kayıt numarası (İKN), ör. "2026/123456". Boş metin alanı temizler. */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tenderNumber?: string | null;

  @IsOptional()
  @IsDateString()
  contractDate?: string | null;

  /** Yer teslim tarihi: işin süresi bu günden itibaren işler. */
  @IsOptional()
  @IsDateString()
  siteDeliveryDate?: string | null;

  /** Sözleşmedeki iş süresi, takvim günü. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(36500)
  workDurationDays?: number | null;

  /** Verilen süre uzatımlarının toplamı, takvim günü. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(36500)
  extensionDays?: number | null;

  @IsOptional()
  @IsDateString()
  provisionalAcceptanceDate?: string | null;

  @IsOptional()
  @IsDateString()
  finalAcceptanceDate?: string | null;

  /**
   * Proje açılırken oluşturulacak imalat kalemlerinin adları.
   * Gönderilmezse şirketin iş koluna göre varsayılan şablon kullanılır.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  workItems?: string[];
}
