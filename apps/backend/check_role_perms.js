const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    where: { name: "Ofis Çalışanı" },
    include: { permissions: true },
  });

  for (const role of roles) {
    console.log(`Role: ${role.name} | Code: ${role.code}`);
    console.log(`Permissions: ${role.permissions.map(p => p.permission).join(", ")}`);
    console.log("-------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
