'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Icon } from '@/components/Icon'

function AuthInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [mode, setMode] = useState<'login' | 'register'>(
    params.get('mode') === 'register' ? 'register' : 'login',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleLogin(form: FormData) {
    const email = String(form.get('email') || '')
    const password = String(form.get('password') || '')
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.error) {
      setError('البريد أو كلمة المرور غير صحيحة')
      return false
    }
    return true
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    setLoading(true)

    try {
      if (mode === 'register') {
        const payload = {
          fullName: String(form.get('fullName') || ''),
          email: String(form.get('email') || ''),
          password: String(form.get('password') || ''),
          isMinor: form.get('isMinor') === 'MINOR',
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || 'تعذّر إنشاء الحساب')
          return
        }
        const ok = await signIn('credentials', {
          email: payload.email,
          password: payload.password,
          redirect: false,
        })
        if (ok?.error) {
          setError('تم إنشاء الحساب — يرجى تسجيل الدخول')
          setMode('login')
          return
        }
        router.push(data.needsGuardianConsent ? '/consent' : '/dashboard')
        router.refresh()
      } else {
        const ok = await handleLogin(form)
        if (!ok) return
        router.push('/dashboard')
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'

  return (
    <>
      <div className="auth-tabs">
        <button
          type="button"
          className={!isRegister ? 'on' : ''}
          onClick={() => {
            setMode('login')
            setError('')
          }}
        >
          تسجيل الدخول
        </button>
        <button
          type="button"
          className={isRegister ? 'on' : ''}
          onClick={() => {
            setMode('register')
            setError('')
          }}
        >
          إنشاء حساب
        </button>
      </div>

      <h1 className="auth-title">{isRegister ? 'أنشئي حسابك في دندونة' : 'أهلًا بعودتك 🌸'}</h1>
      <p className="auth-sub">
        {isRegister ? 'خطوة واحدة تفصلك عن بداية رحلتك.' : 'سجّلي الدخول لمتابعة رحلتك مع دندونة.'}
      </p>

      {error && <div className="auth-alert err">⚠ {error}</div>}

      <form onSubmit={onSubmit} className="auth-form" noValidate>
        {isRegister && (
          <label className="field">
            <span className="field-label">الاسم</span>
            <span className="field-input">
              <Icon name="user" size={18} />
              <input name="fullName" type="text" placeholder="اسمك الكريم" autoComplete="name" required />
            </span>
          </label>
        )}

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
              placeholder={isRegister ? '٨ أحرف على الأقل' : '••••••••'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              minLength={8}
              required
            />
            <button type="button" className="eye" onClick={() => setShowPw((v) => !v)} aria-label="إظهار كلمة المرور">
              <Icon name="eye" size={18} />
            </button>
          </span>
        </label>

        {isRegister && (
          <label className="field">
            <span className="field-label">الفئة العمرية</span>
            <span className="field-input">
              <Icon name="users" size={18} />
              <select name="isMinor" defaultValue="ADULT" required>
                <option value="ADULT">بالغ (١٨ سنة فأكثر)</option>
                <option value="MINOR">قاصر (يتطلب موافقة ولي الأمر)</option>
              </select>
            </span>
          </label>
        )}

        <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
          {loading ? (isRegister ? 'جارٍ الإنشاء…' : 'جارٍ الدخول…') : isRegister ? 'إنشاء الحساب' : 'تسجيل الدخول'}
        </button>
      </form>
    </>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="auth-sub">جارٍ التحميل…</div>}>
      <AuthInner />
    </Suspense>
  )
}
