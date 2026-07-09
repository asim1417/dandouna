import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'المقاييس' }

async function toggleApproval(formData: FormData) {
  'use server'
  const user = await requirePermission('scale:manage')
  const scaleId = String(formData.get('scaleId') || '')
  const approve = formData.get('approve') === '1'
  await prisma.scale.update({ where: { id: scaleId }, data: { approved: approve, approvedAt: approve ? new Date() : null } })
  await prisma.auditLog.create({
    data: { actorId: user.id, action: approve ? 'scale.approve' : 'scale.unapprove', entity: 'Scale', entityId: scaleId },
  })
  redirect('/admin/scales')
}

export default async function AdminScalesPage() {
  await requirePermission('scale:manage')
  const scales = await prisma.scale.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      versions: {
        where: { isCurrent: true },
        select: { id: true, version: true, _count: { select: { questions: true, bands: true } } },
      },
    },
  })

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> لوحة الإدارة
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, margin: '10px 0 18px' }}>
          <h1>المقاييس</h1>
          <Link href="/admin/scales/new" className="btn btn-pink btn-sm">
            <Icon name="clipboard-list" size={16} /> مقياس جديد
          </Link>
        </div>

        {scales.length === 0 ? (
          <div className="card pad">
            <p style={{ marginBottom: 12 }}>لا توجد مقاييس بعد.</p>
            <Link href="/admin/scales/new" className="btn btn-pink">إنشاء أول مقياس</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {scales.map((s) => {
              const v = s.versions[0]
              return (
                <div key={s.id} className="card pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <b>{s.title}</b>
                      <span className="pill" style={{ fontSize: 11, background: s.approved ? '#DCFCE7' : '#FEF3C7', color: s.approved ? '#15803D' : '#92400E' }}>
                        {s.approved ? 'معتمد' : 'مسودة'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--slate)' }}>
                      {s.code} · {s.isActive ? 'مفعّل' : 'معطّل'}
                      {v && ` · ${toArabic(v._count.questions)} سؤال · ${toArabic(v._count.bands)} نطاق`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <form action={toggleApproval}>
                      <input type="hidden" name="scaleId" value={s.id} />
                      <input type="hidden" name="approve" value={s.approved ? '0' : '1'} />
                      <button type="submit" className="btn btn-sm" style={{ background: s.approved ? '#fff' : 'var(--green)', color: s.approved ? 'var(--slate)' : '#fff', border: s.approved ? '1px solid var(--border)' : 'none' }}>
                        {s.approved ? 'إلغاء الاعتماد' : 'اعتماد'}
                      </button>
                    </form>
                    {v && (
                      <Link href={`/admin/questions?v=${v.id}`} className="btn btn-ghost btn-sm">
                        الأسئلة والنطاقات
                      </Link>
                    )}
                  </div>
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
