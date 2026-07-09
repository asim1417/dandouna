import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const metadata = { title: 'الخصوصية' }

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <span className="pill pill-pink">
          <Icon name="lock" /> الخصوصية والبيانات
        </span>
        <h1 style={{ margin: '12px 0 16px' }}>خصوصيتك أولويّة</h1>
        <div className="card pad" style={{ maxWidth: 720 }}>
          <p style={{ marginBottom: 12 }}>
            في دندونة نجمع الحدّ الأدنى من البيانات اللازم لتقديم الخدمة. لا تُباع بياناتك ولا تُستخدم
            في التوظيف أو العقوبة أو التمييز.
          </p>
          <ul style={{ paddingInlineStart: 20, color: 'var(--slate)', lineHeight: 2 }}>
            <li>بيانات القُصّر لا تُعالَج إلا بموافقة ولي أمر موثّقة.</li>
            <li>يمكنك طلب تصدير بياناتك أو حذف حسابك في أي وقت.</li>
            <li>متوافقون مع نظام حماية البيانات الشخصية السعودي (PDPL).</li>
          </ul>
          <div className="safety" style={{ marginTop: 16 }}>
            <Icon name="shield-check" />
            <span>النتائج إرشادية تثقيفية وليست تشخيصًا طبيًا أو نفسيًا.</span>
          </div>
        </div>
        <Link href="/" className="btn btn-ghost" style={{ marginTop: 18 }}>
          العودة للرئيسية
        </Link>
      </main>
    </>
  )
}
