import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'لوحتي' }

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'قيد التقدّم',
  COMPLETED: 'مكتمل',
  ABANDONED: 'متروك',
}

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  const session = await auth()
  const name = session?.user?.name || 'صديقتي'

  const assessments = await prisma.assessment.findMany({
    where: { userId: user.id },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      status: true,
      startedAt: true,
      version: { select: { scale: { select: { title: true } } } },
    },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="dash-welcome">
          <div>
            <span className="pill pill-pink">
              <Icon name="sparkles" /> أهلًا {name}
            </span>
            <h1 style={{ marginTop: 12 }}>لوحتك في دندونة</h1>
            <p className="lead">من هنا تبدأ رحلتك مع الاختبارات والخطط.</p>
          </div>
        </div>

        <div className="trust" style={{ marginTop: 20 }}>
          <Link href="/assessment" className="t t-link">
            <div className="ic-tile">
              <Icon name="flask-conical" />
            </div>
            <b>ابدأ اختبارًا</b>
            <small>الاختبارات المتاحة الآن</small>
          </Link>
          <div className="t">
            <div className="ic-tile">
              <Icon name="calendar-check" />
            </div>
            <b>خطتك اليومية</b>
            <small>قريبًا</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="file-text" />
            </div>
            <b>تقاريرك</b>
            <small>من نتائج اختباراتك</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="moon-star" />
            </div>
            <b>ركن الطمأنينة</b>
            <small>قريبًا</small>
          </div>
        </div>

        <h3 style={{ margin: '30px 0 14px' }}>اختباراتك الأخيرة</h3>
        {assessments.length === 0 ? (
          <div className="card pad">
            <p>لم تبدئي أي اختبار بعد. ابدئي أول اختبار من الأعلى.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {assessments.map((a) => (
              <Link
                key={a.id}
                href={a.status === 'COMPLETED' ? `/assessment/result/${a.id}` : `/assessment/run/${a.id}`}
                className="card pad"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="ic-tile">
                    <Icon name="clipboard-list" />
                  </span>
                  <b>{a.version.scale.title}</b>
                </div>
                <span className="pill pill-pink">{STATUS_LABEL[a.status] ?? a.status}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
