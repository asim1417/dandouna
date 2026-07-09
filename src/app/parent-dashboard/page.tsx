import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'لوحة ولي الأمر' }

export default async function ParentDashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  const session = await auth()
  const name = session?.user?.name || 'ولي الأمر'

  const [children, recent] = await Promise.all([
    prisma.child.findMany({
      where: { guardianId: user.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { assessments: true } } },
    }),
    prisma.assessment.findMany({
      where: { userId: user.id, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        child: { select: { fullName: true } },
        version: { select: { scale: { select: { title: true } } } },
      },
    }),
  ])

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="sparkles" /> أهلًا {name}
        </span>
        <h1 style={{ marginTop: 12 }}>لوحة ولي الأمر</h1>
        <p className="lead">أدر ملفات أطفالك، وابدأ الاختبارات، واطّلع على النتائج والتوصيات.</p>

        <div className="trust" style={{ marginTop: 20 }}>
          <Link href="/children" className="t t-link">
            <div className="ic-tile"><Icon name="users" /></div>
            <b>ملفات الأطفال</b>
            <small>{toArabic(children.length)} ملف</small>
          </Link>
          <Link href="/assessment" className="t t-link">
            <div className="ic-tile"><Icon name="flask-conical" /></div>
            <b>ابدأ اختبارًا</b>
            <small>الاختبارات المتاحة</small>
          </Link>
          <Link href="/plan" className="t t-link">
            <div className="ic-tile"><Icon name="calendar-check" /></div>
            <b>الخطة والتحديات</b>
            <small>خطط عملية</small>
          </Link>
          <Link href="/recommendations" className="t t-link">
            <div className="ic-tile"><Icon name="sprout" /></div>
            <b>التوصيات</b>
            <small>من نتائج أطفالك</small>
          </Link>
          <Link href="/calm" className="t t-link">
            <div className="ic-tile"><Icon name="moon-star" /></div>
            <b>ركن الطمأنينة</b>
            <small>تنفّس وأذكار</small>
          </Link>
        </div>

        <h3 style={{ margin: '30px 0 14px' }}>أطفالك</h3>
        {children.length === 0 ? (
          <div className="card pad">
            <p style={{ marginBottom: 12 }}>لم تُضِف أي ملف بعد.</p>
            <Link href="/children/new" className="btn btn-pink">إضافة ملف طفل</Link>
          </div>
        ) : (
          <div className="why-grid">
            {children.map((c) => (
              <Link key={c.id} href={`/children/${c.id}`} className="card pad t-link" style={{ display: 'block' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="logo-tile" style={{ background: c.avatarColor || 'var(--pink)', borderRadius: 13 }}>
                    <Icon name="smile" />
                  </span>
                  <div>
                    <b style={{ fontSize: 16 }}>{c.fullName}</b>
                    <div style={{ fontSize: 12, color: 'var(--slate)' }}>{toArabic(c._count.assessments)} اختبار</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {recent.length > 0 && (
          <>
            <h3 style={{ margin: '30px 0 14px' }}>أحدث النتائج</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recent.map((a) => (
                <Link key={a.id} href={`/assessment/result/${a.id}`} className="card pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b>{a.version.scale.title}</b>
                  <span style={{ fontSize: 13, color: 'var(--slate)' }}>{a.child?.fullName}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
