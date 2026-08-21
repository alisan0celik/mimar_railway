-- Hakediş artık imalat kalemi bazında düzenlenir: numaralandırma kalem
-- içinde yürür ("Mimari 1 No'lu Hakediş"). Eski proje geneli kayıtlar
-- sectionId NULL olarak kalır ve tarihçede görünmeye devam eder.
ALTER TABLE "ProgressPayment" ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

ALTER TABLE "ProgressPayment" DROP CONSTRAINT IF EXISTS "ProgressPayment_sectionId_fkey";
ALTER TABLE "ProgressPayment" ADD CONSTRAINT "ProgressPayment_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "ProgressPayment_projectId_number_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ProgressPayment_projectId_sectionId_number_key"
    ON "ProgressPayment"("projectId", "sectionId", "number");
