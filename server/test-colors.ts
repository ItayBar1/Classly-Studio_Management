import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const classes = await prisma.classes.findMany({
    where: { instructor_id: "cfc29466-02b8-49b0-b283-5fc520f4bd74", is_active: true },
    select: { id: true, name: true, branch_id: true, location_room: true }
  });
  console.log(classes);
}
main().finally(() => prisma.$disconnect());
