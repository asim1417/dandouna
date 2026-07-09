import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'التوصيات' }

async function addRecommendation(formData: FormData) {
  'use server'
  const user = await requirePermission('recommendation:manage')
  const bandId = String(formData.get('bandId') || '')
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  const referenceId = String(formData.get('referenceId') || '').trim()
  if (!bandId || title.length < 2) redirect('/admin/recommendations')

  const rec = await prisma.recommendation.create({
    data: {
      bandId,
      title,
      body,
      order: 0,
      ...(referenceId ? { references: { create: { referenceId } } } : {}),
    },
  })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'recommendation.create', entity: 'Recommendation', entityId: rec.id } })
  redirect('/admin/recommendations')
}

export default async function AdminRecommendationsPage() {
  await requirePermission('recommendation:manage')
  const [bands, references] = await Promise.all([
    prisma.scoreBand.findMany({
      include: {
        version: { include: { scale: { select: { title: true } } } },
        recommendations: { include: { references: { include: { reference: true } } } },
      },
      orderBy: { minScore: 'asc' },
    }),
    prisma.islamicReference.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'desc' } }),
  ])

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> لوحة الإدارة
        </Link>
        <h1 style={{ margin: '10px 0 18px' }}>التوصيات حسب النطاق</h1>

        {bands.length === 0 ? (
          <div className="card pad">
            <p>لا توجد نطاقات بعد — أضِف نطاقات من إدارة المقاييس أولًا.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bands.map((b) => (
                <div key={b.id} className="card pad">
                  <b style={{ fontSize: 14 }}>
                    {b.version.scale.title} — {b.label}
                  </b>
                  {b.recommendations.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>لا توصيات بعد</div>
                  ) : (
                    b.recommendations.map((r) => (
                      <div key={r.id} className="rec-card" style={{ marginTop: 8 }}>
                        <h4 style={{ fontSize: 14 }}>{r.title}</h4>
                        <p style={{ fontSize: 13 }}>{r.body}</p>
                        {r.references.map((rr) => (
                          <div key={rr.id} style={{ fontSize: 12, color: 'var(--gold2)', marginTop: 4 }}>
                            ↪ {rr.reference.title}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>

            <div className="card pad" style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12 }}>إضافة توصية</h4>
              <form action={addRecommendation} className="auth-form">
                <label className="field">
                  <span className="field-label">النطاق</span>
                  <span className="field-input">
                    <select name="bandId" required>
                      {bands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.version.scale.title} — {b.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
                <label className="field">
                  <span className="field-label">العنوان</span>
                  <span className="field-input">
                    <input name="title" required placeholder="عنوان التوصية" />
                  </span>
                </label>
                <label className="field">
                  <span className="field-label">النص</span>
                  <textarea name="body" rows={3} className="admin-textarea" placeholder="نص التوصية" />
                </label>
                <label className="field">
                  <span className="field-label">ربط بمرجع (اختياري)</span>
                  <span className="field-input">
                    <select name="referenceId" defaultValue="">
                      <option value="">بدون</option>
                      {references.map((r) => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </span>
                </label>
                <button type="submit" className="btn btn-pink btn-block">إضافة التوصية</button>
              </form>
            </div>
          </>
        )}
      </main>
    </>
  )
}
