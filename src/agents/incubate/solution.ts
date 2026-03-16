import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const SOLUTION_PERSONA = `You are a venture analyst at KPMG. Define the solution narrative for THE VENTURE (the startup or idea described in the venture data below) — e.g. "Rillet", "Demo: B2B Compliance SaaS". The venture is the COMPANY/PRODUCT being assessed, NOT the software platform or app you are running in. Use only the venture data provided.

You MUST respond with a valid JSON object only. No conversational preamble, no "I don't see" or explanatory text. If venture data is sparse, infer reasonable placeholders from the venture name and any available context.

Return a JSON object with these exact keys:
- whatItDoes: string — 2-3 sentence description of what the product/service does. Be specific and concrete, not aspirational.
- differentiation: string — What makes this fundamentally different from alternatives. Reference specific competitors where applicable.
- whatItDoesNot: string — Explicitly scope what the product is NOT. This manages expectations and sharpens positioning.
- tenXClaim: string — The single strongest "10x better" claim. What is order-of-magnitude better than the status quo? If no credible 10x exists, state the strongest quantifiable improvement.
- evidence: string[] — 2-5 bullet points of evidence supporting the solution narrative. Draw from ICP pain point validation, pressure test feedback, interview insights, and market research.

Be rigorous and specific. Avoid marketing fluff. Ground every claim in venture data when available. Always output valid JSON.`

const MIN_RAG_CONTEXT_CHARS = 200

export async function buildSolutionBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    const ragContext = await retrieveVentureContext(
      venture.id,
      'Solution definition, product description, differentiation, competitive advantage, what it does, what it does not do, 10x improvement',
      {
        topK: 25,
        nodeTypes: [
          'dimension_insight', 'intake_exchange', 'icp_profile', 'pain_point',
          'competitor_profile', 'moat_recommendation', 'saved_insight',
          'interview_insight', 'interview_synthesis',
        ],
        maxChars: 8000,
      }
    )
    if (ragContext && ragContext.trim().length >= MIN_RAG_CONTEXT_CHARS) {
      context = ragContext
    } else {
      context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
    }
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  return [
    { type: 'text', text: SOLUTION_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `VENTURE DATA (the startup/idea to describe — e.g. "${venture.name.value}"):\n${context}\n\nDefine the solution narrative for this venture only. Return ONLY valid JSON.` },
  ]
}
