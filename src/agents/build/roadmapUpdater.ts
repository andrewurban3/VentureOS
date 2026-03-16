import type { SystemBlock } from '@/services/ai/types'
import type { Venture, RoadmapPhase } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const ROADMAP_UPDATER_PERSONA = `You are a product lead at KPMG. From the venture's current product roadmap and client feedback summary (pilot learnings), produce an UPDATED roadmap that reflects what was learned in the pilot.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "phases": [
    {
      "phase": "string — e.g. MVP / V1 Commercial / V2 Scale",
      "milestones": ["string"],
      "featuresInScope": ["string"],
      "successCriteria": ["string"],
      "capitalRequirement": "string (optional)"
    }
  ]
}

Guidelines:
- Start from the current product roadmap. Adjust phases, milestones, and features based on client feedback: prioritise what pilots validated, deprioritise or drop what did not resonate, add new items that emerged from pilot feedback.
- Keep the same phase names (MVP, V1 Commercial, V2 Scale) unless there is a strong reason to rename.
- successCriteria should reflect pilot learnings where relevant.
- Be specific; reference which feedback drove which changes in the narrative if needed (the phases themselves don't need narrative, but the changes should be grounded in the client feedback summary).`

export async function buildRoadmapUpdaterBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Product roadmap, client feedback, pilot learnings, themes, product gaps, updated roadmap',
      {
        topK: 25,
        nodeTypes: [
          'product_roadmap',
          'client_feedback_summary',
          'updated_roadmap',
          'mvp_feature_s04',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const currentRoadmap = venture.productRoadmap
  const clientFb = venture.clientFeedbackSummary
  const roadmapBlock = currentRoadmap
    ? `\nCURRENT ROADMAP (${currentRoadmap.phases.length} phases):\n${currentRoadmap.phases.map((p) => `${p.phase}: ${p.milestones.join('; ')}; Features: ${p.featuresInScope.join(', ')}`).join('\n')}`
    : '\nNo current product roadmap; create one from context and client feedback.'
  const feedbackBlock = clientFb
    ? `\nCLIENT FEEDBACK SUMMARY:\nThemes: ${clientFb.content.themes.join('; ')}.\nProduct Gaps: ${clientFb.content.productGaps.join('; ')}.\nTop Signals: ${clientFb.content.topSignals.join('; ')}.\nDivergence: ${clientFb.content.divergence.join('; ')}.\nNarrative: ${clientFb.content.narrative.slice(0, 500)}...`
    : '\nNo client feedback summary yet; update roadmap from current product roadmap and venture context only.'

  return [
    { type: 'text', text: ROADMAP_UPDATER_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${roadmapBlock}${feedbackBlock}\n\nProduce the updated roadmap. Return ONLY valid JSON with a "phases" array.`,
    },
  ]
}

export function parseRoadmapUpdaterResponse(text: string): RoadmapPhase[] {
  const raw = JSON.parse(text) as { phases?: unknown[] }
  const phases = Array.isArray(raw.phases) ? raw.phases : []
  return phases.map((p: Record<string, unknown>) => ({
    phase: String(p.phase ?? ''),
    milestones: Array.isArray(p.milestones) ? (p.milestones as string[]) : [],
    featuresInScope: Array.isArray(p.featuresInScope) ? (p.featuresInScope as string[]) : [],
    successCriteria: Array.isArray(p.successCriteria) ? (p.successCriteria as string[]) : [],
    capitalRequirement: p.capitalRequirement != null ? String(p.capitalRequirement) : undefined,
  }))
}
