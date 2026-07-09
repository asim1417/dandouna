'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from './Icon'

export type RunnerQuestion = {
  id: string
  text: string
  options: { label: string; value: number }[]
}

type Props = {
  assessmentId: string
  scaleTitle: string
  questions: RunnerQuestion[]
  initialAnswers: Record<string, number>
}

export function AssessmentRunner({ assessmentId, scaleTitle, questions, initialAnswers }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers)
  const [index, setIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [error, setError] = useState('')

  const q = questions[index]
  const total = questions.length
  const progress = useMemo(() => Math.round(((index + 1) / total) * 100), [index, total])
  const isLast = index === total - 1

  async function saveAnswer(value: number) {
    setAnswers((prev) => ({ ...prev, [q.id]: value }))
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: q.id, value }),
      })
      if (!res.ok) setError('تعذّر حفظ الإجابة — تحقّقي من الاتصال.')
    } catch {
      setError('تعذّر حفظ الإجابة — تحقّقي من الاتصال.')
    } finally {
      setSaving(false)
    }
  }

  async function finish() {
    setFinishing(true)
    setError('')
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/submit`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'تعذّر إنهاء الاختبار.')
        setFinishing(false)
        return
      }
      router.push(`/assessment/result/${assessmentId}`)
      router.refresh()
    } catch {
      setError('تعذّر إنهاء الاختبار.')
      setFinishing(false)
    }
  }

  const answeredCount = Object.keys(answers).length
  const current = answers[q.id]

  return (
    <div className="two">
      <div className="card qcard">
        <div className="qbar">
          <span>{scaleTitle}</span>
          <span className="num">
            السؤال {toArabic(index + 1)} من {toArabic(total)}
          </span>
        </div>
        <div className="bar">
          <i style={{ width: `${progress}%` }} />
        </div>

        <div className="qtext">{q.text}</div>

        <div className="likert">
          {q.options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              className={`lk${current === opt.value ? ' sel' : ''}`}
              onClick={() => saveAnswer(opt.value)}
            >
              <span className="rd" />
              {opt.label}
            </button>
          ))}
        </div>

        {error && <p className="q-error">⚠ {error}</p>}

        <div className="qnav">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => index > 0 && setIndex(index - 1)}
            disabled={index === 0}
          >
            <Icon name="arrow-left" size={16} /> رجوع
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {isLast ? (
              <button
                type="button"
                className="btn btn-pink btn-sm"
                onClick={finish}
                disabled={finishing || answeredCount === 0}
              >
                {finishing ? 'جارٍ الحساب…' : 'إنهاء وعرض النتيجة'}
              </button>
            ) : (
              <button type="button" className="btn btn-pink btn-sm" onClick={() => setIndex(index + 1)}>
                التالي
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="card pad">
          <b style={{ display: 'block', marginBottom: 6 }}>حفظ تلقائي</b>
          <p style={{ fontSize: 13 }}>
            تُحفظ كل إجابة فور اختيارها {saving ? '(جارٍ الحفظ…)' : '✓'}؛ يمكنك المتابعة لاحقًا من حيث توقّفتِ.
          </p>
        </div>
        <div className="card pad">
          <b style={{ display: 'block', marginBottom: 6 }}>تقدّمك</b>
          <p style={{ fontSize: 13 }}>
            أجبتِ على {toArabic(answeredCount)} من {toArabic(total)} سؤالًا.
          </p>
        </div>
        <div className="safety">
          <Icon name="shield" />
          <span>أجيبي بصدق ودون تهويل — لا توجد إجابة صحيحة أو خاطئة، والنتيجة إرشادية.</span>
        </div>
      </div>
    </div>
  )
}

function toArabic(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
