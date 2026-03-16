import type { SystemBlock } from '@/services/ai/types'
import type { Venture, PricingLabRecommendation } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const PRICING_LAB_PERSONA = `You are a pricing strategist at KPMG. From the venture's pricing lab assumptions (which may come from Founder, VL, AI Research, or Client Interview) and venture context, produce a pricing recommendation.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "tierStructure": "string — recommended tier names and what each includes (e.g. Starter / Pro / Enterprise)",
  "pricePoints": "string — recommended price points per tier and rationale",
  "discountingPolicy": "string — when to offer discounts, approval, and guardrails",
  "rationale": "string — 2-4 paragraph rationale tying assumptions to the recommendation; reference client feedback and benchmarks where relevant"
}

Guidelines:
- Ground the recommendation in the assumptions provided. Do not ignore low-confidence or conflicting assumptions; acknowledge them in the rationale.
- If AI_RESEARCH or CLIENT_INTERVIEW assumptions cite benchmarks or willingness-to-pay, reference them in the rationale.
- tierStructure and pricePoints should be specific enough to act on (e.g. "Starter: $X/mo; Pro: $Y/mo").`

export async function buildPricingLabRecommendationBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Pricing, tiers, willingness to pay, client feedback, benchmarks, financial assumptions',
      {
        topK: 25,
        nodeTypes: [
          'pricing_lab',
          'pricing_lab_assumption',
          'financial_assumption',
          'client_feedback_summary',
          'icp_profile',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const assumptions = venture.pricingLab?.assumptions ?? []
  const assumptionsBlock =
    assumptions.length > 0
      ? `\nPRICING LAB ASSUMPTIONS:\n${assumptions.map((a) => `- ${a.label}: ${a.value} (source: ${a.source}, confidence: ${a.confidence})${a.citation ? ` [${a.citation.title}]` : ''}`).join('\n')}`
      : '\nNo pricing assumptions yet; infer from venture context and recommend a starting point.'

  return [
    { type: 'text', text: PRICING_LAB_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${assumptionsBlock}\n\nProduce the pricing recommendation. Return ONLY valid JSON.`,
    },
  ]
}

export function parsePricingLabRecommendationResponse(text: string): PricingLabRecommendation {
  const raw = JSON.parse(text) as Record<string, unknown>
  const now = new Date().toISOString()
  return {
    tierStructure: String(raw.tierStructure ?? ''),
    pricePoints: String(raw.pricePoints ?? ''),
    discountingPolicy: String(raw.discountingPolicy ?? ''),
    rationale: String(raw.rationale ?? ''),
    generatedAt: now,
    source: 'AI_SYNTHESIS',
  }
}
