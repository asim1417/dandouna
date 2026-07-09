import { redirect } from 'next/navigation'
import Link from 'next/link'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'موافقة ولي الأمر' }

export default async function ConsentPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="card pad" style={{ maxWidth: 620 }}>
          <span className="logo-tile" style={{ borderRadius: 13 }}>
            <Icon name="heart-handshake" />
          </span>
          <h1 style={{ margin: '14px 0 8px', fontSize: 22 }}>موافقة ولي الأمر مطلوبة</h1>
          <p>
            لأن الحساب مسجّل كقاصر، يلزم اعتماد ولي الأمر قبل بدء الاختبارات — حمايةً لخصوصية بيانات
            الأطفال وامتثالًا لنظام حماية البيانات الشخصية (PDPL).
          </p>
          <div className="safety" style={{ marginTop: 16 }}>
            <Icon name="shield" />
            <span>سيصل ولي الأمر برابط الاعتماد. هذه الخطوة قيد الإكمال في هذه المرحلة.</span>
          </div>
          <Link href="/dashboard" className="btn btn-ghost" style={{ marginTop: 18 }}>
            العودة للوحة
          </Link>
        </div>
      </main>
    </>
  )
}
