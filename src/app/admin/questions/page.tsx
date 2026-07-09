import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'الأسئلة والنطاقات' }

async function addQuestion(formData: FormData) {
  'use server'
  const user = await requirePermission('question:manage')
  const versionId = String(formData.get('versionId') || '')
  const text = String(formData.get('text') || '').trim()
  const weight = Number(formData.get('weight') || 1)
  const isReverse = formData.get('isReverse') === 'on'
  const subscale = String(formData.get('subscale') || '').trim() || null
  const flagThresholdRaw = String(formData.get('flagThreshold') || '').trim()
  const flagLabel = String(formData.get('flagLabel') || '').trim() || null
  const optionsRaw = String(formData.get('options') || '').trim()
  if (!versionId || text.length < 2) redirect(`/admin/questions?v=${versionId}`)

  const labels = optionsRaw
    ? optionsRaw.split('\n').map((l) => l.trim()).filter(Boolean)
    : ['أبدًا', 'نادرًا', 'أحيانًا', 'غالبًا', 'دائمًا']

  const count = await prisma.question.count({ where: { versionId } })
  await prisma.question.create({
    data: {
      versionId,
      order: count + 1,
      text,
      type: 'LIKERT',
      weight,
      isReverse,
      subscale,
      flagThreshold: flagThresholdRaw ? Number(flagThresholdRaw) : null,
      flagLabel,
      options: { create: labels.map((label, i) => ({ label, value: i, order: i + 1 })) },
    },
  })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'question.create', entity: 'Question' } })
  redirect(`/admin/questions?v=${versionId}`)
}

async function addBand(formData: FormData) {
  'use server'
  const user = await requirePermission('question:manage')
  const versionId = String(formData.get('versionId') || '')
  const label = String(formData.get('label') || '').trim()
  const interpretation = String(formData.get('interpretation') || '').trim()
  const minScore = Number(formData.get('minScore') || 0)
  const maxScore = Number(formData.get('maxScore') || 0)
  const subscale = String(formData.get('subscale') || '').trim() || null
  if (!versionId || !label) redirect(`/admin/questions?v=${versionId}`)

  await prisma.scoreBand.create({
    data: { versionId, label, interpretation, minScore, maxScore, subscale },
  })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'band.create', entity: 'ScoreBand' } })
  redirect(`/admin/questions?v=${versionId}`)
}

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  await requirePermission('question:manage')
  const { v } = await searchParams

  if (!v) {
    const versions = await prisma.scaleVersion.findMany({
      where: { isCurrent: true },
      include: { scale: { select: { title: true } } },
    })
    return (
      <>
        <SiteHeader />
        <main className="page">
          <h1 style={{ marginBottom: 16 }}>اختر مقياسًا لإدارة أسئلته</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {versions.map((ver) => (
              <Link key={ver.id} href={`/admin/questions?v=${ver.id}`} className="card pad">
                <b>{ver.scale.title}</b>
              </Link>
            ))}
          </div>
        </main>
      </>
    )
  }

  const version = await prisma.scaleVersion.findUnique({
    where: { id: v },
    include: {
      scale: { select: { title: true } },
      questions: { orderBy: { order: 'asc' }, include: { options: { orderBy: { order: 'asc' } } } },
      bands: { orderBy: { minScore: 'asc' } },
    },
  })
  if (!version) redirect('/admin/questions')

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin/scales" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> المقاييس
        </Link>
        <h1 style={{ margin: '10px 0 4px' }}>{version.scale.title}</h1>
        <p className="lead">إدارة الأسئلة والنطاقات — طريقة الاحتساب: {version.scoring}</p>

        {/* الأسئلة الحالية */}
        <h3 style={{ margin: '22px 0 12px' }}>الأسئلة ({toArabic(version.questions.length)})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {version.questions.map((q) => (
            <div key={q.id} className="card pad">
              <b style={{ fontSize: 14 }}>
                {toArabic(q.order)}. {q.text}
              </b>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>
                {q.isReverse && '⟲ عكسي · '}
                وزن {toArabic(q.weight)}
                {q.subscale && ` · محور: ${q.subscale}`}
                {q.flagThreshold != null && ` · عَلَم عند ≥ ${toArabic(q.flagThreshold)}`}
                {' · '}
                {q.options.map((o) => o.label).join(' / ')}
              </div>
            </div>
          ))}
        </div>

        {/* إضافة سؤال */}
        <div className="card pad" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>إضافة سؤال</h4>
          <form action={addQuestion} className="auth-form">
            <input type="hidden" name="versionId" value={version.id} />
            <label className="field">
              <span className="field-label">نص السؤال</span>
              <span className="field-input">
                <input name="text" required placeholder="نص السؤال" />
              </span>
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">الوزن</span>
                <span className="field-input">
                  <input name="weight" type="number" step="0.5" defaultValue={1} />
                </span>
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">المحور (اختياري)</span>
                <span className="field-input">
                  <input name="subscale" placeholder="—" />
                </span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">حد العَلَم (اختياري)</span>
                <span className="field-input">
                  <input name="flagThreshold" type="number" placeholder="—" />
                </span>
              </label>
              <label className="field" style={{ flex: 2 }}>
                <span className="field-label">نص العَلَم</span>
                <span className="field-input">
                  <input name="flagLabel" placeholder="تنبيه عند بلوغ الحد" />
                </span>
              </label>
            </div>
            <label className="consent-row" style={{ background: 'transparent', padding: 0 }}>
              <input type="checkbox" name="isReverse" />
              <span>سؤال عكسي (تُقلب قيمته عند الاحتساب)</span>
            </label>
            <label className="field">
              <span className="field-label">الخيارات (سطر لكل خيار — القيمة = ترتيبه من ٠)</span>
              <textarea
                name="options"
                rows={5}
                className="admin-textarea"
                placeholder={'أبدًا\nنادرًا\nأحيانًا\nغالبًا\nدائمًا'}
              />
            </label>
            <button type="submit" className="btn btn-pink btn-block">
              إضافة السؤال
            </button>
          </form>
        </div>

        {/* النطاقات */}
        <h3 style={{ margin: '26px 0 12px' }}>النطاقات ({toArabic(version.bands.length)})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {version.bands.map((b) => (
            <div key={b.id} className="card pad">
              <b style={{ fontSize: 14 }}>
                {b.label} ({toArabic(b.minScore)}–{toArabic(b.maxScore)})
                {b.subscale && ` · ${b.subscale}`}
              </b>
              <div style={{ fontSize: 12, color: 'var(--slate)', marginTop: 4 }}>{b.interpretation}</div>
            </div>
          ))}
        </div>

        <div className="card pad" style={{ marginTop: 16 }}>
          <h4 style={{ marginBottom: 12 }}>إضافة نطاق</h4>
          <form action={addBand} className="auth-form">
            <input type="hidden" name="versionId" value={version.id} />
            <div style={{ display: 'flex', gap: 10 }}>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">من</span>
                <span className="field-input">
                  <input name="minScore" type="number" step="0.5" defaultValue={0} required />
                </span>
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">إلى</span>
                <span className="field-input">
                  <input name="maxScore" type="number" step="0.5" required />
                </span>
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span className="field-label">التسمية</span>
                <span className="field-input">
                  <input name="label" placeholder="منخفض" required />
                </span>
              </label>
            </div>
            <label className="field">
              <span className="field-label">التفسير</span>
              <span className="field-input">
                <input name="interpretation" placeholder="نص التفسير" />
              </span>
            </label>
            <button type="submit" className="btn btn-pink btn-block">
              إضافة النطاق
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
