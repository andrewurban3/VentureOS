import type { SystemBlock } from '@/services/ai/types'
import type { Venture, ClientFeedbackSummary } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const CLIENT_FEEDBACK_PERSONA = `You are a venture analyst synthesising pilot client feedback for a venture. From notes or interview-style content per client, produce a structured summary.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "content": {
    "themes": ["Theme 1", "..."],
    "divergence": ["Area where clients disagreed or gave conflicting signals"],
    "topSignals": ["Strongest validation signals"],
    "productGaps": ["Missing features or capabilities clients expected"],
    "narrative": "A 2-3 paragraph executive summary connecting themes, top signals, and product gaps; reference specific clients where relevant."
  },
  "clientCompanyNames": ["Company A", "Company B"]
}

Guidelines:
- themes: 3-6 recurring patterns across client feedback.
- divergence: 1-4 areas of disagreement or conflicting signals.
- topSignals: 2-5 strongest positive signals or willingness-to-pay indicators.
- productGaps: 2-5 missing features or integrations clients asked about.
- narrative: Reference client companies by name. End with 1-2 actionable recommendations.
- clientCompanyNames: List of client companies that contributed to this feedback (from the notes provided).`

export async function buildClientFeedbackBlocks(
  venture: Venture,
  pilotNotesText: string,
  companyNamesFromUser: string[] = []
): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Client feedback, pilot, themes, product gaps, pricing, design partner feedback, solution, MVP features',
      {
        topK: 25,
        nodeTypes: [
          'client_feedback_summary',
          'design_partner_feedback',
          'solution_definition',
          'mvp_feature_s04',
          'product_roadmap',
          'icp_profile',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const companiesHint =
    companyNamesFromUser.length > 0
      ? `\nClient companies to tag: ${companyNamesFromUser.join(', ')}`
      : ''

  return [
    { type: 'text', text: CLIENT_FEEDBACK_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}\n\nPILOT FEEDBACK NOTES:\n${pilotNotesText || '(No notes provided.)'}${companiesHint}\n\nSynthesise the feedback. Return ONLY valid JSON.`,
    },
  ]
}

export function parseClientFeedbackResponse(
  text: string,
  generatedAt: string,
  source: ClientFeedbackSummary['source'] = 'AI_SYNTHESIS'
): ClientFeedbackSummary {
  const raw = JSON.parse(text) as {
    content?: { themes?: string[]; divergence?: string[]; topSignals?: string[]; productGaps?: string[]; narrative?: string }
    clientCompanyNames?: string[]
  }
  const content = raw.content ?? {}
  const companyNames = Array.isArray(raw.clientCompanyNames) ? raw.clientCompanyNames : []
  const clientTags = companyNames.map((companyName) => ({
    clientId: crypto.randomUUID(),
    companyName,
  }))
  return {
    content: {
      themes: Array.isArray(content.themes) ? content.themes : [],
      divergence: Array.isArray(content.divergence) ? content.divergence : [],
      topSignals: Array.isArray(content.topSignals) ? content.topSignals : [],
      productGaps: Array.isArray(content.productGaps) ? content.productGaps : [],
      narrative: String(content.narrative ?? ''),
    },
    clientTags,
    generatedAt,
    source,
  }
}
