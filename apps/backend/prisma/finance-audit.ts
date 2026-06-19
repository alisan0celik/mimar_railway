import { PrismaClient } from "@prisma/client";

const MAX_AMOUNT = 999_999_999_999;

async function main() {
  const prisma = new PrismaClient();

  try {
    const records = await prisma.financeRecord.findMany({
      where: {
        OR: [{ amount: { lt: 0 } }, { amount: { gt: MAX_AMOUNT } }],
      },
      include: {
        project: { select: { name: true } },
        company: { select: { name: true } },
      },
      orderBy: { amount: "desc" },
    });

    if (records.length === 0) {
      console.log("Anormal tutarlı finans kaydı bulunamadı.");
      return;
    }

    console.log(`${records.length} anormal kayıt bulundu (limit: ${MAX_AMOUNT}):\n`);
    for (const record of records) {
      console.log(
        `- ${record.id} | ${record.company.name} / ${record.project?.name ?? "—"} | ${record.type} | ₺${record.amount.toLocaleString("tr-TR")}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
