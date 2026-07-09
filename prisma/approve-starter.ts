// ============================================================
//  اعتماد مجموعة مقاييس أساسية للإطلاق (اختياري)
//  يجعل مقاييس عائلية عامة ظاهرة للمستخدم. البقية تبقى بانتظار
//  اعتماد مختص من لوحة الإدارة.
// ============================================================
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const STARTER = ["DOPA-CHILD-01", "DOPA-TEEN-01", "DOPA-FAMILY-01", "DOPA-FOCUS-01", "DOPA-SLEEP-01"];

async function main() {
  const res = await prisma.scale.updateMany({
    where: { code: { in: STARTER } },
    data: { approved: true, approvedAt: new Date() },
  });
  console.log(`✓ اعتُمدت ${res.count} مقاييس أساسية للإطلاق: ${STARTER.join(", ")}`);
  console.log("  البقية تبقى بانتظار اعتماد مختص من لوحة الإدارة.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
