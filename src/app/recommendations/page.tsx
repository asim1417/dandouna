import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'التوصيات' }

export default async function RecommendationsPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  // آخر جلسات مكتملة لأطفال ولي الأمر مع نطاقاتها وتوصياتها
  const assessments = await prisma.assessment.findMany({
    where: { userId: user.id, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    take: 10,
    include: {
      child: { select: { fullName: true } },
      results: true,
      version: {
        include: {
          scale: { select: { title: true } },
          bands: { include: { recommendations: { orderBy: { order: 'asc' } } } },
        },
      },
    },
  })

  const items = assessments.map((a) => {
    const recs = a.version.bands
      .filter((b) => a.results.some((r) => r.band === b.label && r.subscale === b.subscale))
      .flatMap((b) => b.recommendations)
    return { id: a.id, scale: a.version.scale.title, child: a.child?.fullName, recs }
  }).filter((x) => x.recs.length > 0)

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="sprout" /> التوصيات
        </span>
        <h1 style={{ margin: '12px 0 18px' }}>توصيات مبنية على نتائج أطفالك</h1>

        {items.length === 0 ? (
          <div className="card pad">
            <p style={{ marginBottom: 12 }}>لا توجد توصيات بعد — أكمل اختبارًا لطفلك لتظهر التوصيات هنا.</p>
            <Link href="/assessment" className="btn btn-pink">ابدأ اختبارًا</Link>
          </div>
        ) : (
          items.map((it) => (
            <div key={it.id} style={{ marginBottom: 22 }}>
              <h3 style={{ marginBottom: 8, fontSize: 16 }}>
                {it.scale} {it.child ? `· ${it.child}` : ''}
              </h3>
              {it.recs.map((rec) => (
                <div className="rec-card" key={rec.id}>
                  <h4>
                    <Icon name="sprout" size={18} /> {rec.title}
                  </h4>
                  <p>{rec.body}</p>
                </div>
              ))}
              <Link href={`/assessment/result/${it.id}`} className="link-pink" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
                عرض التقرير الكامل ←
              </Link>
            </div>
          ))
        )}

        <p className="disclaimer-sm" style={{ marginTop: 16, color: 'var(--gold2)', fontWeight: 600 }}>
          النتائج والتوصيات إرشادية تثقيفية وليست تشخيصًا طبيًا أو نفسيًا.
        </p>
      </main>
    </>
  )
}
