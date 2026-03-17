export interface StageFeature {
  id: string
  name: string
  path: string
}

export const STAGE_FEATURES: Record<string, StageFeature[]> = {
  '01': [
    { id: 'vc-thesis', name: 'VC Thesis', path: '/discover/vc-thesis' },
    { id: 'market-signals', name: 'Market Signals', path: '/discover/market-signals' },
    { id: 'opportunity-brief', name: 'Opportunity Brief', path: '/discover/opportunity-brief' },
    { id: 'resources', name: 'Resources', path: '/discover/resources' },
  ],
  '02': [
    { id: 'idea-intake', name: 'Idea Intake', path: '/define/idea-intake' },
    { id: 'scoring', name: 'Scoring', path: '/define/scoring' },
    { id: 'pressure-test', name: 'Pressure Test', path: '/define/pressure-test' },
    { id: 'icp-builder', name: 'ICP Builder', path: '/define/icp' },
    { id: 'competitors', name: 'Competitors', path: '/define/competitors' },
    { id: 'business-brief', name: 'Business Brief', path: '/define/business-brief' },
  ],
  '03': [
    { id: 'pressure-test', name: 'Pressure Test', path: '/incubate/pressure-test' },
    { id: 'financial-models', name: 'Financial Models', path: '/incubate/financial-models' },
    { id: 'interview-insights', name: 'Interview Insights', path: '/incubate/interviews' },
    { id: 'strategy-moat', name: 'Strategy & Moat', path: '/incubate/strategy' },
    { id: 'solution', name: 'Solution', path: '/incubate/solution' },
    { id: 'risk-mitigation', name: 'Risk Mitigation', path: '/incubate/risk' },
    { id: 'client-list', name: 'Client List', path: '/incubate/client-list' },
    { id: 'outputs', name: 'Outputs', path: '/incubate/outputs' },
  ],
  '04': [
    { id: 'design-partners', name: 'Design Partners', path: '/validate/design-partners' },
    { id: 'feedback-summary', name: 'Feedback Summary', path: '/validate/feedback' },
    { id: 'mvp-features', name: 'MVP Features', path: '/validate/mvp-features' },
  ],
  '05': [
    { id: 'architecture', name: 'Architecture', path: '/mvp-ready/architecture' },
    { id: 'roadmap', name: 'Roadmap', path: '/mvp-ready/roadmap' },
    { id: 'business', name: 'Business', path: '/mvp-ready/business' },
    { id: 'feature-prds', name: 'Feature PRDs', path: '/mvp-ready/prds' },
    { id: 'sprint-plan', name: 'Sprint Plan', path: '/mvp-ready/sprints' },
  ],
  '06': [
    { id: 'client-feedback', name: 'Client Feedback', path: '/build/client-feedback' },
    { id: 'roadmap-updater', name: 'Roadmap Updater', path: '/build/roadmap' },
    { id: 'pricing-lab', name: 'Pricing Lab', path: '/build/pricing-lab' },
    { id: 'business', name: 'Business', path: '/build/business' },
  ],
  '07': [
    { id: 'pricing-tracker', name: 'Pricing Tracker', path: '/commercial/pricing' },
    { id: 'gtm-tracker', name: 'GTM Tracker', path: '/commercial/gtm' },
    { id: 'client-list', name: 'Client List', path: '/commercial/client-list' },
    { id: 'business', name: 'Business', path: '/commercial/business' },
  ],
}

export interface FounderStage {
  id: string
  name: string
  vlStageId: string
  basePaths: string[]
  features: StageFeature[]
}

export const FOUNDER_STAGES: FounderStage[] = [
  {
    id: 'my-idea',
    name: 'My Idea',
    vlStageId: '02',
    basePaths: ['/define'],
    features: [
      { id: 'idea-intake', name: 'Idea Intake', path: '/define/idea-intake' },
      { id: 'scoring', name: 'Scoring', path: '/define/scoring' },
      { id: 'pressure-test', name: 'Pressure Test', path: '/define/pressure-test' },
      { id: 'icp-builder', name: 'ICP Builder', path: '/define/icp' },
      { id: 'competitors', name: 'Competitors', path: '/define/competitors' },
      { id: 'business-brief', name: 'Business Brief', path: '/define/business-brief' },
    ],
  },
  {
    id: 'validate',
    name: 'Validate',
    vlStageId: '03',
    basePaths: ['/incubate'],
    features: [
      { id: 'pressure-test', name: 'Pressure Test', path: '/incubate/pressure-test' },
      { id: 'financial-models', name: 'Financial Models', path: '/incubate/financial-models' },
      { id: 'interview-insights', name: 'Interview Insights', path: '/incubate/interviews' },
      { id: 'strategy-moat', name: 'Strategy & Moat', path: '/incubate/strategy' },
      { id: 'solution', name: 'Solution', path: '/incubate/solution' },
      { id: 'risk-mitigation', name: 'Risk Mitigation', path: '/incubate/risk' },
      { id: 'client-list', name: 'Client List', path: '/incubate/client-list' },
      { id: 'outputs', name: 'Outputs', path: '/validate/outputs' },
    ],
  },
  {
    id: 'design-partners',
    name: 'Design Partners',
    vlStageId: '04',
    basePaths: ['/validate'],
    features: [
      { id: 'design-partners', name: 'Design Partners', path: '/validate/design-partners' },
      { id: 'feedback-summary', name: 'Feedback Summary', path: '/validate/feedback' },
      { id: 'mvp-features', name: 'MVP Features', path: '/validate/mvp-features' },
    ],
  },
  {
    id: 'mvp-readiness',
    name: 'MVP Readiness',
    vlStageId: '05',
    basePaths: ['/mvp-ready'],
    features: [
      { id: 'architecture', name: 'Architecture', path: '/mvp-ready/architecture' },
      { id: 'roadmap', name: 'Roadmap', path: '/mvp-ready/roadmap' },
      { id: 'business', name: 'Business', path: '/mvp-ready/business' },
      { id: 'feature-prds', name: 'Feature PRDs', path: '/mvp-ready/prds' },
      { id: 'sprint-plan', name: 'Sprint Plan', path: '/mvp-ready/sprints' },
    ],
  },
  {
    id: 'build-pilot',
    name: 'Build & Pilot',
    vlStageId: '06',
    basePaths: ['/build'],
    features: [
      { id: 'client-feedback', name: 'Client Feedback', path: '/build/client-feedback' },
      { id: 'roadmap-updater', name: 'Roadmap Updater', path: '/build/roadmap' },
      { id: 'pricing-lab', name: 'Pricing Lab', path: '/build/pricing-lab' },
      { id: 'business', name: 'Business', path: '/build/business' },
    ],
  },
  {
    id: 'go-to-market',
    name: 'Go to Market',
    vlStageId: '07',
    basePaths: ['/commercial'],
    features: [
      { id: 'pricing-tracker', name: 'Pricing Tracker', path: '/commercial/pricing' },
      { id: 'gtm-tracker', name: 'GTM Tracker', path: '/commercial/gtm' },
      { id: 'client-list', name: 'Client List', path: '/commercial/client-list' },
      { id: 'business', name: 'Business', path: '/commercial/business' },
    ],
  },
]

export const STAGE_BASE_PATHS: Record<string, string> = {
  '01': '/discover',
  '02': '/define',
  '03': '/incubate',
  '04': '/validate',
  '05': '/mvp-ready',
  '06': '/build',
  '07': '/commercial',
  'stage-gate': '/stage-gate',
}
