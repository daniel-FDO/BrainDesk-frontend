import { useState } from 'react'
import { Menu } from '../components/Menu.tsx'
import { Chip, Icon, Ring, Tag } from '../components/ui.tsx'
import { useFocusTimer } from '../context/FocusTimer.tsx'
import { useProfile } from '../context/Profile.tsx'
import { courses, recentNotes, upcomingSessions } from '../data.ts'
import type { Route } from '../types.ts'

const SETUP_STEPS = [
  { href: '#/settings', icon: 'person', label: 'Set your name and study track' },
  { href: '#/resources', icon: 'upload_file', label: 'Add your syllabus to Resources' },
  { href: '#/planner', icon: 'event_available', label: 'Schedule your first study session' },
]

interface DashboardProps {
  onNavigate: (route: Route) => void
  onCreateNote: () => void
  onAskAssistant: (prompt: string) => void
}

function greeting(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Stand-in for the design's "Feed-forward Pass" figure (no Stitch asset access). */
function FeedForwardFigure() {
  const layers = [
    [22, 44, 66],
    [14, 34, 54, 74],
    [30, 58],
  ]
  const xs = [30, 110, 190]
  return (
    <svg viewBox="0 0 220 88" className="figure__svg" aria-hidden="true">
      {layers.slice(0, -1).flatMap((layer, li) =>
        layer.flatMap((y1, a) =>
          layers[li + 1].map((y2, b) => (
            <line key={`${li}-${a}-${b}`} x1={xs[li]} y1={y1} x2={xs[li + 1]} y2={y2} />
          )),
        ),
      )}
      {layers.flatMap((layer, li) =>
        layer.map((y, i) => <circle key={`${li}-${i}`} cx={xs[li]} cy={y} r={5.5} />),
      )}
    </svg>
  )
}

export function Dashboard({ onNavigate, onCreateNote, onAskAssistant }: DashboardProps) {
  const timer = useFocusTimer()
  const profile = useProfile()
  const [showSetup, setShowSetup] = useState(true)
  const [showSteps, setShowSteps] = useState(false)
  const [hour] = useState(() => new Date().getHours())
  const todayCount = upcomingSessions.filter((s) => s.when.startsWith('Today')).length

  function startFocus() {
    timer.setMode('pomodoro')
    timer.start()
    onNavigate('planner')
  }

  return (
    <div className="dashboard">
      <section className="hello">
        <div>
          <Chip mono>
            <span className="dot dot--blue" aria-hidden="true" />
            Fall Semester • Week 7
          </Chip>
          <h1 className="h1">
            {greeting(hour)}, {profile.firstName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="muted">
            You&rsquo;ve got {todayCount} study sessions scheduled today. Stay curious and protect your momentum.
          </p>
        </div>
        <div className="hello__actions">
          <button type="button" className="btn btn--outline" onClick={startFocus}>
            <Icon name="bolt" />
            Start Focus Session
            <span className="kbd mono">{timer.durations.pomodoro}m</span>
          </button>
          <button type="button" className="btn btn--primary" onClick={onCreateNote}>
            <Icon name="edit_square" />
            Create note
          </button>
        </div>
      </section>

      <section className="card hero" aria-labelledby="hero-title">
        <div className="hero__body">
          <div className="row gap-8 wrap">
            <Chip mono>Computer Science</Chip>
            <span className="meta mono">
              <Icon name="schedule" /> Opened 24 mins ago
            </span>
          </div>
          <p className="meta mono hero__module">
            <Icon name="layers" /> Module 4 • Deep Learning
          </p>
          <h2 id="hero-title" className="h2">
            Neural Networks &amp; Backpropagation
          </h2>
          <p className="muted clamp-2">
            Mathematical derivation of the chain rule through multi-layer perceptrons, weight tensors update
            mechanisms, and computational graphs.
          </p>
          <div className="row gap-8 wrap hero__actions">
            <button type="button" className="btn btn--primary" onClick={() => onNavigate('notes')}>
              <Icon name="menu_book" />
              Resume Reading
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => onAskAssistant('Quiz me on Computer Science')}
            >
              <Icon name="quiz" />
              Generate Quiz
            </button>
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => onAskAssistant('Summarize Neural Networks & Backpropagation')}
            >
              <Icon name="summarize" />
              Summarize
            </button>
          </div>
        </div>

        <aside className="mastery" aria-label="Module mastery">
          <div className="row between">
            <span className="label">Module Mastery</span>
            <span className="label text-primary">68% Reviewed</span>
          </div>
          <div className="row gap-12 mastery__stats">
            <Ring value={68} label="68% of module concepts reviewed">
              <strong>68%</strong>
            </Ring>
            <div className="min-w-0">
              <p className="mastery__count">14 / 21 Concepts</p>
              <p className="meta mono truncate">Next: Stochastic Gradient Descent</p>
              <p className="meta mono">
                <span className="dot dot--blue" aria-hidden="true" /> Spaced repetition due
              </p>
            </div>
          </div>
          <figure className="figure">
            <FeedForwardFigure />
            <figcaption className="mono">Figure 4.3 • Feed-forward Pass</figcaption>
          </figure>
        </aside>
      </section>

      <section aria-labelledby="topics-title">
        <div className="section-head">
          <h2 id="topics-title" className="h3">
            Course Topics <Chip mono>{courses.length} Active</Chip>
          </h2>
          <a className="link" href="#/topics">
            Manage Topics <Icon name="arrow_forward" />
          </a>
        </div>
        <ul className="grid-4">
          {courses.map((course) => (
            <li key={course.id} className="card course">
              <div className="row between">
                <span className={`tile tile--${course.tone}`} aria-hidden="true">
                  <Icon name={course.icon} />
                </span>
                <span className="code mono">{course.code}</span>
              </div>
              <h3 className="course__name">{course.name}</h3>
              <p className="meta">{course.summary}</p>
              <p className="course__counts meta mono">
                <span>
                  <Icon name="description" /> {course.notes} notes
                </span>
                <span>
                  <Icon name="attach_file" /> {course.resources} resources
                </span>
              </p>
              <div className="course__next">
                <p className="label text-primary">Next Session: {course.nextSession.when}</p>
                <p className="course__next-title">{course.nextSession.title}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="split-2">
        <section className="card panel" aria-labelledby="sessions-title">
          <div className="section-head">
            <h2 id="sessions-title" className="h3">
              <Icon name="calendar_today" className="text-primary" /> Upcoming Study Sessions
            </h2>
            <span className="meta mono">{todayCount} Sessions Remaining Today</span>
          </div>
          <ul className="stack-8">
            {upcomingSessions.map((s) => (
              <li key={s.id} className="session">
                <span className="session__check" aria-hidden="true">
                  <Icon name="check" />
                </span>
                <div className="session__body">
                  <Chip tone={s.tone} mono>
                    {s.tag}
                  </Chip>
                  <p className="session__title">{s.title}</p>
                  <p className="meta mono">
                    <Icon name="schedule" /> {s.minutes} min · {s.goal}
                  </p>
                </div>
                <span className={`when mono ${s.isNext ? 'when--next' : ''}`}>{s.when}</span>
                <Menu
                  label={`More options for ${s.title}`}
                  trigger={<Icon name="more_horiz" />}
                  items={[
                    { label: 'Start focus session', icon: 'bolt', onSelect: startFocus },
                    { label: 'Open in planner', icon: 'calendar_month', onSelect: () => onNavigate('planner') },
                  ]}
                />

              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--soft btn--block" onClick={() => onNavigate('planner')}>
            <Icon name="add_circle" />
            Schedule New Session
          </button>
        </section>

        <section className="card panel" aria-labelledby="recent-title">
          <div className="section-head">
            <h2 id="recent-title" className="h3">
              <Icon name="description" className="text-primary" /> Recently Edited Notes
            </h2>
            <a className="link" href="#/notes">
              View all
            </a>
          </div>
          <ul className="stack-8">
            {recentNotes.map((n) => (
              <li key={n.id} className="recent">
                <div className="row between">
                  <p className="recent__title">{n.title}</p>
                  <Icon
                    name="star"
                    filled={n.starred}
                    className={n.starred ? 'star is-on' : 'star'}
                    label={n.starred ? 'Starred' : 'Not starred'}
                  />
                </div>
                <p className="meta clamp-1">{n.excerpt}</p>
                <div className="row between wrap gap-8">
                  <span className="row gap-4 wrap">
                    {n.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </span>
                  <span className="meta mono">{n.edited}</span>
                </div>
              </li>
            ))}
          </ul>
          <p className="sync">
            <Icon name="cloud_done" />
            <span>Auto-sync enabled for 49 total notes</span>
            <span className="label text-primary">All saved</span>
          </p>
        </section>
      </div>

      {showSetup && (
        <section className="card banner" aria-labelledby="setup-title">
          <span className="tile tile--blue" aria-hidden="true">
            <Icon name="school" />
          </span>
          <div className="banner__text">
            <h2 id="setup-title" className="h4">
              Starting a new term or module?
            </h2>
            <p className="meta">
              Import syllabus PDFs, auto-generate study roadmaps, and sync your course timetable in minutes.
            </p>
          </div>
          <div className="row gap-8">
            <button type="button" className="btn btn--outline" onClick={() => setShowSetup(false)}>
              Dismiss
            </button>
            <button
              type="button"
              className="btn btn--primary"
              aria-expanded={showSteps}
              aria-controls="setup-steps"
              onClick={() => setShowSteps((v) => !v)}
            >
              Run Setup Wizard <Icon name={showSteps ? 'expand_less' : 'chevron_right'} />
            </button>
          </div>
          {showSteps && (
            <ol id="setup-steps" className="setup-steps">
              {SETUP_STEPS.map((step) => (
                <li key={step.href}>
                  <a className="link" href={step.href}>
                    <Icon name={step.icon} /> {step.label}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  )
}
