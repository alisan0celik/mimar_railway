-- Varsayılan imalat kalemleri, kodda Türkçe etiket yerine İngilizce anahtar
-- yazıldığı için "architecture", "static" gibi adlarla oluşmuştu. Kalem listesi
-- ilk kez bir ekranda göründüğü için bu ancak şimdi fark edildi.
-- Yalnızca kullanıcının elle değiştirmediği, birebir eşleşen adlar düzeltilir.
UPDATE "Section" SET "name" = 'Mimari'  WHERE "name" = 'architecture';
UPDATE "Section" SET "name" = 'Statik'  WHERE "name" = 'static';
UPDATE "Section" SET "name" = 'Mekanik' WHERE "name" = 'mechanical';
UPDATE "Section" SET "name" = 'Elektrik' WHERE "name" = 'electrical';
UPDATE "Section" SET "name" = 'Harita'  WHERE "name" = 'map';
UPDATE "Section" SET "name" = 'Jeoloji' WHERE "name" = 'geology';
