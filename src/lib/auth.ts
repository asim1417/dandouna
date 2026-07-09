// ============================================================
//  إعداد المصادقة (Auth.js v5)
//  دخول بكلمة مرور + مزوّد Google (اختياري) — جلسات JWT
//  ملاحظة: مزوّد Credentials في Auth.js v5 يتطلب استراتيجية JWT،
//  لذا نُثري الرمز (token) بالدور وحالة القاصر بدل جلسة قاعدة البيانات.
// ============================================================
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/lib/rbac";

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    credentials: {
      email: { label: "البريد", type: "email" },
      password: { label: "كلمة المرور", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email ?? "").toLowerCase();
      const password = String(creds?.password ?? "");
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || user.deletedAt) return null;

      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return null;

      return { id: user.id, name: user.fullName, email: user.email ?? undefined };
    },
  }),
  // دخول برمز التحقق (OTP) عبر البريد — يُنشئ ولي أمر جديد عند أول دخول
  Credentials({
    id: "email-otp",
    credentials: {
      email: { label: "البريد", type: "email" },
      code: { label: "الرمز", type: "text" },
      fullName: { label: "الاسم", type: "text" },
    },
    async authorize(creds) {
      const email = String(creds?.email ?? "").toLowerCase();
      const code = String(creds?.code ?? "");
      const fullName = String(creds?.fullName ?? "").trim();
      if (!email || code.length !== 6) return null;

      // تحقق من رمز غير منتهٍ
      const tokens = await prisma.verificationToken.findMany({
        where: { identifier: email, expires: { gt: new Date() } },
      });
      let matched = null as null | { token: string };
      for (const t of tokens) {
        if (await bcrypt.compare(code, t.token)) {
          matched = t;
          break;
        }
      }
      if (!matched) return null;

      // استهلاك الرمز
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });

      // أنشئ ولي الأمر إن لم يكن موجودًا
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: { email, fullName: fullName || email.split("@")[0], role: "GUARDIAN", emailVerified: new Date() },
        });
        await prisma.auditLog.create({
          data: { actorId: user.id, action: "user.register.otp", entity: "User", entityId: user.id },
        });
      } else if (user.deletedAt) {
        return null;
      }

      return { id: user.id, name: user.fullName, email: user.email ?? undefined };
    },
  }),
];

// نُفعّل Google فقط عند توفّر بيانات الاعتماد
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/auth" },
  providers,
  callbacks: {
    // إثراء الرمز بالدور وحالة القاصر
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      const id = (token.id ?? token.sub) as string | undefined;
      if (id && token.role === undefined) {
        const dbUser = await prisma.user.findUnique({
          where: { id },
          select: { role: true, isMinor: true },
        });
        token.role = (dbUser?.role as Role) ?? "USER";
        token.isMinor = !!dbUser?.isMinor;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.role = token.role as Role;
        session.user.isMinor = !!token.isMinor;
      }
      return session;
    },
  },
});
