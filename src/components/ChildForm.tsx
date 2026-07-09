'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './Icon'

const COLORS = ['#F74A80', '#3B82F6', '#16A34A', '#C9A86A', '#7C6BD1']

export function ChildForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [consent, setConsent] = useState(true)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)
    const payload = {
      fullName: String(form.get('fullName') || ''),
      birthDate: String(form.get('birthDate') || '') || undefined,
      gender: String(form.get('gender') || '') || undefined,
      avatarColor: color,
      grantConsent: consent,
    }
    if (!consent) {
      setError('يلزم إقراركم بالموافقة على معالجة بيانات الطفل للمتابعة (PDPL).')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'تعذّر إنشاء الملف')
        return
      }
      router.push(`/children/${data.child.id}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      {error && <div className="auth-alert err">⚠ {error}</div>}

      <label className="field">
        <span className="field-label">اسم الطفل</span>
        <span className="field-input">
          <Icon name="user" size={18} />
          <input name="fullName" type="text" placeholder="اسم الطفل" required />
        </span>
      </label>

      <label className="field">
        <span className="field-label">تاريخ الميلاد (اختياري)</span>
        <span className="field-input">
          <Icon name="calendar-check" size={18} />
          <input name="birthDate" type="date" />
        </span>
      </label>

      <label className="field">
        <span className="field-label">الجنس (اختياري)</span>
        <span className="field-input">
          <Icon name="users" size={18} />
          <select name="gender" defaultValue="">
            <option value="">غير محدّد</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>
        </span>
      </label>

      <div className="field">
        <span className="field-label">لون الملف</span>
        <div style={{ display: 'flex', gap: 10 }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`لون ${c}`}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: c,
                border: color === c ? '3px solid #1E3A8A' : '3px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      </div>

      <label className="consent-row">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          أُقِرّ بصفتي ولي الأمر بموافقتي على معالجة بيانات هذا الطفل لأغراض التقييم الإرشادي، وفق
          نظام حماية البيانات الشخصية (PDPL). يمكنني سحب الموافقة لاحقًا.
        </span>
      </label>

      <button type="submit" className="btn btn-pink btn-block" disabled={loading}>
        {loading ? 'جارٍ الحفظ…' : 'حفظ الملف'}
      </button>
    </form>
  )
}
