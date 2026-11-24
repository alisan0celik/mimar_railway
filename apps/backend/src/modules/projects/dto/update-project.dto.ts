import { IsOptional, IsString, IsNumber, IsDateString, IsIn, IsNotEmpty, IsInt, Max, MaxLength, Min } from 'class-validator';

export class UpdateProjectDto {
  /** Gönderilmeyebilir, ama gönderildiyse boş olamaz: proje adsız kalırdı. */
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  name?: string;

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

  // --- Konum ve imar bilgisi ---

  /** Enlem; boylamla birlikte gönderilmeli. `null` ikisini birlikte temizler. */
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number | null;

  /** Mahalle. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  neighbourhood?: string | null;

  /** Ada numarası. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cadastralBlock?: string | null;

  /** Parsel numarası. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  cadastralParcel?: string | null;
}
