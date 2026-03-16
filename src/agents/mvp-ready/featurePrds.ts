import type { SystemBlock } from '@/services/ai/types'
import type { Venture, FeaturePrd } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const FEATURE_PRD_PERSONA = `You are a product manager at KPMG. For each MVP feature in the venture's feature list, produce a short Feature PRD. Use design partner feedback summary where available to ground user stories and acceptance criteria.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "prds": [
    {
      "featureId": "string — same id as the MVP feature this PRD describes",
      "name": "string — feature name (match MVP feature list)",
      "userStory": "string — As a [role], I want [goal] so that [benefit].",
      "acceptanceCriteria": ["string — criterion 1", "..."],
      "inScope": ["string — in scope for this feature"],
      "outOfScope": ["string — explicitly out of scope"],
      "dependencies": ["string — other features or systems this depends on"],
      "designPartnerOrigin": "string (optional) — company or partner name if derived from design partner feedback"
    }
  ]
}

Guidelines:
- One PRD per MVP feature. Preserve the same order as the MVP feature list.
- Acceptance criteria should be testable and specific.
- designPartnerOrigin: set when the feature or user story was strongly requested by a named design partner.
- Keep each PRD concise; avoid duplication with the MVP feature description.`

export async function buildFeaturePrdsBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Feature PRD, MVP features, user story, acceptance criteria, design partner feedback, product gaps',
      {
        topK: 30,
        nodeTypes: [
          'mvp_feature_s04',
          'design_partner_feedback',
          'design_partner_candidate',
          'feature_prd',
          'solution_definition',
        ],
        maxChars: 10000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 10000 })
  }

  const features = venture.mvpFeatureList?.features ?? []
  const feedback = venture.designPartnerFeedbackSummary
  const featuresBlock =
    features.length > 0
      ? `\nMVP FEATURES (id, name, description):\n${features.map((f) => `- id: ${f.id}, name: ${f.name}, description: ${f.description}`).join('\n')}`
      : '\nNo MVP feature list yet.'
  const feedbackBlock = feedback
    ? `\nDESIGN PARTNER FEEDBACK: Themes: ${feedback.content.commonThemes.join('; ')}. Product Gaps: ${feedback.content.productGaps.join('; ')}. Strongest use cases: ${feedback.content.strongestUseCases.join('; ')}.`
    : ''

  return [
    { type: 'text', text: FEATURE_PRD_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${featuresBlock}${feedbackBlock}\n\nProduce one Feature PRD per MVP feature. Return ONLY valid JSON with a "prds" array.`,
    },
  ]
}

export function parseFeaturePrdsResponse(text: string, generatedAt: string): FeaturePrd[] {
  const raw = JSON.parse(text) as { prds?: unknown[] }
  const prds = Array.isArray(raw.prds) ? raw.prds : []
  return prds.map((p: Record<string, unknown>) => ({
    id: crypto.randomUUID(),
    featureId: String(p.featureId ?? ''),
    name: String(p.name ?? ''),
    userStory: String(p.userStory ?? ''),
    acceptanceCriteria: Array.isArray(p.acceptanceCriteria) ? (p.acceptanceCriteria as string[]) : [],
    inScope: Array.isArray(p.inScope) ? (p.inScope as string[]) : [],
    outOfScope: Array.isArray(p.outOfScope) ? (p.outOfScope as string[]) : [],
    dependencies: Array.isArray(p.dependencies) ? (p.dependencies as string[]) : [],
    designPartnerOrigin: p.designPartnerOrigin != null ? String(p.designPartnerOrigin) : undefined,
    generatedAt,
    source: 'AI_SYNTHESIS' as const,
  }))
}
