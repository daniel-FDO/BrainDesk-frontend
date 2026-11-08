import { useEffect, useEffectEvent, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Icon } from '../components/ui.tsx'
import { askAssistant, type Scope } from '../lib/assistant.ts'
import { SUBJECTS, SUBJECT_TONE } from '../lib/subjects.ts'
import type { ChatMessage, Note } from '../types.ts'

const SUGGESTIONS = [
  { icon: 'quiz', label: 'Quiz me', prompt: 'Quiz me on Computer Science' },
  { icon: 'summarize', label: 'Summarize', prompt: 'Summarize my latest note' },
  { icon: 'event_upcoming', label: "What's next", prompt: "What's next on my study plan?" },
  { icon: 'lightbulb', label: 'Explain', prompt: 'Explain backpropagation simply' },
]

let nextId = 0
const newId = () => `m-${Date.now()}-${nextId++}`

/** Renders **bold** spans inside a line of text. */
function inline(text: string): ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))
}

type Block = { kind: 'p'; text: string } | { kind: 'ul' | 'ol'; items: string[] }

/** Groups reply lines into paragraphs, "- " bullet lists and "1. " numbered lists. */
function toBlocks(text: string): Block[] {
  const blocks: Block[] = []
  for (const line of text.split('\n')) {
    const bullet = line.match(/^- (.*)/)
    const numbered = line.match(/^\d+\. (.*)/)
    const match = bullet ?? numbered
    if (match) {
      const kind = bullet ? 'ul' : 'ol'
      const last = blocks.at(-1)
      if (last && last.kind === kind) last.items.push(match[1])
      else blocks.push({ kind, items: [match[1]] })
    } else if (line.trim()) {
      blocks.push({ kind: 'p', text: line })
    }
  }
  return blocks
}

function RichText({ text }: { text: string }) {
  return toBlocks(text).map((block, i) => {
    if (block.kind === 'p') return <p key={i}>{inline(block.text)}</p>
    const List = block.kind
    return (
      <List key={i} className={`msg__list msg__list--${block.kind}`}>
        {block.items.map((item, j) => (
          <li key={j}>{inline(item)}</li>
        ))}
      </List>
    )
  })
}

interface AssistantProps {
  notes: Note[]
  onOpenNote: (id: string) => void
  /** Sent automatically on arrival, e.g. from "Generate Quiz" on another page. */
  initialPrompt?: string | null
  onInitialPromptUsed?: () => void
}

export function Assistant({ notes, onOpenNote, initialPrompt, onInitialPromptUsed }: AssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [scope, setScope] = useState<Scope>('all')
  const [pending, setPending] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Bumped on "New chat" and unmount so late replies from an old conversation are dropped.
  const conversation = useRef(0)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  useEffect(
    () => () => {
      conversation.current++
    },
    [],
  )

  async function send(text: string) {
    const prompt = text.trim()
    if (!prompt || pending) return
    const turn = conversation.current
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text: prompt }])
    setDraft('')
    setPending(true)
    try {
      const reply = await askAssistant(prompt, { notes, scope })
      if (turn !== conversation.current) return
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', ...reply }])
    } catch {
      if (turn !== conversation.current) return
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', text: 'Something went wrong while answering. Please try again.' },
      ])
    } finally {
      if (turn === conversation.current) {
        setPending(false)
        inputRef.current?.focus()
      }
    }
  }

  const sendInitialPrompt = useEffectEvent((prompt: string) => {
    onInitialPromptUsed?.()
    void send(prompt)
  })

  useEffect(() => {
    if (!initialPrompt) return
    // Deferred so StrictMode's trial unmount cancels this instead of dropping the reply.
    const id = window.setTimeout(() => sendInitialPrompt(initialPrompt), 0)
    return () => window.clearTimeout(id)
  }, [initialPrompt])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a newline; ignore while an IME is composing.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void send(draft)
    }
  }

  function newChat() {
    conversation.current++
    setMessages([])
    setPending(false)
    setDraft('')
    inputRef.current?.focus()
  }

  const scopedNotes = scope === 'all' ? notes : notes.filter((n) => n.subject === scope)

  return (
    <div className="assistant">
      <section className="card chat" aria-labelledby="chat-title">
        <header className="chat__head">
          <span className="tile" aria-hidden="true">
            <Icon name="auto_awesome" filled />
          </span>
          <div className="min-w-0">
            <h1 id="chat-title" className="h4">
              BrainDesk Assistant
            </h1>
            <p className="meta">Answers come from your own notes and study plan</p>
          </div>
          <div className="chat__head-actions">
            <label className="sr-only" htmlFor="assistant-scope">
              Subject scope
            </label>
            <select
              id="assistant-scope"
              className="select"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
            >
              <option value="all">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn icon-btn--bordered"
              onClick={newChat}
              aria-label="New chat"
              title="New chat"
              disabled={messages.length === 0 && !pending}
            >
              <Icon name="edit_square" />
            </button>
          </div>
        </header>

        <div ref={logRef} className="chat__log" role="log" aria-live="polite" aria-label="Conversation">
          {messages.length === 0 ? (
            <div className="chat__welcome">
              <span className="tile chat__welcome-mark" aria-hidden="true">
                <Icon name="auto_awesome" filled />
              </span>
              <p className="h3">How can I help you study?</p>
              <p className="muted">
                Ask me to explain a concept, quiz you, or summarize a note. I only use what&rsquo;s in your workspace.
              </p>
              <ul className="chat__suggestions">
                {SUGGESTIONS.map((s) => (
                  <li key={s.label}>
                    <button type="button" className="suggestion" onClick={() => void send(s.prompt)}>
                      <Icon name={s.icon} />
                      <span>
                        <strong>{s.label}</strong>
                        <span className="meta">{s.prompt}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            messages.map((m) => (
              <article key={m.id} className={`msg msg--${m.role}`} aria-label={m.role === 'user' ? 'You' : 'Assistant'}>
                {m.role === 'assistant' && (
                  <span className="tile tile--sm" aria-hidden="true">
                    <Icon name="auto_awesome" />
                  </span>
                )}
                <div className="msg__bubble">
                  {m.role === 'user' ? <p>{m.text}</p> : <RichText text={m.text} />}
                  {m.sources && m.sources.length > 0 && (
                    <div className="msg__sources">
                      <span className="label">Sources</span>
                      {m.sources.map((s) => (
                        <button key={s.id} type="button" className="source-chip" onClick={() => onOpenNote(s.id)}>
                          <Icon name="description" /> {s.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
          {pending && (
            <div className="msg msg--assistant" role="status">
              <span className="tile tile--sm" aria-hidden="true">
                <Icon name="auto_awesome" />
              </span>
              <div className="msg__bubble typing">
                <span className="sr-only">Assistant is thinking…</span>
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </div>
            </div>
          )}
        </div>

        <form className="composer" onSubmit={onSubmit}>
          <label className="sr-only" htmlFor="assistant-input">
            Message the assistant
          </label>
          <textarea
            id="assistant-input"
            ref={inputRef}
            rows={1}
            placeholder="Ask about your notes…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="submit"
            className="icon-btn icon-btn--primary"
            aria-label="Send message"
            disabled={!draft.trim() || pending}
          >
            <Icon name="arrow_upward" />
          </button>
        </form>
        <p className="chat__hint meta">
          <kbd className="kbd mono">Enter</kbd> to send · <kbd className="kbd mono">Shift + Enter</kbd> for a new line
        </p>
      </section>

      <aside className="stack-16 assistant__side" aria-label="Assistant tools">
        <section className="card panel" aria-labelledby="quick-title">
          <h2 id="quick-title" className="h4">
            <Icon name="bolt" /> Quick actions
          </h2>
          <div className="stack-8">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                type="button"
                className="btn btn--outline btn--block quick-action"
                onClick={() => void send(s.prompt)}
                disabled={pending}
              >
                <Icon name={s.icon} /> {s.prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="card panel" aria-labelledby="scope-title">
          <div className="section-head">
            <h2 id="scope-title" className="h4">
              <Icon name="library_books" /> Notes in scope
            </h2>
            <span className="count mono">{scopedNotes.length}</span>
          </div>
          {scopedNotes.length === 0 ? (
            <p className="meta">No notes for this subject yet.</p>
          ) : (
            <ul className="stack-8">
              {scopedNotes.slice(0, 5).map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className="scope-note"
                    onClick={() => void send(`Summarize ${n.title}`)}
                    disabled={pending}
                  >
                    <span className={`dot dot--${SUBJECT_TONE[n.subject]}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="scope-note__title truncate">{n.title}</span>
                      <span className="meta">{n.subject}</span>
                    </span>
                    <Icon name="summarize" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="meta assistant__privacy">
          <Icon name="lock" /> Runs entirely in your browser. Nothing you type is sent anywhere.
        </p>
      </aside>
    </div>
  )
}
