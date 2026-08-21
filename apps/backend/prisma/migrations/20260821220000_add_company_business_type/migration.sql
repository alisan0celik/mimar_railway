-- Şirketin iş kolu: mimarlık ofisi, müteahhit veya her ikisi.
-- Mevcut şirketler mimarlık varsayılanıyla kalır; davranışları değişmez.
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "businessType" TEXT NOT NULL DEFAULT 'architecture';
