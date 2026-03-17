import type { TrackedField, SourceTag } from './index'
import type { LensScoreResult, CompositeSignal } from '@/constants/scoring'

export interface IntakeMessage {
  role: 'user' | 'assistant'
  content: string
  source: 'FOUNDER' | 'VERA'
  timestamp: string
  voiceInput?: boolean
  citations?: { url: string; title: string; excerpt?: string }[]
}

export interface VentureCitation {
  id: string
  source: SourceTag
  title: string
  url?: string
  excerpt?: string
  context: string
  dimensionId?: string
  generatedAt: string
}

export interface BusinessBriefDocument {
  content: {
    opportunityOverview: string
    problemAndPainPoints: string
    idealCustomerProfile: string
    solutionOverview: string
    marketAnalysis: string
    recommendations: string
  }
  citationIds: number[]
  generatedAt: string
  version: number
}

export interface InvestmentMemoDocument {
  content: Record<string, string>
  citationIds: number[]
  generatedAt: string
  version: number
}

export interface PitchDeckDocument {
  content: Record<string, string>
  citationIds: number[]
  generatedAt: string
  version: number
}

export interface DiscoverResearch {
  id: string
  type: 'vc_thesis' | 'market_signal' | 'opportunity_brief'
  query: string
  content: string
  citations: { title: string; url?: string; date?: string }[]
  source: 'AI_RESEARCH' | 'AI_SYNTHESIS'
  generatedAt: string
}

export interface IcpDocument {
  industry: string
  industrySegments?: { segment: string; rationale: string }[]
  companySize: string
  buyerRole: string
  decisionMakingUnit: string
  buyingTrigger?: string
  painPoints: string | { pain: string; severity: 'High' | 'Medium' | 'Low'; evidence: string }[]
  buyingCharacteristics?: { characteristic: string; importance: 'High' | 'Medium' | 'Low' }[]
  currentAlternatives: string
  willingnessToPay: string
  generatedAt: string
  source: 'AI_SYNTHESIS'
  founderNotes?: string
  vlNotes?: string
}

export interface CompetitorProfile {
  id: string
  name: string
  websiteUrl?: string
  category: 'Direct' | 'Adjacent' | 'Emerging' | 'Do Nothing'
  description: string
  valueProposition?: string
  keyFeatures?: string[]
  recentNews?: string
  targetIcp: string
  pricingModel: string
  fundingScale: string
  keyStrengths: string
  keyWeaknesses: string
  threatLevel: 'High' | 'Medium' | 'Low'
  threatRationale: string
  ourDifferentiation: string
  featureComparison?: { feature: string; us: string; them: string }[]
  competitorSummary?: string
  status: 'pending' | 'accepted' | 'rejected'
  rejectionReason?: string
  rejectedBy?: 'founder' | 'venture-lead'
  founderComments?: string
  vlNotes?: string
  source: 'AI_RESEARCH'
  citations?: { url: string; title: string; excerpt?: string }[]
}

export interface CompetitorAnalysis {
  competitors: CompetitorProfile[]
  landscapeSummary?: string
  citations?: { url: string; title: string; excerpt?: string }[]
  generatedAt: string
}

export interface ClientListEntry {
  id: string
  companyName: string
  industry?: string
  companySize?: string
  rationale: string
  contactRole?: string
  linkedInUrl?: string
  status: 'candidate' | 'contacted' | 'qualified' | 'declined'
  notes?: string
  source: 'AI_RESEARCH' | 'FOUNDER' | 'VL'
  generatedAt: string
}

export interface ClientList {
  entries: ClientListEntry[]
  generatedAt: string
}

export interface FinancialAssumption {
  id: string
  label: string
  value: string | number
  source: 'FOUNDER' | 'VL' | 'AI_RESEARCH' | 'AI_SYNTHESIS'
  citation?: { title: string; url?: string }
  confidence: 'High' | 'Medium' | 'Low'
  note?: string
  updatedAt: string
}

export interface MvpCostModel {
  mvpFeatures?: { feature: string; description?: string }[]
  scenarios: { conservative: number; base: number; aggressive: number }
  lineItems: { category: string; conservative: number; base: number; aggressive: number }[]
  assumptions: FinancialAssumption[]
  generatedAt: string
}

export interface UnitEconomicsModel {
  inputs: Record<string, { value: number; assumptionId?: string }>
  outputs: { ltv: number; ltvCac: number; paybackMonths: number; ruleOf40?: number }
  assumptions: FinancialAssumption[]
  generatedAt: string
}

export interface MarketSizingModel {
  tam: number
  sam: number
  som: number
  cagr?: number
  methodology: string
  assumptions: FinancialAssumption[]
  generatedAt: string
}

export type InterviewRole = 'Prospect' | 'Client' | 'VC' | 'Expert' | 'Partner' | 'Competitor' | 'Other'
export type InterviewConductedBy = 'Founder' | 'Venture Lead'

export interface InterviewUpload {
  id: string
  transcript: string
  intervieweeRole: InterviewRole
  intervieweeCompany: string
  interviewDate: string
  conductedBy: InterviewConductedBy
  interviewType: string
  uploadedBy: 'FOUNDER' | 'VL'
  uploadedAt: string
}

export interface InterviewExtraction {
  uploadId: string
  painPoints: { quote: string; paraphrase: string; dimensionId?: string; validated?: boolean }[]
  workarounds: string[]
  willingnessToPay: string[]
  icpMatch: string
  featureRequests: string[]
  objections: string[]
  keyQuotes: string[]
  signalQuality: 'Strong' | 'Moderate' | 'Weak'
  generatedAt: string
}

export interface CrossInterviewSynthesis {
  themes: { theme: string; count: number }[]
  contradictions: string[]
  topQuotes: string[]
  signalQuality: string
  generatedAt: string
}

export interface MoatRecommendation {
  type: string
  rationale: string
  examples?: string[]
}

export interface MoatClaim {
  moatType: string
  claim: string
  supported: boolean
}

export interface MoatAssessment {
  recommendedMoats: MoatRecommendation[]
  currentClaims: MoatClaim[]
  narrative?: string
  generatedAt: string
}

export interface StrategyMoatSession {
  personaId: string
  personaName: string
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
  startedAt: string
}

export interface SolutionDefinition {
  whatItDoes: string
  differentiation: string
  whatItDoesNot: string
  tenXClaim?: string
  evidence?: string[]
  founderNotes?: string
  generatedAt: string
}

export type RiskCategory = 'market' | 'technical' | 'organisational' | 'financial' | 'execution'
export type RiskLevel = 'High' | 'Medium' | 'Low'
export type RiskSource = 'AI_SYNTHESIS' | 'FOUNDER' | 'VL'

export interface RiskItem {
  id: string
  category: RiskCategory
  description: string
  likelihood: RiskLevel
  impact: RiskLevel
  mitigation: string
  residualRisk: string
  source: RiskSource
}

export interface RiskRegister {
  risks: RiskItem[]
  generatedAt: string
  founderNotes?: string
}

// ── Stage 04: Design & Validate ──────────────────────────────

export type DesignPartnerPipelineStage =
  | 'identified'
  | 'outreach_sent'
  | 'response_received'
  | 'conversation'
  | 'loi'
  | 'signed'

export interface DesignPartnerQualificationScore {
  dimension: string
  weight: number
  score: number
  explanation: string
}

export interface DesignPartnerQualification {
  scores: DesignPartnerQualificationScore[]
  total: number
  verdict: 'Strong Candidate' | 'Conditional' | 'Low Priority' | 'Disqualify'
  recommendation: string
  generatedAt: string
}

export interface DesignPartnerCandidate {
  id: string
  companyName: string
  contactName: string
  contactTitle: string
  linkedInUrl?: string
  whyFit?: string
  pipelineStage: DesignPartnerPipelineStage
  qualification?: DesignPartnerQualification
  linkedInData?: {
    extractedTitle?: string
    extractedCompany?: string
    industry?: string
    companySize?: string
    background?: string
    label?: string
  }
  conversationNotes?: string
  source: 'FOUNDER' | 'VL' | 'AI_RESEARCH'
  addedAt: string
  updatedAt: string
}

export interface DesignPartnerPipeline {
  candidates: DesignPartnerCandidate[]
  generatedAt: string
}

export interface DesignPartnerFeedbackSummary {
  content: {
    commonThemes: string[]
    divergentFeedback: string[]
    strongestUseCases: string[]
    productGaps: string[]
    narrative: string
  }
  partnerTags: { partnerId: string; companyName: string }[]
  generatedAt: string
  version: number
}

export type MoscowPriority = 'Must Have' | 'Should Have' | 'Nice to Have'
export type ComplexityEstimate = 'Low' | 'Medium' | 'High'

export type MvpFeatureScope = 'mvp' | 'roadmap'

export interface MvpFeatureItem {
  id: string
  name: string
  description: string
  requestedByPartnerIds?: string[]
  moscow: MoscowPriority
  complexity: ComplexityEstimate
  scope?: MvpFeatureScope
  source: 'AI_SYNTHESIS' | 'FOUNDER' | 'VL'
  addedAt: string
}

export interface MvpFeatureList {
  features: MvpFeatureItem[]
  generatedAt: string
}

// ── Stage 05: MVP Readiness ───────────────────────────────────

export interface TechnicalArchitecture {
  content: {
    techStack: string
    componentDiagram: string
    mermaidDiagram?: string
    integrationPoints: string
    keyDecisions: string
    risksAndOpenQuestions: string
  }
  generatedAt: string
  source: 'AI_SYNTHESIS' | 'VL'
}

export interface RoadmapPhase {
  phase: string
  milestones: string[]
  featuresInScope: string[]
  successCriteria: string[]
  capitalRequirement?: string
}

export interface ProductRoadmap {
  phases: RoadmapPhase[]
  generatedAt: string
  source: 'AI_SYNTHESIS' | 'VL'
}

export interface FeaturePrd {
  id: string
  featureId: string
  name: string
  userStory: string
  acceptanceCriteria: string[]
  inScope: string[]
  outOfScope: string[]
  dependencies: string[]
  designPartnerOrigin?: string
  generatedAt: string
  source: 'AI_SYNTHESIS' | 'VL'
}

export interface FeaturePrdList {
  prds: FeaturePrd[]
  generatedAt: string
}

export interface SprintPlanSprint {
  sprintNumber: number
  durationWeeks: number
  featuresInScope: string[]
  definitionOfDone: string
  acceptanceCriteria: string[]
}

export interface SprintPlanAssumption {
  label: string
  value: string
  source: 'FOUNDER' | 'VL' | 'AI_SYNTHESIS'
}

export interface SprintPlan {
  sprints: SprintPlanSprint[]
  assumptions: SprintPlanAssumption[]
  generatedAt: string
  source: 'AI_SYNTHESIS' | 'VL'
}

// ── Stage 06: Build & Pilot ──────────────────────────────────

export interface ClientFeedbackSummary {
  content: {
    themes: string[]
    divergence: string[]
    topSignals: string[]
    productGaps: string[]
    narrative: string
  }
  clientTags: { clientId: string; companyName: string }[]
  generatedAt: string
  source: 'CLIENT_INTERVIEW' | 'AI_SYNTHESIS'
}

export interface UpdatedRoadmap {
  phases: RoadmapPhase[]
  generatedAt: string
  source: 'AI_SYNTHESIS' | 'VL'
}

export interface PricingLabAssumption {
  id: string
  label: string
  value: string | number
  source: 'FOUNDER' | 'VL' | 'AI_RESEARCH' | 'CLIENT_INTERVIEW'
  confidence: 'High' | 'Medium' | 'Low'
  citation?: { title: string; url?: string }
  updatedAt: string
}

export interface PricingLabRecommendation {
  tierStructure: string
  pricePoints: string
  discountingPolicy: string
  rationale: string
  generatedAt: string
  source: 'AI_SYNTHESIS'
}

export interface PricingLab {
  assumptions: PricingLabAssumption[]
  recommendation?: PricingLabRecommendation
  versionHistory?: { generatedAt: string; snapshot: PricingLabRecommendation }[]
}

// ── Stage 07: Commercial ─────────────────────────────────────

export interface PricingImplementationTracker {
  pricingLabSnapshot?: PricingLabRecommendation
  rolloutStatus: string
  milestones: string[]
  generatedAt: string
  source: 'VL' | 'AI_SYNTHESIS'
}

export interface SignedSowEntry {
  company: string
  status: string
}

export interface AcquisitionFunnelStage {
  stage: string
  count: number
}

export interface GtmTracker {
  gtmPlan: string
  pricingImplementationPlan: string
  signedSowTracker: SignedSowEntry[]
  acquisitionFunnel?: AcquisitionFunnelStage[]
  generatedAt: string
  source: 'FOUNDER' | 'VL' | 'AI_SYNTHESIS'
}

export interface KpiDefinition {
  id: string
  name: string
  target: number
  unit?: string
  direction?: 'higher' | 'lower' // higher = above target is good, lower = below target is good
}

export interface KpiSnapshot {
  kpiId: string
  date: string // YYYY-MM-DD
  value: number
}

export interface KpiTracker {
  definitions: KpiDefinition[]
  snapshots: KpiSnapshot[]
}

export interface TeamMember {
  id: string
  name: string
  role: string
  email?: string
  allocationPct: number
  addedAt: string
  updatedAt: string
}

export interface Venture {
  id: string
  name: TrackedField<string>
  stage: TrackedField<string>
  founder: TrackedField<string>
  status: TrackedField<string>
  description?: TrackedField<string>
  ideaIntake?: {
    messages: IntakeMessage[]
    dimensionCoverage: { id: string; status: string; summary: string; flags: string[] }[]
    completed: boolean
  }
  scoring?: {
    corporate?: LensScoreResult
    vc?: LensScoreResult
    studio?: LensScoreResult
    compositeSignal?: CompositeSignal
  }
  pressureTests?: {
    personaId: string
    personaName: string
    messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[]
    startedAt: string
  }[]
  savedInsights?: {
    id: string
    personaId: string
    personaName: string
    content: string
    founderResponse?: string
    savedAt: string
  }[]
  discover?: {
    research: DiscoverResearch[]
  }
  icpDocument?: IcpDocument
  competitorAnalysis?: CompetitorAnalysis
  citations?: VentureCitation[]
  businessBrief?: BusinessBriefDocument
  investmentMemo?: InvestmentMemoDocument
  pitchDeck?: PitchDeckDocument
  clientList?: ClientList
  financialModels?: {
    mvpCost?: MvpCostModel
    unitEconomics?: UnitEconomicsModel
    marketSizing?: MarketSizingModel
  }
  interviews?: {
    uploads: InterviewUpload[]
    extractions: Record<string, InterviewExtraction>
    synthesis?: CrossInterviewSynthesis
  }
  strategyMoat?: {
    assessment?: MoatAssessment
    sessions?: StrategyMoatSession[]
    founderNotes?: string
    vlNotes?: string
  }
  solutionDefinition?: SolutionDefinition
  riskRegister?: RiskRegister
  designPartnerPipeline?: DesignPartnerPipeline
  designPartnerFeedbackSummary?: DesignPartnerFeedbackSummary
  mvpFeatureList?: MvpFeatureList
  technicalArchitecture?: TechnicalArchitecture
  productRoadmap?: ProductRoadmap
  ventureSuccessCriteria?: string[]
  revenueModel?: string
  businessKpis?: string[]
  kpiTracker?: KpiTracker
  featurePrdList?: FeaturePrdList
  sprintPlan?: SprintPlan
  clientFeedbackSummary?: ClientFeedbackSummary
  updatedRoadmap?: UpdatedRoadmap
  pricingLab?: PricingLab
  pricingImplementationTracker?: PricingImplementationTracker
  gtmTracker?: GtmTracker
  teamMembers?: TeamMember[]
}
