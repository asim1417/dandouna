'use client'

import { Suspense, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Icon } from '@/components/Icon'

function AuthInner() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  async function requestCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد غير صحيح')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'تعذّر إرسال الرمز')
        return
      }
      setDevCode(data.devCode ?? null)
      setStep('code')
    } finally {
      setLoading(false)
    }
  }

  function onCodeChange(i: number, v: string) {
    const digit = v.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    if (digit && i < 5) inputs.current[i + 1]?.focus()
  }

  function onCodeKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const full = code.join('')
    if (full.length !== 6) {
      setError('أدخل الرمز المكوّن من ٦ أرقام')
      return
    }
    setLoading(true)
    try {
      const res = await signIn('email-otp', { email, code: full, fullName, redirect: false })
      if (res?.error) {
        setError('الرمز غير صحيح أو منتهٍ')
        return
      }
      router.push('/parent-dashboard')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <>
        <h1 className="auth-title">الدخول إلى دندونة 🌸</h1>
        <p className="auth-sub">أدخل بريدك وسنرسل لك رمز دخول — بلا كلمات مرور.</p>
        {error && <div className="auth-alert err">⚠ {error}</div>}
        <form onSubmit={requestCode} className="auth-form" noValidate>
          <label className="field">
            <span className="field-label">الاسم (لأول دخول)</span>
            <span className="field-input">
              <Icon name="user" size={18} />
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="اسمك الكريم" autoComplete="name" />
            </span>
          </label>
          <label className="field">
            <span className="field-label">البريد الإلكتروني</span>
            <span className="field-input">
              <Icon name="mail" size={18} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required />
            </span>
          </label>
          <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
            {loading ? 'جارٍ الإرسال…' : 'إرسال رمز الدخول'}
          </button>
        </form>
      </>
    )
  }

  return (
    <>
      <h1 className="auth-title">أدخل الرمز</h1>
      <p className="auth-sub">أرسلنا رمزًا من ٦ أرقام إلى {email}.</p>
      {devCode && <div className="dev-code">وضع التطوير — رمزك: <b>{devCode}</b></div>}
      {error && <div className="auth-alert err">⚠ {error}</div>}
      <form onSubmit={verifyCode} className="auth-form" noValidate>
        <div className="otp-boxes">
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el
              }}
              value={d}
              onChange={(e) => onCodeChange(i, e.target.value)}
              onKeyDown={(e) => onCodeKey(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`الرقم ${i + 1}`}
            />
          ))}
        </div>
        <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
          {loading ? 'جارٍ التحقق…' : 'تأكيد والدخول'}
        </button>
        <button
          type="button"
          className="link-pink"
          style={{ background: 'none', border: 0 }}
          onClick={() => {
            setStep('email')
            setCode(['', '', '', '', '', ''])
            setError('')
          }}
        >
          تغيير البريد
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
