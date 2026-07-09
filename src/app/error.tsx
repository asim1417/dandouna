'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@/components/Icon'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // يُسجّل في مراقبة الأخطاء لاحقًا (Sentry ونحوه)
    console.error(error)
  }, [error])

  return (
    <div className="sys-page">
      <span className="logo-tile" style={{ width: 56, height: 56, borderRadius: 18, background: '#FEE2E2', color: '#e11d48' }}>
        <Icon name="shield" size={26} />
      </span>
      <h1>حدث خطأ غير متوقّع</h1>
      <p>نعتذر عن ذلك — حاول مرة أخرى، وإن تكرّر فتواصل معنا.</p>
      <div className="sys-actions">
        <button className="btn btn-pink" onClick={() => reset()}>
          إعادة المحاولة
        </button>
        <Link href="/parent-dashboard" className="btn btn-ghost">
          لوحتي
        </Link>
      </div>
    </div>
  )
}
