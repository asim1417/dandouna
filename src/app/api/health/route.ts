import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/health — فحص صحة التطبيق وقاعدة البيانات
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', db: 'up' })
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 })
  }
}
