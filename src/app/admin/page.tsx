import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'لوحة الإدارة' }

const CARDS = [
  { href: '/admin/scales', icon: 'clipboard-list', title: 'المقاييس', desc: 'إضافة وتعديل المقاييس ونسخها' },
  { href: '/admin/questions', icon: 'list-checks', title: 'الأسئلة', desc: 'أسئلة كل مقياس وخياراتها والنطاقات' },
  { href: '/admin/recommendations', icon: 'sprout', title: 'التوصيات', desc: 'توصيات حسب النطاق' },
  { href: '/admin/references', icon: 'book-open', title: 'المراجع', desc: 'المراجع الشرعية والتربوية' },
]

const ADMIN_CARDS = [
  { href: '/admin/users', icon: 'users', title: 'المستخدمون', desc: 'إدارة الأدوار والصلاحيات' },
  { href: '/admin/audit', icon: 'shield', title: 'سجل التدقيق', desc: 'سجل العمليات (PDPL)' },
]

export default async function AdminPage() {
  const user = await requirePermission('scale:manage')
  const isAdmin = user.role === 'ADMIN'
  const cards = isAdmin ? [...CARDS, ...ADMIN_CARDS] : CARDS
  const [scales, questions, recs, refs] = await Promise.all([
    prisma.scale.count(),
    prisma.question.count(),
    prisma.recommendation.count(),
    prisma.islamicReference.count(),
  ])

  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="layout-dashboard" /> لوحة الإدارة
        </span>
        <h1 style={{ margin: '12px 0 6px' }}>إدارة المحتوى</h1>
        <p className="lead">أضِف المقاييس والأسئلة والتوصيات والمراجع دون الحاجة إلى مبرمج.</p>

        <div className="trust" style={{ marginTop: 20 }}>
          {cards.map((c) => (
            <Link key={c.href} href={c.href} className="t t-link">
              <div className="ic-tile">
                <Icon name={c.icon} />
              </div>
              <b>{c.title}</b>
              <small>{c.desc}</small>
            </Link>
          ))}
        </div>

        <div className="admin-stats">
          <Stat n={scales} label="مقياس" />
          <Stat n={questions} label="سؤال" />
          <Stat n={recs} label="توصية" />
          <Stat n={refs} label="مرجع" />
        </div>
      </main>
    </>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="admin-stat">
      <div className="num">{String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])}</div>
      <div>{label}</div>
    </div>
  )
}
