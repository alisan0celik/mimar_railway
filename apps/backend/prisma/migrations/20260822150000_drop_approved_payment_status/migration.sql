-- Hakedişte onay adımı kaldırıldı: taslak ya tahsil edilir ya iptal olur.
-- Onaylanmış kayıtlar taslağa döner; tutarları zaten hesaba katılıyordu.
UPDATE "ProgressPayment" SET "status" = 'draft' WHERE "status" = 'approved';
