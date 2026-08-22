-- Kalemin taşerona maliyeti ve hakedişin yönü.
-- Müteahhit işverenden hakediş alır, aynı kalem için taşerona hakediş öder;
-- iki seri aynı kalem üzerinde ayrı numaralanır.
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "costAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "ProgressPayment" ADD COLUMN IF NOT EXISTS "direction" TEXT NOT NULL DEFAULT 'incoming';

DROP INDEX IF EXISTS "ProgressPayment_projectId_sectionId_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ProgressPayment_projectId_sectionId_direction_number_key"
    ON "ProgressPayment"("projectId", "sectionId", "direction", "number");
