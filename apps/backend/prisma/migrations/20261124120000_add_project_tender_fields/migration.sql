-- Belediye modu: projeye kamu ihalesi bilgileri.
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "tenderNumber" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "contractDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "siteDeliveryDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "workDurationDays" INTEGER;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "extensionDays" INTEGER;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "provisionalAcceptanceDate" TIMESTAMP(3);
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "finalAcceptanceDate" TIMESTAMP(3);
