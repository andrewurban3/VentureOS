import type { Venture } from '@/types/venture'

const TAM_THRESHOLD = 1_000_000_000
const CAGR_THRESHOLD = 20

export interface GateKeyResult {
  id: string
  label: string
  score: (v: Venture) => number
}

export interface GateObjective {
  id: string
  label: string
  keyResults: GateKeyResult[]
}

export type GateKey = '02->03' | '03->04' | '04->05' | '05->06' | '06->07'

export const GATE_OKRS: Record<GateKey, GateObjective[]> = {
  '02->03': [
    {
      id: 'problem_validation',
      label: 'Validated a real, painful problem',
      keyResults: [
        { id: 'icp_defined', label: 'ICP defined', score: (v) => (v.icpDocument ? 100 : 0) },
        {
          id: 'pressure_tests',
          label: '5+ pressure test sessions completed',
          score: (v) => Math.min(((v.pressureTests?.length ?? 0) / 5) * 100, 100),
        },
        {
          id: 'signal_advance',
          label: 'Composite signal is Advance',
          score: (v) => (v.scoring?.compositeSignal === 'Advance' ? 100 : 0),
        },
      ],
    },
    {
      id: 'market_opportunity',
      label: 'Identified a large addressable market',
      keyResults: [
        {
          id: 'tam_1b',
          label: 'TAM > $1B',
          score: (v) => {
            const tam = v.financialModels?.marketSizing?.tam ?? 0
            return Math.min((tam / TAM_THRESHOLD) * 100, 100)
          },
        },
        {
          id: 'cagr_20',
          label: 'CAGR > 20%',
          score: (v) => {
            const cagr = v.financialModels?.marketSizing?.cagr
            if (cagr == null) return 0
            return cagr >= CAGR_THRESHOLD ? 100 : Math.min((cagr / CAGR_THRESHOLD) * 100, 100)
          },
        },
        {
          id: 'competitor_landscape',
          label: 'Competitor landscape mapped',
          score: (v) => (v.competitorAnalysis?.landscapeSummary ? 100 : 0),
        },
        {
          id: 'competitors_3',
          label: '3+ competitors analyzed',
          score: (v) =>
            Math.min(((v.competitorAnalysis?.competitors?.length ?? 0) / 3) * 100, 100),
        },
      ],
    },
    {
      id: 'business_viability',
      label: 'Articulated a compelling business case',
      keyResults: [
        { id: 'business_brief', label: 'Business Brief generated', score: (v) => (v.businessBrief ? 100 : 0) },
        {
          id: 'scoring_complete',
          label: 'Scoring complete (all 3 lenses)',
          score: (v) =>
            v.scoring?.corporate && v.scoring?.vc && v.scoring?.studio ? 100 : 0,
        },
        {
          id: 'citations',
          label: 'Citations supporting claims',
          score: (v) => ((v.citations?.length ?? 0) > 0 ? 100 : 0),
        },
      ],
    },
  ],
  '03->04': [
    {
      id: 'customer_evidence',
      label: 'Validated problem with real customers',
      keyResults: [
        {
          id: 'interviews_5',
          label: '5+ customer interviews conducted',
          score: (v) =>
            Math.min(((v.interviews?.uploads?.length ?? 0) / 5) * 100, 100),
        },
        {
          id: 'synthesis',
          label: 'Cross-interview synthesis completed',
          score: (v) => (v.interviews?.synthesis ? 100 : 0),
        },
        {
          id: 'client_list_10',
          label: 'Client list has 10+ prospects',
          score: (v) =>
            Math.min(((v.clientList?.entries?.length ?? 0) / 10) * 100, 100),
        },
      ],
    },
    {
      id: 'financial_feasibility',
      label: 'Demonstrated viable unit economics',
      keyResults: [
        {
          id: 'mvp_cost',
          label: 'Financial model (MVP cost) created',
          score: (v) => (v.financialModels?.mvpCost ? 100 : 0),
        },
        {
          id: 'unit_economics',
          label: 'Unit economics modeled',
          score: (v) => (v.financialModels?.unitEconomics ? 100 : 0),
        },
        {
          id: 'market_sizing',
          label: 'Market sizing completed',
          score: (v) => (v.financialModels?.marketSizing ? 100 : 0),
        },
      ],
    },
    {
      id: 'strategic_clarity',
      label: 'Clear differentiation and moat',
      keyResults: [
        {
          id: 'solution_definition',
          label: 'Solution definition articulated',
          score: (v) => (v.solutionDefinition ? 100 : 0),
        },
        {
          id: 'strategy_moat',
          label: 'Strategy & moat assessed',
          score: (v) => (v.strategyMoat?.assessment ? 100 : 0),
        },
        {
          id: 'risk_register_5',
          label: 'Risk register populated (5+ risks)',
          score: (v) =>
            Math.min(((v.riskRegister?.risks?.length ?? 0) / 5) * 100, 100),
        },
      ],
    },
    {
      id: 'investment_readiness',
      label: 'Ready for increased investment',
      keyResults: [
        {
          id: 'investment_doc',
          label: 'Investment Memo or Pitch Deck generated',
          score: (v) => (v.investmentMemo || v.pitchDeck ? 100 : 0),
        },
        {
          id: 'signal_advance',
          label: 'Composite signal is Advance',
          score: (v) => (v.scoring?.compositeSignal === 'Advance' ? 100 : 0),
        },
      ],
    },
  ],
  '04->05': [
    {
      id: 'design_partner_traction',
      label: 'Co-creation partners committed',
      keyResults: [
        {
          id: 'signed_3',
          label: '3+ design partners signed',
          score: (v) => {
            const signed = (v.designPartnerPipeline?.candidates ?? []).filter(
              (c) => c.pipelineStage === 'signed'
            ).length
            return Math.min((signed / 3) * 100, 100)
          },
        },
        {
          id: 'pipeline_5',
          label: '5+ in pipeline',
          score: (v) =>
            Math.min(((v.designPartnerPipeline?.candidates?.length ?? 0) / 5) * 100, 100),
        },
        {
          id: 'qual_score_60',
          label: 'Average qualification score > 60',
          score: (v) => {
            const candidates = v.designPartnerPipeline?.candidates ?? []
            const withScore = candidates.filter((c) => c.qualification?.total != null)
            if (withScore.length === 0) return 0
            const avg =
              withScore.reduce((s, c) => s + (c.qualification!.total ?? 0), 0) /
              withScore.length
            return avg >= 60 ? 100 : Math.min((avg / 60) * 100, 100)
          },
        },
      ],
    },
    {
      id: 'product_validation',
      label: 'Product direction validated by partners',
      keyResults: [
        {
          id: 'feedback_summary',
          label: 'Feedback summary generated',
          score: (v) => (v.designPartnerFeedbackSummary ? 100 : 0),
        },
        {
          id: 'mvp_features_5',
          label: 'MVP features defined (5+ features)',
          score: (v) =>
            Math.min(((v.mvpFeatureList?.features?.length ?? 0) / 5) * 100, 100),
        },
        {
          id: 'product_gaps',
          label: 'Product gaps identified',
          score: (v) =>
            (v.designPartnerFeedbackSummary?.content?.productGaps?.length ?? 0) > 0
              ? 100
              : 0,
        },
      ],
    },
  ],
  '05->06': [
    {
      id: 'technical_readiness',
      label: 'Architecture and plan in place',
      keyResults: [
        {
          id: 'architecture',
          label: 'Technical architecture defined',
          score: (v) => (v.technicalArchitecture ? 100 : 0),
        },
        {
          id: 'sprint_plan',
          label: 'Sprint plan created (3+ sprints)',
          score: (v) =>
            Math.min(((v.sprintPlan?.sprints?.length ?? 0) / 3) * 100, 100),
        },
        {
          id: 'feature_prds',
          label: 'Feature PRDs written',
          score: (v) => (v.featurePrdList?.prds?.length ? 100 : 0),
        },
      ],
    },
    {
      id: 'business_planning',
      label: 'Go-to-market plan ready',
      keyResults: [
        {
          id: 'roadmap_phases',
          label: 'Product roadmap with 2+ phases',
          score: (v) =>
            Math.min(((v.productRoadmap?.phases?.length ?? 0) / 2) * 100, 100),
        },
        {
          id: 'business_kpis',
          label: 'Business KPIs defined',
          score: (v) => ((v.businessKpis?.length ?? 0) > 0 ? 100 : 0),
        },
        {
          id: 'revenue_model',
          label: 'Revenue model documented',
          score: (v) => (v.revenueModel ? 100 : 0),
        },
      ],
    },
    {
      id: 'team_readiness',
      label: 'Team assembled',
      keyResults: [
        {
          id: 'team_members_2',
          label: '2+ team members assigned',
          score: (v) =>
            Math.min(((v.teamMembers?.length ?? 0) / 2) * 100, 100),
        },
      ],
    },
  ],
  '06->07': [
    {
      id: 'pilot_validation',
      label: 'Pilot demonstrates value',
      keyResults: [
        {
          id: 'client_feedback',
          label: 'Client feedback captured',
          score: (v) => (v.clientFeedbackSummary ? 100 : 0),
        },
        {
          id: 'updated_roadmap',
          label: 'Updated roadmap from learnings',
          score: (v) => (v.updatedRoadmap ? 100 : 0),
        },
        {
          id: 'positive_signals',
          label: 'Positive signal themes',
          score: (v) =>
            (v.clientFeedbackSummary?.content?.strongestUseCases?.length ??
              v.clientFeedbackSummary?.content?.themes?.length ??
              0) > 0
              ? 100
              : 0,
        },
      ],
    },
    {
      id: 'commercial_readiness',
      label: 'Pricing and GTM validated',
      keyResults: [
        {
          id: 'pricing_recommendation',
          label: 'Pricing recommendation from Pricing Lab',
          score: (v) => (v.pricingLab?.recommendation ? 100 : 0),
        },
        {
          id: 'pricing_implementation',
          label: 'Pricing implementation plan started',
          score: (v) =>
            v.pricingImplementationTracker?.rolloutStatus ||
            (v.pricingImplementationTracker?.milestones?.length ?? 0) > 0
              ? 100
              : 0,
        },
      ],
    },
  ],
}

export interface OkrEvaluationResult {
  categoryId: string
  categoryLabel: string
  categoryScore: number
  keyResults: { id: string; label: string; score: number }[]
}

export function evaluateGateOkrs(
  venture: Venture,
  fromStage: string,
  toStage: string
): {
  categories: OkrEvaluationResult[]
  overall: number
  allScores: { categoryId: string; krId: string; label: string; score: number }[]
} {
  const key = `${fromStage}->${toStage}` as GateKey
  const objectives = GATE_OKRS[key]
  if (!objectives) {
    return { categories: [], overall: 0, allScores: [] }
  }

  const allScores: { categoryId: string; krId: string; label: string; score: number }[] = []
  const categories: OkrEvaluationResult[] = objectives.map((obj) => {
    const krResults = obj.keyResults.map((kr) => {
      const s = Math.round(kr.score(venture))
      allScores.push({ categoryId: obj.id, krId: kr.id, label: kr.label, score: s })
      return { id: kr.id, label: kr.label, score: s }
    })
    const categoryScore =
      krResults.length > 0
        ? Math.round(
            krResults.reduce((sum, r) => sum + r.score, 0) / krResults.length
          )
        : 0
    return {
      categoryId: obj.id,
      categoryLabel: obj.label,
      categoryScore,
      keyResults: krResults,
    }
  })

  const totalKrScore = allScores.reduce((sum, r) => sum + r.score, 0)
  const overall =
    allScores.length > 0
      ? Math.round(totalKrScore / allScores.length)
      : 0

  return { categories, overall, allScores }
}

export function getGateOkrs(fromStage: string, toStage: string): GateObjective[] {
  const key = `${fromStage}->${toStage}` as GateKey
  return GATE_OKRS[key] ?? []
}
