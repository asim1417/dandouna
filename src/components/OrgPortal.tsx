import { redirect } from 'next/navigation'
import type { Role } from '@/lib/rbac'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

const BANDS = ['منخفض', 'متوسط', 'مرتفع'] as const

/** بوابة مؤسسية/شركة: مؤشرات مجمّعة مجهولة الهوية لأعضاء المنظّمة. */
export async function OrgPortal({ orgType, title, subtitle }: { orgType: Role; title: string; subtitle: string }) {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, org: { type: orgType } },
    include: { org: true },
  })

  if (!membership) {
    return (
      <>
        <SiteHeader />
        <main className="page">
          <h1 style={{ marginBottom: 12 }}>{title}</h1>
          <div className="card pad">
            <p>لست مرتبطًا بأي {orgType === 'COMPANY' ? 'شركة' : 'مؤسسة'} بعد. تواصل مع الإدارة لربط حسابك.</p>
          </div>
        </main>
      </>
    )
  }

  const org = membership.org
  // أعضاء المنظّمة → أطفالهم → آخر تقييم مكتمل → توزيع النطاقات (مجهول الهوية)
  const memberships = await prisma.membership.findMany({ where: { orgId: org.id }, select: { userId: true } })
  const memberIds = memberships.map((m) => m.userId)

  const assessments = await prisma.assessment.findMany({
    where: { userId: { in: memberIds }, status: 'COMPLETED' },
    orderBy: { completedAt: 'desc' },
    include: { results: true },
  })

  const dist: Record<string, number> = { منخفض: 0, متوسط: 0, مرتفع: 0 }
  let scoreSum = 0
  let scoreCount = 0
  for (const a of assessments) {
    const r = a.results[0]
    if (!r) continue
    if (dist[r.band] !== undefined) dist[r.band]++
    scoreSum += r.normalizedScore
    scoreCount++
  }
  const avg = scoreCount ? Math.round(scoreSum / scoreCount) : 0
  const total = assessments.length

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="users" /> {title}
        </span>
        <h1 style={{ margin: '12px 0 4px' }}>{org.name}</h1>
        <p className="lead">{subtitle}</p>

        <div className="privacy-banner" style={{ marginTop: 12 }}>
          <Icon name="shield-check" />
          <span>مؤشرات عامة مجهولة الهوية فقط — لا أسماء ولا ربط بفرد بعينه.</span>
        </div>

        <div className="admin-stats" style={{ marginTop: 18 }}>
          <Stat n={memberIds.length} label="عضو مشارِك" />
          <Stat n={total} label="تقييم مكتمل" />
          <Stat n={avg} label="متوسط المؤشر" />
          <Stat n={org.seats} label="المقاعد" />
        </div>

        <h3 style={{ margin: '26px 0 12px' }}>توزيع المؤشرات (مجهول)</h3>
        {total === 0 ? (
          <div className="card pad"><p>لا توجد تقييمات مكتملة بعد لعرض المؤشرات.</p></div>
        ) : (
          <div className="card pad">
            {BANDS.map((b) => {
              const pct = total ? Math.round((dist[b] / total) * 100) : 0
              return (
                <div key={b} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>{b}</span>
                    <span className="num">{toArabic(pct)}٪</span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <p className="disclaimer-sm" style={{ marginTop: 16, color: 'var(--gold2)', fontWeight: 600 }}>
          المؤشرات إرشادية تثقيفية ولا تُستخدم في التوظيف أو التقييم الفردي.
        </p>
      </main>
    </>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="admin-stat">
      <div className="num">{toArabic(n)}</div>
      <div>{label}</div>
    </div>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
