import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const schema = z.object({
  name: z.string().trim().min(2, 'الاسم قصير جدًا'),
  email: z.string().email('البريد غير صحيح'),
  password: z.string().min(8, 'كلمة المرور ٨ أحرف على الأقل'),
  ageBand: z.enum(['ADULT', 'MINOR']).default('ADULT'),
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'بيانات غير صالحة'
    return NextResponse.json({ error: first }, { status: 422 })
  }

  const { name, email, password, ageBand } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'هذا البريد مسجّل مسبقًا' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: { name, email, passwordHash, ageBand },
    select: { id: true, email: true, ageBand: true },
  })

  // القُصّر يحتاجون موافقة ولي أمر قبل بدء الاختبارات (المرحلة ١)
  return NextResponse.json(
    { ok: true, userId: user.id, needsGuardianConsent: user.ageBand === 'MINOR' },
    { status: 201 },
  )
}
