import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.classes.findMany({
    take: 5,
    include: {
      branch: { select: { name: true } },
      category: { select: { name: true } },
      instructor: { select: { full_name: true } }
    }
  });
  console.log(JSON.stringify(classes, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
