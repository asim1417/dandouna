import { ICONS } from './icons'

const SVG_ATTRS =
  'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%"'

type Props = {
  name: string
  className?: string
  /** الحجم بالبكسل (العرض والارتفاع). الافتراضي 20 كما في التصميم. */
  size?: number
  title?: string
}

/**
 * أيقونة خطية من مجموعة دندونة.
 * تعرض مسارات SVG مباشرة (بدون اعتماد خارجي على مكتبة أيقونات).
 */
export function Icon({ name, className, size, title }: Props) {
  const paths = ICONS[name]
  if (!paths) return null
  const style = size ? { width: size, height: size } : undefined
  return (
    <span
      className={`ic${className ? ' ' + className : ''}`}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: `<svg ${SVG_ATTRS}>${paths}</svg>` }}
    />
  )
}
