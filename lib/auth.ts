import NextAuth, { type NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './prisma'
import type { Role } from '@prisma/client'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// نُفعّل Google فقط عند توفّر بيانات الاعتماد
const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw)
      if (!parsed.success) return null
      const { email, password } = parsed.data

      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.passwordHash) return null

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) return null

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      }
    },
  }),
]

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  )
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  // Credentials تتطلب استراتيجية JWT
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as { role?: Role }).role ?? 'USER'
      return token
    },
    async session({ session, token }) {
      if (session.user && token.role) {
        ;(session.user as { role?: Role }).role = token.role as Role
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
