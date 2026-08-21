-- Şirket bazlı favori imalat kalemleri.
CREATE TABLE IF NOT EXISTS "CompanyWorkItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyWorkItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyWorkItem_companyId_name_key" ON "CompanyWorkItem"("companyId", "name");
CREATE INDEX IF NOT EXISTS "CompanyWorkItem_companyId_idx" ON "CompanyWorkItem"("companyId");

ALTER TABLE "CompanyWorkItem" ADD CONSTRAINT "CompanyWorkItem_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
