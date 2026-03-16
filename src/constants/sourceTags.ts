import type { SourceTag } from '@/types'

export const SOURCE_COLORS: Record<SourceTag, string> = {
  FOUNDER: '#4F9CF9',
  VL: '#F59E0B',
  VERA: '#7C6AF7',
  AI_SYNTHESIS: '#7C6AF7',
  AI_RESEARCH: '#0EA5E9',
  PRESSURE_TEST: '#F97316',
  SCORING: '#059669',
  DESIGN_PARTNER: '#06B6D4',
  CLIENT_INTERVIEW: '#10B981',
  VC_INTERVIEW: '#6366F1',
  EXPERT_INTERVIEW: '#9333EA',
  COMPETITOR: '#EC4899',
  FINANCIAL: '#84CC16',
  FEEDBACK: '#94A3B8',
}

export const SOURCE_LABELS: Record<SourceTag, string> = {
  FOUNDER: 'Founder Input',
  VL: 'Venture Lead',
  VERA: 'Vera',
  AI_SYNTHESIS: 'AI Synthesis',
  AI_RESEARCH: 'AI Research',
  PRESSURE_TEST: 'Pressure Test',
  SCORING: 'Scoring Model',
  DESIGN_PARTNER: 'Design Partner',
  CLIENT_INTERVIEW: 'Client Interview',
  VC_INTERVIEW: 'VC Interview',
  EXPERT_INTERVIEW: 'Expert Interview',
  COMPETITOR: 'Competitor Analysis',
  FINANCIAL: 'Financial Model',
  FEEDBACK: 'Human Feedback',
}
