import { redirect } from 'next/navigation'
import { auth, signOut } from '@/lib/auth'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const metadata = { title: 'لوحتي' }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const name = session.user.name || 'صديقتي'

  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="dash-welcome">
          <div>
            <span className="pill pill-pink">
              <Icon name="sparkles" /> أهلًا {name}
            </span>
            <h1 style={{ marginTop: 12 }}>لوحتك في دندونة</h1>
            <p className="lead">تم تسجيل دخولك بنجاح. من هنا تبدأ رحلتك مع الاختبارات والخطط.</p>
          </div>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button type="submit" className="btn btn-ghost btn-sm">
              تسجيل الخروج
            </button>
          </form>
        </div>

        <div className="trust" style={{ marginTop: 20 }}>
          <div className="t">
            <div className="ic-tile">
              <Icon name="flask-conical" />
            </div>
            <b>ابدأ اختبارًا</b>
            <small>قريبًا — محرّك المقاييس</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="calendar-check" />
            </div>
            <b>خطتك اليومية</b>
            <small>قريبًا</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="file-text" />
            </div>
            <b>تقاريرك</b>
            <small>قريبًا</small>
          </div>
          <div className="t">
            <div className="ic-tile">
              <Icon name="moon-star" />
            </div>
            <b>ركن الطمأنينة</b>
            <small>قريبًا</small>
          </div>
        </div>
      </main>
    </>
  )
}
