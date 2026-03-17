import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const GTM_PERSONA = `You are a go-to-market strategist. From the venture's context (ICP, solution, pricing, design partners, client feedback), produce a GTM plan.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "gtmPlan": "string — 3-5 paragraph GTM plan covering: 10/50/100 trajectory (first 10 customers, next 50, scale to 100), channels (inbound, outbound, partnerships), timelines, ownership, and key milestones. Be specific and actionable.",
  "pricingImplementationPlan": "string — 2-3 paragraph plan for rolling out pricing: contract structure, sales enablement, timing, link to Pricing Lab if available"
}

Guidelines:
- Ground the plan in the venture's ICP, solution definition, and any design partner or client feedback.
- Reference pricing from Pricing Lab or financial models if available.
- The 10/50/100 trajectory should be realistic for the venture's stage and market.`

export async function buildGtmStrategyBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'GTM, ICP, solution, pricing, design partners, client feedback, signed SOWs, commercial stage',
      {
        topK: 30,
        nodeTypes: [
          'icp_profile',
          'solution_definition',
          'design_partner_pipeline',
          'client_feedback_summary',
          'pricing_lab',
          'gtm_tracker',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const existingGtm = venture.gtmTracker
  const existingBlock = existingGtm?.gtmPlan
    ? `\nEXISTING GTM PLAN (refine or replace):\n${existingGtm.gtmPlan}`
    : ''

  return [
    { type: 'text', text: GTM_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${existingBlock}\n\nProduce the GTM plan. Return ONLY valid JSON.`,
    },
  ]
}

export interface GtmStrategyResult {
  gtmPlan: string
  pricingImplementationPlan: string
}
