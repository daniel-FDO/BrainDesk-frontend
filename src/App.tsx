import { useEffect, useRef, useState } from 'react'
import { Sidebar } from './components/Sidebar.tsx'
import { TopBar } from './components/TopBar.tsx'
import { FocusTimerProvider } from './context/FocusTimer.tsx'
import { ProfileProvider } from './context/Profile.tsx'
import { notes as seedNotes } from './data.ts'
import { useHashRoute } from './hooks/useHashRoute.ts'
import { Assistant } from './pages/Assistant.tsx'
import { Dashboard } from './pages/Dashboard.tsx'
import { Notes } from './pages/Notes.tsx'
import { Planner } from './pages/Planner.tsx'
import { Resources } from './pages/Resources.tsx'
import { Settings } from './pages/Settings.tsx'
import { Topics } from './pages/Topics.tsx'
import type { Note } from './types.ts'

const TITLES = {
  dashboard: 'Dashboard',
  notes: 'Notes',
  topics: 'Subjects & Topics',
  planner: 'Study Planner',
  assistant: 'AI Assistant',
  resources: 'Resources',
  settings: 'Settings',
} as const

export default function App() {
  const [route, navigate] = useHashRoute()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notes, setNotes] = useState<Note[]>(seedNotes)
  const [selectedNoteId, setSelectedNoteId] = useState(seedNotes[0].id)
  const [noteQuery, setNoteQuery] = useState('')
  const [assistantPrompt, setAssistantPrompt] = useState<string | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.title = `${TITLES[route]} · BrainDesk`
    mainRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [route])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  function createNote() {
    const note: Note = {
      id: `n-${Date.now()}`,
      subject: 'Computer Science',
      title: 'Untitled note',
      excerpt: '',
      tags: [],
      updated: 'Just now',
      favorite: false,
    }
    setNotes((prev) => [note, ...prev])
    setSelectedNoteId(note.id)
    setNoteQuery('')
    navigate('notes')
  }

  function openNote(id: string) {
    setSelectedNoteId(id)
    setNoteQuery('')
    navigate('notes')
  }

  function search(query: string) {
    setNoteQuery(query)
    navigate('notes')
  }

  function askAssistant(prompt: string) {
    setAssistantPrompt(prompt)
    navigate('assistant')
  }

  return (
    <ProfileProvider>
      <FocusTimerProvider>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="app">
          <Sidebar route={route} open={menuOpen} onClose={() => setMenuOpen(false)} />
          <div className="app__main">
            <TopBar
              onMenu={() => setMenuOpen(true)}
              menuOpen={menuOpen}
              onSearch={search}
              onCreateNote={createNote}
            />
            <main id="main" ref={mainRef} tabIndex={-1} className="page">
              {route === 'dashboard' && (
                <Dashboard onNavigate={navigate} onCreateNote={createNote} onAskAssistant={askAssistant} />
              )}
              {route === 'notes' && (
                <Notes
                  notes={notes}
                  setNotes={setNotes}
                  selectedId={selectedNoteId}
                  onSelect={setSelectedNoteId}
                  query={noteQuery}
                  onQueryChange={setNoteQuery}
                  onCreateNote={createNote}
                  onAskAssistant={askAssistant}
                />
              )}
              {route === 'topics' && <Topics onNavigate={navigate} onAskAssistant={askAssistant} />}
              {route === 'planner' && <Planner onNavigate={navigate} onAskAssistant={askAssistant} />}
              {route === 'assistant' && (
                <Assistant
                  notes={notes}
                  onOpenNote={openNote}
                  initialPrompt={assistantPrompt}
                  onInitialPromptUsed={() => setAssistantPrompt(null)}
                />
              )}
              {route === 'resources' && <Resources />}
              {route === 'settings' && <Settings />}
            </main>
          </div>
        </div>
      </FocusTimerProvider>
    </ProfileProvider>
  )
}
