import { useState, type FormEvent } from 'react'
import { upcomingSessions } from '../data.ts'
import { Menu } from './Menu.tsx'
import { Icon } from './ui.tsx'

interface TopBarProps {
  onMenu: () => void
  menuOpen: boolean
  onSearch: (query: string) => void
  onCreateNote: () => void
}

export function TopBar({ onMenu, menuOpen, onSearch, onCreateNote }: TopBarProps) {
  const [query, setQuery] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    onSearch(query.trim())
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn topbar__menu"
        onClick={onMenu}
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        aria-controls="sidebar"
      >
        <Icon name="menu" />
      </button>

      <nav className="crumbs mono" aria-label="Breadcrumb">
        <span>Workspace</span>
        <Icon name="chevron_right" />
        <span className="crumbs__current" aria-current="location">
          Active Session
        </span>
      </nav>

      <form className="search topbar__search" role="search" onSubmit={submit}>
        <Icon name="search" />
        <label className="sr-only" htmlFor="global-search">
          Search notes, lectures, concepts
        </label>
        <input
          id="global-search"
          type="search"
          placeholder="Search notes, lectures, concepts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>

      <div className="topbar__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={onCreateNote}>
          <Icon name="add" />
          <span className="hide-sm">Create note</span>
        </button>
        <Menu
          label="Notifications"
          trigger={<Icon name="notifications" />}
          heading="Upcoming sessions"
          items={upcomingSessions.map((s) => ({
            label: s.title,
            detail: `${s.when} · ${s.minutes} min`,
            icon: 'event',
            href: '#/planner',
          }))}
        />
        <a className="avatar avatar--sm" href="#/settings" aria-label="Profile and settings" title="Profile and settings">
          <Icon name="person" filled />
        </a>
      </div>
    </header>
  )
}
