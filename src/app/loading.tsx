import { Icon } from '@/components/Icon'

export default function Loading() {
  return (
    <div className="sys-page">
      <span className="logo-tile spin-tile" style={{ width: 48, height: 48, borderRadius: 16 }}>
        <Icon name="sparkles" size={22} />
      </span>
      <p style={{ color: 'var(--slate)' }}>جارٍ التحميل…</p>
    </div>
  )
}
