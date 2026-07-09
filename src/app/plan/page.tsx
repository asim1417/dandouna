import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { generatePlanFromLatestAssessment } from '@/lib/plan'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'الخطة والتحديات' }

async function generatePlan(formData: FormData) {
  'use server'
  const childId = String(formData.get('childId') || '')
  const user = await currentUser()
  if (!user) redirect('/auth')
  const child = await prisma.child.findFirst({ where: { id: childId, guardianId: user.id, deletedAt: null } })
  if (!child) redirect('/plan')
  await generatePlanFromLatestAssessment(childId)
  redirect('/plan')
}

async function toggleChallenge(formData: FormData) {
  'use server'
  const id = String(formData.get('id') || '')
  const done = formData.get('done') === '1'
  const user = await currentUser()
  if (!user) redirect('/auth')
  // تأكيد أن التحدّي يخص طفلًا لولي الأمر
  const ch = await prisma.challenge.findUnique({
    where: { id },
    include: { plan: { include: { child: { select: { guardianId: true } } } } },
  })
  if (ch && ch.plan.child.guardianId === user.id) {
    await prisma.challenge.update({ where: { id }, data: { done: !done } })
  }
  redirect('/plan')
}

export default async function PlanPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const children = await prisma.child.findMany({
    where: { guardianId: user.id, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    include: {
      plans: {
        orderBy: { createdAt: 'desc' },
        include: { challenges: { orderBy: { order: 'asc' } } },
      },
      _count: { select: { assessments: { where: { status: 'COMPLETED' } } } },
    },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="calendar-check" /> الخطة والتحديات
        </span>
        <h1 style={{ margin: '12px 0 18px' }}>خطط عملية لأطفالك</h1>

        {children.length === 0 && (
          <div className="card pad">
            <p style={{ marginBottom: 12 }}>أضِف ملف طفل وابدأ اختبارًا لتوليد خطة.</p>
            <Link href="/children/new" className="btn btn-pink">إضافة طفل</Link>
          </div>
        )}

        {children.map((c) => (
          <section key={c.id} style={{ marginBottom: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="logo-tile" style={{ background: c.avatarColor || 'var(--pink)', borderRadius: 11, width: 30, height: 30 }}>
                  <Icon name="smile" size={16} />
                </span>
                {c.fullName}
              </h3>
              {c._count.assessments > 0 && (
                <form action={generatePlan}>
                  <input type="hidden" name="childId" value={c.id} />
                  <button type="submit" className="btn btn-ghost btn-sm">
                    <Icon name="sparkles" size={14} /> توليد خطة من آخر نتيجة
                  </button>
                </form>
              )}
            </div>

            {c.plans.length === 0 ? (
              <div className="card pad" style={{ marginTop: 10 }}>
                <p style={{ fontSize: 13 }}>
                  {c._count.assessments === 0 ? 'أكمل اختبارًا لهذا الطفل أولًا.' : 'لا توجد خطة بعد — ولّد خطة من آخر نتيجة.'}
                </p>
              </div>
            ) : (
              c.plans.map((plan) => {
                const done = plan.challenges.filter((x) => x.done).length
                return (
                  <div key={plan.id} className="card pad" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b>{plan.title}</b>
                      <span className="pill pill-pink">
                        {toArabic(done)}/{toArabic(plan.challenges.length)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                      {plan.challenges.map((ch) => (
                        <form key={ch.id} action={toggleChallenge} className="challenge-row">
                          <input type="hidden" name="id" value={ch.id} />
                          <input type="hidden" name="done" value={ch.done ? '1' : '0'} />
                          <button type="submit" className={`chk${ch.done ? ' on' : ''}`} aria-label="تبديل">
                            {ch.done && <Icon name="check" size={14} />}
                          </button>
                          <div className={ch.done ? 'ch-done' : ''}>
                            <b>{ch.title}</b>
                            {ch.description && <p style={{ fontSize: 12.5 }}>{ch.description}</p>}
                          </div>
                        </form>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </section>
        ))}

        <p className="disclaimer-sm" style={{ marginTop: 8, color: 'var(--gold2)', fontWeight: 600 }}>
          الخطط إرشادية تثقيفية وليست بديلًا عن استشارة مختص.
        </p>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
