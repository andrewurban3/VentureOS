import type { SystemBlock } from '@/services/ai/types'
import type { Venture, RoadmapPhase } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const BUSINESS_SUGGESTIONS_PERSONA = `You are a venture analyst at a corporate venture studio. Given venture context (financial models, roadmap, ICP, solution, pricing), suggest structured business planning fields to help the Venture Lead create value for the founder.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "ventureSuccessCriteria": ["Criterion 1", "Criterion 2", "..."],
  "revenueModel": "2-4 sentence description of monetization strategy",
  "businessKpis": ["KPI 1 with target", "KPI 2 with target", "..."],
  "capitalByPhase": [{"phase": "Phase name", "capitalRequirement": "Description"}],
  "insight": "One actionable recommendation or insight for the founder (1-2 sentences)"
}

Guidelines:
- ventureSuccessCriteria: 3-5 overall business targets (e.g. "$2M ARR by year 2", "NRR > 120%", "2 new verticals"). Derive from unit economics, market sizing, and roadmap.
- revenueModel: Concise monetization strategy. Reference pricing model, ACV range, gross margin if available from financial models.
- businessKpis: 3-5 KPIs with targets (e.g. "CAC < $500", "LTV > $5K", "Monthly churn < 2%"). Align with unit economics outputs.
- capitalByPhase: One entry per roadmap phase. Include funding/resource notes (e.g. "Series B runway; no additional raise for MVP", "$500K-$1M for pilot scale").
- insight: One specific recommendation—e.g. "Focus on reducing CAC in pilot; current LTV/CAC suggests room for sales efficiency gains."`

function buildRoadmapSection(venture: Venture): string {
  const roadmap = venture.productRoadmap
  if (!roadmap?.phases?.length) return ''
  const lines: string[] = ['PRODUCT ROADMAP PHASES:']
  roadmap.phases.forEach((p) => {
    lines.push(`\n${p.phase}:`)
    lines.push(`  Milestones: ${(p.milestones ?? []).join('; ')}`)
    lines.push(`  Success Criteria: ${(p.successCriteria ?? []).join('; ')}`)
    if (p.capitalRequirement) lines.push(`  Capital: ${p.capitalRequirement}`)
  })
  return lines.join('\n')
}

function buildPricingSection(venture: Venture): string {
  const pl = venture.pricingLab
  if (!pl?.recommendation) return ''
  const lines: string[] = ['PRICING LAB:']
  const r = pl.recommendation as Record<string, unknown>
  if (r.tierStructure) lines.push(`Tier Structure: ${r.tierStructure}`)
  if (r.pricePoints) lines.push(`Price Points: ${r.pricePoints}`)
  if (r.rationale) lines.push(`Rationale: ${r.rationale}`)
  return lines.join('\n')
}

export async function buildBusinessSuggestionsBlocks(venture: Venture): Promise<SystemBlock[]> {
  let baseContext: string
  try {
    baseContext = await retrieveVentureContext(
      venture.id,
      'Business planning: venture success criteria, revenue model, unit economics, market sizing, roadmap phases, capital requirements, business KPIs, financial models',
      { topK: 30, maxChars: 10000 }
    )
  } catch {
    baseContext = buildVentureContext(venture, { sections: 'full', maxChars: 10000 })
  }
  if (!baseContext) {
    baseContext = buildVentureContext(venture, { sections: 'full', maxChars: 10000 })
  }

  const roadmapSection = buildRoadmapSection(venture)
  const pricingSection = buildPricingSection(venture)
  const context = [baseContext, roadmapSection, pricingSection].filter(Boolean).join('\n\n---\n\n')

  return [
    { type: 'text', text: BUSINESS_SUGGESTIONS_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}\n\nSuggest venture success criteria, revenue model, business KPIs, and capital requirements by phase. Add one insight for the founder. Return ONLY valid JSON.`,
    },
  ]
}

export interface BusinessSuggestionsResult {
  ventureSuccessCriteria: string[]
  revenueModel: string
  businessKpis: string[]
  capitalByPhase: { phase: string; capitalRequirement: string }[]
  insight: string
}

export function parseBusinessSuggestionsResponse(
  input: string | Record<string, unknown>
): BusinessSuggestionsResult {
  const raw = (typeof input === 'string' ? JSON.parse(input) : input) as {
    ventureSuccessCriteria?: string[]
    revenueModel?: string
    businessKpis?: string[]
    capitalByPhase?: { phase: string; capitalRequirement: string }[]
    insight?: string
  }
  return {
    ventureSuccessCriteria: Array.isArray(raw.ventureSuccessCriteria) ? raw.ventureSuccessCriteria : [],
    revenueModel: String(raw.revenueModel ?? ''),
    businessKpis: Array.isArray(raw.businessKpis) ? raw.businessKpis : [],
    capitalByPhase: Array.isArray(raw.capitalByPhase) ? raw.capitalByPhase : [],
    insight: String(raw.insight ?? ''),
  }
}

export function applySuggestionsToPhases(
  phases: RoadmapPhase[],
  capitalByPhase: { phase: string; capitalRequirement: string }[]
): RoadmapPhase[] {
  if (!phases.length || !capitalByPhase.length) return phases
  const phaseMap = new Map(capitalByPhase.map((p) => [p.phase.toLowerCase(), p.capitalRequirement]))
  return phases.map((p) => {
    const cap = phaseMap.get(p.phase.toLowerCase())
    return cap ? { ...p, capitalRequirement: cap } : p
  })
}
