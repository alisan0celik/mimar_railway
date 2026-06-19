-- Müellif/danışman ödemelerini gider tipine birleştir
UPDATE "FinanceRecord"
SET "type" = 'expense'
WHERE "type" = 'consultant-payment';
