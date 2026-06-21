-- Drop global unique constraint on Role.code and add per-company uniqueness
DROP INDEX IF EXISTS "Role_code_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Role_companyId_code_key" ON "Role"("companyId", "code");
