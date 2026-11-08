import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import {
  DEFAULT_DURATIONS,
  FOCUS_MODE_IDS,
  parseTimerMinutes,
  type FocusDurations,
  type FocusMode,
} from '../lib/focusModes.ts'
import { readJson, writeJson } from '../lib/storage.ts'

const STORAGE_KEY = 'braindesk.timer.durations'

interface TimerState {
  mode: FocusMode
  durations: FocusDurations
  remaining: number
  running: boolean
}

type TimerAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'tick' }
  | { type: 'setMode'; mode: FocusMode }
  | { type: 'setDurations'; durations: FocusDurations }

const secondsFor = (durations: FocusDurations, mode: FocusMode) => durations[mode] * 60

function reducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'start':
      return { ...state, running: true, remaining: state.remaining || secondsFor(state.durations, state.mode) }
    case 'pause':
      return { ...state, running: false }
    case 'reset':
      return { ...state, running: false, remaining: secondsFor(state.durations, state.mode) }
    case 'setMode':
      return { ...state, mode: action.mode, running: false, remaining: secondsFor(state.durations, action.mode) }
    case 'setDurations':
      // A new length for the active mode restarts it; other modes apply next time they're picked.
      if (action.durations[state.mode] === state.durations[state.mode]) return { ...state, durations: action.durations }
      return {
        ...state,
        durations: action.durations,
        running: false,
        remaining: secondsFor(action.durations, state.mode),
      }
    case 'tick':
      if (state.remaining <= 1) return { ...state, running: false, remaining: 0 }
      return { ...state, remaining: state.remaining - 1 }
  }
}

function loadDurations(): FocusDurations {
  const saved = readJson(STORAGE_KEY) as Partial<Record<FocusMode, unknown>> | null
  const durations = { ...DEFAULT_DURATIONS }
  for (const mode of FOCUS_MODE_IDS) {
    const minutes = parseTimerMinutes(String(saved?.[mode] ?? ''))
    if (minutes !== null) durations[mode] = minutes
  }
  return durations
}

function initState(): TimerState {
  const durations = loadDurations()
  return { mode: 'pomodoro', durations, remaining: secondsFor(durations, 'pomodoro'), running: false }
}

interface FocusTimerValue extends TimerState {
  total: number
  start: () => void
  pause: () => void
  reset: () => void
  setMode: (mode: FocusMode) => void
  setDurations: (durations: FocusDurations) => void
}

const FocusTimerContext = createContext<FocusTimerValue | null>(null)

export function FocusTimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  useEffect(() => {
    if (!state.running) return
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000)
    return () => window.clearInterval(id)
  }, [state.running])

  useEffect(() => writeJson(STORAGE_KEY, state.durations), [state.durations])

  const value = useMemo<FocusTimerValue>(
    () => ({
      ...state,
      total: secondsFor(state.durations, state.mode),
      start: () => dispatch({ type: 'start' }),
      pause: () => dispatch({ type: 'pause' }),
      reset: () => dispatch({ type: 'reset' }),
      setMode: (mode) => dispatch({ type: 'setMode', mode }),
      setDurations: (durations) => dispatch({ type: 'setDurations', durations }),
    }),
    [state],
  )

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFocusTimer() {
  const ctx = useContext(FocusTimerContext)
  if (!ctx) throw new Error('useFocusTimer must be used inside <FocusTimerProvider>')
  return ctx
}
