import Link from 'next/link'
import { Icon } from './Icon'

/**
 * ترويسة الموقع الحقيقية (بديلة عن شريط تبديل الشاشات في النموذج).
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="دندونة — الصفحة الرئيسية">
          <span className="logo-tile">
            <Icon name="sparkles" size={22} />
          </span>
          <span>
            <b>دندونة</b>
            <small>DANDOUNA</small>
          </span>
        </Link>
        <nav className="site-nav">
          <Link href="/login" className="btn btn-ghost btn-sm">
            تسجيل الدخول
          </Link>
          <Link href="/register" className="btn btn-pink btn-sm">
            إنشاء حساب
          </Link>
        </nav>
      </div>
    </header>
  )
}
