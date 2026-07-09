'use client'

// حاجز أخطاء جذري (يستبدل الـ layout عند خطأ جذري)
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          fontFamily: "'Readex Pro', system-ui, sans-serif",
          background: '#FFF5F8',
          color: '#1E3A8A',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          textAlign: 'center',
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24 }}>حدث خطأ في التطبيق</h1>
        <p style={{ color: '#64748B' }}>نعتذر — يرجى تحديث الصفحة.</p>
        <button
          onClick={() => reset()}
          style={{ background: '#F74A80', color: '#fff', border: 0, borderRadius: 14, padding: '12px 22px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          إعادة المحاولة
        </button>
      </body>
    </html>
  )
}
