/** localStorage can throw (private mode, quota, blocked site data), so every access is guarded. */
export function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Settings still apply for this session; they just won't survive a reload.
  }
}
