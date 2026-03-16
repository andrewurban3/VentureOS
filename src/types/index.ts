// Source attribution system - PRD Section 4

export type SourceTag =
  | 'FOUNDER'
  | 'VL'
  | 'VERA'
  | 'AI_SYNTHESIS'
  | 'AI_RESEARCH'
  | 'CLIENT_INTERVIEW'
  | 'VC_INTERVIEW'
  | 'EXPERT_INTERVIEW'
  | 'PRESSURE_TEST'
  | 'SCORING'
  | 'COMPETITOR'
  | 'FINANCIAL'
  | 'DESIGN_PARTNER'
  | 'FEEDBACK'

export interface ExternalCitation {
  title: string
  url?: string
  publicationDate?: string
  accessDate: string
  relevanceNote: string
  flaggedBy?: 'FOUNDER' | 'VL'
  flagReason?: 'not_credible' | 'outdated'
}

export type ValidationTagType =
  | 'CLIENT_INTERVIEW'
  | 'VC_INTERVIEW'
  | 'EXPERT_INTERVIEW'
  | 'CONTRADICTED'

export interface ValidationTag {
  type: ValidationTagType
  intervieweeCompany: string
  intervieweeRole: string
  date: string
}

export interface FeedbackEntry {
  rating: 'positive' | 'negative'
  comment?: string
  correctedValue?: string
  userRole: 'FOUNDER' | 'VL'
  timestamp: string
}

export interface HistoryEntry<T> {
  value: T
  source: SourceTag
  subSource?: string
  timestamp: string
}

export interface TrackedField<T> {
  value: T
  source: SourceTag
  subSource?: string
  timestamp: string
  citation?: ExternalCitation
  validationTags?: ValidationTag[]
  feedback?: FeedbackEntry[]
  history?: HistoryEntry<T>[]
}

export function makeTrackedField<T>(
  value: T,
  source: SourceTag,
  subSource?: string,
  citation?: ExternalCitation
): TrackedField<T> {
  const timestamp = new Date().toISOString()
  const entry: HistoryEntry<T> = { value, source, subSource, timestamp }
  return {
    value,
    source,
    subSource,
    timestamp,
    citation,
    history: [entry],
  }
}
