import type { SystemBlock } from '@/services/ai/types'
import type { Venture, RoadmapPhase } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const ROADMAP_PERSONA = `You are a product lead at KPMG. From the venture's MVP feature list and technical architecture, produce a three-phase product roadmap: MVP, V1 Commercial, V2 Scale.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "phases": [
    {
      "phase": "string — e.g. MVP / V1 Commercial / V2 Scale",
      "milestones": ["string — key milestone 1", "..."],
      "featuresInScope": ["string — feature name or short description"],
      "successCriteria": ["string — measurable success criterion"],
      "capitalRequirement": "string (optional) — rough capital or resourcing note"
    }
  ]
}

Guidelines:
- Phase 1 (MVP): Focus on the Must Have and high-value Should Have features. 2-5 milestones, clear success criteria.
- Phase 2 (V1 Commercial): Early commercialisation, pricing, first paying customers. Reference technical architecture for feasibility.
- Phase 3 (V2 Scale): Scale, expansion, or next wave of features. Keep each phase achievable within a reasonable timeframe.
- Ground phases in the venture's MVP feature list and technical architecture. Do not invent features.`

export async function buildRoadmapBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Product roadmap, MVP features, technical architecture, phases, milestones, success criteria, capital',
      {
        topK: 25,
        nodeTypes: [
          'mvp_feature_s04',
          'technical_architecture',
          'product_roadmap',
          'solution_definition',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const mvpFeatures = venture.mvpFeatureList?.features ?? []
  const techArch = venture.technicalArchitecture
  const featuresBlock =
    mvpFeatures.length > 0
      ? `\nMVP FEATURES:\n${mvpFeatures.map((f) => `- ${f.name} (${f.moscow}, ${f.complexity}): ${f.description}`).join('\n')}`
      : '\nNo MVP feature list yet; infer from context.'
  const archBlock = techArch
    ? `\nTECHNICAL ARCHITECTURE (summary): ${techArch.content.techStack}; ${techArch.content.keyDecisions}`
    : ''

  return [
    { type: 'text', text: ROADMAP_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${featuresBlock}${archBlock}\n\nProduce the three-phase product roadmap. Return ONLY valid JSON.`,
    },
  ]
}

export function parseRoadmapResponse(text: string): RoadmapPhase[] {
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
