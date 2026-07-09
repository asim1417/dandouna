import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { assertPermission, ForbiddenError } from '@/lib/rbac'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'الاختبارات' }

// بدء جلسة تقييم (Server Action) — يطبّق نفس شروط RBAC وموافقة القاصر
async function startAssessment(formData: FormData) {
  'use server'
  const versionId = String(formData.get('versionId') || '')
  const user = await currentUser()
  if (!user) redirect('/auth')

  try {
    assertPermission(user.role, 'assessment:take')
  } catch (e) {
    if (e instanceof ForbiddenError) redirect('/dashboard')
    throw e
  }

  // شرط PDPL: لا تُفتح جلسة لقاصر إلا بموافقة سارية
  if (user.isMinor) {
    const consent = await prisma.consent.findFirst({
      where: { subjectId: user.id, status: 'GRANTED' },
    })
    if (!consent) redirect('/consent')
  }

  // استئناف جلسة قائمة لنفس النسخة أو إنشاء جديدة
  const existing = await prisma.assessment.findFirst({
    where: { userId: user.id, versionId, status: 'IN_PROGRESS' },
  })
  const assessment =
    existing ?? (await prisma.assessment.create({ data: { userId: user.id, versionId } }))

  redirect(`/assessment/run/${assessment.id}`)
}

export default async function AssessmentListPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const scales = await prisma.scale.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      description: true,
      versions: {
        where: { isCurrent: true },
        select: { id: true, _count: { select: { questions: true } } },
      },
    },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="clipboard-list" /> الاختبارات المتاحة
        </span>
        <h1 style={{ margin: '12px 0 20px' }}>اختر اختبارًا لتبدأ</h1>

        {scales.length === 0 ? (
          <div className="card pad">
            <p>لا توجد اختبارات متاحة حاليًا. سيتم إضافتها قريبًا.</p>
          </div>
        ) : (
          <div className="why-grid">
            {scales.map((s) => {
              const version = s.versions[0]
              return (
                <div className="card pad" key={s.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span className="logo-tile" style={{ borderRadius: 13 }}>
                      <Icon name="clipboard-list" />
                    </span>
                    <h3 style={{ fontSize: 18 }}>{s.title}</h3>
                  </div>
                  {s.description && <p style={{ fontSize: 13.5 }}>{s.description}</p>}
                  <div className="assess-meta">
                    <div className="m">
                      <span className="tile">
                        <Icon name="list-checks" />
                      </span>
                      <b>الأسئلة</b>
                      <span>{version ? toArabic(version._count.questions) : '—'}</span>
                    </div>
                    <div className="m">
                      <span className="tile">
                        <Icon name="shield-check" />
                      </span>
                      <b>الخصوصية</b>
                      <span>كاملة</span>
                    </div>
                  </div>
                  {version ? (
                    <form action={startAssessment}>
                      <input type="hidden" name="versionId" value={version.id} />
                      <button type="submit" className="btn btn-pink btn-block" style={{ marginTop: 12 }}>
                        ابدأ الاختبار
                      </button>
                    </form>
                  ) : (
                    <p className="disclaimer-sm" style={{ marginTop: 12 }}>
                      قيد الإعداد — لا توجد نسخة فعّالة بعد.
                    </p>
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
