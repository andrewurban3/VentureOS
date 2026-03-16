import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { getDimensionSummaries } from '@/lib/dimensionContext'

const ICP_PERSONA = `You are an ICP (Ideal Customer Profile) analyst at KPMG. Your job is to synthesize information from a venture's idea intake session into a structured ICP document.

You extract and infer ICP attributes from the founder's conversation with Vera. Where the founder provided explicit answers, use them. Where information is missing, make a reasonable hypothesis based on what IS known and mark it clearly as "[Hypothesis]".

Output a JSON object with these exact keys:

- industry: Primary target industry/vertical. Be specific — "Financial Services" is too broad; prefer "Mid-market commercial banks" or "Series A-C fintech startups".

- industrySegments: Array of 2-4 specific sub-segments to prioritize. Each object has:
  - segment: A specific niche within the industry (e.g. "Regional banks with $1B-$10B in assets", "Insurance companies undergoing digital transformation")
  - rationale: Why this segment is a good fit for the venture

- companySize: Employee count or revenue range of target companies

- buyerRole: Primary buyer title/role

- decisionMakingUnit: Who is involved in the purchase decision

- painPoints: Array of 3-5 pain points. Each object has:
  - pain: Description of the pain point
  - severity: "High" | "Medium" | "Low" — how acute this pain is for the ICP
  - evidence: What from the intake conversation supports this (founder quote, market data, or "[Hypothesis]" if inferred)

- buyingCharacteristics: Array of 3-5 observable signals that help identify a company as a potential customer. These are NOT triggers/events — they are identifiable traits or situations. Each object has:
  - characteristic: An observable signal (e.g. "Currently using spreadsheets or manual processes for X", "Recently failed a compliance audit", "Headcount growing >20% YoY", "No dedicated team for X function")
  - importance: "High" | "Medium" | "Low"

- currentAlternatives: What the ICP does today instead of using this solution

- willingnessToPay: Any pricing signals or willingness indicators

Be specific and grounded in the venture data. Do not invent details — if something is unknown, say "[Hypothesis] likely X based on Y".`

export function buildIcpSystemBlocks(venture: Venture): SystemBlock[] {
  const dimensionContext = getDimensionSummaries(venture, ['02', '03', '05'])
  const ventureName = venture.name.value

  const dynamicBlock = `VENTURE: ${ventureName}

RELEVANT DIMENSION SUMMARIES FROM IDEA INTAKE:
${dimensionContext || 'No dimension data available yet.'}

Generate the ICP document based on this context. Return ONLY the JSON object.`

  return [
    { type: 'text', text: ICP_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}

export function buildIcpRefinementBlocks(venture: Venture, founderFeedback: string): SystemBlock[] {
  const dimensionContext = getDimensionSummaries(venture, ['02', '03', '05'])
  const existing = venture.icpDocument

  const dynamicBlock = `VENTURE: ${venture.name.value}

CURRENT ICP DOCUMENT:
${existing ? JSON.stringify(existing, null, 2) : 'None generated yet.'}

DIMENSION SUMMARIES:
${dimensionContext || 'No dimension data available yet.'}

FOUNDER FEEDBACK: ${founderFeedback}

Refine the ICP document based on the founder's feedback. Return the full updated JSON object.`

  return [
    { type: 'text', text: ICP_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
