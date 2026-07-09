import Link from 'next/link'
import { Icon } from './Icon'
import { auth, signOut } from '@/lib/auth'

/**
 * ترويسة الموقع. تعرض روابط الدخول/التسجيل للزائر، واسم المستخدم + الخروج للمسجّل.
 */
export async function SiteHeader() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href={user ? '/dashboard' : '/'} className="brand" aria-label="دندونة — الصفحة الرئيسية">
          <span className="logo-tile">
            <Icon name="sparkles" size={22} />
          </span>
          <span>
            <b>دندونة</b>
            <small>DANDOUNA</small>
          </span>
        </Link>

        {user ? (
          <nav className="site-nav">
            <Link href="/dashboard" className="nav-user">
              <Icon name="user" size={16} /> {user.name || 'حسابي'}
            </Link>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button type="submit" className="btn btn-ghost btn-sm">
                خروج
              </button>
            </form>
          </nav>
        ) : (
          <nav className="site-nav">
            <Link href="/auth" className="btn btn-ghost btn-sm">
              تسجيل الدخول
            </Link>
            <Link href="/auth?mode=register" className="btn btn-pink btn-sm">
              إنشاء حساب
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
