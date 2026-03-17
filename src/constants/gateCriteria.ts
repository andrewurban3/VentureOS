export interface GateCriterion {
  id: string
  label: string
  check: (venture: import('@/types/venture').Venture) => boolean
}

type Venture = import('@/types/venture').Venture

export const GATE_CRITERIA: Record<string, GateCriterion[]> = {
  '02->03': [
    {
      id: 'business_brief',
      label: 'Business Brief generated',
      check: (v) => !!v.businessBrief,
    },
    {
      id: 'signal_advance',
      label: 'Composite signal is Advance',
      check: (v) => v.scoring?.compositeSignal === 'Advance',
    },
    {
      id: 'icp_validated',
      label: 'ICP defined',
      check: (v) => !!v.icpDocument,
    },
  ],
  '03->04': [
    {
      id: 'investment_memo',
      label: 'Investment Memo or Pitch Deck generated',
      check: (v) => !!(v.investmentMemo || v.pitchDeck),
    },
    {
      id: 'signal_advance',
      label: 'Composite signal is Advance',
      check: (v) => v.scoring?.compositeSignal === 'Advance',
    },
    {
      id: 'risk_register',
      label: 'Risk register populated',
      check: (v) => !!(v.riskRegister?.risks?.length),
    },
  ],
  '04->05': [
    {
      id: 'design_partners_signed',
      label: '3+ design partners signed',
      check: (v) =>
        (v.designPartnerPipeline?.candidates ?? []).filter((c) => c.pipelineStage === 'signed').length >= 3,
    },
    {
      id: 'mvp_features',
      label: 'MVP features defined',
      check: (v) => !!(v.mvpFeatureList?.features?.length),
    },
    {
      id: 'feedback_summary',
      label: 'Design partner feedback summarized',
      check: (v) => !!v.designPartnerFeedbackSummary,
    },
  ],
  '05->06': [
    {
      id: 'architecture',
      label: 'Technical architecture defined',
      check: (v) => !!v.technicalArchitecture,
    },
    {
      id: 'roadmap',
      label: 'Product roadmap defined',
      check: (v) => !!(v.productRoadmap?.phases?.length),
    },
    {
      id: 'sprint_plan',
      label: 'Sprint plan created',
      check: (v) => !!v.sprintPlan,
    },
  ],
  '06->07': [
    {
      id: 'client_feedback',
      label: 'Pilot client feedback captured',
      check: (v) => !!v.clientFeedbackSummary,
    },
    {
      id: 'pricing_lab',
      label: 'Pricing recommendation from Pricing Lab',
      check: (v) => !!v.pricingLab?.recommendation,
    },
    {
      id: 'updated_roadmap',
      label: 'Roadmap updated from pilot learnings',
      check: (v) => !!v.updatedRoadmap,
    },
  ],
}

export function getGateCriteria(fromStage: string, toStage: string): GateCriterion[] {
  const key = `${fromStage}->${toStage}`
  return GATE_CRITERIA[key] ?? []
}

export function checkGateCriteria(venture: Venture, fromStage: string, toStage: string): { met: boolean; criteria: { label: string; met: boolean }[] } {
  const criteria = getGateCriteria(fromStage, toStage)
  const results = criteria.map((c) => ({ label: c.label, met: c.check(venture) }))
  const met = results.every((r) => r.met)
  return { met, criteria: results }
}
