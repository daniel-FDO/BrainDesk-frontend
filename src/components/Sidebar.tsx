import { useState, type FormEvent } from 'react'
import { useFocusTimer } from '../context/FocusTimer.tsx'
import { useProfile } from '../context/Profile.tsx'
import { FOCUS_MODES, MAX_TIMER_MINUTES, MIN_TIMER_MINUTES, parseTimerMinutes } from '../lib/focusModes.ts'
import { formatClock } from '../lib/format.ts'
import type { Route } from '../types.ts'
import { Icon } from './ui.tsx'

const NAV: { route?: Route; label: string; icon: string }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: 'space_dashboard' },
  { route: 'notes', label: 'Notes', icon: 'sticky_note_2' },
  { route: 'topics', label: 'Topics', icon: 'folder_open' },
  { route: 'planner', label: 'Study Planner', icon: 'calendar_month' },
  { route: 'assistant', label: 'AI Assistant', icon: 'auto_awesome' },
  { route: 'resources', label: 'Resources', icon: 'local_library' },
]

/** Sidebar timer. Clicking the clock swaps it for a minutes field for the active mode. */
function FocusMini() {
  const timer = useFocusTimer()
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)
  const modeLabel = FOCUS_MODES[timer.mode].label

  function cancel() {
    setDraft(null)
    setInvalid(false)
  }

  function save(e: FormEvent) {
    e.preventDefault()
    const minutes = parseTimerMinutes(draft ?? '')
    if (minutes === null) {
      setInvalid(true)
      return
    }
    timer.setDurations({ ...timer.durations, [timer.mode]: minutes })
    cancel()
  }

  if (draft !== null) {
    return (
      <form className="focus-mini focus-mini--edit" onSubmit={save} noValidate>
        <label className="label" htmlFor="timer-minutes">
          {modeLabel} minutes
        </label>
        <div className="focus-mini__edit-row">
          <input
            id="timer-minutes"
            className="input mono"
            type="number"
            inputMode="numeric"
            min={MIN_TIMER_MINUTES}
            max={MAX_TIMER_MINUTES}
            value={draft}
            autoFocus
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setDraft(e.target.value)
              setInvalid(false)
            }}
            onKeyDown={(e) => e.key === 'Escape' && cancel()}
          />
          <button type="submit" className="btn btn--primary btn--xs">
            Save
          </button>
          <button type="button" className="icon-btn icon-btn--sm" aria-label="Cancel" onClick={cancel}>
            <Icon name="close" />
          </button>
        </div>
        {invalid && (
          <p className="form-error" role="alert">
            Enter {MIN_TIMER_MINUTES}–{MAX_TIMER_MINUTES} minutes.
          </p>
        )}
      </form>
    )
  }

  return (
    <div className="focus-mini">
      <div>
        <p className="label">Focus Timer</p>
        <button
          type="button"
          className="focus-mini__time mono"
          title="Change timer length"
          aria-label={`${formatClock(timer.remaining)} remaining. Change ${modeLabel} length`}
          onClick={() => setDraft(String(timer.durations[timer.mode]))}
        >
          {formatClock(timer.remaining)}
          <Icon name="edit" />
        </button>
      </div>
      <div className="focus-mini__side">
        <Icon name="timer" className="focus-mini__icon" />
        <button type="button" className="btn btn--outline btn--xs" onClick={timer.running ? timer.pause : timer.start}>
          {timer.running ? 'Pause' : 'Start'}
        </button>
      </div>
    </div>
  )
}

interface SidebarProps {
  route: Route
  open: boolean
  onClose: () => void
}

export function Sidebar({ route, open, onClose }: SidebarProps) {
  const profile = useProfile()
  const onSettings = route === 'settings'

  return (
    <>
      <div className={`scrim ${open ? 'scrim--visible' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside id="sidebar" className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Primary">
        <a className="brand" href="#/dashboard" onClick={onClose}>
          <span className="brand__mark" aria-hidden="true">
            <Icon name="view_week" filled />
          </span>
          BrainDesk
        </a>

        <nav className="nav">
          <ul>
            {NAV.map((item) => (
              <li key={item.label}>
                {item.route ? (
                  <a
                    href={`#/${item.route}`}
                    className={`nav__link ${route === item.route ? 'is-active' : ''}`}
                    aria-current={route === item.route ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <Icon name={item.icon} filled={route === item.route} />
                    {item.label}
                  </a>
                ) : (
                  <span className="nav__link is-disabled" aria-disabled="true" title="Not available yet">
                    <Icon name={item.icon} />
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar__footer">
          <FocusMini />

          <a
            href="#/settings"
            className={`nav__link ${onSettings ? 'is-active' : ''}`}
            aria-current={onSettings ? 'page' : undefined}
            onClick={onClose}
          >
            <Icon name="settings" filled={onSettings} />
            Settings
          </a>

          <a href="#/settings" className="user-card" aria-label={`Edit profile: ${profile.name}`} onClick={onClose}>
            <span className="avatar" aria-hidden="true">
              <Icon name="person" filled />
            </span>
            <span className="user-card__text">
              <strong className="truncate">{profile.name}</strong>
              <span className="truncate">{profile.track}</span>
            </span>
            <Icon name="chevron_right" />
          </a>
        </div>
      </aside>
    </>
  )
}
