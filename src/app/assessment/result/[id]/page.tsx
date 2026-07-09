import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'نتيجتك' }

const SOURCE_LABEL: Record<string, string> = {
  QURAN: 'قرآن كريم',
  SUNNAH: 'سنة نبوية',
  SCHOLARLY: 'قول أهل العلم',
  OTHER: 'مرجع',
}

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const { id } = await params
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      results: true,
      version: {
        include: {
          scale: { select: { title: true } },
          bands: {
            include: {
              recommendations: {
                orderBy: { order: 'asc' },
                include: { references: { include: { reference: true } } },
              },
            },
          },
        },
      },
    },
  })

  if (!assessment || assessment.userId !== user.id) notFound()
  if (assessment.status !== 'COMPLETED' || assessment.results.length === 0) {
    redirect(`/assessment/run/${assessment.id}`)
  }

  // اجمع التوصيات والمراجع من النطاقات المطابقة للنتائج
  const recommendations = assessment.version.bands
    .filter((b) =>
      assessment.results.some((r) => r.band === b.label && r.subscale === b.subscale),
    )
    .flatMap((b) => b.recommendations)

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">نتيجة الاختبار</span>
        <h1 style={{ margin: '12px 0 20px' }}>{assessment.version.scale.title}</h1>

        {assessment.results.map((r) => (
          <div className="card result-card" key={r.id} style={{ marginBottom: 16 }}>
            {r.subscale && (
              <div className="cap" style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
                {r.subscale}
              </div>
            )}
            <div className="cap" style={{ fontSize: 14, color: '#64748B', fontWeight: 600 }}>
              المؤشر (من ١٠٠)
            </div>
            <div className="score">{toArabic(Math.round(r.normalizedScore))}</div>
            <span className="pill pill-pink" style={{ marginTop: 6 }}>
              {r.band}
            </span>
            <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
              الدرجة الخام: {toArabic(Math.round(r.rawScore))}
            </div>

            <div className="scale-bar">
              <span className="seg" style={{ background: '#DCFCE7' }} />
              <span className="seg" style={{ background: '#FCE7CF' }} />
              <span className="seg" style={{ background: '#FEE2E2' }} />
            </div>
            <div className="scale-labels">
              <span>منخفض</span>
              <span>متوسط</span>
              <span>مرتفع</span>
            </div>

            {r.interpretation && <p style={{ fontSize: 14, marginTop: 8 }}>{r.interpretation}</p>}

            {Array.isArray(r.flags) && r.flags.length > 0 && (
              <div className="flags-box">
                <b>
                  <Icon name="shield" size={15} /> إشارات تستدعي الانتباه
                </b>
                <ul>
                  {(r.flags as string[]).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {recommendations.length > 0 && (
          <section>
            <h3 style={{ margin: '26px 0 4px' }}>توصيات مخصّصة لك</h3>
            {recommendations.map((rec) => (
              <div className="rec-card" key={rec.id}>
                <h4>
                  <Icon name="sprout" size={18} /> {rec.title}
                </h4>
                <p>{rec.body}</p>
                {rec.references.map((rr) => (
                  <div className="ref-quote" key={rr.id}>
                    <div className="txt">«{rr.reference.textAr}»</div>
                    <div className="cite">
                      {SOURCE_LABEL[rr.reference.source] ?? 'مرجع'}
                      {rr.reference.citation ? ` · ${rr.reference.citation}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-ghost">
            العودة للوحة
          </Link>
          <Link href="/assessment" className="btn btn-pink">
            اختبار آخر
          </Link>
        </div>

        <p className="disclaimer-sm" style={{ marginTop: 16, color: 'var(--gold2)', fontWeight: 600 }}>
          النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا أو نفسيًا.
        </p>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
