import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.classes.findMany({
    where: { is_active: true },
    select: { id: true, name: true, branch_id: true, branch: { select: { name: true } }, instructor: { select: { full_name: true } } }
  });
  console.log(classes);
}
main().finally(() => prisma.$disconnect());
