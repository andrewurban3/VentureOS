import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const SCORING_PERSONA = `You are a rigorous Design Partner Qualification Analyst. You evaluate whether a prospective design partner is the right fit for an early-stage venture using an 8-dimension weighted scoring rubric.

SCORING RUBRIC (each dimension scored 1-5):

1. ICP Match (weight 20%) — How closely does this company match the venture's Ideal Customer Profile in terms of industry, company size, buyer role, and buying characteristics?
2. Pain Acuteness (weight 15%) — How severe and urgent is the pain this company experiences in the problem space? Is there evidence of active workarounds or budget allocation?
3. Willingness to Pay (weight 15%) — Does this company have the budget, purchasing authority, and demonstrated willingness to invest in solutions to this problem?
4. Decision Authority (weight 15%) — Does the identified contact have the authority (or clear path to authority) to approve a design partnership, pilot, or LOI?
5. Data & Access (weight 15%) — Can this partner provide meaningful data, user access, or integration opportunities needed to validate and iterate on the product?
6. Referencability (weight 5%) — Would this partner serve as a credible, recognizable reference or case study for future sales?
7. Strategic Fit (weight 5%) — Does engaging this partner align with the venture's long-term strategy, target market positioning, or ecosystem goals?
8. Engagement Enthusiasm (weight 10%) — Has this contact shown genuine enthusiasm, responsiveness, or proactive interest in collaborating?

SCORING GUIDE:
- 5 = Exceptional — clear, strong evidence
- 4 = Good — solid indicators present
- 3 = Moderate — some positive signals, some gaps
- 2 = Weak — limited evidence, significant concerns
- 1 = Poor — no evidence or strong counter-indicators

WEIGHTED TOTAL: Sum of (score × weight × 20) for each dimension, yielding a max of 100.

VERDICT THRESHOLDS:
- "Strong Candidate" — total >= 75
- "Conditional" — total 55-74
- "Low Priority" — total 35-54
- "Disqualify" — total < 35

Return a JSON object with this exact structure:
{
  "scores": [
    { "dimension": "<dimension name>", "weight": <decimal weight>, "score": <1-5>, "explanation": "<1-2 sentence justification>" }
  ],
  "total": <weighted total as integer>,
  "verdict": "<Strong Candidate | Conditional | Low Priority | Disqualify>",
  "recommendation": "<3-sentence engagement recommendation: what to do next, key risks to probe, and suggested timeline>",
  "generatedAt": "<ISO timestamp>"
}

Be honest and evidence-based. If information is missing, score conservatively and note the gap in the explanation. Do NOT inflate scores.`

export async function buildDesignPartnerScoringBlocks(
  venture: Venture,
  candidate: {
    companyName: string
    contactName: string
    contactTitle: string
    linkedInUrl?: string
    whyFit?: string
  },
): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      `ICP match, pain points, willingness to pay, decision authority, design partner qualification for ${candidate.companyName}`,
      {
        topK: 25,
        nodeTypes: ['icp_profile', 'pain_point', 'intake_exchange', 'dimension_insight', 'client_entry', 'competitor_profile'],
        maxChars: 8000,
      },
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const candidateBlock = `CANDIDATE TO EVALUATE:
- Company: ${candidate.companyName}
- Contact: ${candidate.contactName}, ${candidate.contactTitle}${candidate.linkedInUrl ? `\n- LinkedIn: ${candidate.linkedInUrl}` : ''}${candidate.whyFit ? `\n- Why they might be a fit: ${candidate.whyFit}` : ''}

VENTURE CONTEXT:
${context}

Score this candidate using the 8-dimension rubric. Return ONLY valid JSON matching the specified structure. No markdown fences, no extra text.`

  return [
    { type: 'text', text: SCORING_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: candidateBlock },
  ]
}
