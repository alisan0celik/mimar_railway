import { IsIn, IsISO8601, IsOptional, IsString, MaxLength } from "class-validator";

/**
 * Tutar bilerek alınmıyor — kalemin imalat ilerlemesinden hesaplanır, böylece
 * hakediş ile sahadaki gerçek ilerleme birbirinden ayrışamaz.
 */
export class CreateProgressPaymentDto {
  /** Hakedişin düzenleneceği imalat kalemi. */
  @IsString()
  sectionId!: string;

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
