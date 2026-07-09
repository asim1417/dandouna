import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'البداية' }

const STEPS = [
  { icon: 'user', title: 'أضف ملف طفلك', desc: 'اسم الطفل وبعض التفاصيل، مع موافقتك على معالجة بياناته.' },
  { icon: 'clipboard-list', title: 'ابدأ اختبارًا', desc: 'اختر مقياسًا مناسبًا وأجب على الأسئلة بهدوء.' },
  { icon: 'sprout', title: 'اطّلع على النتيجة والتوصيات', desc: 'مؤشر واضح وتوصيات عملية ومراجع موثوقة.' },
]

export default async function OnboardingPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')
  const childCount = await prisma.child.count({ where: { guardianId: user.id, deletedAt: null } })

  return (
    <>
      <SiteHeader />
      <main className="page" style={{ maxWidth: 620 }}>
        <span className="pill pill-pink">
          <Icon name="sparkles" /> أهلًا بك في دندونة
        </span>
        <h1 style={{ margin: '12px 0 6px' }}>ثلاث خطوات لتبدأ</h1>
        <p className="lead">رحلة قصيرة وودودة لفهم أنماط طفلك ودعمه.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '20px 0' }}>
          {STEPS.map((s, i) => (
            <div key={i} className="card pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span className="logo-tile" style={{ borderRadius: 13 }}>
                <Icon name={s.icon} />
              </span>
              <div>
                <b>{toArabic(i + 1)}. {s.title}</b>
                <p style={{ fontSize: 13 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Link href={childCount === 0 ? '/children/new' : '/parent-dashboard'} className="btn btn-pink btn-block">
          {childCount === 0 ? 'أضف ملف طفلك الأول' : 'انتقل إلى لوحتك'}
        </Link>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
