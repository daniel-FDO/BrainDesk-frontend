export type Route = 'dashboard' | 'notes' | 'topics' | 'planner' | 'assistant' | 'resources' | 'settings'

/** Colour family used for subject chips, legends and progress bars. */
export type Tone = 'blue' | 'teal' | 'violet' | 'slate' | 'amber'

export type Subject = 'Computer Science' | 'Cellular Biology' | 'Mathematics' | 'Neuroscience'

export interface Course {
  id: string
  name: string
  code: string
  summary: string
  icon: string
  tone: Tone
  notes: number
  resources: number
  nextSession: { when: string; title: string }
}

export interface StudySession {
  id: string
  tag: string
  tone: Tone
  title: string
  minutes: number
  goal: string
  when: string
  isNext?: boolean
}

export interface RecentNote {
  id: string
  title: string
  excerpt: string
  tags: string[]
  edited: string
  starred: boolean
}

export interface Note {
  id: string
  subject: Subject
  title: string
  excerpt: string
  tags: string[]
  updated: string
  favorite: boolean
}

export interface Topic {
  id: string
  title: string
  summary: string
  badge: string
  meta: string
  /** Highlighted state badge such as "Today" or "Mastery High". */
  metaEmphasis?: boolean
  progress: number
  notes: number
  resources: number
  footnote: string
}

export interface TopicDomain {
  id: 'cs' | 'bio' | 'math'
  label: string
  shortLabel: string
  icon: string
  tone: Tone
  topics: Topic[]
}

export interface TopicNote {
  id: string
  icon: string
  title: string
  excerpt: string
  edited: string
  kind: string
  words: string
}

export type BlockStatus = 'completed' | 'in-progress' | 'upcoming'

export interface LearningBlock {
  id: string
  day: number
  when: string
  tag: string
  minutes: number
  tone: Tone
  status: BlockStatus
  title: string
  detail: string
  /** Weeks from the seeded planner week; omitted means that week. */
  week?: number
  reminder?: boolean
}

export interface AgendaTask {
  id: string
  title: string
  detail: string
  done: boolean
}

export type ResourceType = 'pdf' | 'video' | 'link' | 'slides'

export interface Resource {
  id: string
  title: string
  type: ResourceType
  subject: Subject
  /** Where it came from — author, site or course. */
  source: string
  /** Size-ish detail: page count, runtime, etc. */
  detail?: string
  added: string
  /** External resources open in a new tab; uploaded files have no URL yet. */
  url?: string
  pinned: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Notes the answer drew on, shown as clickable chips. */
  sources?: { id: string; title: string }[]
}
