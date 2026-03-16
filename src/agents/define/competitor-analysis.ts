import type { SystemBlock } from '@/services/ai/types'
import type { Venture, CompetitorProfile } from '@/types/venture'
import { getDimensionSummaries } from '@/lib/dimensionContext'

const COMPETITOR_PERSONA = `You are a competitive intelligence analyst at KPMG. You research, profile, and evaluate competitors for early-stage ventures using real web data.

You identify four categories of competitors:
- Direct: companies solving the exact same problem for the same ICP
- Adjacent: solutions the ICP might use instead (including spreadsheets, consultants, manual processes)
- Emerging: early-stage companies or platform features that could compete
- Do Nothing: what the ICP does today if they buy nothing

For each competitor, return ALL of these fields:
- name: Company or alternative name
- websiteUrl: Main company website URL (use web search to find it)
- category: Direct | Adjacent | Emerging | Do Nothing
- description: 2-3 sentences on what they do
- valueProposition: One clear sentence describing their core value proposition
- keyFeatures: Array of 3-5 key product features or capabilities (strings)
- recentNews: Most notable recent event — e.g. "Raised $15M Series A (Jan 2025)", "Acquired by X", "Launched Y feature". If nothing recent, say "No major recent news"
- targetIcp: Who they serve and how close to our ICP
- pricingModel: How they charge (subscription, usage, services, free)
- fundingScale: Known funding, revenue estimates, or headcount
- keyStrengths: What they do well
- keyWeaknesses: Where they fall short or leave gaps
- threatLevel: High | Medium | Low
- threatRationale: Why this threat level
- ourDifferentiation: Specific differentiation claim for this comparison
- featureComparison: Array of objects { "feature": "Feature name", "us": "Our approach", "them": "Their approach" } — 3-5 key features where you compare us vs them
- competitorSummary: 2-3 sentence summary of how this company competes with the venture and why it matters
- citations: Array of { "url": "...", "title": "...", "excerpt": "..." } — web sources used for THIS competitor's data

Also produce a landscapeSummary: 2-3 paragraph synthesis covering white space, strongest differentiation claims, and any gaps.

Return JSON: { "competitors": [...], "landscapeSummary": "..." }

CRITICAL INSTRUCTIONS:
- Use web search to find real, current competitor data. Cite specific companies. Do not invent fictional competitors.
- Prioritize recent news: funding rounds, product launches, acquisitions, partnerships.
- Every claim should be traceable to a source. Include citations per competitor.
- Do not include any preamble, explanation, or text before the JSON. Your entire response must be the JSON object only.`

export function buildCompetitorSystemBlocks(venture: Venture): SystemBlock[] {
  const dimensionContext = getDimensionSummaries(venture)
  const ventureName = venture.name.value
  const icpSummary = venture.icpDocument
    ? `Industry: ${venture.icpDocument.industry}, Buyer: ${venture.icpDocument.buyerRole}, Company Size: ${venture.icpDocument.companySize}`
    : null

  const dynamicBlock = `VENTURE: ${ventureName}

IDEA INTAKE DIMENSION SUMMARIES:
${dimensionContext || 'No dimension data available yet.'}
${icpSummary ? `\nICP SUMMARY: ${icpSummary}` : ''}

Identify and profile competitors for this venture. Use web search for current data. Return the JSON object.`

  return [
    { type: 'text', text: COMPETITOR_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}

export function buildCompetitorRefreshBlocks(
  venture: Venture,
  acceptedCompetitors: CompetitorProfile[],
  rejectedCompetitors: CompetitorProfile[],
  founderFeedback?: string
): SystemBlock[] {
  const dimensionContext = getDimensionSummaries(venture)

  const rejectedSection = rejectedCompetitors.length
    ? `\nREJECTED COMPETITORS (do not re-include these):\n${rejectedCompetitors.map((c) => `- "${c.name}" -- reason: "${c.rejectionReason || 'No reason given'}"`).join('\n')}`
    : ''

  const dynamicBlock = `VENTURE: ${venture.name.value}

DIMENSION SUMMARIES:
${dimensionContext || 'No dimension data available yet.'}

ACCEPTED COMPETITORS (preserve these, update their data if needed):
${JSON.stringify(acceptedCompetitors.map((c) => ({ name: c.name, category: c.category })), null, 2)}
${rejectedSection}
${founderFeedback ? `\nUSER FEEDBACK: ${founderFeedback}` : ''}

Update and expand the competitor analysis. Keep accepted competitors and refresh their data. Do NOT re-include rejected competitors. Add any newly discovered competitors. Return the full updated JSON object with all competitors and an updated landscapeSummary.`

  return [
    { type: 'text', text: COMPETITOR_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
