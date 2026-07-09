import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const metadata = { title: 'الشروط والأحكام' }

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="page" style={{ maxWidth: 720 }}>
        <span className="pill pill-pink">
          <Icon name="file-text" /> الشروط والأحكام
        </span>
        <h1 style={{ margin: '12px 0 16px' }}>شروط استخدام دندونة</h1>
        <div className="card pad">
          <ul style={{ paddingInlineStart: 20, color: 'var(--slate)', lineHeight: 2.1 }}>
            <li>دندونة أداة تثقيفية إرشادية، ولا تُغني عن تقييم مختص مؤهّل.</li>
            <li>النتائج والتوصيات لا تُعدّ تشخيصًا طبيًا أو نفسيًا.</li>
            <li>يلتزم ولي الأمر بصحّة البيانات المُدخلة، ويتحمّل مسؤولية استخدام الحساب.</li>
            <li>تُعالَج بيانات الأطفال بموافقة ولي الأمر فقط، ووفق نظام حماية البيانات الشخصية (PDPL).</li>
            <li>يحق لك تصدير بياناتك أو حذف حسابك في أي وقت.</li>
          </ul>
          <div className="safety" style={{ marginTop: 16 }}>
            <Icon name="shield-check" />
            <span>باستخدامك المنصة فأنت توافق على هذه الشروط وعلى سياسة الخصوصية.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <Link href="/privacy" className="btn btn-ghost">سياسة الخصوصية</Link>
          <Link href="/" className="btn btn-pink">العودة للرئيسية</Link>
        </div>
      </main>
    </>
  )
}
