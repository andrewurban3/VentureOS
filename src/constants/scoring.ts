export interface ScoringDimension {
  id: string
  name: string
  weight: number
  whyItMatters: string
}

export const CORPORATE_DIMENSIONS: ScoringDimension[] = [
  { id: 'strategic_alignment', name: 'Strategic Alignment', weight: 20, whyItMatters: "A venture that does not serve the parent's strategy will be defunded at the first budget cycle." },
  { id: 'horizon_classification', name: 'Horizon Classification', weight: 15, whyItMatters: 'H1/H2/H3 clarity determines the right management model and capital patience.' },
  { id: 'internal_sponsorship', name: 'Internal Sponsorship', weight: 15, whyItMatters: 'The leading cause of corporate venture death is loss of internal champion.' },
  { id: 'organizational_readiness', name: 'Organizational Readiness', weight: 15, whyItMatters: 'The best product fails if the parent organisation cannot support it at scale.' },
  { id: 'innovation_type', name: 'Innovation Type', weight: 10, whyItMatters: 'Different innovation types require different investment profiles and timelines.' },
  { id: 'cannibalization_risk', name: 'Cannibalization Risk', weight: 10, whyItMatters: 'Unacknowledged cannibalization risk surfaces as internal sabotage.' },
  { id: 'build_buy_partner_fit', name: 'Build / Buy / Partner Fit', weight: 15, whyItMatters: 'Building what should be acquired destroys capital and time.' },
]

export const VC_DIMENSIONS: ScoringDimension[] = [
  { id: 'market_size', name: 'Market Size', weight: 20, whyItMatters: 'VCs need $1B+ TAM to justify the fund math.' },
  { id: 'problem_severity', name: 'Problem Severity', weight: 15, whyItMatters: 'Painkillers get funded. Vitamins get interesting case studies.' },
  { id: 'solution_differentiation', name: 'Solution Differentiation', weight: 15, whyItMatters: '10x better or go home. Incremental improvement gets copied.' },
  { id: 'founder_market_fit', name: 'Founder-Market Fit', weight: 15, whyItMatters: 'The team is the only truly defensible moat in the early stage.' },
  { id: 'business_model_quality', name: 'Business Model Quality', weight: 10, whyItMatters: 'Revenue model design determines VC-scale vs lifestyle business.' },
  { id: 'timing_why_now', name: 'Timing / Why Now', weight: 10, whyItMatters: 'Being right too early is the same as being wrong.' },
  { id: 'competitive_moat', name: 'Competitive Moat', weight: 10, whyItMatters: 'What compounds over time gets acquired at a premium.' },
  { id: 'traction_signal', name: 'Traction Signal', weight: 5, whyItMatters: 'Any signal that someone will pay changes the risk profile.' },
]

export const STUDIO_DIMENSIONS: ScoringDimension[] = [
  { id: 'design_partner_readiness', name: 'Design Partner Readiness', weight: 20, whyItMatters: 'The studio model only works if real clients will co-build.' },
  { id: 'prototype_ability', name: 'Prototype-ability', weight: 15, whyItMatters: 'If something meaningful cannot be built in a 5-day sprint, the scope is wrong.' },
  { id: 'studio_unfair_advantage', name: 'Studio Unfair Advantage', weight: 15, whyItMatters: "If this venture doesn't need the studio's assets, fund as standalone." },
  { id: 'stage_gate_progressibility', name: 'Stage-Gate Progressibility', weight: 15, whyItMatters: 'Clear outputs at each gate manage capital risk.' },
  { id: 'founder_accountability', name: 'Founder Accountability', weight: 10, whyItMatters: 'A studio venture without a committed founder is a consulting project.' },
  { id: 'capital_efficiency', name: 'Capital Efficiency', weight: 10, whyItMatters: 'Capital must follow conviction, not precede it.' },
  { id: 'exit_path_clarity', name: 'Exit Path Clarity', weight: 5, whyItMatters: 'A great product with no credible exit is a cost centre.' },
  { id: 'client_validation_signal', name: 'Client Validation Signal', weight: 10, whyItMatters: 'No venture advances without a client who will pay.' },
]

export const LENS_CONFIG = {
  corporate: {
    id: 'corporate',
    name: 'Corporate Innovation',
    researchBasis: 'Nagji & Tuff HBR (2012); McKinsey Three Horizons; Doblin; Chesbrough; O\'Reilly & Tushman',
    dimensions: CORPORATE_DIMENSIONS,
    loadingMessage: 'Running Corporate Innovation analysis...',
  },
  vc: {
    id: 'vc',
    name: 'Venture Capital',
    researchBasis: 'Sequoia; Bessemer; a16z; Benchmark; First Round; Elad Gil',
    dimensions: VC_DIMENSIONS,
    loadingMessage: 'Applying the VC Lens...',
  },
  studio: {
    id: 'studio',
    name: 'Venture Studio',
    researchBasis: 'Mach49; BCG Digital Ventures; High Alpha; Atomic; Bain; Ries; Blank',
    dimensions: STUDIO_DIMENSIONS,
    loadingMessage: 'Running Studio evaluation...',
  },
} as const

export type CompositeSignal = 'Advance' | 'Caution' | 'Revisit' | 'Kill'

export interface DimensionScore {
  id: string
  name: string
  score: number
  explanation: string
  whyItMatters: string
}

export interface LensScoreResult {
  dimensions: DimensionScore[]
  average: number
  recommendation?: string
}
