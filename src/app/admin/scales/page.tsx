import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'المقاييس' }

export default async function AdminScalesPage() {
  await requirePermission('scale:manage')
  const scales = await prisma.scale.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      versions: {
        where: { isCurrent: true },
        select: { id: true, version: true, _count: { select: { questions: true, bands: true } } },
      },
    },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> لوحة الإدارة
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, margin: '10px 0 18px' }}>
          <h1>المقاييس</h1>
          <Link href="/admin/scales/new" className="btn btn-pink btn-sm">
            <Icon name="clipboard-list" size={16} /> مقياس جديد
          </Link>
        </div>

        {scales.length === 0 ? (
          <div className="card pad">
            <p style={{ marginBottom: 12 }}>لا توجد مقاييس بعد.</p>
            <Link href="/admin/scales/new" className="btn btn-pink">إنشاء أول مقياس</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scales.map((s) => {
              const v = s.versions[0]
              return (
                <div key={s.id} className="card pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <b>{s.title}</b>
                    <div style={{ fontSize: 12, color: 'var(--slate)' }}>
                      {s.code} · {s.isActive ? 'مفعّل' : 'معطّل'}
                      {v && ` · ${toArabic(v._count.questions)} سؤال · ${toArabic(v._count.bands)} نطاق`}
                    </div>
                  </div>
                  {v && (
                    <Link href={`/admin/questions?v=${v.id}`} className="btn btn-ghost btn-sm">
                      إدارة الأسئلة والنطاقات
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
