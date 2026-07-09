import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("البريد غير صحيح"),
  fullName: z.string().trim().min(2).optional(),
})

// POST /api/auth/otp — توليد رمز تحقق وإرساله للبريد
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "البريد غير صحيح" }, { status: 422 });
  }
  const email = parsed.data.email.toLowerCase();

  // رمز من ٦ أرقام
  const code = String(Math.floor(100000 + secureRandom() * 900000));
  const tokenHash = await bcrypt.hash(code, 10);
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  // نظّف الرموز السابقة لهذا البريد ثم أنشئ رمزًا جديدًا
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token: tokenHash, expires },
  });

  const result = await sendOtpEmail(email, code);

  return NextResponse.json({
    ok: true,
    delivered: result.delivered,
    // في التطوير بلا مزوّد بريد، نعيد الرمز لتسهيل التجربة العائلية
    devCode: result.devCode,
  });
}

// عشوائية كافية بلا Math.random المحظور في بعض البيئات
function secureRandom(): number {
  const arr = new Uint32Array(1);
  globalThis.crypto.getRandomValues(arr);
  return arr[0] / 0xffffffff;
}
