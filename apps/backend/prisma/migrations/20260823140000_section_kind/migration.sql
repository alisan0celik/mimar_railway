-- İmalata bağlı olmayan alacak/borç satırları (iş artışı, fiyat farkı,
-- avans, ceza). Mevcut satırların tamamı imalat kalemi.
ALTER TABLE "Section" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'work';
