-- Align office role permissions with company-role.constants.
-- UserPermission rows are resynced via: npm run prisma:resync-roles

DELETE FROM "RolePermission" rp
USING "Role" r
WHERE rp."roleId" = r."id"
  AND r."code" LIKE 'office-employee-%'
  AND rp."permission" IN (
    'finance.view',
    'finance.update',
    'finance.payment.create',
    'user.view',
    'user.approve',
    'user.reject',
    'user.role.assign',
    'user.remove',
    'role.view',
    'role.create',
    'role.update',
    'project.task.manage',
    'company.update'
  );

INSERT INTO "RolePermission" ("id", "roleId", "permission", "createdAt")
SELECT
  'mig_emp_' || r."id" || '_' || p.permission,
  r."id",
  p.permission,
  CURRENT_TIMESTAMP
FROM "Role" r
CROSS JOIN (
  VALUES
    ('project.view'),
    ('project.create'),
    ('project.update'),
    ('project.complete'),
    ('project.restore'),
    ('notification.view'),
    ('completed-project.view'),
    ('completed-project.restore'),
    ('company.join')
) AS p(permission)
WHERE r."code" LIKE 'office-employee-%'
ON CONFLICT ("roleId", "permission") DO NOTHING;

INSERT INTO "RolePermission" ("id", "roleId", "permission", "createdAt")
SELECT
  'mig_mgr_' || r."id" || '_project_task_manage',
  r."id",
  'project.task.manage',
  CURRENT_TIMESTAMP
FROM "Role" r
WHERE r."code" LIKE 'office-manager-%'
ON CONFLICT ("roleId", "permission") DO NOTHING;
