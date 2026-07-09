import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { assertPermission, ForbiddenError } from '@/lib/rbac'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'الاختبارات' }

// بدء جلسة تقييم لطفل (Server Action)
async function startAssessment(formData: FormData) {
  'use server'
  const versionId = String(formData.get('versionId') || '')
  const childId = String(formData.get('childId') || '')
  const user = await currentUser()
  if (!user) redirect('/auth')

  try {
    assertPermission(user.role, 'assessment:take')
  } catch (e) {
    if (e instanceof ForbiddenError) redirect('/parent-dashboard')
    throw e
  }

  // ملكية الطفل
  const child = await prisma.child.findFirst({
    where: { id: childId, guardianId: user.id, deletedAt: null },
  })
  if (!child) redirect('/children')

  // موافقة PDPL سارية
  const consent = await prisma.consent.findFirst({ where: { childId, status: 'GRANTED' } })
  if (!consent) redirect(`/children/${childId}`)

  const existing = await prisma.assessment.findFirst({
    where: { userId: user.id, childId, versionId, status: 'IN_PROGRESS' },
  })
  const assessment =
    existing ?? (await prisma.assessment.create({ data: { userId: user.id, childId, versionId } }))

  redirect(`/assessment/run/${assessment.id}`)
}

export default async function AssessmentListPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const [scales, children] = await Promise.all([
    prisma.scale.findMany({
      where: { isActive: true, approved: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        estMinutes: true,
        minAge: true,
        maxAge: true,
        versions: {
          where: { isCurrent: true },
          select: { id: true, _count: { select: { questions: true } } },
        },
      },
    }),
    prisma.child.findMany({
      where: { guardianId: user.id, deletedAt: null },
      select: { id: true, fullName: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="clipboard-list" /> الاختبارات المتاحة
        </span>
        <h1 style={{ margin: '12px 0 8px' }}>اختر اختبارًا وطفلًا لتبدأ</h1>

        {children.length === 0 ? (
          <div className="card pad" style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 12 }}>
              لبدء اختبار، أضِف ملف طفل أولًا (تُطلب موافقتك على معالجة بياناته).
            </p>
            <Link href="/children/new" className="btn btn-pink">
              <Icon name="user" size={16} /> إضافة ملف طفل
            </Link>
          </div>
        ) : scales.length === 0 ? (
          <div className="card pad" style={{ marginTop: 12 }}>
            <p>لا توجد اختبارات متاحة حاليًا. سيتم إضافتها من لوحة الإدارة.</p>
          </div>
        ) : (
          <div className="why-grid" style={{ marginTop: 16 }}>
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
                  {s.category && (
                    <span className="pill pill-pink" style={{ marginTop: 2, fontSize: 12 }}>
                      {s.category}
                    </span>
                  )}
                  {s.description && <p style={{ fontSize: 13.5, marginTop: 8 }}>{s.description}</p>}
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
                        <Icon name="clock" />
                      </span>
                      <b>المدة</b>
                      <span>{toArabic(s.estMinutes)} د</span>
                    </div>
                    {(s.minAge || s.maxAge) && (
                      <div className="m">
                        <span className="tile">
                          <Icon name="users" />
                        </span>
                        <b>العمر</b>
                        <span>
                          {toArabic(s.minAge ?? 0)}–{toArabic(s.maxAge ?? 18)}
                        </span>
                      </div>
                    )}
                  </div>
                  {version ? (
                    <form action={startAssessment} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <input type="hidden" name="versionId" value={version.id} />
                      <label className="field">
                        <span className="field-label">اختر الطفل</span>
                        <span className="field-input">
                          <Icon name="user" size={18} />
                          <select name="childId" required defaultValue={children[0].id}>
                            {children.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.fullName}
                              </option>
                            ))}
                          </select>
                        </span>
                      </label>
                      <button type="submit" className="btn btn-pink btn-block">
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
