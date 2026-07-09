// ============================================================
//  بيانات تمهيدية (Seed) — حسابات ومؤسسة تجريبية فقط
//  المحتوى العلمي (المراجع والمقاييس) يُستورد عبر: npm run db:import
//  لا بيانات حقيقية في التطوير (شرط PDPL)
// ============================================================
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  console.log("→ بدء التهيئة…");
  const pass = await bcrypt.hash("Dandouna#1447", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dandouna.local" },
    update: {},
    create: { email: "admin@dandouna.local", fullName: "مدير النظام", role: "ADMIN", passwordHash: pass },
  });
  const guardian = await prisma.user.upsert({
    where: { email: "guardian@dandouna.local" },
    update: {},
    create: { email: "guardian@dandouna.local", fullName: "ولي الأمر", role: "GUARDIAN", passwordHash: pass },
  });
  await prisma.user.upsert({
    where: { email: "editor@dandouna.local" },
    update: {},
    create: { email: "editor@dandouna.local", fullName: "مشرف المحتوى", role: "CONTENT_EDITOR", passwordHash: pass },
  });
  await prisma.user.upsert({
    where: { email: "specialist@dandouna.local" },
    update: {},
    create: { email: "specialist@dandouna.local", fullName: "المختص", role: "SPECIALIST", passwordHash: pass },
  });

  // ملف طفل + موافقة
  let child = await prisma.child.findFirst({ where: { guardianId: guardian.id, fullName: "سارة" } });
  if (!child) {
    child = await prisma.child.create({
      data: { guardianId: guardian.id, fullName: "سارة", birthDate: new Date("2013-01-01"), gender: "أنثى", avatarColor: "#F74A80" },
    });
  }
  if (!(await prisma.consent.findFirst({ where: { childId: child.id } }))) {
    await prisma.consent.create({
      data: { childId: child.id, grantedById: guardian.id, purpose: "أداء مقاييس التقييم السلوكي", status: "GRANTED", grantedAt: new Date() },
    });
  }

  // شركة تجريبية + عضوية
  if (!(await prisma.organization.findFirst({ where: { name: "شركة أفق التقنية" } }))) {
    const org = await prisma.organization.create({ data: { name: "شركة أفق التقنية", type: "COMPANY", seats: 50 } });
    await prisma.membership.upsert({
      where: { userId_orgId: { userId: guardian.id, orgId: org.id } },
      update: {},
      create: { userId: guardian.id, orgId: org.id, roleInOrg: "COMPANY" },
    });
  }

  console.log("✓ اكتملت التهيئة (حسابات + طفل + شركة)");
  console.log("  admin@ · guardian@ · editor@ · specialist@dandouna.local · كلمة المرور: Dandouna#1447");
  console.log("  ▸ لاستيراد المقاييس والمراجع: npm run db:import");
  void admin;
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
