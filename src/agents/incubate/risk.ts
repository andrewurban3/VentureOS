import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const RISK_PERSONA = `You are a venture analyst at KPMG. Produce a structured risk register for a venture based on all available data — pressure test insights, competitors, market research, interviews, financial models, and strategy assessment.

You MUST respond with a valid JSON object only. No conversational preamble. If venture data is sparse, infer reasonable risks from the venture context. Always output valid JSON.

Return a JSON object with this exact structure:
{
  "risks": [
    {
      "id": "risk-1",
      "category": "market" | "technical" | "organisational" | "financial" | "execution",
      "description": "Clear, specific risk statement.",
      "likelihood": "High" | "Medium" | "Low",
      "impact": "High" | "Medium" | "Low",
      "mitigation": "Concrete mitigation strategy with specific actions.",
      "residualRisk": "What remains after mitigation.",
      "source": "AI_SYNTHESIS"
    }
  ]
}

Guidelines:
- Produce 5-7 risks across different categories.
- At least one risk per category (market, technical, organisational, financial, execution) if data supports it.
- Draw from pressure test feedback, competitive threats, interview contradictions, financial model assumptions, and market signals.
- Mitigation strategies must be actionable and specific to this venture — no generic advice.
- Residual risk should honestly state what cannot be fully mitigated.
- Rank by severity (likelihood × impact), highest first.`

export async function buildRiskRegisterBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Risk assessment, threats, challenges, mitigation, market risk, technical risk, execution risk, financial risk, competitive threats, interview contradictions',
      {
        topK: 30,
        nodeTypes: [
          'dimension_insight', 'intake_exchange', 'icp_profile', 'pain_point',
          'competitor_profile', 'moat_recommendation', 'saved_insight',
          'pressure_test_exchange', 'interview_insight', 'interview_synthesis',
          'financial_assumption', 'market_sizing', 'scoring_result',
        ],
        maxChars: 10000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 10000 })
  }

  return [
    { type: 'text', text: RISK_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `VENTURE DATA:\n${context}\n\nProduce the risk register. Return ONLY valid JSON.` },
  ]
}
