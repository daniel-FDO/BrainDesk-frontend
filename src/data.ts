/**
 * Content transcribed from the BrainDesk Stitch screens.
 * There is no backend yet — swap these for API calls when one exists.
 */
import type {
  AgendaTask,
  Course,
  LearningBlock,
  Note,
  RecentNote,
  Resource,
  StudySession,
  TopicDomain,
  TopicNote,
} from './types.ts'

export const user = { name: 'Alex Chen', firstName: 'Alex', track: 'CS & Bio', initials: 'AC' }

export const courses: Course[] = [
  {
    id: 'cs',
    name: 'Computer Science',
    code: 'CS-401',
    summary: 'Algorithms, Architecture & ML',
    icon: 'desktop_windows',
    tone: 'blue',
    notes: 18,
    resources: 3,
    nextSession: { when: 'Today, 4:00 PM', title: 'Distributed Systems' },
  },
  {
    id: 'bio',
    name: 'Cellular Biology',
    code: 'BIO-210',
    summary: 'Energetics & Membrane Kinetics',
    icon: 'science',
    tone: 'teal',
    notes: 12,
    resources: 5,
    nextSession: { when: 'Tomorrow, 10:00 AM', title: 'Mitochondrial Pathways' },
  },
  {
    id: 'math',
    name: 'Discrete Mathematics',
    code: 'MATH-215',
    summary: 'Combinatorics, Logic & Proofs',
    icon: 'functions',
    tone: 'violet',
    notes: 15,
    resources: 2,
    nextSession: { when: 'Thursday, 2:30 PM', title: 'Graph Theory & Trees' },
  },
  {
    id: 'neuro',
    name: 'Cognitive Neuroscience',
    code: 'NEUR-180',
    summary: 'Memory Encoding & Sensory Cortices',
    icon: 'psychology',
    tone: 'slate',
    notes: 9,
    resources: 4,
    nextSession: { when: 'Friday, 11:00 AM', title: 'Memory Consolidation' },
  },
]

export const upcomingSessions: StudySession[] = [
  {
    id: 's1',
    tag: 'CS',
    tone: 'blue',
    title: 'Review Graph Search Algorithms',
    minutes: 45,
    goal: 'Goal: Master Dijkstra & A* Heuristics',
    when: 'Today, 4:00 PM',
    isNext: true,
  },
  {
    id: 's2',
    tag: 'Biology',
    tone: 'teal',
    title: 'Protein Synthesis Flashcards',
    minutes: 30,
    goal: 'Goal: 40 Spaced-Repetition Cards',
    when: 'Today, 7:15 PM',
  },
  {
    id: 's3',
    tag: 'Math',
    tone: 'violet',
    title: 'Eulerian & Hamiltonian Paths',
    minutes: 60,
    goal: 'Goal: Complete Chapter 5 Proof Exercises',
    when: 'Tomorrow, 2:00 PM',
  },
]

export const recentNotes: RecentNote[] = [
  {
    id: 'r1',
    title: 'Backpropagation Math Breakdown',
    excerpt: 'Expanded chain rule gradient proofs for dense layers.',
    tags: ['calculus', 'algorithms'],
    edited: 'Edited 24m ago',
    starred: true,
  },
  {
    id: 'r2',
    title: 'ATP Synthase Mechanism',
    excerpt: 'Chemiosmotic proton rotor stator coupling in the inner membrane.',
    tags: ['biochemistry', 'energetics'],
    edited: 'Edited 2h ago',
    starred: false,
  },
  {
    id: 'r3',
    title: 'Bayesian Inference Cheat Sheet',
    excerpt: 'Prior, likelihood, posterior distribution definitions.',
    tags: ['statistics', 'inference'],
    edited: 'Edited yesterday',
    starred: true,
  },
]

export const notes: Note[] = [
  {
    id: 'n1',
    subject: 'Computer Science',
    title: 'Neural Networks & Backpropagation',
    excerpt:
      'Chain rule derivations for deep multivariate matrices. Vectorized error propagation across layers.',
    tags: ['calculus', 'backprop'],
    updated: 'Just now',
    favorite: true,
  },
  {
    id: 'n2',
    subject: 'Cellular Biology',
    title: 'Mitochondrial Respiration & ATP Synthase',
    excerpt:
      'Chemiosmotic coupling across the inner mitochondrial membrane. F0-F1 rotor complex mechanics.',
    tags: ['bioenergetics', 'metabolism'],
    updated: '2h ago',
    favorite: false,
  },
  {
    id: 'n3',
    subject: 'Mathematics',
    title: 'Spectral Theorem & SVD Decompositions',
    excerpt:
      'Hermitian matrices, unitary transformations, geometric intuition of principal axes rotations in high dimensions.',
    tags: ['linear-algebra', 'eigenvalues'],
    updated: 'Yesterday',
    favorite: false,
  },
  {
    id: 'n4',
    subject: 'Neuroscience',
    title: 'Synaptic Plasticity & LTP Induction',
    excerpt:
      'NMDA receptor voltage-dependent magnesium unblock. Ca2+ intracellular signaling cascade, and AMPA trafficking.',
    tags: ['synapses', 'hippocampus'],
    updated: 'Oct 22',
    favorite: false,
  },
  {
    id: 'n5',
    subject: 'Computer Science',
    title: 'Distributed Consensus & Raft Algorithm',
    excerpt: 'Leader election, log replication and quorum safety invariants.',
    tags: ['distributed-systems', 'raft'],
    updated: 'Oct 21',
    favorite: false,
  },
]

/** Library-wide counts shown on the Notes filter chips. */
export const noteCounts = {
  all: 64,
  favorites: 12,
  'Computer Science': 18,
  'Cellular Biology': 12,
  Mathematics: 15,
  Neuroscience: 9,
} as const

export const topicDomains: TopicDomain[] = [
  {
    id: 'cs',
    label: 'Computer Science & AI',
    shortLabel: 'CS & AI',
    icon: 'memory',
    tone: 'blue',
    topics: [
      {
        id: 'ml',
        title: 'Machine Learning & Deep Learning',
        summary: 'Optimization landscapes, transformers, and representation learning.',
        badge: 'Core ML',
        meta: 'Today',
        metaEmphasis: true,
        progress: 82,
        notes: 24,
        resources: 6,
        footnote: 'Selected',
      },
      {
        id: 'ds',
        title: 'Distributed Systems',
        summary: 'Consensus protocols, Raft, vector clocks, and replication.',
        badge: 'Infra',
        meta: 'Next: Fri',
        progress: 45,
        notes: 6,
        resources: 4,
        footnote: 'Exam Oct 28',
      },
      {
        id: 'os',
        title: 'Operating Systems & Kernels',
        summary: 'Virtual memory pages, context switching, and scheduling.',
        badge: 'Low Level',
        meta: 'Next: Nov 2',
        progress: 60,
        notes: 8,
        resources: 3,
        footnote: '5 Flashcard sets',
      },
    ],
  },
  {
    id: 'bio',
    label: 'Biological Sciences',
    shortLabel: 'Biology',
    icon: 'biotech',
    tone: 'teal',
    topics: [
      {
        id: 'cell',
        title: 'Cellular & Molecular Biology',
        summary:
          'Mitochondrial respiration, GTPase cascades, actin cytoskeleton, and vesicle trafficking.',
        badge: 'Cytology',
        meta: 'Next: Tomorrow',
        progress: 70,
        notes: 12,
        resources: 4,
        footnote: 'Lab Notebook active',
      },
      {
        id: 'gen',
        title: 'Genetics & Epigenetics',
        summary:
          'Histone methylation, CRISPR Cas-9 loci, mendelian inheritance ratios, and imprinting.',
        badge: 'Genetics',
        meta: 'Next: Thu',
        progress: 50,
        notes: 7,
        resources: 3,
        footnote: 'Midterm due Nov 14',
      },
    ],
  },
  {
    id: 'math',
    label: 'Mathematics & Logic',
    shortLabel: 'Math & Logic',
    icon: 'calculate',
    tone: 'violet',
    topics: [
      {
        id: 'disc',
        title: 'Discrete Mathematics & Graphs',
        summary:
          'Planar embeddings, combinatorics, proof by induction, Eulerian paths, and Boolean algebra.',
        badge: 'Graph Theory',
        meta: 'Mastery High',
        metaEmphasis: true,
        progress: 90,
        notes: 15,
        resources: 4,
        footnote: 'Almost Finished',
      },
      {
        id: 'linalg',
        title: 'Linear Algebra & Vector Spaces',
        summary:
          'Eigen-decomposition, SVD factorizations, null spaces, inner product projections, and more.',
        badge: 'Linear Spaces',
        meta: 'Next: Sun',
        progress: 45,
        notes: 9,
        resources: 2,
        footnote: '5 problem sets',
      },
    ],
  },
]

/** Detail-panel content. Only the Machine Learning topic has data in the design. */
export const topicDetails: Record<
  string,
  { linkedNotes: number; studyHours: string; quizScore: string; coverage: number; embeddings: number; recent: TopicNote[] }
> = {
  ml: {
    linkedNotes: 14,
    studyHours: '32.4',
    quizScore: '92%',
    coverage: 82,
    embeddings: 42,
    recent: [
      {
        id: 't1',
        icon: 'segment',
        title: 'Transformer Architecture & Self-Attention',
        excerpt: 'Scaled dot-product equations, multi-head projections.',
        edited: '3d ago',
        kind: 'Lecture 09',
        words: '1,420 words',
      },
      {
        id: 't2',
        icon: 'show_chart',
        title: 'Stochastic Gradient Descent Variants',
        excerpt: 'First and second momentum bounds, learning rate schedules.',
        edited: 'Yesterday',
        kind: 'Math Derivation',
        words: '840 words',
      },
      {
        id: 't3',
        icon: 'blur_on',
        title: 'Latent Diffusion & Score Matching',
        excerpt: 'Forward noising process, reverse denoising U-Net.',
        edited: '5 days ago',
        kind: 'Research Paper',
        words: '2,100 words',
      },
    ],
  },
}

export const weekDays = [
  { day: 21, label: 'Mon' },
  { day: 22, label: 'Tue' },
  { day: 23, label: 'Wed' },
  { day: 24, label: 'Thu' },
  { day: 25, label: 'Fri' },
  { day: 26, label: 'Sat', weekend: true },
  { day: 27, label: 'Sun', weekend: true },
]

export const TODAY = 23

export const learningBlocks: LearningBlock[] = [
  {
    id: 'b1',
    day: 21,
    when: 'Mon, Oct 21 • 4:00 PM',
    tag: 'CS',
    minutes: 45,
    tone: 'blue',
    status: 'completed',
    title: 'Backprop & Gradient Descent',
    detail: 'Chain rule expansions • Matrix calculus derivatives reviewed',
  },
  {
    id: 'b2',
    day: 22,
    when: 'Tue, Oct 22 • 10:00 AM',
    tag: 'Bio',
    minutes: 30,
    tone: 'teal',
    status: 'completed',
    title: 'Cellular Respiration Flashcards',
    detail: '32 Anki cards memorized • Krebs Cycle enzymes verified',
  },
  {
    id: 'b3',
    day: 23,
    when: 'Wed, Oct 23 • 2:00 PM (Now)',
    tag: 'Math',
    minutes: 60,
    tone: 'violet',
    status: 'in-progress',
    title: 'Graph Theory Problem Set 4',
    detail: 'Questions 1-5 • Topological sort arrays & acyclic verification',
  },
  {
    id: 'b4',
    day: 24,
    when: 'Thu, Oct 24 • 4:00 PM',
    tag: 'CS',
    minutes: 45,
    tone: 'blue',
    status: 'upcoming',
    title: 'Distributed Consensus Protocols',
    detail: 'Raft vs. Paxos comparisons • Quorum safety invariants reading',
  },
  {
    id: 'b5',
    day: 25,
    when: 'Fri, Oct 25 • 11:00 AM',
    tag: 'Neuro',
    minutes: 45,
    tone: 'slate',
    status: 'upcoming',
    title: 'Action Potentials in Neurons',
    detail: 'Voltage-gated sodium channels • Refractory period diagrams',
  },
]

export const initialAgenda: AgendaTask[] = [
  { id: 'a1', title: 'Review 15 flashcards', detail: 'Bio • Completed 10:30 AM', done: true },
  { id: 'a2', title: 'Complete quiz on Chapter 4', detail: 'Score: 94% • Math Dept', done: true },
  { id: 'a3', title: 'Draft summary for Lecture 7', detail: 'CS • Due tonight by 11:59 PM', done: false },
  {
    id: 'a4',
    title: 'Submit graph problem set scratchwork',
    detail: 'Math • PDF export pending',
    done: false,
  },
]

export const weeklyHours = [
  { label: 'M', hours: 3.2 },
  { label: 'T', hours: 4.1 },
  { label: 'W', hours: 3.5 },
  { label: 'T', hours: 2.5 },
  { label: 'F', hours: 2.8 },
  { label: 'S', hours: 1.5 },
  { label: 'S', hours: 0.5 },
]

export const resources: Resource[] = [
  {
    id: 'res1',
    title: 'Attention Is All You Need',
    type: 'pdf',
    subject: 'Computer Science',
    source: 'Vaswani et al. · arXiv',
    detail: '15 pages',
    added: 'Oct 20',
    url: 'https://arxiv.org/abs/1706.03762',
    pinned: true,
  },
  {
    id: 'res2',
    title: 'In Search of an Understandable Consensus Algorithm (Raft)',
    type: 'pdf',
    subject: 'Computer Science',
    source: 'Ongaro & Ousterhout',
    detail: '18 pages',
    added: 'Oct 18',
    url: 'https://raft.github.io/raft.pdf',
    pinned: false,
  },
  {
    id: 'res3',
    title: 'Raft Consensus — Interactive Visualization',
    type: 'link',
    subject: 'Computer Science',
    source: 'raft.github.io',
    added: 'Oct 18',
    url: 'https://raft.github.io/',
    pinned: false,
  },
  {
    id: 'res4',
    title: 'Neural Networks Series',
    type: 'video',
    subject: 'Computer Science',
    source: '3Blue1Brown',
    detail: '4 videos',
    added: 'Oct 12',
    url: 'https://www.3blue1brown.com/topics/neural-networks',
    pinned: true,
  },
  {
    id: 'res5',
    title: 'Lecture 7 — Oxidative Phosphorylation',
    type: 'slides',
    subject: 'Cellular Biology',
    source: 'BIO-210 Course Slides',
    detail: '42 slides',
    added: 'Oct 22',
    pinned: false,
  },
  {
    id: 'res6',
    title: 'Krebs Cycle Enzyme Reference Sheet',
    type: 'pdf',
    subject: 'Cellular Biology',
    source: 'Lab handout',
    detail: '2 pages',
    added: 'Oct 15',
    pinned: true,
  },
  {
    id: 'res7',
    title: 'Mathematics for Computer Science',
    type: 'link',
    subject: 'Mathematics',
    source: 'MIT OpenCourseWare 6.042J',
    added: 'Oct 2',
    url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/',
    pinned: false,
  },
  {
    id: 'res8',
    title: 'Graph Theory Problem Set 4',
    type: 'pdf',
    subject: 'Mathematics',
    source: 'MATH-215',
    detail: '6 pages',
    added: 'Oct 21',
    pinned: false,
  },
  {
    id: 'res9',
    title: 'Week 5 — Memory Consolidation',
    type: 'slides',
    subject: 'Neuroscience',
    source: 'NEUR-180 Course Slides',
    detail: '36 slides',
    added: 'Oct 19',
    pinned: false,
  },
  {
    id: 'res10',
    title: 'LTP & Synaptic Plasticity Walkthrough',
    type: 'video',
    subject: 'Neuroscience',
    source: 'Recorded lecture',
    detail: '52 min',
    added: 'Oct 10',
    pinned: false,
  },
]
