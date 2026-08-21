-- Etkinliğe gerçek başlangıç/bitiş anı eklenir. Eskiden yalnızca `date`
-- (gün) ve serbest metin `time` vardı; cihaz takvimine yazmak için ikisi de
-- yetersizdi. Eski istemciler `date`/`time` okumaya devam ettiği için o
-- sütunlar kaldırılmadı.
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3);
ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);

-- Mevcut kayıtları doldur: "14:30" biçimindeki saati güne ekle, bitişi
-- bir saat sonrası kabul et. Saat okunamıyorsa günün başlangıcı kullanılır.
UPDATE "CalendarEvent"
SET "startsAt" = "date"
      + COALESCE(NULLIF(split_part("time", ':', 1), '')::int, 0) * INTERVAL '1 hour'
      + COALESCE(NULLIF(split_part("time", ':', 2), '')::int, 0) * INTERVAL '1 minute'
WHERE "startsAt" IS NULL AND "time" ~ '^[0-9]{1,2}:[0-9]{2}';

UPDATE "CalendarEvent" SET "startsAt" = "date" WHERE "startsAt" IS NULL;
UPDATE "CalendarEvent" SET "endsAt" = "startsAt" + INTERVAL '1 hour' WHERE "endsAt" IS NULL;
