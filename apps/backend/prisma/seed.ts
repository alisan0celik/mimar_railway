import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

const PERMISSIONS = [
  "project.view", "project.create", "project.update", "project.task.manage",
  "project.complete", "project.restore",
  "finance.view", "finance.update", "finance.payment.create",
  "user.view", "user.approve", "user.reject", "user.role.assign", "user.remove",
  "role.view", "role.create", "role.update",
  "notification.view",
  "completed-project.view", "completed-project.restore",
  "company.join", "company.update",
];

const OFFICE_MANAGER_PERMISSIONS = [...PERMISSIONS];

const OFFICE_EMPLOYEE_PERMISSIONS = PERMISSIONS.filter(
  (p) =>
    ![
      "finance.view",
      "finance.update",
      "finance.payment.create",
      "user.view",
      "user.approve",
      "user.reject",
      "user.role.assign",
      "user.remove",
      "role.view",
      "role.create",
      "role.update",
      "project.task.manage",
      "company.update",
    ].includes(p),
);

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const company = await prisma.company.create({
    data: {
      name: "Mimar Yapı Teknoloji",
      description: "Modern mimarlık proje ofisi",
      city: "İstanbul",
      status: "active",
      logoInitials: "MY",
      owner: {
        create: {
          email: "admin@mimar.com",
          passwordHash: hashedPassword,
          fullName: "Admin Kullanıcı",
          approvalStatus: "approved",
          title: "Ofis Sahibi",
        },
      },
    },
    include: { owner: true },
  });

  const ownerRole = await prisma.role.create({
    data: {
      name: "Ofis Sahibi",
      code: `owner-${company.id.slice(-6)}`,
      description: "Tam yetkili ofis sahibi",
      icon: "shield-crown",
      color: "#FFD700",
      companyId: company.id,
      permissions: {
        create: PERMISSIONS.map((perm) => ({
          permission: perm,
        })),
      },
    },
  });

  await prisma.userRole.create({
    data: {
      userId: company.owner.id,
      roleId: ownerRole.id,
    },
  });

  await prisma.userPermission.createMany({
    data: PERMISSIONS.map((perm) => ({
      userId: company.owner.id,
      permission: perm,
    })),
  });

  const officeManagerRole = await prisma.role.create({
    data: {
      name: "Ofis Yöneticisi",
      code: `office-manager-${company.id.slice(-6)}`,
      description: "Finans ve kullanıcı yönetimi dahil tüm yetkilere sahiptir",
      icon: "account-tie",
      color: "#2563EB",
      companyId: company.id,
      permissions: {
        create: OFFICE_MANAGER_PERMISSIONS.map((perm) => ({
          permission: perm,
        })),
      },
    },
  });

  const officeEmployeeRole = await prisma.role.create({
    data: {
      name: "Ofis Çalışanı",
      code: `office-employee-${company.id.slice(-6)}`,
      description: "Finans, kullanıcı onay ve rol yönetimi hariç temel yetkilere sahiptir",
      icon: "account",
      color: "#10B981",
      companyId: company.id,
      permissions: {
        create: OFFICE_EMPLOYEE_PERMISSIONS.map((perm) => ({
          permission: perm,
        })),
      },
    },
  });

  await prisma.user.update({
    where: { id: company.owner.id },
    data: { companyId: company.id },
  });

  console.log("Seed completed successfully");
  console.log(`Admin email: admin@mimar.com`);
  console.log(`Admin password: 123456`);
  console.log(`Roles created: ${ownerRole.name}, ${officeManagerRole.name}, ${officeEmployeeRole.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
