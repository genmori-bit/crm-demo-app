import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const [users, companies, activities, deals, tasks] = await Promise.all([p.user.count(), p.company.count(), p.activity.count(), p.deal.count(), p.task.count()]);
  console.log({ users, companies, activities, deals, tasks });
  await p.$disconnect();
}
main().catch(console.error);
