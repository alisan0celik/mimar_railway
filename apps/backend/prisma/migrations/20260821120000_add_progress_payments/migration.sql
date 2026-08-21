-- İmalat kalemlerine sözleşme payı ve ilerleme yüzdesi
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "progress" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Mevcut kayıtlarda durumdan makul bir ilerleme türet
UPDATE "Section" SET "progress" = 100 WHERE "status" = 'approved' AND "progress" = 0;
UPDATE "Section" SET "progress" = 90 WHERE "status" = 'review' AND "progress" = 0;
UPDATE "Section" SET "progress" = 50 WHERE "status" = 'in-progress' AND "progress" = 0;

CREATE TABLE IF NOT EXISTS "ProgressPayment" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cumulativeAmount" DOUBLE PRECISION NOT NULL,
    "previousAmount" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "progressPercent" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "note" TEXT,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProgressPayment_projectId_number_key" ON "ProgressPayment"("projectId", "number");
CREATE INDEX IF NOT EXISTS "ProgressPayment_companyId_idx" ON "ProgressPayment"("companyId");
CREATE INDEX IF NOT EXISTS "ProgressPayment_projectId_idx" ON "ProgressPayment"("projectId");

ALTER TABLE "ProgressPayment" ADD CONSTRAINT "ProgressPayment_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressPayment" ADD CONSTRAINT "ProgressPayment_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProgressPayment" ADD CONSTRAINT "ProgressPayment_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
