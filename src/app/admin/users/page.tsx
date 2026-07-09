import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/admin'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'المستخدمون' }

const ROLES = [
  { v: 'GUARDIAN', l: 'ولي أمر' },
  { v: 'SPECIALIST', l: 'مختص' },
  { v: 'CONTENT_EDITOR', l: 'مشرف محتوى' },
  { v: 'ADMIN', l: 'مدير' },
  { v: 'INSTITUTION', l: 'مؤسسة' },
  { v: 'COMPANY', l: 'شركة' },
  { v: 'USER', l: 'مستخدم' },
]

async function changeRole(formData: FormData) {
  'use server'
  const admin = await requirePermission('user:manage')
  const userId = String(formData.get('userId') || '')
  const role = String(formData.get('role') || '') as
    | 'GUARDIAN' | 'SPECIALIST' | 'CONTENT_EDITOR' | 'ADMIN' | 'INSTITUTION' | 'COMPANY' | 'USER'
  if (!userId || userId === admin.id) redirect('/admin/users') // لا يغيّر المدير دوره لنفسه
  await prisma.user.update({ where: { id: userId }, data: { role } })
  await prisma.auditLog.create({
    data: { actorId: admin.id, action: 'user.role.change', entity: 'User', entityId: userId, metadata: { role } },
  })
  redirect('/admin/users')
}

export default async function AdminUsersPage() {
  await requirePermission('user:manage')
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, fullName: true, email: true, role: true },
  })
  const label = (r: string) => ROLES.find((x) => x.v === r)?.l ?? r

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/admin" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> لوحة الإدارة
        </Link>
        <h1 style={{ margin: '10px 0 18px' }}>المستخدمون ({toArabic(users.length)})</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map((u) => (
            <div key={u.id} className="card pad" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <b>{u.fullName}</b>
                <div style={{ fontSize: 12, color: 'var(--slate)' }}>{u.email}</div>
              </div>
              <form action={changeRole} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="hidden" name="userId" value={u.id} />
                <span className="field-input" style={{ padding: '0 8px' }}>
                  <select name="role" defaultValue={u.role} style={{ padding: '8px 0' }}>
                    {ROLES.map((r) => (
                      <option key={r.v} value={r.v}>{r.l}</option>
                    ))}
                  </select>
                </span>
                <button type="submit" className="btn btn-ghost btn-sm">حفظ</button>
              </form>
            </div>
          ))}
        </div>
        <p className="disclaimer-sm" style={{ marginTop: 14, color: 'var(--slate)' }}>
          الدور الحالي: {label(users[0]?.role ?? '')} — تغيير الأدوار يُسجَّل في سجل التدقيق.
        </p>
      </main>
    </>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
