import Link from 'next/link'
import { Icon } from '@/components/Icon'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <Link href="/" className="brand auth-brand" aria-label="دندونة — الرئيسية">
        <span className="logo-tile">
          <Icon name="sparkles" size={22} />
        </span>
        <span>
          <b>دندونة</b>
          <small>DANDOUNA</small>
        </span>
      </Link>
      <div className="auth-card">{children}</div>
      <p className="auth-foot disclaimer-sm">النتائج إرشادية تثقيفية وليست تشخيصًا.</p>
    </div>
  )
}
