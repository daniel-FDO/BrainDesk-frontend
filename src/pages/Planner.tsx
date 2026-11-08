import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Menu } from '../components/Menu.tsx'
import { Chip, EmptyState, Icon, Ring } from '../components/ui.tsx'
import { useFocusTimer } from '../context/FocusTimer.tsx'
import { FOCUS_MODES, FOCUS_MODE_IDS } from '../lib/focusModes.ts'
import { TODAY, initialAgenda, learningBlocks, weekDays, weeklyHours } from '../data.ts'
import { formatClock, formatFileSize } from '../lib/format.ts'
import type { AgendaTask, BlockStatus, LearningBlock, Route, Tone } from '../types.ts'

/** Monday of the week the seeded plan belongs to; `week` offsets count from here. */
const BASE_MONDAY = new Date(2024, 9, 21)

interface PlannerDay {
  date: Date
  day: number
  label: string
  weekend: boolean
}

function daysOfWeek(week: number): PlannerDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(BASE_MONDAY.getFullYear(), BASE_MONDAY.getMonth(), BASE_MONDAY.getDate() + week * 7 + i)
    return {
      date,
      day: date.getDate(),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      weekend: i >= 5,
    }
  })
}

const monthDay = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const SUBJECT_TAGS: { tag: string; tone: Tone }[] = [
  { tag: 'CS', tone: 'blue' },
  { tag: 'Bio', tone: 'teal' },
  { tag: 'Math', tone: 'violet' },
  { tag: 'Neuro', tone: 'slate' },
]

const STATUS: Record<BlockStatus, { label: string; icon: string }> = {
  completed: { label: 'Completed', icon: 'check_circle' },
  'in-progress': { label: 'In Progress', icon: 'hourglass_top' },
  upcoming: { label: 'Upcoming', icon: 'event' },
}

interface PlannerProps {
  onNavigate: (route: Route) => void
  onAskAssistant: (prompt: string) => void
}

export function Planner({ onNavigate, onAskAssistant }: PlannerProps) {
  const [view, setView] = useState<'calendar' | 'agenda'>('calendar')
  const [day, setDay] = useState(TODAY)
  const [week, setWeek] = useState(0)
  const [scheduling, setScheduling] = useState(false)
  const [blocks, setBlocks] = useState<LearningBlock[]>(learningBlocks)

  const days = daysOfWeek(week)
  const visibleBlocks = blocks.filter((b) => (b.week ?? 0) === week)

  const updateBlock = (id: string, patch: Partial<LearningBlock>) =>
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const markDone = (id: string) => updateBlock(id, { status: 'completed' })
  const removeBlock = (id: string) => setBlocks((prev) => prev.filter((b) => b.id !== id))

  function changeWeek(delta: number) {
    const next = week + delta
    setWeek(next)
    setDay(next === 0 ? TODAY : daysOfWeek(next)[0].day)
  }

  return (
    <div className="planner">
      <header className="card planner__head">
        <div>
          <h1 className="h2 row gap-8 wrap">
            Study Planner <Chip mono>Fall Term 2024</Chip>
          </h1>
          <p className="meta mono row gap-4">
            <Icon name="calendar_today" /> Week of {monthDay(days[0].date)} - {monthDay(days[6].date)},{' '}
            {days[6].date.getFullYear()}
            <button
              type="button"
              className="icon-btn icon-btn--sm"
              aria-label="Previous week"
              onClick={() => changeWeek(-1)}
            >
              <Icon name="chevron_left" />
            </button>
            <button type="button" className="icon-btn icon-btn--sm" aria-label="Next week" onClick={() => changeWeek(1)}>
              <Icon name="chevron_right" />
            </button>
          </p>
        </div>
        <div className="row gap-8 wrap">
          <div className="segmented" role="group" aria-label="Planner view">
            <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>
              <Icon name="calendar_view_week" /> Weekly Calendar
            </button>
            <button type="button" aria-pressed={view === 'agenda'} onClick={() => setView('agenda')}>
              <Icon name="view_agenda" /> Agenda List
            </button>
          </div>
          <button
            type="button"
            className="btn btn--primary"
            aria-expanded={scheduling}
            onClick={() => setScheduling((v) => !v)}
          >
            <Icon name={scheduling ? 'close' : 'add_circle'} /> {scheduling ? 'Cancel' : 'Schedule Session'}
          </button>
        </div>
      </header>

      {scheduling && (
        <ScheduleForm
          days={days}
          week={week}
          selectedDay={day}
          onCancel={() => setScheduling(false)}
          onAdd={(block) => {
            setBlocks((prev) => [...prev, block])
            setDay(block.day)
            setScheduling(false)
          }}
        />
      )}

      <div className="planner__layout">
        <div className="stack-16 min-w-0">
          <FocusCard />

          {view === 'calendar' && (
            <div className="card week" role="group" aria-label="Select a day">
              {days.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  className={`week__day ${d.weekend ? 'is-weekend' : ''}`}
                  aria-pressed={day === d.day}
                  onClick={() => setDay(d.day)}
                >
                  <span className="mono">{d.label}</span>
                  <strong>{d.day}</strong>
                </button>
              ))}
            </div>
          )}

          <section className="card panel" aria-labelledby="blocks-title">
            <div className="section-head">
              <h2 id="blocks-title" className="h4">
                Scheduled Learning Blocks
              </h2>
              <ul className="legend meta" aria-label="Legend">
                <li>
                  <span className="dot dot--blue" aria-hidden="true" /> Computer Sci
                </li>
                <li>
                  <span className="dot dot--teal" aria-hidden="true" /> Bio &amp; Med
                </li>
                <li>
                  <span className="dot dot--violet" aria-hidden="true" /> Mathematics
                </li>
              </ul>
            </div>
            {visibleBlocks.length === 0 ? (
              <EmptyState icon="event_busy" title="Nothing scheduled this week">
                Use “Schedule Session” to plan your first block.
              </EmptyState>
            ) : (
              <ul className="stack-8">
                {visibleBlocks.map((b) => (
                  <BlockRow
                    key={b.id}
                    block={b}
                    highlighted={view === 'calendar' && b.day === day}
                    onDone={() => markDone(b.id)}
                    onRemove={() => removeBlock(b.id)}
                    onToggleReminder={() => updateBlock(b.id, { reminder: !b.reminder })}
                    onOpenNotes={() => onNavigate('notes')}
                  />
                ))}
              </ul>
            )}
          </section>

          <WeeklyLoad />
        </div>

        <div className="stack-16 min-w-0">
          <Agenda />
          <AttachedResources onNavigate={onNavigate} onAskAssistant={onAskAssistant} />
          <section className="card tip" aria-labelledby="tip-title">
            <div className="tip__media" aria-hidden="true">
              <Icon name="self_improvement" />
            </div>
            <div className="tip__body">
              <h2 id="tip-title" className="label text-primary">
                Mindful Learning Tip
              </h2>
              <p className="meta">
                Take a 5-minute cognitive reset every 25 minutes to boost neural consolidation and decrease study
                fatigue.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function ScheduleForm({
  days,
  week,
  selectedDay,
  onAdd,
  onCancel,
}: {
  days: PlannerDay[]
  week: number
  selectedDay: number
  onAdd: (block: LearningBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, days.findIndex((d) => d.day === selectedDay)))
  const [time, setTime] = useState('16:00')
  const [minutes, setMinutes] = useState('45')
  const [tag, setTag] = useState(SUBJECT_TAGS[0].tag)
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const cleanTitle = title.trim()
    const length = Number(minutes)
    if (!cleanTitle) return setError('Give the session a title.')
    if (!time) return setError('Pick a start time.')
    if (!Number.isInteger(length) || length < 1 || length > 480) return setError('Length must be 1–480 minutes.')

    const target = days[dayIndex]
    const [hours, mins] = time.split(':').map(Number)
    const clock = new Date(2000, 0, 1, hours, mins).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    onAdd({
      id: `b-${Date.now()}`,
      day: target.day,
      week,
      when: `${target.label}, ${monthDay(target.date)} • ${clock}`,
      tag,
      minutes: length,
      tone: SUBJECT_TAGS.find((s) => s.tag === tag)!.tone,
      status: 'upcoming',
      title: cleanTitle,
      detail: 'Added by you',
    })
  }

  return (
    <form className="card panel settings__section" onSubmit={submit} noValidate>
      <h2 className="h4">
        <Icon name="add_circle" /> Schedule a session
      </h2>
      <div className="form-grid">
        <label className="field">
          <span className="label">Title</span>
          <input className="input" value={title} autoFocus onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">Subject</span>
          <select className="input" value={tag} onChange={(e) => setTag(e.target.value)}>
            {SUBJECT_TAGS.map((s) => (
              <option key={s.tag}>{s.tag}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label">Day</span>
          <select className="input" value={dayIndex} onChange={(e) => setDayIndex(Number(e.target.value))}>
            {days.map((d, i) => (
              <option key={d.day} value={i}>
                {d.label}, {monthDay(d.date)}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <label className="field">
            <span className="label">Time</span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
          <label className="field">
            <span className="label">Minutes</span>
            <input
              className="input mono"
              type="number"
              min={1}
              max={480}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </label>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          <Icon name="error" /> {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          Add session
        </button>
      </div>
    </form>
  )
}

interface Attachment {
  id: string
  name: string
  size: number
  url: string
}

function AttachedResources({ onNavigate, onAskAssistant }: PlannerProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrls = useRef(new Set<string>())

  useEffect(() => {
    const urls = objectUrls.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  function addFiles(e: ChangeEvent<HTMLInputElement>) {
    const added = Array.from(e.target.files ?? []).map((file, i) => {
      const url = URL.createObjectURL(file)
      objectUrls.current.add(url)
      return { id: `att-${Date.now()}-${i}`, name: file.name, size: file.size, url }
    })
    setAttachments((prev) => [...prev, ...added])
    e.target.value = '' // Lets the same file be picked again after removing it.
  }

  function remove(attachment: Attachment) {
    URL.revokeObjectURL(attachment.url)
    objectUrls.current.delete(attachment.url)
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
  }

  return (
    <section className="card panel" aria-labelledby="res-title">
      <div className="section-head">
        <h2 id="res-title" className="h4">
          Attached Resources
        </h2>
        <button type="button" className="link meta" onClick={() => fileInputRef.current?.click()}>
          <Icon name="attach_file" /> Attach
        </button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={addFiles} />
      </div>
      <ul className="stack-8">
        <li className="resource">
          <Icon name="picture_as_pdf" className="text-primary" />
          <div className="min-w-0">
            <p className="resource__name truncate">Lecture_09_Graph_Algorithms.pdf</p>
            <p className="meta mono">3.4 MB • Annotated</p>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            aria-label="Open Lecture_09_Graph_Algorithms.pdf in Resources"
            onClick={() => onNavigate('resources')}
          >
            <Icon name="open_in_new" />
          </button>
        </li>
        <li className="resource">
          <Icon name="style" className="text-primary" />
          <div className="min-w-0">
            <p className="resource__name truncate">AI Flashcard Deck: Graph Search</p>
            <p className="meta mono">24 Generated Cards</p>
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            aria-label="Open flashcard deck"
            onClick={() => onAskAssistant('Quiz me on Mathematics')}
          >
            <Icon name="arrow_forward" />
          </button>
        </li>
        {attachments.map((a) => (
          <li key={a.id} className="resource">
            <Icon name="draft" className="text-primary" />
            <div className="min-w-0">
              <p className="resource__name truncate">{a.name}</p>
              <p className="meta mono">{formatFileSize(a.size)}</p>
            </div>
            <span className="row gap-4">
              <a
                className="icon-btn icon-btn--sm"
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${a.name}`}
              >
                <Icon name="open_in_new" />
              </a>
              <button
                type="button"
                className="icon-btn icon-btn--sm icon-btn--danger"
                aria-label={`Remove ${a.name}`}
                onClick={() => remove(a)}
              >
                <Icon name="close" />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function FocusCard() {
  const timer = useFocusTimer()
  const elapsedPct = ((timer.total - timer.remaining) / timer.total) * 100
  const finished = timer.remaining === 0

  return (
    <section className="card focus" aria-labelledby="focus-title">
      <Ring value={elapsedPct} size={104} stroke={8} label={`${formatClock(timer.remaining)} remaining`}>
        <strong className="focus__clock mono">{formatClock(timer.remaining)}</strong>
        <span className="label">{finished ? 'Done' : 'Flow State'}</span>
      </Ring>
      <div className="focus__info">
        <p className="row gap-8 wrap">
          <Chip mono>
            <span className="dot dot--blue" aria-hidden="true" /> Active Target
          </Chip>
          <Chip tone="amber" mono>
            🔥 4-day streak • 3.5 hrs today
          </Chip>
        </p>
        <h2 id="focus-title" className="h3">
          Graph Search Algorithms
        </h2>
        <p className="meta">Discrete Mathematics • Module 4: BFS, DFS &amp; Dijkstra Proofs</p>
        <p className="sr-only" aria-live="polite">
          {finished ? 'Focus session complete.' : ''}
        </p>
      </div>
      <div className="focus__controls">
        <div className="segmented segmented--stack" role="group" aria-label="Session length">
          {FOCUS_MODE_IDS.map((m) => (
            <button key={m} type="button" aria-pressed={timer.mode === m} onClick={() => timer.setMode(m)}>
              {FOCUS_MODES[m].label} ({timer.durations[m]}m)
            </button>
          ))}
        </div>
        <a className="link meta" href="#/settings">
          <Icon name="tune" /> Change lengths
        </a>
        <div className="row gap-8">
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={timer.running ? timer.pause : timer.start}
          >
            <Icon name={timer.running ? 'pause' : 'play_arrow'} filled />
            {timer.running ? 'Pause Session' : finished ? 'Restart Session' : 'Start Session'}
          </button>
          <button type="button" className="icon-btn icon-btn--bordered" aria-label="Reset timer" onClick={timer.reset}>
            <Icon name="restart_alt" />
          </button>
        </div>
      </div>
    </section>
  )
}

function BlockRow({
  block,
  highlighted,
  onDone,
  onRemove,
  onToggleReminder,
  onOpenNotes,
}: {
  block: LearningBlock
  highlighted: boolean
  onDone: () => void
  onRemove: () => void
  onToggleReminder: () => void
  onOpenNotes: () => void
}) {
  const timer = useFocusTimer()
  const isCompleted = block.status === 'completed'
  const status = STATUS[block.status]
  return (
    <li className={`block block--${block.tone} ${highlighted ? 'is-highlighted' : ''}`}>
      <div className="min-w-0">
        <p className="row gap-8 wrap meta mono">
          <span>{block.when}</span>
          <span className={`chip chip--${block.tone} mono`}>
            {block.tag} • {block.minutes}m
          </span>
          <span className={`status status--${block.status} mono`}>
            <Icon name={status.icon} /> {status.label}
          </span>
          {block.reminder && !isCompleted && (
            <span className="status mono">
              <Icon name="alarm_on" /> Reminder on
            </span>
          )}
        </p>
        <p className="block__title">{block.title}</p>
        <p className="meta">{block.detail}</p>
      </div>
      <div className="row gap-4">
        {block.status === 'in-progress' ? (
          <>
            <button type="button" className="btn btn--primary btn--sm" onClick={timer.start}>
              Resume
            </button>
            <button type="button" className="icon-btn" aria-label={`Mark ${block.title} complete`} onClick={onDone}>
              <Icon name="check" />
            </button>
          </>
        ) : (
          <>
            {isCompleted ? (
              <button type="button" className="icon-btn" aria-label={`Notes for ${block.title}`} onClick={onOpenNotes}>
                <Icon name="sticky_note_2" />
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn"
                aria-label={`Reminder for ${block.title}`}
                aria-pressed={Boolean(block.reminder)}
                onClick={onToggleReminder}
              >
                <Icon name="alarm" filled={block.reminder} />
              </button>
            )}
            <Menu
              label={`More options for ${block.title}`}
              trigger={<Icon name="more_vert" />}
              items={[
                ...(isCompleted
                  ? []
                  : [
                      { label: 'Start focus timer', icon: 'bolt', onSelect: timer.start },
                      { label: 'Mark complete', icon: 'check', onSelect: onDone },
                    ]),
                { label: 'Delete session', icon: 'delete', danger: true, onSelect: onRemove },
              ]}
            />
          </>
        )}
      </div>
    </li>
  )
}

function Agenda() {
  const [tasks, setTasks] = useState<AgendaTask[]>(initialAgenda)
  const [draft, setDraft] = useState('')
  const done = tasks.filter((t) => t.done).length

  function add(e: FormEvent) {
    e.preventDefault()
    const title = draft.trim()
    if (!title) return
    setTasks((prev) => [...prev, { id: `a-${Date.now()}`, title, detail: 'Added just now', done: false }])
    setDraft('')
  }

  return (
    <section className="card panel" aria-labelledby="agenda-title">
      <div className="section-head">
        <h2 id="agenda-title" className="h4">
          <Icon name="checklist" /> Today&rsquo;s Agenda
        </h2>
        <span className="chip chip--blue mono" aria-live="polite">
          {done} of {tasks.length} done
        </span>
      </div>
      {tasks.length === 0 ? (
        <EmptyState icon="task_alt" title="Your agenda is clear">
          Add a rapid task below.
        </EmptyState>
      ) : (
        <ul className="stack-4">
          {tasks.map((t) => (
            <li key={t.id} className={`task ${t.done ? 'is-done' : ''}`}>
              <input
                id={`task-${t.id}`}
                type="checkbox"
                checked={t.done}
                onChange={() => setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))}
              />
              <label htmlFor={`task-${t.id}`}>
                <span className="task__title">{t.title}</span>
                <span className="meta mono">{t.detail}</span>
              </label>
              <button
                type="button"
                className="icon-btn icon-btn--sm task__remove"
                aria-label={`Remove ${t.title}`}
                onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
              >
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="quick-add" onSubmit={add}>
        <label className="sr-only" htmlFor="rapid-task">
          Add rapid task
        </label>
        <input
          id="rapid-task"
          placeholder="Add rapid task..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="icon-btn icon-btn--primary" aria-label="Add task" disabled={!draft.trim()}>
          <Icon name="arrow_upward" />
        </button>
      </form>
    </section>
  )
}

function WeeklyLoad() {
  const max = Math.max(...weeklyHours.map((d) => d.hours))
  const todayIndex = weekDays.findIndex((d) => d.day === TODAY)
  return (
    <section className="card panel" aria-labelledby="load-title">
      <div className="section-head">
        <h2 id="load-title" className="h4">
          Cognitive Load &amp; Weekly Distribution
        </h2>
        <span className="meta mono">Goal: 22 hrs / week (14.5 hrs completed)</span>
      </div>
      <ol className="bars">
        {weeklyHours.map((d, i) => (
          <li
            key={i}
            className={`bars__col ${i < todayIndex ? 'is-past' : i === todayIndex ? 'is-today' : ''}`}
          >
            <span className="bars__value mono">
              {d.hours}h<span className="sr-only"> on {weekDays[i].label}</span>
            </span>
            <span className="bars__bar" style={{ height: `${(d.hours / max) * 100}%` }} aria-hidden="true" />
            <span className="bars__label mono" aria-hidden="true">
              {d.label}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
