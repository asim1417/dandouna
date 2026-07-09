import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'المراجع' }

const SOURCES = [
  { v: 'QURAN', l: 'قرآن كريم' },
  { v: 'SUNNAH', l: 'سنة نبوية' },
  { v: 'SCHOLARLY', l: 'قول أهل العلم' },
  { v: 'OTHER', l: 'مرجع تربوي' },
]

async function addReference(formData: FormData) {
  'use server'
  const user = await requirePermission('reference:manage')
  const source = String(formData.get('source') || 'SCHOLARLY') as 'QURAN' | 'SUNNAH' | 'SCHOLARLY' | 'OTHER'
  const title = String(formData.get('title') || '').trim()
  const textAr = String(formData.get('textAr') || '').trim()
  const citation = String(formData.get('citation') || '').trim() || null
  const category = String(formData.get('category') || '').trim() || null
  if (title.length < 2 || textAr.length < 2) redirect('/admin/references')

  const ref = await prisma.islamicReference.create({ data: { source, title, textAr, citation, category } })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'reference.create', entity: 'IslamicReference', entityId: ref.id } })
  redirect('/admin/references')
}

export default async function AdminReferencesPage() {
  await requirePermission('reference:manage')
  const refs = await prisma.islamicReference.findMany({ orderBy: { createdAt: 'desc' } })
  const label = (s: string) => SOURCES.find((x) => x.v === s)?.l ?? s

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> لوحة الإدارة
        </Link>
        <h1 style={{ margin: '10px 0 18px' }}>المراجع الشرعية والتربوية</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {refs.map((r) => (
            <div key={r.id} className="card pad">
              <b style={{ fontSize: 14 }}>{r.title}</b>
              <div className="ref-quote" style={{ marginTop: 8 }}>
                <div className="txt">«{r.textAr}»</div>
                <div className="cite">
                  {label(r.source)}
                  {r.citation ? ` · ${r.citation}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card pad" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>إضافة مرجع</h4>
          <form action={addReference} className="auth-form">
            <label className="field">
              <span className="field-label">المصدر</span>
              <span className="field-input">
                <select name="source" defaultValue="SCHOLARLY">
                  {SOURCES.map((s) => (
                    <option key={s.v} value={s.v}>{s.l}</option>
                  ))}
                </select>
              </span>
            </label>
            <label className="field">
              <span className="field-label">العنوان</span>
              <span className="field-input">
                <input name="title" required placeholder="عنوان المرجع" />
              </span>
            </label>
            <label className="field">
              <span className="field-label">النص</span>
              <textarea name="textAr" rows={3} className="admin-textarea" required placeholder="نص المرجع" />
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">الإحالة</span>
                <span className="field-input">
                  <input name="citation" placeholder="سورة/آية أو تخريج" />
                </span>
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">التصنيف</span>
                <span className="field-input">
                  <input name="category" placeholder="—" />
                </span>
              </label>
            </div>
            <button type="submit" className="btn btn-pink btn-block">إضافة المرجع</button>
          </form>
        </div>
      </main>
    </>
  )
}
