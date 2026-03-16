import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const MVP_COST_PERSONA = `You are a venture cost analyst at KPMG. Estimate the cost of building and launching an MVP.

Use web search for salary and rate benchmarks (developer rates, design rates, cloud costs) in the relevant geography. Cite sources.

Return a JSON object with:
- mvpFeatures: array of { feature: string, description?: string } — the MVP capabilities being priced out, inferred from the venture's solution, ICP, and minimum viable scope. 5–15 items. Be specific (e.g., "Core dashboard with key metrics", "User auth (email/password)", "API integrations for X"). Derive from Idea Intake Dimension 04 "The Solution" and ICP.
- scenarios: { conservative: number, base: number, aggressive: number } — total cost in USD for each scenario
- lineItems: array of { category: string, conservative: number, base: number, aggressive: number } — cost categories in USD
  Categories: Product & Engineering, Design, Data, Infrastructure, GTM for MVP Phase, Operations, Contingency
- assumptions: array of { id: string, label: string, value: string | number, source: "AI_RESEARCH"|"AI_SYNTHESIS", citation?: { title, url }, confidence: "High"|"Medium"|"Low", updatedAt: string }
  Include key assumptions (blended rate, person-months, etc.) with sources.`

export async function buildMvpCostSystemBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'MVP cost estimate, solution scope, team, technical complexity, rate benchmarks', {
      topK: 25,
      nodeTypes: ['icp_profile', 'pain_point', 'intake_exchange', 'dimension_insight', 'mvp_feature', 'financial_assumption', 'scoring_result'],
      maxChars: 6000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  const dynamicBlock = `VENTURE DATA:
${context}

Generate the MVP Cost Model. Return ONLY valid JSON.`

  return [
    { type: 'text', text: MVP_COST_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
