import { redirect } from 'next/navigation'
import Link from 'next/link'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { ChildForm } from '@/components/ChildForm'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'إضافة ملف طفل' }

export default async function NewChildPage() {
  const user = await currentUser()
  if (!user) redirect('/auth')

  return (
    <>
      <SiteHeader />
      <main className="page" style={{ maxWidth: 560 }}>
        <Link href="/children" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> رجوع للملفات
        </Link>
        <h1 style={{ margin: '10px 0 18px' }}>إضافة ملف طفل</h1>
        <div className="card pad">
          <ChildForm />
        </div>
      </main>
    </>
  )
}
