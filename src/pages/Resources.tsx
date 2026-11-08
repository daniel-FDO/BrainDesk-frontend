import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Chip, EmptyState, Icon } from '../components/ui.tsx'
import { resources as seedResources } from '../data.ts'
import { SUBJECTS, SUBJECT_TONE } from '../lib/subjects.ts'
import type { Resource, ResourceType, Subject } from '../types.ts'

const TYPE_META: Record<ResourceType, { label: string; plural: string; icon: string }> = {
  pdf: { label: 'PDF', plural: 'PDFs', icon: 'picture_as_pdf' },
  video: { label: 'Video', plural: 'Videos', icon: 'play_circle' },
  link: { label: 'Link', plural: 'Links', icon: 'link' },
  slides: { label: 'Slides', plural: 'Slides', icon: 'slideshow' },
}
const TYPES = Object.keys(TYPE_META) as ResourceType[]

type TypeFilter = 'all' | ResourceType
type SubjectFilter = 'all' | Subject

function matches(r: Resource, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [r.title, r.source, r.subject, TYPE_META[r.type].label].some((field) => field.toLowerCase().includes(q))
}

/** Accepts bare domains ("arxiv.org/abs/…") by assuming https. Returns null if it can't be a web URL. */
function normalizeUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  // Spaces are never valid in a URL. Check explicitly: Chromium's URL parser
  // percent-encodes them into the hostname instead of throwing.
  if (/\s/.test(value)) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    // Require a dotted hostname ("arxiv.org"), so typos like "foo" aren't accepted as links.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname) && url.hostname !== 'localhost') return null
    return url.href
  } catch {
    return null
  }
}

export function Resources() {
  const [items, setItems] = useState<Resource[]>(seedResources)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TypeFilter>('all')
  const [subject, setSubject] = useState<SubjectFilter>('all')
  const [adding, setAdding] = useState(false)

  const visible = useMemo(
    () =>
      items.filter(
        (r) => (type === 'all' || r.type === type) && (subject === 'all' || r.subject === subject) && matches(r, query),
      ),
    [items, type, subject, query],
  )
  const pinned = visible.filter((r) => r.pinned)
  const rest = visible.filter((r) => !r.pinned)
  const filtered = type !== 'all' || subject !== 'all' || query.trim() !== ''

  const togglePin = (id: string) => setItems((prev) => prev.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)))
  const remove = (id: string) => setItems((prev) => prev.filter((r) => r.id !== id))

  function clearFilters() {
    setQuery('')
    setType('all')
    setSubject('all')
  }

  return (
    <div className="resources">
      <header className="page-head">
        <div>
          <p className="eyebrow mono">
            <span className="dot dot--blue" aria-hidden="true" /> Study Library
          </p>
          <h1 className="h1">Resources</h1>
          <p className="muted">Papers, lecture slides, videos and links for every course, all in one place.</p>
        </div>
        <div className="page-head__side">
          <button
            type="button"
            className="btn btn--primary"
            aria-expanded={adding}
            aria-controls="add-resource"
            onClick={() => setAdding((v) => !v)}
          >
            <Icon name={adding ? 'close' : 'add'} /> {adding ? 'Cancel' : 'Add Resource'}
          </button>
        </div>
      </header>

      {adding && (
        <AddResourceForm
          onCancel={() => setAdding(false)}
          onAdd={(r) => {
            setItems((prev) => [r, ...prev])
            setAdding(false)
          }}
        />
      )}

      <div className="resources__toolbar">
        <div className="search search--lg">
          <Icon name="search" />
          <label className="sr-only" htmlFor="resource-search">
            Search resources
          </label>
          <input
            id="resource-search"
            type="search"
            placeholder="Search by title, source or subject..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <label className="sr-only" htmlFor="resource-subject">
          Filter by subject
        </label>
        <select
          id="resource-subject"
          className="select select--lg"
          value={subject}
          onChange={(e) => setSubject(e.target.value as SubjectFilter)}
        >
          <option value="all">All subjects</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="filters" role="group" aria-label="Filter by type">
        <button type="button" className="filter" aria-pressed={type === 'all'} onClick={() => setType('all')}>
          All <span className="mono">{items.length}</span>
        </button>
        {TYPES.map((t) => (
          <button key={t} type="button" className="filter" aria-pressed={type === t} onClick={() => setType(t)}>
            <Icon name={TYPE_META[t].icon} /> {TYPE_META[t].plural}{' '}
            <span className="mono">{items.filter((r) => r.type === t).length}</span>
          </button>
        ))}
      </div>

      <p className="sr-only" role="status">
        {visible.length} {visible.length === 1 ? 'resource' : 'resources'} shown
      </p>

      {visible.length === 0 ? (
        <div className="card">
          <EmptyState icon="search_off" title="No resources match">
            {filtered ? (
              <button type="button" className="link" onClick={clearFilters}>
                Clear filters
              </button>
            ) : (
              'Add your first paper, video or link to get started.'
            )}
          </EmptyState>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <ResourceSection title="Pinned" icon="push_pin" items={pinned} onPin={togglePin} onRemove={remove} />
          )}
          {rest.length > 0 && (
            <ResourceSection
              title={pinned.length > 0 ? 'Everything else' : 'All resources'}
              icon="folder_open"
              items={rest}
              onPin={togglePin}
              onRemove={remove}
            />
          )}
        </>
      )}
    </div>
  )
}

function ResourceSection({
  title,
  icon,
  items,
  onPin,
  onRemove,
}: {
  title: string
  icon: string
  items: Resource[]
  onPin: (id: string) => void
  onRemove: (id: string) => void
}) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId}>
      <div className="section-head">
        <h2 id={headingId} className="h4">
          <Icon name={icon} /> {title} <span className="count mono">{items.length}</span>
        </h2>
      </div>
      <ul className="grid-3 resources__grid">
        {items.map((r) => (
          <li key={r.id}>
            <ResourceCard resource={r} onPin={onPin} onRemove={onRemove} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function ResourceCard({
  resource: r,
  onPin,
  onRemove,
}: {
  resource: Resource
  onPin: (id: string) => void
  onRemove: (id: string) => void
}) {
  const tone = SUBJECT_TONE[r.subject]
  const meta = TYPE_META[r.type]
  return (
    <article className="card res-card">
      <div className="row between gap-8">
        <span className={`tile tile--${tone}`} aria-hidden="true">
          <Icon name={meta.icon} />
        </span>
        <div className="row gap-4">
          <button
            type="button"
            className={`icon-btn icon-btn--sm res-card__pin ${r.pinned ? 'is-pinned' : ''}`}
            aria-pressed={r.pinned}
            aria-label={`${r.pinned ? 'Unpin' : 'Pin'} ${r.title}`}
            title={r.pinned ? 'Unpin' : 'Pin'}
            onClick={() => onPin(r.id)}
          >
            <Icon name="push_pin" filled={r.pinned} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm icon-btn--danger"
            aria-label={`Remove ${r.title}`}
            title="Remove"
            onClick={() => onRemove(r.id)}
          >
            <Icon name="delete" />
          </button>
        </div>
      </div>

      <h3 className="res-card__title clamp-2">{r.title}</h3>
      <p className="meta truncate">{r.source}</p>

      <div className="row gap-8 wrap">
        <Chip tone={tone}>{r.subject}</Chip>
        <span className="tag mono">{meta.label}</span>
      </div>

      <div className="row between meta mono res-card__foot">
        <span>
          {r.detail ? `${r.detail} · ` : ''}Added {r.added}
        </span>
        {r.url ? (
          <a className="link" href={r.url} target="_blank" rel="noopener noreferrer">
            Open <Icon name="open_in_new" />
            <span className="sr-only"> {r.title} (opens in a new tab)</span>
          </a>
        ) : (
          <span className="row gap-4" title="Uploaded file">
            <Icon name="cloud_done" /> Saved
          </span>
        )}
      </div>
    </article>
  )
}

function AddResourceForm({ onAdd, onCancel }: { onAdd: (r: Resource) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<ResourceType>('link')
  const [subject, setSubject] = useState<Subject>(SUBJECTS[0])
  const [error, setError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError('Give the resource a title.')
      titleRef.current?.focus()
      return
    }
    const cleanUrl = url.trim() ? normalizeUrl(url) : undefined
    if (cleanUrl === null) {
      setError('That link doesn’t look like a web address. Try something like https://example.com.')
      return
    }
    onAdd({
      id: `res-${Date.now()}`,
      title: cleanTitle,
      type,
      subject,
      source: cleanUrl ? new URL(cleanUrl).hostname.replace(/^www\./, '') : 'Added by you',
      added: 'Just now',
      url: cleanUrl,
      pinned: false,
    })
  }

  return (
    <form id="add-resource" className="card panel add-resource" onSubmit={submit} noValidate>
      <h2 className="h4">
        <Icon name="add_link" /> Add a resource
      </h2>
      <div className="add-resource__fields">
        <label className="field">
          <span className="label">Title</span>
          <input
            ref={titleRef}
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lecture 8 — Graph Coloring"
            autoFocus
            aria-invalid={error?.includes('title') || undefined}
          />
        </label>
        <label className="field">
          <span className="label">Link (optional)</span>
          <input
            className="input"
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://"
            aria-invalid={error?.includes('link') || undefined}
          />
        </label>
        <label className="field">
          <span className="label">Type</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Subject</span>
          <select className="input" value={subject} onChange={(e) => setSubject(e.target.value as Subject)}>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          <Icon name="error" /> {error}
        </p>
      )}
      <div className="row gap-8 add-resource__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          <Icon name="add" /> Add resource
        </button>
      </div>
    </form>
  )
}
