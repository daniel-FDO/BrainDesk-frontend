import { useCallback, useSyncExternalStore } from 'react'
import type { Route } from '../types.ts'

const ROUTES: readonly Route[] = ['dashboard', 'notes', 'topics', 'planner', 'assistant', 'resources', 'settings']

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(hash) ? (hash as Route) : 'dashboard'
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** Tiny hash router: `#/notes` → 'notes'. Unknown hashes fall back to the dashboard. */
export function useHashRoute() {
  const route = useSyncExternalStore(subscribe, readRoute, () => 'dashboard' as Route)
  const navigate = useCallback((next: Route) => {
    window.location.hash = `/${next}`
  }, [])
  return [route, navigate] as const
}
