-- Saha raporları: sahada yazılan not, konum ve fotoğraflar.
CREATE TABLE IF NOT EXISTS "FieldReport" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "title" TEXT,
    "note" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FieldReportPhoto" (
    "id" TEXT NOT NULL,
    "clientPhotoId" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldReportPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FieldReport_projectId_idx" ON "FieldReport"("projectId");
CREATE UNIQUE INDEX IF NOT EXISTS "FieldReport_companyId_clientId_key" ON "FieldReport"("companyId", "clientId");
CREATE INDEX IF NOT EXISTS "FieldReportPhoto_reportId_idx" ON "FieldReportPhoto"("reportId");
CREATE UNIQUE INDEX IF NOT EXISTS "FieldReportPhoto_reportId_clientPhotoId_key" ON "FieldReportPhoto"("reportId", "clientPhotoId");

ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FieldReport" ADD CONSTRAINT "FieldReport_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FieldReportPhoto" ADD CONSTRAINT "FieldReportPhoto_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "FieldReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
