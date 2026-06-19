const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
      permissions: true,
      company: true,
    }
  });

  for (const user of users) {
    console.log(`User: ${user.email} | Name: ${user.fullName}`);
    console.log(`Company: ${user.company?.name}`);
    console.log(`Roles: ${user.roles.map(r => r.role.name).join(", ")}`);
    console.log(`Permissions: ${user.permissions.map(p => p.permission).join(", ")}`);
    console.log("-------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
