export const INTAKE_DIMENSIONS = [
  { id: '01', name: 'Core Concept', focus: 'What is the idea? What problem does it solve? Where did the insight come from?' },
  { id: '02', name: 'Problem & Pain Points', focus: 'How acute is the pain? Who feels it most? Current workarounds and cost?' },
  { id: '03', name: 'Ideal Customer Profile', focus: 'Buyer identity, industry, decision-making unit, company size, buying trigger' },
  { id: '04', name: 'The Solution', focus: 'How it works, what makes it effective, what it does NOT do, minimum viable version' },
  { id: '05', name: 'Revenue Model', focus: 'Monetisation approach, pricing model, unit economics intuition, who writes the cheque' },
  { id: '06', name: 'Market Size', focus: 'TAM/SAM/SOM, sizing methodology, market growth rate' },
  { id: '07', name: 'Why Now', focus: 'Market/tech/regulatory shift enabling this, what prevented it 3 years ago' },
  { id: '08', name: 'Team & Founder Fit', focus: 'Who is involved, relevant experience, known gaps, founder unfair advantage' },
  { id: '09', name: 'Strategy & Moat', focus: 'Long-term defensibility, network effects, switching costs, strategic threats' },
  { id: '10', name: 'Traction & Evidence', focus: 'Client conversations, LOIs, pilots, revenue, design partner interest' },
] as const

export type DimensionStatus = 'complete' | 'in_progress' | 'issue' | 'missing' | 'not_started'

export interface DimensionCoverage {
  id: string
  status: DimensionStatus
  summary: string
  flags: string[]
}

export const DIMENSION_STATUS_COLORS: Record<DimensionStatus, string> = {
  complete: '#10B981',
  in_progress: '#4F9CF9',
  issue: '#EF4444',
  missing: '#F59E0B',
  not_started: '#8B87A8',
}
