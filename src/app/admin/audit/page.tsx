import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'سجل التدقيق' }

const ACTION_LABEL: Record<string, string> = {
  'user.register': 'تسجيل مستخدم',
  'user.register.otp': 'تسجيل عبر رمز',
  'user.role.change': 'تغيير دور',
  'child.create': 'إنشاء ملف طفل',
  'child.delete': 'حذف ملف طفل',
  'consent.grant': 'منح موافقة',
  'consent.revoke': 'سحب موافقة',
  'assessment.start': 'بدء تقييم',
  'assessment.submit': 'إنهاء تقييم',
  'scale.create': 'إنشاء مقياس',
  'question.create': 'إضافة سؤال',
  'band.create': 'إضافة نطاق',
  'recommendation.create': 'إضافة توصية',
  'reference.create': 'إضافة مرجع',
}

export default async function AdminAuditPage() {
  await requirePermission('audit:view')
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { actor: { select: { fullName: true, email: true } } },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> لوحة الإدارة
        </Link>
        <h1 style={{ margin: '10px 0 6px' }}>سجل التدقيق</h1>
        <p className="lead">آخر {toArabic(logs.length)} عملية مسجّلة (امتثال PDPL).</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
          {logs.length === 0 ? (
            <div className="card pad"><p>لا توجد سجلات بعد.</p></div>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="card pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="ic-tile" style={{ width: 32, height: 32 }}>
                    <Icon name="shield" size={16} />
                  </span>
                  <div>
                    <b style={{ fontSize: 14 }}>{ACTION_LABEL[l.action] ?? l.action}</b>
                    <div style={{ fontSize: 12, color: 'var(--slate)' }}>
                      {l.actor?.fullName ?? 'النظام'} · {l.entity}
                    </div>
                  </div>
                </div>
                <span className="num" style={{ fontSize: 12, color: 'var(--slate2)' }}>
                  {new Date(l.createdAt).toLocaleString('ar-SA')}
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
