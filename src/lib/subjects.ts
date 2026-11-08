import type { Subject, Tone } from '../types.ts'

/** Colour family for each subject — shared by Notes, Resources and the Assistant. */
export const SUBJECT_TONE: Record<Subject, Tone> = {
  'Computer Science': 'blue',
  'Cellular Biology': 'teal',
  Mathematics: 'violet',
  Neuroscience: 'slate',
}

export const SUBJECTS = Object.keys(SUBJECT_TONE) as Subject[]
