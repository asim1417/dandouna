import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ركن الطمأنينة' }

type Breathing = { code: string; title: string; durationSec: number; steps: string[]; whenToUse?: string }
type Athkar = { code?: string; textAr?: string; text?: string; citation?: string }
type CalmCorner = { intro?: string; breathing?: Breathing[]; athkar?: Athkar[]; microTips?: string[] }

export default async function CalmPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  const row = await prisma.siteContent.findUnique({ where: { key: 'calmCorner' } })
  const calm = (row?.data as CalmCorner | null) ?? {}
  const athkarText = (a: Athkar) => a.textAr || a.text || ''

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="calm-hero">
          <div className="gi">
            <Icon name="moon-star" size={26} />
          </div>
          <div className="verse">ركن الطمأنينة</div>
          {calm.intro && <p style={{ fontSize: 14, maxWidth: 560, margin: '10px auto 0' }}>{calm.intro}</p>}
        </div>

        {calm.breathing && calm.breathing.length > 0 && (
          <>
            <h3 style={{ margin: '26px 0 12px' }}>تمارين تنفّس</h3>
            <div className="why-grid">
              {calm.breathing.map((br) => (
                <div className="card pad" key={br.code}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="gi" style={{ width: 38, height: 38 }}>
                      <Icon name="wind" size={18} />
                    </span>
                    <b>{br.title}</b>
                    <span className="pill pill-pink" style={{ fontSize: 11 }}>
                      {toArabic(Math.round(br.durationSec / 60))} د
                    </span>
                  </div>
                  <ol style={{ paddingInlineStart: 18, fontSize: 13.5, color: 'var(--slate)', lineHeight: 2 }}>
                    {br.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  {br.whenToUse && <p style={{ fontSize: 12.5, color: 'var(--gold2)', marginTop: 6 }}>{br.whenToUse}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {calm.athkar && calm.athkar.length > 0 && (
          <>
            <h3 style={{ margin: '26px 0 12px' }}>أذكار وطمأنينة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {calm.athkar.map((a, i) => (
                <div className="ref-quote" key={a.code || i}>
                  <div className="txt">{athkarText(a)}</div>
                  {a.citation && <div className="cite">{a.citation}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {calm.microTips && calm.microTips.length > 0 && (
          <div className="card pad" style={{ marginTop: 22 }}>
            <b style={{ display: 'block', marginBottom: 8 }}>
              <Icon name="sparkles" size={16} /> لمسات صغيرة
            </b>
            <ul style={{ paddingInlineStart: 18, fontSize: 13.5, color: 'var(--slate)', lineHeight: 2 }}>
              {calm.microTips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="safety" style={{ marginTop: 20 }}>
          <Icon name="shield" />
          <span>محتوى اختياري يدعم بناء العادة، ولا يقيس الإيمان. النصوص مراجَعة.</span>
        </div>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
