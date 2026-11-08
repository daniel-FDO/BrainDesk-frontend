import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Icon } from './ui.tsx'

export interface MenuItem {
  label: string
  icon?: string
  detail?: string
  /** Renders a link instead of a button. */
  href?: string
  onSelect?: () => void
  danger?: boolean
  disabled?: boolean
}

interface MenuProps {
  /** Accessible name for the trigger. */
  label: string
  trigger: ReactNode
  triggerClassName?: string
  heading?: string
  items: MenuItem[]
}

/** Dropdown of actions. Closes on outside press, Escape, or picking an item. */
export function Menu({ label, trigger, triggerClassName = 'icon-btn', heading, items }: MenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="menu">
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        <div id={panelId} className="menu__panel">
          {heading && <p className="label menu__heading">{heading}</p>}
          <ul>
            {items.map((item) => {
              const content = (
                <>
                  {item.icon && <Icon name={item.icon} />}
                  <span className="min-w-0">
                    <span className="menu__label">{item.label}</span>
                    {item.detail && <span className="meta">{item.detail}</span>}
                  </span>
                </>
              )
              const className = `menu__item ${item.danger ? 'menu__item--danger' : ''}`
              return (
                <li key={item.label}>
                  {item.href ? (
                    <a className={className} href={item.href} onClick={() => setOpen(false)}>
                      {content}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={className}
                      disabled={item.disabled}
                      onClick={() => {
                        setOpen(false)
                        item.onSelect?.()
                      }}
                    >
                      {content}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
