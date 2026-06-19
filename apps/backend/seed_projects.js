const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found.");
    return;
  }
  
  const owner = await prisma.user.findUnique({ where: { id: company.ownerId }});

  console.log(`Seeding projects for company ${company.name}...`);
  
  const p1 = await prisma.project.create({
    data: {
      name: "Yıldız Konut Projesi",
      description: "Yıldız İnşaat A.Ş. için konut projesi",
      budget: 2850000,
      companyId: company.id,
      createdById: owner.id,
    }
  });

  const p2 = await prisma.project.create({
    data: {
      name: "Koru Ofis Binası",
      description: "Koru Gayrimenkul ofis binası",
      budget: 1650000,
      companyId: company.id,
      createdById: owner.id,
    }
  });

  console.log("Projects seeded:", p1.id, p2.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
