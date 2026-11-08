export type FocusMode = 'pomodoro' | 'short' | 'deep'
export type FocusDurations = Record<FocusMode, number>

export const FOCUS_MODES: Record<FocusMode, { label: string }> = {
  pomodoro: { label: 'Pomodoro' },
  short: { label: 'Short Break' },
  deep: { label: 'Deep Work' },
}

export const FOCUS_MODE_IDS = Object.keys(FOCUS_MODES) as FocusMode[]

export const DEFAULT_DURATIONS: FocusDurations = { pomodoro: 25, short: 5, deep: 50 }

export const MIN_TIMER_MINUTES = 1
export const MAX_TIMER_MINUTES = 180

/**
 * Turns what the user typed into a timer length in minutes, or null if it should be rejected.
 * Used by the sidebar timer, the Settings page and when reading saved lengths back from storage.
 */
export function parseTimerMinutes(raw: string): number | null {
  const minutes = Number(raw)
  return Number.isInteger(minutes) && minutes >= MIN_TIMER_MINUTES && minutes <= MAX_TIMER_MINUTES ? minutes : null
}
