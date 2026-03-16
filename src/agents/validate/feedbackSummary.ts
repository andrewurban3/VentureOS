import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const FEEDBACK_PERSONA = `You are a venture analyst synthesizing design partner feedback for a venture studio. Your task is to read all conversation notes from design partner interactions alongside venture context (solution definition, ICP) and produce a structured feedback synthesis.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences. If notes are sparse, synthesize what is available and note limitations in the narrative.

Return a JSON object with this exact structure:
{
  "commonThemes": ["Theme shared across multiple partners..."],
  "divergentFeedback": ["Area where partners disagreed or gave conflicting signals..."],
  "strongestUseCases": ["Use case that received strongest validation..."],
  "productGaps": ["Feature or capability partners expected but is missing..."],
  "narrative": "A 2-3 paragraph executive summary connecting the themes, highlighting the strongest signals, and recommending next steps for the venture team."
}

Guidelines:
- commonThemes: Identify 3-6 recurring patterns across partner conversations. Quote or paraphrase specific partners where possible.
- divergentFeedback: Flag 1-4 areas of disagreement or conflicting signals between partners. This is critical for founders to understand where the market is divided.
- strongestUseCases: List 2-5 use cases that partners were most enthusiastic about or would pay for soonest.
- productGaps: List 2-5 missing features, integrations, or capabilities that partners expected or asked about.
- narrative: Weave together the synthesis into a coherent story. Reference specific partners by company name. End with 2-3 actionable recommendations.
- Cross-reference feedback against the venture's ICP and solution definition to assess alignment.
- Be honest about signal strength — flag where evidence is thin.`

export async function buildFeedbackSummaryBlocks(venture: Venture): Promise<SystemBlock[]> {
  const candidates = venture.designPartnerPipeline?.candidates ?? []
  const notesBlock = candidates
    .filter((c) => c.conversationNotes?.trim())
    .map((c) => `### ${c.companyName} (${c.contactName}, ${c.contactTitle})\n${c.conversationNotes}`)
    .join('\n\n')

  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Design partner feedback, conversation notes, use cases, product gaps, ICP fit, solution validation, common themes',
      {
        topK: 25,
        nodeTypes: [
          'icp_profile', 'solution_definition', 'intake_exchange',
          'dimension_insight', 'design_partner_candidate', 'design_partner_feedback',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  return [
    { type: 'text', text: FEEDBACK_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}\n\nDESIGN PARTNER CONVERSATION NOTES:\n${notesBlock || '(No conversation notes recorded yet.)'}\n\nSynthesize the feedback. Return ONLY valid JSON.`,
    },
  ]
}
