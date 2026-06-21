const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Removing role.view from Ofis Çalışanı roles...");
  
  const officeRoles = await prisma.role.findMany({
    where: { name: "Ofis Çalışanı" },
  });

  for (const role of officeRoles) {
    // Delete role.view from this role's permissions
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permission: "role.view",
      },
    });
    console.log(`Removed role.view from role ${role.id}`);

    // Get all users who have this role
    const userRoles = await prisma.userRole.findMany({
      where: { roleId: role.id },
    });

    for (const ur of userRoles) {
      // Remove role.view from the user's direct permissions as well
      await prisma.userPermission.deleteMany({
        where: {
          userId: ur.userId,
          permission: "role.view",
        },
      });
      console.log(`Removed role.view from user ${ur.userId}`);
    }
  }

  console.log("Migration complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
