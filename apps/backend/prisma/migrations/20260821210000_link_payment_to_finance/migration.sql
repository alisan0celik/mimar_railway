-- Hakediş "ödendi" işaretlendiğinde oluşturulan tahsilat kaydının bağlantısı.
ALTER TABLE "ProgressPayment" ADD COLUMN IF NOT EXISTS "financeRecordId" TEXT;
