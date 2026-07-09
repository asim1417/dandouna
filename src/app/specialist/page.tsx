import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'بوابة المختص' }

export default async function SpecialistPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  const session = await auth()
  const email = (session?.user?.email || '').toLowerCase()

  // الملفات المشارَكة مع بريد هذا المختص
  const links = email
    ? await prisma.specialistLink.findMany({
        where: { specialistEmail: email },
        include: {
          child: {
            include: {
              assessments: {
                where: { status: 'COMPLETED' },
                orderBy: { completedAt: 'desc' },
                include: { results: true, version: { select: { scale: { select: { title: true } } } } },
              },
            },
          },
        },
      })
    : []

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="heart-handshake" /> بوابة المختص
        </span>
        <h1 style={{ margin: '12px 0 6px' }}>الحالات المشارَكة معك</h1>
        <p className="lead">تقارير مشارَكة بتفويض صريح من ولي الأمر — للعرض فقط.</p>

        <div className="privacy-banner" style={{ marginTop: 12 }}>
          <Icon name="shield-check" />
          <span>تصل إليك هذه البيانات بموافقة ولي الأمر، ولا يجوز استخدامها لغير الغرض الإرشادي.</span>
        </div>

        {links.length === 0 ? (
          <div className="card pad" style={{ marginTop: 16 }}>
            <p>لا توجد حالات مشارَكة مع بريدك ({email || '—'}) بعد.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {links.map((lnk) => (
              <div key={lnk.id} className="card pad">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span className="logo-tile" style={{ background: lnk.child.avatarColor || 'var(--pink)', borderRadius: 11, width: 32, height: 32 }}>
                    <Icon name="smile" size={16} />
                  </span>
                  <b>{lnk.child.fullName}</b>
                </div>
                {lnk.child.assessments.length === 0 ? (
                  <p style={{ fontSize: 13 }}>لا توجد تقارير مكتملة بعد.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {lnk.child.assessments.map((a) => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderTop: '1px solid var(--border2)', paddingTop: 6 }}>
                        <span>{a.version.scale.title}</span>
                        <span className="pill pill-pink">
                          {a.results[0]?.band ?? '—'} · {toArabic(Math.round(a.results[0]?.normalizedScore ?? 0))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="disclaimer-sm" style={{ marginTop: 16, color: 'var(--gold2)', fontWeight: 600 }}>
          النتائج إرشادية تثقيفية وليست تشخيصًا.
        </p>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
