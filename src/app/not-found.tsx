import Link from 'next/link'
import { Icon } from '@/components/Icon'

export default function NotFound() {
  return (
    <div className="sys-page">
      <span className="logo-tile" style={{ width: 56, height: 56, borderRadius: 18 }}>
        <Icon name="search" size={26} />
      </span>
      <h1>الصفحة غير موجودة</h1>
      <p>يبدو أن الرابط غير صحيح أو أن الصفحة انتقلت.</p>
      <div className="sys-actions">
        <Link href="/" className="btn btn-pink">
          العودة للرئيسية
        </Link>
        <Link href="/parent-dashboard" className="btn btn-ghost">
          لوحتي
        </Link>
      </div>
    </div>
  )
}
