'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Icon } from '@/components/Icon'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')

    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)

    if (res?.error) {
      setError('البريد أو كلمة المرور غير صحيحة')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <h1 className="auth-title">أهلًا بعودتك 🌸</h1>
      <p className="auth-sub">سجّلي الدخول لمتابعة رحلتك مع دندونة.</p>

      {error && <div className="auth-alert err">⚠ {error}</div>}

      <form onSubmit={onSubmit} className="auth-form" noValidate>
        <label className="field">
          <span className="field-label">البريد الإلكتروني</span>
          <span className="field-input">
            <Icon name="mail" size={18} />
            <input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
          </span>
        </label>

        <label className="field">
          <span className="field-label">كلمة المرور</span>
          <span className="field-input">
            <Icon name="lock" size={18} />
            <input
              name="password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button type="button" className="eye" onClick={() => setShowPw((v) => !v)} aria-label="إظهار كلمة المرور">
              <Icon name="eye" size={18} />
            </button>
          </span>
        </label>

        <div className="auth-row">
          <Link href="/forgot" className="link-pink">
            نسيت كلمة المرور؟
          </Link>
        </div>

        <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
          {loading ? 'جارٍ الدخول…' : 'تسجيل الدخول'}
        </button>
      </form>

      <p className="auth-switch">
        ليس لديك حساب؟ <Link href="/register" className="link-pink">أنشئي حسابًا</Link>
      </p>
    </>
  )
}
