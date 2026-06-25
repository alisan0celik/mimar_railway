ALTER TYPE "AuthProvider" ADD VALUE IF NOT EXISTS 'MICROSOFT';

INSERT INTO "RolePermission" ("id", "roleId", "permission", "createdAt")
SELECT
  'mig_emp_task_' || r."id",
  r."id",
  'project.task.manage',
  CURRENT_TIMESTAMP
FROM "Role" r
WHERE r."code" LIKE 'office-employee-%'
ON CONFLICT ("roleId", "permission") DO NOTHING;

INSERT INTO "UserPermission" ("id", "userId", "permission", "granted", "createdAt")
SELECT DISTINCT
  'mig_emp_user_task_' || ur."userId",
  ur."userId",
  'project.task.manage',
  true,
  CURRENT_TIMESTAMP
FROM "UserRole" ur
JOIN "Role" r ON r."id" = ur."roleId"
WHERE r."code" LIKE 'office-employee-%'
ON CONFLICT ("userId", "permission") DO NOTHING;
