import type { ReactNode } from 'react'
import type { Tone } from '../types.ts'

/** Material Symbols glyph — decorative unless a `label` is given. */
export function Icon({ name, filled, label, className = '' }: { name: string; filled?: boolean; label?: string; className?: string }) {
  return (
    <span
      className={`icon ${filled ? 'icon--filled' : ''} ${className}`}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {name}
    </span>
  )
}

export function Chip({ tone = 'blue', children, mono }: { tone?: Tone; children: ReactNode; mono?: boolean }) {
  return <span className={`chip chip--${tone} ${mono ? 'mono' : ''}`}>{children}</span>
}

export function Tag({ children }: { children: string }) {
  return <span className="tag mono">#{children}</span>
}

export function ProgressBar({ value, tone = 'blue', label }: { value: number; tone?: Tone; label: string }) {
  return (
    <div
      className={`progress progress--${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

/** Circular progress used for module mastery and the focus timer. */
export function Ring({
  value,
  size = 72,
  stroke = 7,
  children,
  label,
}: {
  value: number
  size?: number
  stroke?: number
  children?: ReactNode
  label: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring__track" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring__value"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(Math.max(value, 0), 100) / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring__label">{children}</div>
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty" role="status">
      <Icon name={icon} />
      <p className="empty__title">{title}</p>
      {children && <p className="empty__body">{children}</p>}
    </div>
  )
}
