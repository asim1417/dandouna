import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'

const schema = z.object({
  fullName: z.string().trim().min(2, 'الاسم قصير جدًا'),
  email: z.string().email('البريد غير صحيح'),
  password: z.string().min(8, 'كلمة المرور ٨ أحرف على الأقل'),
  isMinor: z.boolean().optional().default(false),
})

// POST /api/auth/register — إنشاء حساب جديد
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? 'بيانات غير صالحة'
    return NextResponse.json({ error: first }, { status: 422 })
  }

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'هذا البريد مسجّل مسبقًا' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  // المسجّل هو ولي أمر يدير ملفات أطفاله
  const user = await prisma.user.create({
    data: {
      email,
      fullName: parsed.data.fullName,
      passwordHash,
      role: 'GUARDIAN',
    },
    select: { id: true },
  })

  await prisma.auditLog.create({
    data: { actorId: user.id, action: 'user.register', entity: 'User', entityId: user.id },
  })

  return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
}
