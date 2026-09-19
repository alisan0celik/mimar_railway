import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateProgressPaymentDto {
  /** Hakedişin düzenleneceği imalat kalemi. */
  @IsString()
  sectionId!: string;

  /**
   * Hakediş tutarı (TL). Kalemin o yöndeki kalan bedelini aşamaz.
   *
   * Gönderilmezse tutar eskisi gibi ilerleme yüzdesinden hesaplanır: ilerleme
   * kaldırılmadan önceki uygulama sürümleri tutar göndermiyor ve güncelleyene
   * kadar hakediş kesebilmeleri gerekiyor.
   */
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  /**
   * "incoming" işverenden alınan, "outgoing" taşerona ödenen hakediş.
   * Belirtilmezse işveren hakedişi kabul edilir.
   */
  @IsOptional()
  @IsIn(["incoming", "outgoing"])
  direction?: string;

  /**
   * "paid" gönderilirse hakediş doğrudan tahsil edilmiş sayılır ve finans
   * kaydı aynı anda oluşur. Uygulama tek dokunuşla ödeme yaptığı için
   * varsayılan da budur; taslak akışı isteyen "draft" gönderir.
   */
  @IsOptional()
  @IsIn(["draft", "paid"])
  status?: string;

  @IsOptional()
  @IsISO8601()
  issueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
