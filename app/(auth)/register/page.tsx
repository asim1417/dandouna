'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Icon } from '@/components/Icon'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
      ageBand: String(form.get('ageBand') || 'ADULT'),
    }

    setLoading(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setLoading(false)
      setError(data.error || 'تعذّر إنشاء الحساب')
      return
    }

    // دخول تلقائي بعد الإنشاء
    await signIn('credentials', {
      email: payload.email,
      password: payload.password,
      redirect: false,
    })
    setLoading(false)

    if (data.needsGuardianConsent) {
      router.push('/consent')
    } else {
      router.push('/dashboard')
    }
    router.refresh()
  }

  return (
    <>
      <h1 className="auth-title">أنشئي حسابك في دندونة</h1>
      <p className="auth-sub">خطوة واحدة تفصلك عن بداية رحلتك.</p>

      {error && <div className="auth-alert err">⚠ {error}</div>}

      <form onSubmit={onSubmit} className="auth-form" noValidate>
        <label className="field">
          <span className="field-label">الاسم</span>
          <span className="field-input">
            <Icon name="user" size={18} />
            <input name="name" type="text" placeholder="اسمك الكريم" autoComplete="name" required />
          </span>
        </label>

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
              placeholder="٨ أحرف على الأقل"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button type="button" className="eye" onClick={() => setShowPw((v) => !v)} aria-label="إظهار كلمة المرور">
              <Icon name="eye" size={18} />
            </button>
          </span>
        </label>

        <label className="field">
          <span className="field-label">الفئة العمرية</span>
          <span className="field-input">
            <Icon name="users" size={18} />
            <select name="ageBand" defaultValue="ADULT" required>
              <option value="ADULT">بالغ (١٨ سنة فأكثر)</option>
              <option value="MINOR">قاصر (يتطلب موافقة ولي الأمر)</option>
            </select>
          </span>
        </label>

        <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
          {loading ? 'جارٍ الإنشاء…' : 'إنشاء الحساب'}
        </button>
      </form>

      <p className="auth-switch">
        لديك حساب؟ <Link href="/login" className="link-pink">سجّلي الدخول</Link>
      </p>
    </>
  )
}
