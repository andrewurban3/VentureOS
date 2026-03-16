import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const UNIT_ECON_PERSONA = `You are a unit economics analyst at KPMG. Model the fundamental unit economics of the business.

Use web search for benchmarks: ACV by SaaS category, churn rates (e.g. SaaS Capital Annual Report), CAC benchmarks, payback period targets. Cite sources.

Return a JSON object with:
- inputs: Record of input name to { value: number, assumptionId?: string }
  Keys: acv, grossMarginPct, salesCycleMonths, cac, customerSuccessCost, annualChurnRate, expansionRevenueRate, paybackTargetMonths
- outputs: { ltv: number, ltvCac: number, paybackMonths: number, ruleOf40?: number }
  LTV = (ACV * grossMargin) / churn. LTV:CAC = LTV / CAC.
- assumptions: array of { id: string, label: string, value: string | number, source: "FOUNDER"|"AI_RESEARCH"|"AI_SYNTHESIS", citation?: { title, url }, confidence: "High"|"Medium"|"Low", updatedAt: string }`

export async function buildUnitEconomicsSystemBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'Unit economics, ACV, churn, CAC, revenue model, pricing', {
      topK: 25,
      nodeTypes: ['icp_profile', 'intake_exchange', 'dimension_insight', 'financial_assumption', 'market_sizing', 'scoring_result'],
      maxChars: 6000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  const dynamicBlock = `VENTURE DATA:
${context}

Generate the Unit Economics Model. Return ONLY valid JSON.`

  return [
    { type: 'text', text: UNIT_ECON_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
