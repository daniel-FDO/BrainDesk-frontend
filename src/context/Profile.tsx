import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { user as defaultUser } from '../data.ts'
import { readJson, writeJson } from '../lib/storage.ts'

const STORAGE_KEY = 'braindesk.profile'

export interface Profile {
  name: string
  track: string
}

interface ProfileValue extends Profile {
  firstName: string
  update: (profile: Profile) => void
}

function loadProfile(): Profile {
  const saved = readJson(STORAGE_KEY) as Partial<Profile> | null
  return {
    name: typeof saved?.name === 'string' && saved.name.trim() ? saved.name : defaultUser.name,
    track: typeof saved?.track === 'string' ? saved.track : defaultUser.track,
  }
}

const ProfileContext = createContext<ProfileValue | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(loadProfile)

  useEffect(() => writeJson(STORAGE_KEY, profile), [profile])

  const value = useMemo<ProfileValue>(
    () => ({ ...profile, firstName: profile.name.trim().split(/\s+/)[0], update: setProfile }),
    [profile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
