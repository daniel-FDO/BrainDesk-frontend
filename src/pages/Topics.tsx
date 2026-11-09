import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Menu } from "../components/Menu.tsx";
import { EmptyState, Icon, ProgressBar } from "../components/ui.tsx";
import { topicDetails } from "../data.ts";
import { averagePercent } from "../lib/format.ts";
import {
  createTopic,
  deleteTopicById,
  groupByDomain,
  listTopics,
  updateTopic,
  type ApiTopic,
  type TopicInput,
} from "../lib/topicsApi.ts";
import type { Route, Subject, Topic, TopicDomain } from "../types.ts";

type DomainFilter = "all" | TopicDomain["id"];
type Tab = "notes" | "pdfs" | "sessions" | "ai";

/** The assistant's quizzes work per subject, so each domain maps to one. */
const DOMAIN_SUBJECT: Record<TopicDomain["id"], Subject> = {
  cs: "Computer Science",
  bio: "Cellular Biology",
  math: "Mathematics",
};

const FREQUENCIES = ["Daily", "Every 2 days", "Weekly"];

/** The backend rejects empty summaries, so a blank one is stored as this. */
const NO_SUMMARY = "No description yet.";

const TABS: { id: Tab; label: string; count?: number }[] = [
  { id: "notes", label: "Notes", count: 14 },
  { id: "pdfs", label: "PDFs", count: 4 },
  { id: "sessions", label: "Sessions", count: 3 },
  { id: "ai", label: "AI Practice" },
];

interface TopicsProps {
  onNavigate: (route: Route) => void;
  onAskAssistant: (prompt: string) => void;
}

export function Topics({ onNavigate, onAskAssistant }: TopicsProps) {
  const [topics, setTopics] = useState<ApiTopic[]>([]);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("notes");
  const [addingTopic, setAddingTopic] = useState(false);
  const [editingTopic, setEditingTopic] = useState(false);
  const [frequency, setFrequency] = useState(FREQUENCIES[0]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    listTopics(controller.signal)
      .then((loaded) => {
        setTopics(loaded);
        setLoadStatus("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadStatus("failed");
      });
    return () => controller.abort();
  }, []);

  const allDomains = groupByDomain(topics);
  const domains = allDomains.filter(
    (d) =>
      d.topics.length > 0 && (domainFilter === "all" || d.id === domainFilter),
  );
  const allCards = allDomains.flatMap((d) => d.topics);
  const selected = allCards.find((t) => t.id === selectedId) ?? allCards[0];
  const selectedDomain = allDomains.find((d) => d.topics.includes(selected));
  const detail = selected ? topicDetails[selected.id] : undefined;
  const quizPrompt = selectedDomain
    ? `Quiz me on ${DOMAIN_SUBJECT[selectedDomain.id]}`
    : "";

  function selectTopic(id: string | null) {
    setSelectedId(id);
    setTab("notes");
    setEditingTopic(false);
  }

  /** Runs a backend call, surfacing failures and blocking double submits. */
  async function runAction(
    action: () => Promise<void>,
    failureMessage: string,
  ) {
    setSaving(true);
    setActionError(null);
    try {
      await action();
    } catch {
      setActionError(failureMessage);
    } finally {
      setSaving(false);
    }
  }

  function addTopic(input: TopicInput) {
    return runAction(async () => {
      const created = await createTopic(input);
      setTopics((prev) => [...prev, created]);
      setDomainFilter("all");
      setAddingTopic(false);
      selectTopic(String(created.id));
    }, "Couldn’t add the topic. Is the backend running?");
  }

  function saveTopic(patch: Pick<Topic, "title" | "summary">) {
    if (!selected) return;
    const id = Number(selected.id);
    return runAction(async () => {
      const updated = await updateTopic(id, patch);
      setTopics((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingTopic(false);
    }, "Couldn’t save your changes. Is the backend running?");
  }

  function deleteTopic() {
    if (
      !selected ||
      !window.confirm(`Delete “${selected.title}”? This can’t be undone.`)
    )
      return;
    const id = Number(selected.id);
    return runAction(async () => {
      await deleteTopicById(id);
      setTopics((prev) => prev.filter((t) => t.id !== id));
      selectTopic(null);
    }, "Couldn’t delete the topic. Is the backend running?");
  }

  function onTabKey(e: KeyboardEvent, index: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next =
      (index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="topics">
      <header className="page-head">
        <div>
          <p className="eyebrow mono">
            <span className="dot dot--blue" aria-hidden="true" /> Knowledge
            Architecture
          </p>
          <h1 className="h1">Subjects &amp; Topics</h1>
          <p className="muted">
            Organize your curriculum, track syllabus completion, and curate
            notes across multimodal academic tracks.
          </p>
        </div>
        <div className="page-head__side">
          <div
            className="pill-group"
            role="group"
            aria-label="Filter by domain"
          >
            <button
              type="button"
              aria-pressed={domainFilter === "all"}
              onClick={() => setDomainFilter("all")}
            >
              All Domains{" "}
              <span className="count mono">{allDomains.length}</span>
            </button>
            {allDomains.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={domainFilter === d.id}
                onClick={() => setDomainFilter(d.id)}
              >
                <span className={`dot dot--${d.tone}`} aria-hidden="true" />{" "}
                {d.shortLabel}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--primary"
            aria-expanded={addingTopic}
            onClick={() => setAddingTopic((v) => !v)}
          >
            <Icon name={addingTopic ? "close" : "add"} />{" "}
            {addingTopic ? "Cancel" : "New Topic"}
          </button>
        </div>
      </header>

      {actionError && (
        <p className="form-error" role="alert">
          <Icon name="error" /> {actionError}
        </p>
      )}

      {addingTopic && (
        <NewTopicForm
          domains={allDomains}
          saving={saving}
          onAdd={addTopic}
          onCancel={() => setAddingTopic(false)}
        />
      )}

      <div className="topics__layout">
        <div className="stack-24">
          {domains.length === 0 &&
            (loadStatus === "failed" ? (
              <EmptyState icon="error" title="Couldn’t load topics">
                Check that the backend is running at 127.0.0.1:8000.
              </EmptyState>
            ) : (
              <EmptyState
                icon="inventory_2"
                title={
                  loadStatus === "loading"
                    ? "Loading topics…"
                    : "No topics here yet"
                }
              >
                {loadStatus === "ready" && "Use New Topic to add one."}
              </EmptyState>
            ))}
          {domains.map((domain) => (
            <section key={domain.id} aria-labelledby={`domain-${domain.id}`}>
              <div className="section-head">
                <h2 id={`domain-${domain.id}`} className="h3">
                  <span
                    className={`tile tile--sm tile--${domain.tone}`}
                    aria-hidden="true"
                  >
                    <Icon name={domain.icon} />
                  </span>
                  {domain.label}
                  <span className="count mono">
                    {domain.topics.length} Topics
                  </span>
                </h2>
                <span className="meta mono">
                  Avg. {averagePercent(domain.topics.map((t) => t.progress))}%
                  Done
                </span>
              </div>
              <ul className="grid-3">
                {domain.topics.map((topic) => {
                  const isSelected = topic.id === selected?.id;
                  return (
                    <li key={topic.id}>
                      <button
                        type="button"
                        className={`card topic ${isSelected ? "is-selected" : ""}`}
                        aria-pressed={isSelected}
                        onClick={() => selectTopic(topic.id)}
                      >
                        <span className="row between gap-8">
                          <span
                            className={`subject subject--${domain.tone} subject--boxed mono`}
                          >
                            <span className="dot" aria-hidden="true" />
                            {topic.badge}
                          </span>
                          <span
                            className={`meta mono ${topic.metaEmphasis ? "pill-badge" : ""}`}
                          >
                            {topic.meta}
                          </span>
                        </span>
                        <span className="topic__title">{topic.title}</span>
                        <span className="meta clamp-2">{topic.summary}</span>
                        <span className="topic__progress">
                          <span className="row between meta mono">
                            <span>Syllabus Covered</span>
                            <strong>{topic.progress}%</strong>
                          </span>
                          <ProgressBar
                            value={topic.progress}
                            tone={domain.tone}
                            label={`${topic.title} syllabus covered`}
                          />
                        </span>
                        <span className="row between meta mono topic__foot">
                          <span className="row gap-8">
                            <span>
                              <Icon name="description" /> {topic.notes}
                            </span>
                            <span>
                              <Icon name="attach_file" /> {topic.resources}
                            </span>
                          </span>
                          <span>
                            {isSelected ? "Selected" : topic.footnote}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {selected && selectedDomain ? (
          <aside className="card detail" aria-labelledby="detail-title">
            <div className="row between">
              <p className="eyebrow mono">Active Workspace Subject</p>
              <div className="row gap-4">
                <button
                  type="button"
                  className="icon-btn icon-btn--sm"
                  aria-label="Topic settings"
                  aria-expanded={editingTopic}
                  onClick={() => setEditingTopic((v) => !v)}
                >
                  <Icon name="tune" />
                </button>
                <Menu
                  label="More topic actions"
                  trigger={<Icon name="more_vert" />}
                  triggerClassName="icon-btn icon-btn--sm"
                  items={[
                    {
                      label: "Quiz me on this subject",
                      icon: "quiz",
                      onSelect: () => onAskAssistant(quizPrompt),
                    },
                    {
                      label: "Delete topic",
                      icon: "delete",
                      danger: true,
                      disabled: saving,
                      onSelect: deleteTopic,
                    },
                  ]}
                />
              </div>
            </div>
            <h2 id="detail-title" className="h3 detail__title">
              <span
                className={`dot dot--lg dot--${selectedDomain.tone}`}
                aria-hidden="true"
              />
              {selected.title}
            </h2>

            {editingTopic && (
              <TopicEditForm
                key={selected.id}
                topic={selected}
                saving={saving}
                onSave={saveTopic}
                onCancel={() => setEditingTopic(false)}
              />
            )}

            <dl className="stats">
              <div>
                <dt>Linked Notes</dt>
                <dd>{detail?.linkedNotes ?? selected.notes}</dd>
              </div>
              <div>
                <dt>Study Hours</dt>
                <dd>{detail?.studyHours ?? "—"}</dd>
              </div>
              <div>
                <dt>Quiz Score</dt>
                <dd className="text-primary">{detail?.quizScore ?? "—"}</dd>
              </div>
            </dl>

            {detail && (
              <div className="coverage">
                <span className="tile tile--blue" aria-hidden="true">
                  <Icon name="hub" />
                </span>
                <div>
                  <p className="coverage__title">
                    Semantic Graph Coverage{" "}
                    <span className="label text-primary">
                      {detail.coverage}% Sync
                    </span>
                  </p>
                  <p className="meta">
                    Connected with {detail.embeddings} concept embeddings
                  </p>
                </div>
              </div>
            )}

            <div className="tabs" role="tablist" aria-label="Topic content">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  id={`tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  aria-controls="topic-tabpanel"
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  {t.label}
                  {detail && t.count !== undefined && ` (${t.count})`}
                </button>
              ))}
            </div>

            <div
              id="topic-tabpanel"
              role="tabpanel"
              aria-labelledby={`tab-${tab}`}
            >
              {tab === "notes" && detail ? (
                <>
                  <div className="row between detail__sub">
                    <span className="meta mono">
                      Recently Edited in this Topic
                    </span>
                    <a className="link meta" href="#/notes">
                      View All <Icon name="arrow_forward" />
                    </a>
                  </div>
                  <ul className="stack-8">
                    {detail.recent.map((n) => (
                      <li key={n.id} className="topic-note">
                        <span
                          className="tile tile--sm tile--blue"
                          aria-hidden="true"
                        >
                          <Icon name={n.icon} />
                        </span>
                        <div className="min-w-0">
                          <p className="row between gap-8">
                            <span className="topic-note__title truncate">
                              {n.title}
                            </span>
                            <span className="meta mono nowrap">{n.edited}</span>
                          </p>
                          <p className="meta truncate">{n.excerpt}</p>
                          <p className="row gap-8 meta mono">
                            <span className="tag">{n.kind}</span>
                            <span>{n.words}</span>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <EmptyState
                  icon="inventory_2"
                  title={`No ${TABS.find((t) => t.id === tab)!.label.toLowerCase()} yet`}
                >
                  Items you link to {selected.title} will show up here.
                </EmptyState>
              )}
            </div>

            {detail && (
              <div className="recommend">
                <p className="recommend__title mono">
                  <Icon name="auto_awesome" /> BrainDesk Assistant
                  Recommendation
                </p>
                <p>
                  Based on your last quiz, review{" "}
                  <strong className="text-primary">
                    Backpropagation with Batch Normalization
                  </strong>{" "}
                  before tonight&rsquo;s 20:00 session.
                </p>
                <button
                  type="button"
                  className="link meta mono"
                  onClick={() => onAskAssistant(quizPrompt)}
                >
                  Generate 5-min drill <Icon name="arrow_forward" />
                </button>
              </div>
            )}

            <button
              type="button"
              className="btn btn--primary btn--block btn--lg"
              onClick={() => onNavigate("planner")}
            >
              <Icon name="event_available" /> Schedule Study Session for this
              Topic
            </button>
            {detail && (
              <div className="row between meta mono">
                <span>Review: {frequency} · Next slot: Today at 19:30</span>
                <Menu
                  label="Adjust frequency"
                  trigger="Adjust frequency"
                  triggerClassName="link"
                  items={FREQUENCIES.map((f) => ({
                    label: f,
                    icon: f === frequency ? "check" : undefined,
                    onSelect: () => setFrequency(f),
                  }))}
                />
              </div>
            )}
          </aside>
        ) : (
          <aside className="card detail">
            <EmptyState icon="inventory_2" title="No topic selected">
              Add a topic to open its workspace.
            </EmptyState>
          </aside>
        )}
      </div>
    </div>
  );
}

function NewTopicForm({
  domains,
  saving,
  onAdd,
  onCancel,
}: {
  domains: TopicDomain[];
  saving: boolean;
  onAdd: (input: TopicInput) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [domainId, setDomainId] = useState(domains[0].id);
  const [error, setError] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError(true);
      return;
    }
    onAdd({
      title: cleanTitle,
      domain: domainId,
      summary: summary.trim() || NO_SUMMARY,
    });
  }

  return (
    <form className="card panel settings__section" onSubmit={submit} noValidate>
      <h2 className="h4">
        <Icon name="add" /> New topic
      </h2>
      <div className="form-grid">
        <label className="field">
          <span className="label">Title</span>
          <input
            className="input"
            value={title}
            autoFocus
            aria-invalid={error || undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(false);
            }}
          />
        </label>
        <label className="field">
          <span className="label">Domain</span>
          <select
            className="input"
            value={domainId}
            onChange={(e) => setDomainId(e.target.value as TopicDomain["id"])}
          >
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span className="label">Summary (optional)</span>
        <input
          className="input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>
      {error && (
        <p className="form-error" role="alert">
          <Icon name="error" /> Give the topic a title.
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Adding…" : "Add topic"}
        </button>
      </div>
    </form>
  );
}

function TopicEditForm({
  topic,
  saving,
  onSave,
  onCancel,
}: {
  topic: Topic;
  saving: boolean;
  onSave: (patch: Pick<Topic, "title" | "summary">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(topic.title);
  const [summary, setSummary] = useState(topic.summary);
  const cleanTitle = title.trim();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!cleanTitle) return;
    onSave({ title: cleanTitle, summary: summary.trim() || NO_SUMMARY });
  }

  return (
    <form className="stack-8" onSubmit={submit} noValidate>
      <label className="field">
        <span className="label">Title</span>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="field">
        <span className="label">Summary</span>
        <input
          className="input"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={!cleanTitle || saving}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
