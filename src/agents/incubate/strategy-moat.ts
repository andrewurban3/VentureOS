import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const MOAT_TYPES = [
  'Data Network Effects',
  'Network Effects (Direct)',
  'Switching Costs',
  'Scale Economics',
  'Regulatory / Compliance Moat',
  'Brand / Trust',
  'Counter-Positioning',
  'Proprietary Process / IP',
]

const STRATEGY_PERSONA = `You are a strategy analyst at KPMG. Recommend which moat types are most achievable for a venture given its business model, ICP, solution, and revenue model.

Use web search to find comparable businesses that have successfully built each moat type. Cite sources.

Return a JSON object with:
- recommendedMoats: array of { type: string, rationale: string, examples?: string[] }
  Recommend 2-3 moat types. type must be one of: ${MOAT_TYPES.join(', ')}
- currentClaims: array of { moatType: string, claim: string, supported: boolean }
  Extract any moat claims from the venture record. supported = true if the business model supports it.
- narrative: string (optional 1-2 paragraph strategy narrative)`

export async function buildStrategyMoatBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'Strategy, moat, defensibility, network effects, competitive advantage, business model', {
      topK: 25,
      nodeTypes: ['icp_profile', 'competitor_profile', 'dimension_insight', 'intake_exchange', 'moat_recommendation', 'saved_insight', 'scoring_result'],
      maxChars: 8000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const dynamicBlock = `VENTURE DATA:
${context}

Recommend moats for this venture. Return ONLY valid JSON.`

  return [
    { type: 'text', text: STRATEGY_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}

export async function buildStrategyPressureTestBlocks(
  venture: Venture,
  persona: { id: string; name: string; archetype: string; focus: string }
): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, `Strategy pressure test: ${persona.focus}, defensibility, moat assessment`, {
      topK: 20,
      nodeTypes: ['moat_recommendation', 'dimension_insight', 'competitor_profile', 'intake_exchange', 'saved_insight'],
      maxChars: 6000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  const assessment = venture.strategyMoat?.assessment

  const dynamicBlock = `You are ${persona.name} (${persona.archetype}). You are pressure testing the venture's strategy and moat choices.

VENTURE CONTEXT:
${context}

CURRENT MOAT ASSESSMENT:
${assessment ? JSON.stringify(assessment, null, 2) : 'None yet.'}

Your focus: ${persona.focus}

Ask the hardest questions about defensibility in 18-36 months. Be adversarial but constructive. One question at a time.`

  return [{ type: 'text', text: dynamicBlock }]
}
