import type { Note, Subject } from '../types.ts'

/** The chip row on the Notes screen: everything, starred notes, or one subject. */
export type NoteFilter = 'all' | 'favorites' | Subject

function matchesFilter(note: Note, filter: NoteFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'favorites') return note.favorite
  return note.subject === filter
}

/**
 * Decides whether a note matches what the user typed into
 * "Search in notes, tags, or concepts…" (also used by the top-bar search).
 * An empty query must match every note.
 */
export function matchesQuery(note: Note, query: string): boolean {
  // TODO(human): replace this naive, case-sensitive, title-only match.
  return note.title.includes(query)
}

export function filterNotes(notes: Note[], filter: NoteFilter, query: string): Note[] {
  return notes.filter((note) => matchesFilter(note, filter) && matchesQuery(note, query))
}
