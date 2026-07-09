import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ملفات الأطفال' }

export default async function ChildrenPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const children = await prisma.child.findMany({
    where: { guardianId: user.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { assessments: true } },
      consents: { where: { status: 'GRANTED' }, select: { id: true }, take: 1 },
    },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <span className="pill pill-pink">
              <Icon name="users" /> ملفات الأطفال
            </span>
            <h1 style={{ marginTop: 12 }}>أطفالك</h1>
          </div>
          <Link href="/children/new" className="btn btn-pink btn-sm">
            <Icon name="user" size={16} /> إضافة طفل
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="card pad" style={{ marginTop: 18 }}>
            <p style={{ marginBottom: 12 }}>لا توجد ملفات بعد. أضِف أول ملف طفل لتبدأ.</p>
            <Link href="/children/new" className="btn btn-pink">
              إضافة ملف طفل
            </Link>
          </div>
        ) : (
          <div className="why-grid" style={{ marginTop: 18 }}>
            {children.map((c) => (
              <Link key={c.id} href={`/children/${c.id}`} className="card pad t-link" style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    className="logo-tile"
                    style={{ background: c.avatarColor || 'var(--pink)', borderRadius: 13 }}
                  >
                    <Icon name="smile" />
                  </span>
                  <div>
                    <b style={{ fontSize: 17 }}>{c.fullName}</b>
                    <div style={{ fontSize: 12, color: 'var(--slate)' }}>
                      {toArabic(c._count.assessments)} اختبار
                      {c.consents.length === 0 && ' · بانتظار الموافقة'}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
