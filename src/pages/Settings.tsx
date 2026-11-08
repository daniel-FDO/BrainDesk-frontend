import { useState, type FormEvent } from 'react'
import { Icon } from '../components/ui.tsx'
import { useFocusTimer } from '../context/FocusTimer.tsx'
import { useProfile } from '../context/Profile.tsx'
import {
  DEFAULT_DURATIONS,
  FOCUS_MODES,
  FOCUS_MODE_IDS,
  MAX_TIMER_MINUTES,
  MIN_TIMER_MINUTES,
  parseTimerMinutes,
  type FocusDurations,
  type FocusMode,
} from '../lib/focusModes.ts'

function SavedBadge() {
  return (
    <span className="saved mono" role="status">
      <Icon name="check_circle" /> Saved
    </span>
  )
}

function ProfileSection() {
  const profile = useProfile()
  const [name, setName] = useState(profile.name)
  const [track, setTrack] = useState(profile.track)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError(true)
      return
    }
    profile.update({ name: name.trim(), track: track.trim() })
    setSaved(true)
  }

  return (
    <form className="card panel settings__section" aria-labelledby="profile-title" onSubmit={submit} noValidate>
      <div className="settings__profile">
        <span className="avatar avatar--lg" aria-hidden="true">
          <Icon name="person" filled />
        </span>
        <div className="min-w-0">
          <h2 id="profile-title" className="h4">
            Profile
          </h2>
          <p className="meta">Shown in the sidebar and your dashboard greeting.</p>
        </div>
      </div>
      <div className="form-grid">
        <label className="field">
          <span className="label">Name</span>
          <input
            className="input"
            value={name}
            autoComplete="name"
            aria-invalid={error || undefined}
            onChange={(e) => {
              setName(e.target.value)
              setError(false)
              setSaved(false)
            }}
          />
        </label>
        <label className="field">
          <span className="label">Study track</span>
          <input
            className="input"
            value={track}
            placeholder="e.g. CS & Bio"
            onChange={(e) => {
              setTrack(e.target.value)
              setSaved(false)
            }}
          />
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          <Icon name="error" /> Your name can&rsquo;t be empty.
        </p>
      )}
      <div className="form-actions">
        {saved && <SavedBadge />}
        <button type="submit" className="btn btn--primary">
          Save profile
        </button>
      </div>
    </form>
  )
}

function TimerSection() {
  const timer = useFocusTimer()
  // Only fields being edited live here, so changes from the sidebar timer show up immediately.
  const [edits, setEdits] = useState<Partial<Record<FocusMode, string>>>({})
  const [invalid, setInvalid] = useState<FocusMode[]>([])
  const [saved, setSaved] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    const next: FocusDurations = { ...timer.durations }
    const bad: FocusMode[] = []
    for (const mode of FOCUS_MODE_IDS) {
      const minutes = parseTimerMinutes(edits[mode] ?? String(timer.durations[mode]))
      if (minutes === null) bad.push(mode)
      else next[mode] = minutes
    }
    setInvalid(bad)
    if (bad.length > 0) return
    timer.setDurations(next)
    setEdits({})
    setSaved(true)
  }

  function restoreDefaults() {
    timer.setDurations(DEFAULT_DURATIONS)
    setEdits({})
    setInvalid([])
    setSaved(true)
  }

  return (
    <form className="card panel settings__section" aria-labelledby="timer-title" onSubmit={submit} noValidate>
      <div>
        <h2 id="timer-title" className="h4">
          Focus timer
        </h2>
        <p className="meta">Changing the length of the mode you&rsquo;re in restarts that timer.</p>
      </div>
      <div className="form-grid form-grid--3">
        {FOCUS_MODE_IDS.map((mode) => (
          <label key={mode} className="field">
            <span className="label">{FOCUS_MODES[mode].label} (min)</span>
            <input
              className="input mono"
              type="number"
              inputMode="numeric"
              min={MIN_TIMER_MINUTES}
              max={MAX_TIMER_MINUTES}
              value={edits[mode] ?? String(timer.durations[mode])}
              aria-invalid={invalid.includes(mode) || undefined}
              onChange={(e) => {
                setEdits((prev) => ({ ...prev, [mode]: e.target.value }))
                setInvalid((prev) => prev.filter((m) => m !== mode))
                setSaved(false)
              }}
            />
          </label>
        ))}
      </div>
      {invalid.length > 0 && (
        <p className="form-error" role="alert">
          <Icon name="error" /> Timer lengths must be {MIN_TIMER_MINUTES}–{MAX_TIMER_MINUTES} minutes.
        </p>
      )}
      <div className="form-actions">
        {saved && <SavedBadge />}
        <button type="button" className="btn btn--ghost" onClick={restoreDefaults}>
          Restore defaults
        </button>
        <button type="submit" className="btn btn--primary">
          Save timer
        </button>
      </div>
    </form>
  )
}

export function Settings() {
  return (
    <div className="settings stack-16">
      <header className="page-head">
        <div>
          <h1 className="h1">Settings</h1>
          <p className="muted">Your profile and timer, saved in this browser.</p>
        </div>
      </header>
      <ProfileSection />
      <TimerSection />
    </div>
  )
}
