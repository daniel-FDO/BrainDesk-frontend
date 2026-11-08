/**
 * Local, offline stand-in for an AI model.
 *
 * It answers from the user's own notes and study plan using simple keyword
 * heuristics. The async signature is deliberate: to use a real model, replace
 * the body of `askAssistant` with a call to your backend (never call an LLM API
 * straight from the browser — it would expose your API key).
 */
import { upcomingSessions } from '../data.ts'
import type { ChatMessage, Note, Subject } from '../types.ts'
import { SUBJECTS } from './subjects.ts'

export type Scope = 'all' | Subject

export interface AssistantContext {
  notes: Note[]
  scope: Scope
}

type Reply = Pick<ChatMessage, 'text' | 'sources'>

const STOP_WORDS = new Set(['what', 'when', 'where', 'which', 'with', 'about', 'explain', 'simply', 'does', 'this', 'that', 'from', 'into', 'have', 'please', 'tell', 'give', 'show', 'notes', 'note'])

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
}

/** Scores notes by how many prompt keywords appear in their title, excerpt or tags. */
function rankNotes(notes: Note[], prompt: string): Note[] {
  const words = keywords(prompt)
  if (words.length === 0) return []
  return notes
    .map((note) => {
      const haystack = `${note.title} ${note.excerpt} ${note.tags.join(' ')}`.toLowerCase()
      return { note, score: words.filter((w) => haystack.includes(w)).length }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.note)
}

/** A subject named in the prompt wins over the scope picker. */
function resolveScope(prompt: string, scope: Scope): Scope {
  const lower = prompt.toLowerCase()
  return SUBJECTS.find((s) => lower.includes(s.toLowerCase())) ?? scope
}

const sourcesOf = (notes: Note[]) => notes.map((n) => ({ id: n.id, title: n.title }))

function sentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function quiz(notes: Note[], scope: Scope): Reply {
  const picked = notes.slice(0, 3)
  if (picked.length === 0) return { text: `You don't have any ${scope === 'all' ? '' : `${scope} `}notes to quiz you on yet.` }
  const questions = picked.map((n, i) => {
    const tag = n.tags[0] ? ` (hint: think about **${n.tags[0]}**)` : ''
    return `${i + 1}. In your own words, what is the core idea of **${n.title}**?${tag}`
  })
  return {
    text: [`Here's a quick ${scope === 'all' ? '' : `${scope} `}recall check. Answer from memory, then compare with your notes:`, ...questions, 'Reply with your answers and I\'ll point you back to the right note.'].join('\n'),
    sources: sourcesOf(picked),
  }
}

function summarize(note: Note | undefined): Reply {
  if (!note) return { text: 'There are no notes in this scope to summarize yet.' }
  const points = sentences(note.excerpt)
  return {
    text: [
      `**${note.title}** (${note.subject} · ${note.updated})`,
      ...(points.length ? points.map((p) => `- ${p}`) : ['- This note is still empty — add a few lines and ask again.']),
      note.tags.length ? `Key tags: ${note.tags.map((t) => `#${t}`).join(' ')}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    sources: sourcesOf([note]),
  }
}

function plan(): Reply {
  return {
    text: [
      "Here's what's coming up on your study plan:",
      ...upcomingSessions.map((s) => `- **${s.when}** · ${s.title} (${s.minutes} min) — ${s.goal.replace(/^Goal:\s*/, '')}`),
      `Tip: the first one is next — a 5-minute skim of related notes beforehand makes it stick better.`,
    ].join('\n'),
  }
}

function explain(prompt: string, notes: Note[]): Reply {
  const [best, ...rest] = rankNotes(notes, prompt)
  if (!best) {
    const titles = notes.slice(0, 3).map((n) => `- ${n.title}`)
    return {
      text: [
        "I couldn't find that in your notes yet, so I won't guess. Try writing a note on it first, or ask about something you've already covered:",
        ...titles,
      ].join('\n'),
    }
  }
  const related = rest.slice(0, 2)
  return {
    text: [
      `Based on your note **${best.title}**:`,
      ...sentences(best.excerpt).map((s) => `- ${s}`),
      related.length ? `This connects to ${related.map((n) => `**${n.title}**`).join(' and ')}.` : '',
      'Want me to turn this into a quick quiz?',
    ]
      .filter(Boolean)
      .join('\n'),
    sources: sourcesOf([best, ...related]),
  }
}

export async function askAssistant(prompt: string, { notes, scope }: AssistantContext): Promise<Reply> {
  // Simulated latency so the UI's "thinking" state is visible.
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500))

  const effective = resolveScope(prompt, scope)
  const inScope = effective === 'all' ? notes : notes.filter((n) => n.subject === effective)
  const lower = prompt.toLowerCase()

  // Order matters: "Summarize <note title>" must win even if the title contains "quiz" or "today".
  if (/^\s*summar/.test(lower)) {
    const mentioned = rankNotes(inScope, prompt)[0]
    return summarize(mentioned ?? inScope[0])
  }
  if (/\b(quiz|test me|flashcards?|practice)\b/.test(lower)) return quiz(inScope, effective)
  if (/\b(plan|schedule|next|today|upcoming)\b/.test(lower)) return plan()
  return explain(prompt, inScope)
}
