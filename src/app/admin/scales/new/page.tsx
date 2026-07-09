import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'مقياس جديد' }

async function createScale(formData: FormData) {
  'use server'
  const user = await requirePermission('scale:manage')
  const code = String(formData.get('code') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const scoring = String(formData.get('scoring') || 'SUM') as 'SUM' | 'AVERAGE' | 'WEIGHTED' | 'SUBSCALE'
  const optionMax = Number(formData.get('optionMax') || 4)
  if (code.length < 2 || title.length < 2) redirect('/admin/scales/new')

  const scale = await prisma.scale.create({
    data: {
      code,
      title,
      description: description || null,
      audience: 'USER',
      versions: { create: { version: 1, scoring, isCurrent: true, optionMin: 0, optionMax } },
    },
    include: { versions: true },
  })
  await prisma.auditLog.create({
    data: { actorId: user.id, action: 'scale.create', entity: 'Scale', entityId: scale.id },
  })
  redirect(`/admin/questions?v=${scale.versions[0].id}`)
}

export default async function NewScalePage() {
  await requirePermission('scale:manage')
  return (
    <>
      <SiteHeader />
      <main className="page" style={{ maxWidth: 560 }}>
        <Link href="/admin/scales" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> المقاييس
        </Link>
        <h1 style={{ margin: '10px 0 18px' }}>مقياس جديد</h1>
        <div className="card pad">
          <form action={createScale} className="auth-form">
            <label className="field">
              <span className="field-label">الرمز (فريد)</span>
              <span className="field-input">
                <input name="code" placeholder="DOPA-SCREEN-02" required />
              </span>
            </label>
            <label className="field">
              <span className="field-label">العنوان</span>
              <span className="field-input">
                <input name="title" placeholder="اسم المقياس" required />
              </span>
            </label>
            <label className="field">
              <span className="field-label">الوصف</span>
              <span className="field-input">
                <input name="description" placeholder="وصف مختصر" />
              </span>
            </label>
            <label className="field">
              <span className="field-label">طريقة الاحتساب</span>
              <span className="field-input">
                <select name="scoring" defaultValue="SUM">
                  <option value="SUM">جمع (SUM)</option>
                  <option value="AVERAGE">متوسط (AVERAGE)</option>
                  <option value="WEIGHTED">موزون (WEIGHTED)</option>
                  <option value="SUBSCALE">محاور فرعية (SUBSCALE)</option>
                </select>
              </span>
            </label>
            <label className="field">
              <span className="field-label">أعلى قيمة للخيار</span>
              <span className="field-input">
                <input name="optionMax" type="number" defaultValue={4} min={1} required />
              </span>
            </label>
            <button type="submit" className="btn btn-pink btn-block">
              إنشاء والانتقال للأسئلة
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
