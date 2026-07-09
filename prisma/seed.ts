import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // مدير أولي — غيّر البريد وكلمة المرور بعد أول دخول
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@dandouna.sa'
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe#12345'

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'مدير دندونة',
      email: adminEmail,
      role: 'ADMIN',
      passwordHash: await bcrypt.hash(adminPass, 12),
    },
  })

  // مقياس تجريبي أولي
  await prisma.scale.upsert({
    where: { slug: 'balance-basic' },
    update: {},
    create: {
      slug: 'balance-basic',
      title: 'مؤشر التوازن التحفيزي (مبدئي)',
      description: 'مقياس تجريبي لقياس التوازن التحفيزي اليومي.',
      questions: {
        create: [
          { order: 1, text: 'أشعر بأن يومي منظّم ومتوازن.', type: 'LIKERT' },
          { order: 2, text: 'أجد دافعًا للقيام بمهامي اليومية.', type: 'LIKERT' },
          { order: 3, text: 'أخصّص وقتًا لما يريحني ويسعدني.', type: 'LIKERT' },
        ],
      },
    },
  })

  console.log('✔ تمت تهيئة البيانات الأولية (مدير + مقياس تجريبي)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
