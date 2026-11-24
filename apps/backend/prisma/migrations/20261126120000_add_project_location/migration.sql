-- Proje konumu (harita noktası) ve imar bilgisi (mahalle, ada, parsel).
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "neighbourhood" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "cadastralBlock" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "cadastralParcel" TEXT;
