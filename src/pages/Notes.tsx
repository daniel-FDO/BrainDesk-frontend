import { useMemo, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { Chip, EmptyState, Icon, Tag } from '../components/ui.tsx'
import { noteCounts } from '../data.ts'
import { filterNotes, type NoteFilter } from '../lib/filterNotes.ts'
import { applyFormat, type FormatKind } from '../lib/markdown.ts'
import { SUBJECTS, SUBJECT_TONE } from '../lib/subjects.ts'
import type { Note, Subject } from '../types.ts'

const FORMAT_GROUPS: { kind: FormatKind; label: string; icon?: string; text?: string }[][] = [
  [
    { kind: 'bold', label: 'Bold', icon: 'format_bold' },
    { kind: 'italic', label: 'Italic', icon: 'format_italic' },
    { kind: 'link', label: 'Link', icon: 'link' },
  ],
  [
    { kind: 'h1', label: 'Heading 1', text: 'H1' },
    { kind: 'h2', label: 'Heading 2', text: 'H2' },
    { kind: 'h3', label: 'Heading 3', text: 'H3' },
  ],
  [
    { kind: 'bullet', label: 'Bulleted list', icon: 'format_list_bulleted' },
    { kind: 'numbered', label: 'Numbered list', icon: 'format_list_numbered' },
    { kind: 'math', label: 'Math', icon: 'functions' },
    { kind: 'quote', label: 'Quote', icon: 'format_quote' },
    { kind: 'image', label: 'Image', icon: 'image' },
  ],
]

function downloadMarkdown(note: Note) {
  const tags = note.tags.map((t) => `#${t}`).join(' ')
  const text = [`# ${note.title}`, tags, note.excerpt].filter(Boolean).join('\n\n') + '\n'
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'note'}.md`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const FILTERS: { id: NoteFilter; label: string; count: number }[] = [
  { id: 'all', label: 'All Notes', count: noteCounts.all },
  { id: 'favorites', label: 'Favorites', count: noteCounts.favorites },
  ...SUBJECTS.map((s) => ({ id: s, label: s, count: noteCounts[s] })),
]

interface NotesProps {
  notes: Note[]
  setNotes: Dispatch<SetStateAction<Note[]>>
  selectedId: string
  onSelect: (id: string) => void
  query: string
  onQueryChange: (q: string) => void
  onCreateNote: () => void
  onAskAssistant: (prompt: string) => void
}

export function Notes({
  notes,
  setNotes,
  selectedId,
  onSelect,
  query,
  onQueryChange,
  onCreateNote,
  onAskAssistant,
}: NotesProps) {
  const [filter, setFilter] = useState<NoteFilter>('all')
  const [view, setView] = useState<'split' | 'grid'>('split')

  const visible = useMemo(() => filterNotes(notes, filter, query), [notes, filter, query])
  const selected = notes.find((n) => n.id === selectedId) ?? null

  function update(id: string, patch: Partial<Note>) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch, updated: 'Just now' } : n)))
  }

  function remove(note: Note) {
    if (!window.confirm(`Delete “${note.title}”? This can’t be undone.`)) return
    const rest = notes.filter((n) => n.id !== note.id)
    setNotes(rest)
    if (rest[0]) onSelect(rest[0].id)
  }

  return (
    <div className="notes">
      <div className="notes__toolbar">
        <div className="search search--lg">
          <Icon name="search" />
          <label className="sr-only" htmlFor="notes-search">
            Search in notes, tags, or concepts
          </label>
          <input
            id="notes-search"
            type="search"
            placeholder="Search in notes, tags, or concepts..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          <kbd className="kbd mono">⌘K</kbd>
        </div>
        <div className="segmented" role="group" aria-label="Layout">
          <button type="button" aria-pressed={view === 'split'} onClick={() => setView('split')}>
            <Icon name="vertical_split" /> Split
          </button>
          <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
            <Icon name="grid_view" /> Grid
          </button>
        </div>
        <button type="button" className="btn btn--primary" onClick={onCreateNote}>
          <Icon name="add" /> New Note
        </button>
      </div>

      <div className="filters" role="group" aria-label="Filter notes">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="filter mono"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.id === 'favorites' && <Icon name="star" filled />}
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className={`notes__body notes__body--${view}`}>
        <section className="notes__list" aria-label="Notes">
          <div className="row between notes__list-head">
            <span className="label">{noteCounts.all} Notes Indexed</span>
            <span className="meta mono">
              Sort: <span className="text-primary">Last modified</span>
            </span>
          </div>

          {visible.length === 0 ? (
            <EmptyState icon="search_off" title="No notes match">
              {query ? `Nothing found for “${query}”.` : 'No notes in this filter yet.'}{' '}
              <button
                type="button"
                className="link"
                onClick={() => {
                  onQueryChange('')
                  setFilter('all')
                }}
              >
                Clear filters
              </button>
            </EmptyState>
          ) : (
            <ul className={view === 'grid' ? 'grid-3' : 'stack-8'}>
              {visible.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={`note-card ${note.id === selectedId && view === 'split' ? 'is-selected' : ''}`}
                    aria-current={note.id === selectedId ? 'true' : undefined}
                    onClick={() => {
                      onSelect(note.id)
                      setView('split')
                    }}
                  >
                    <span className="row between">
                      <span className={`subject subject--${SUBJECT_TONE[note.subject]} mono`}>
                        <span className="dot" aria-hidden="true" />
                        {note.subject}
                      </span>
                      <Icon
                        name="star"
                        filled={note.favorite}
                        className={note.favorite ? 'star is-on' : 'star'}
                        label={note.favorite ? 'Favorite' : undefined}
                      />
                    </span>
                    <span className="note-card__title">{note.title}</span>
                    <span className="meta clamp-2">{note.excerpt || 'Empty note'}</span>
                    <span className="row between wrap gap-8">
                      <span className="row gap-4 wrap">
                        {note.tags.map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </span>
                      <span className="meta mono">{note.updated}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {view === 'split' &&
          (selected ? (
            <Editor
              key={selected.id}
              note={selected}
              onChange={(patch) => update(selected.id, patch)}
              onDelete={() => remove(selected)}
              onAskAssistant={onAskAssistant}
            />
          ) : (
            <section className="card editor">
              <EmptyState icon="edit_note" title="No note selected">
                Pick a note from the list or create a new one.
              </EmptyState>
            </section>
          ))}
      </div>
    </div>
  )
}

function Editor({
  note,
  onChange,
  onDelete,
  onAskAssistant,
}: {
  note: Note
  onChange: (patch: Partial<Note>) => void
  onDelete: () => void
  onAskAssistant: (prompt: string) => void
}) {
  const isFeatured = note.id === 'n1'
  const [editingFeatured, setEditingFeatured] = useState(false)
  const [tagDraft, setTagDraft] = useState<string | null>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const showArticle = isFeatured && !editingFeatured
  const words = note.excerpt.trim() ? note.excerpt.trim().split(/\s+/).length : 0

  function format(kind: FormatKind) {
    const textarea = bodyRef.current
    const fallback = note.excerpt.length
    const result = applyFormat(
      note.excerpt,
      textarea?.selectionStart ?? fallback,
      textarea?.selectionEnd ?? fallback,
      kind,
    )
    onChange({ excerpt: result.value })
    setEditingFeatured(true)
    // Runs after React has committed the new value, otherwise the caret jumps to the end.
    requestAnimationFrame(() => {
      bodyRef.current?.focus()
      bodyRef.current?.setSelectionRange(result.start, result.end)
    })
  }

  function addTag(e: FormEvent) {
    e.preventDefault()
    const tag = (tagDraft ?? '').trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-')
    if (tag && !note.tags.includes(tag)) onChange({ tags: [...note.tags, tag] })
    setTagDraft(null)
  }

  return (
    <section className="card editor" aria-label="Note editor">
      <div className="editor__bar">
        <span className="saved mono">
          <Icon name="check_circle" /> Autosaved
        </span>
        <label className="sr-only" htmlFor="note-subject">
          Subject
        </label>
        <select
          id="note-subject"
          className="select mono"
          value={note.subject}
          onChange={(e) => onChange({ subject: e.target.value as Subject })}
        >
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="editor__bar-spacer" />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          aria-pressed={note.favorite}
          onClick={() => onChange({ favorite: !note.favorite })}
        >
          <Icon name="star" filled={note.favorite} className={note.favorite ? 'star is-on' : 'star'} />
          Favorite
        </button>
        <button type="button" className="btn btn--soft btn--sm" onClick={() => onAskAssistant(`Summarize ${note.title}`)}>
          <Icon name="auto_awesome" /> AI Summary
        </button>
        <button type="button" className="btn btn--outline btn--sm" onClick={() => downloadMarkdown(note)}>
          <Icon name="ios_share" /> Export
        </button>
        <button type="button" className="icon-btn icon-btn--danger" aria-label="Delete note" onClick={onDelete}>
          <Icon name="delete" />
        </button>
      </div>

      <label className="sr-only" htmlFor="note-title">
        Note title
      </label>
      <input
        id="note-title"
        className="editor__title"
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
      />
      <div className="row gap-4 wrap editor__tags">
        {note.tags.map((t) => (
          <Chip key={t} mono>
            #{t}
          </Chip>
        ))}
        {tagDraft === null ? (
          <button type="button" className="link meta mono" onClick={() => setTagDraft('')}>
            + Tag
          </button>
        ) : (
          <form onSubmit={addTag}>
            <label className="sr-only" htmlFor="note-new-tag">
              New tag
            </label>
            <input
              id="note-new-tag"
              className="input input--sm mono"
              placeholder="Tag, then Enter"
              value={tagDraft}
              autoFocus
              onChange={(e) => setTagDraft(e.target.value)}
              onBlur={() => setTagDraft(null)}
              onKeyDown={(e) => e.key === 'Escape' && setTagDraft(null)}
            />
          </form>
        )}
      </div>

      <div className="editor__format" role="toolbar" aria-label="Formatting">
        {FORMAT_GROUPS.map((group, i) => (
          <span key={group[0].kind} className="editor__format-group">
            {i > 0 && <span className="divider" aria-hidden="true" />}
            {group.map((item) => (
              <button
                key={item.kind}
                type="button"
                className={`icon-btn icon-btn--sm ${item.text ? 'mono' : ''}`}
                aria-label={item.label}
                title={item.label}
                onClick={() => format(item.kind)}
              >
                {item.icon ? <Icon name={item.icon} /> : item.text}
              </button>
            ))}
          </span>
        ))}
        {isFeatured && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingFeatured((v) => !v)}>
            {editingFeatured ? 'View article' : 'Edit text'}
          </button>
        )}
      </div>

      <div className="editor__content">
        {showArticle ? (
          <BackpropArticle />
        ) : (
          <>
            <label className="sr-only" htmlFor="note-body">
              Note body
            </label>
            <textarea
              ref={bodyRef}
              id="note-body"
              className="editor__textarea"
              placeholder="Start writing…"
              value={note.excerpt}
              onChange={(e) => onChange({ excerpt: e.target.value })}
            />
          </>
        )}
      </div>

      <div className="editor__foot">
        <span className="meta mono">
          {showArticle ? '1,240 words • 6 min read' : `${words} words • ${Math.max(1, Math.ceil(words / 200))} min read`}{' '}
          • UTF-8 Markdown
        </span>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => onAskAssistant(`Explain ${note.title}`)}>
          <Icon name="auto_awesome" /> Ask AI about this note
        </button>
      </div>
    </section>
  )
}

function BackpropArticle() {
  return (
    <article className="prose">
      <aside className="callout">
        <p className="callout__title">
          <Icon name="lightbulb" /> Core Concept: What is Backpropagation?
        </p>
        <p>
          Backpropagation (backward propagation of errors) is the mathematical engine of supervised neural networks.
          It computes the partial derivative (gradient) of the loss function with respect to every weight and bias
          parameter via the recursive application of the multivariate chain rule.
        </p>
      </aside>

      <h2>1. The Multivariate Chain Rule Derivation</h2>
      <p>
        Consider a feed-forward layer where output <code>z = w · x + b</code> passes through an activation function{' '}
        <code>a = σ(z)</code>. To evaluate the gradient of loss <code>L</code> with respect to the specific connection
        weight <code>w</code>:
      </p>

      <figure className="formula">
        <figcaption className="label">Gradient Descent Chain Expansion</figcaption>
        <p className="formula__main mono">∂L / ∂w = (∂L / ∂y) · (∂y / ∂z) · (∂z / ∂w)</p>
        <p className="formula__sub mono">
          where ∂z / ∂w = x &nbsp;|&nbsp; δ<sub>l</sub> = ∇<sub>a</sub>L ⊙ σ′(z<sup>l</sup>)
        </p>
      </figure>

      <h3>Key Architectural Invariants</h3>
      <ul>
        <li>
          <strong>Vanishing Gradient Vulnerability:</strong> Saturating activations (such as Sigmoid or Tanh) cause
          derivatives to collapse toward 0 at extreme values, causing upper layers to freeze during training.
        </li>
        <li>
          <strong>Computational Complexity:</strong> Forward pass stores intermediate activations <code>aˡ</code> in
          memory buffer; backward step reuses cached activations yielding linear <code>O(N)</code> runtime.
        </li>
      </ul>
    </article>
  )
}
