import { topicDomains } from '../data.ts'
import type { Topic, TopicDomain } from '../types.ts'

const TOPICS_URL = '/api/topics'

/** A topic exactly as the FastAPI backend sends it. */
export interface ApiTopic {
  id: number
  title: string
  domain: string
  summary: string
}

export type TopicInput = Omit<ApiTopic, 'id'>

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url} failed with ${res.status}`)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export function listTopics(signal?: AbortSignal) {
  return request<ApiTopic[]>(TOPICS_URL, { signal })
}

export function createTopic(input: TopicInput) {
  return request<ApiTopic>(TOPICS_URL, { method: 'POST', body: JSON.stringify(input) })
}

export function updateTopic(id: number, patch: Partial<TopicInput>) {
  return request<ApiTopic>(`${TOPICS_URL}/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function deleteTopicById(id: number) {
  return request<void>(`${TOPICS_URL}/${id}`, { method: 'DELETE' })
}

/** The backend stores four fields; the rest of a card is display defaults. */
function toCard(topic: ApiTopic, domain: TopicDomain): Topic {
  return {
    id: String(topic.id),
    title: topic.title,
    summary: topic.summary,
    badge: domain.shortLabel,
    meta: '',
    progress: 0,
    notes: 0,
    resources: 0,
    footnote: 'Not started',
  }
}

export function groupByDomain(topics: ApiTopic[]): TopicDomain[] {
  const domains = topicDomains.map((domain) => ({ ...domain, topics: [] as Topic[] }))

  for (const topic of topics) {
    const domain = domains.find((d) => d.id === topic.domain)

    // TODO(human): decide what happens when topic.domain isn't 'cs', 'bio' or 'math'.
    if (!domain) continue

    domain.topics.push(toCard(topic, domain))
  }

  return domains
}
