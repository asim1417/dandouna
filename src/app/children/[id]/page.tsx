import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { currentUser } from '@/lib/session'
import { SiteHeader } from '@/components/SiteHeader'
import { Icon } from '@/components/Icon'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'ملف الطفل' }

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'قيد التقدّم',
  COMPLETED: 'مكتمل',
  ABANDONED: 'متروك',
}

async function grantConsent(formData: FormData) {
  'use server'
  const childId = String(formData.get('childId') || '')
  const user = await currentUser()
  if (!user) redirect('/auth')
  const child = await prisma.child.findFirst({ where: { id: childId, guardianId: user.id, deletedAt: null } })
  if (!child) redirect('/children')
  await prisma.consent.create({
    data: { childId, grantedById: user.id, purpose: 'أداء مقاييس التقييم السلوكي', status: 'GRANTED', grantedAt: new Date() },
  })
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'consent.grant', entity: 'Consent', entityId: childId } })
  redirect(`/children/${childId}`)
}

async function shareWithSpecialist(formData: FormData) {
  'use server'
  const childId = String(formData.get('childId') || '')
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const user = await currentUser()
  if (!user) redirect('/auth')
  const child = await prisma.child.findFirst({ where: { id: childId, guardianId: user.id, deletedAt: null } })
  if (child && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    await prisma.specialistLink.upsert({
      where: { childId_specialistEmail: { childId, specialistEmail: email } },
      update: {},
      create: { childId, specialistEmail: email, grantedById: user.id },
    })
    await prisma.auditLog.create({ data: { actorId: user.id, action: 'specialist.share', entity: 'SpecialistLink', entityId: childId } })
  }
  redirect(`/children/${childId}`)
}

async function deleteChild(formData: FormData) {
  'use server'
  const childId = String(formData.get('childId') || '')
  const user = await currentUser()
  if (!user) redirect('/auth')
  const child = await prisma.child.findFirst({ where: { id: childId, guardianId: user.id, deletedAt: null } })
  if (child) {
    await prisma.child.update({ where: { id: childId }, data: { deletedAt: new Date() } })
    await prisma.auditLog.create({ data: { actorId: user.id, action: 'child.delete', entity: 'Child', entityId: childId } })
  }
  redirect('/children')
}

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  if (!user) redirect('/auth')
  const { id } = await params

  const child = await prisma.child.findFirst({
    where: { id, guardianId: user.id, deletedAt: null },
    include: {
      consents: { where: { status: 'GRANTED' }, take: 1 },
      specialistLinks: { orderBy: { createdAt: 'desc' } },
      assessments: {
        orderBy: { startedAt: 'desc' },
        select: { id: true, status: true, version: { select: { scale: { select: { title: true } } } } },
      },
    },
  })
  if (!child) notFound()
  const hasConsent = child.consents.length > 0

  return (
    <>
      <SiteHeader />
      <main className="page">
        <Link href="/children" className="link-pink" style={{ fontSize: 13 }}>
          <Icon name="arrow-left" size={14} /> رجوع للملفات
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '12px 0 20px' }}>
          <span className="logo-tile" style={{ background: child.avatarColor || 'var(--pink)', borderRadius: 16, width: 52, height: 52 }}>
            <Icon name="smile" size={26} />
          </span>
          <div>
            <h1 style={{ fontSize: 24 }}>{child.fullName}</h1>
            {child.gender && <span style={{ fontSize: 13, color: 'var(--slate)' }}>{child.gender}</span>}
          </div>
        </div>

        {!hasConsent ? (
          <div className="card pad" style={{ marginBottom: 18 }}>
            <div className="safety" style={{ marginBottom: 12 }}>
              <Icon name="shield" />
              <span>لبدء التقييم يلزم إقراركم بالموافقة على معالجة بيانات الطفل (PDPL).</span>
            </div>
            <form action={grantConsent}>
              <input type="hidden" name="childId" value={child.id} />
              <button type="submit" className="btn btn-pink">
                أوافق على معالجة البيانات
              </button>
            </form>
          </div>
        ) : (
          <div className="card pad" style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div className="safety" style={{ margin: 0 }}>
              <Icon name="shield-check" />
              <span>الموافقة سارية — يمكنك بدء الاختبارات.</span>
            </div>
            <Link href="/assessment" className="btn btn-pink btn-sm">
              ابدأ اختبارًا
            </Link>
          </div>
        )}

        <h3 style={{ margin: '10px 0 12px' }}>اختبارات {child.fullName}</h3>
        {child.assessments.length === 0 ? (
          <div className="card pad">
            <p>لا توجد اختبارات بعد.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {child.assessments.map((a) => (
              <Link
                key={a.id}
                href={a.status === 'COMPLETED' ? `/assessment/result/${a.id}` : `/assessment/run/${a.id}`}
                className="card pad"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <b>{a.version.scale.title}</b>
                <span className="pill pill-pink">{STATUS_LABEL[a.status] ?? a.status}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="card pad" style={{ marginTop: 26 }}>
          <h4 style={{ marginBottom: 4 }}>
            <Icon name="heart-handshake" size={16} /> مشاركة مع مختص
          </h4>
          <p style={{ fontSize: 13, marginBottom: 12 }}>
            بتفويض صريح منك، يمكن لمختص الاطّلاع على تقارير {child.fullName} عند دخوله بنفس البريد.
          </p>
          {child.specialistLinks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {child.specialistLinks.map((l) => (
                <span key={l.id} className="pill pill-pink" style={{ fontSize: 12 }}>
                  {l.specialistEmail}
                </span>
              ))}
            </div>
          )}
          <form action={shareWithSpecialist} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="hidden" name="childId" value={child.id} />
            <span className="field-input" style={{ flex: 1, minWidth: 200 }}>
              <Icon name="mail" size={16} />
              <input name="email" type="email" placeholder="بريد المختص" required />
            </span>
            <button type="submit" className="btn btn-ghost btn-sm">مشاركة</button>
          </form>
        </div>

        <form action={deleteChild} style={{ marginTop: 20 }}>
          <input type="hidden" name="childId" value={child.id} />
          <button type="submit" className="btn btn-ghost btn-sm" style={{ borderColor: '#fecdd3', color: '#e11d48' }}>
            <Icon name="shield" size={14} /> حذف الملف نهائيًا
          </button>
        </form>
      </main>
    </>
  )
}
