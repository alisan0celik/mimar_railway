-- Şirket bazlı favori yapılacaklar; yeni projelere otomatik eklenir.
CREATE TABLE IF NOT EXISTS "CompanyFavouriteTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyFavouriteTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyFavouriteTask_companyId_title_key" ON "CompanyFavouriteTask"("companyId", "title");
CREATE INDEX IF NOT EXISTS "CompanyFavouriteTask_companyId_idx" ON "CompanyFavouriteTask"("companyId");

ALTER TABLE "CompanyFavouriteTask" ADD CONSTRAINT "CompanyFavouriteTask_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
