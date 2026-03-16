import type { SystemBlock } from '@/services/ai/types'
import type { Venture, SprintPlan, SprintPlanSprint, SprintPlanAssumption } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const SPRINT_PLAN_PERSONA = `You are an delivery lead at KPMG. From the venture's feature PRDs (or MVP feature list) and complexity, produce a sprint-by-sprint delivery plan with clear assumptions.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "sprints": [
    {
      "sprintNumber": 1,
      "durationWeeks": 2,
      "featuresInScope": ["feature name or PRD name"],
      "definitionOfDone": "string — what must be true for the sprint to be done",
      "acceptanceCriteria": ["string — key AC for this sprint"]
    }
  ],
  "assumptions": [
    {
      "label": "string — e.g. Team size, Velocity",
      "value": "string — e.g. 2 devs, 5 SP/sprint",
      "source": "FOUNDER" | "VL" | "AI_SYNTHESIS"
    }
  ]
}

Guidelines:
- Sprints should be 1-3 weeks. Typical MVP: 4-8 sprints.
- featuresInScope: assign features from the PRD list or MVP feature list; respect complexity (high = more time or split).
- assumptions: include 3-6 key assumptions (team size, velocity, scope stability, dependencies). Use AI_SYNTHESIS for inferred values.
- definitionOfDone and acceptanceCriteria should be testable.`

export async function buildSprintPlanBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Sprint plan, feature PRDs, MVP features, complexity, milestones, definition of done',
      {
        topK: 25,
        nodeTypes: [
          'feature_prd',
          'mvp_feature_s04',
          'sprint_plan',
          'product_roadmap',
          'technical_architecture',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const prds = venture.featurePrdList?.prds ?? []
  const features = venture.mvpFeatureList?.features ?? []
  const prdBlock =
    prds.length > 0
      ? `\nFEATURE PRDS:\n${prds.map((p) => `- ${p.name} (featureId: ${p.featureId}): ${p.userStory}`).join('\n')}`
      : ''
  const featureBlock =
    features.length > 0
      ? `\nMVP FEATURES (complexity):\n${features.map((f) => `- ${f.name}: ${f.complexity}`).join('\n')}`
      : ''
  const fallback = !prdBlock && featureBlock ? `\nUse MVP features for scope.${featureBlock}` : prdBlock + featureBlock

  return [
    { type: 'text', text: SPRINT_PLAN_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${fallback}\n\nProduce the sprint plan with sprints and assumptions. Return ONLY valid JSON.`,
    },
  ]
}

export function parseSprintPlanResponse(text: string): { sprints: SprintPlanSprint[]; assumptions: SprintPlanAssumption[] } {
  const raw = JSON.parse(text) as { sprints?: unknown[]; assumptions?: unknown[] }
  const sprints = Array.isArray(raw.sprints) ? raw.sprints : []
  const assumptions = Array.isArray(raw.assumptions) ? raw.assumptions : []
  return {
    sprints: sprints.map((s: Record<string, unknown>) => ({
      sprintNumber: Number(s.sprintNumber) || 0,
      durationWeeks: Number(s.durationWeeks) || 2,
      featuresInScope: Array.isArray(s.featuresInScope) ? (s.featuresInScope as string[]) : [],
      definitionOfDone: String(s.definitionOfDone ?? ''),
      acceptanceCriteria: Array.isArray(s.acceptanceCriteria) ? (s.acceptanceCriteria as string[]) : [],
    })),
    assumptions: assumptions.map((a: Record<string, unknown>) => ({
      label: String(a.label ?? ''),
      value: String(a.value ?? ''),
      source: (a.source === 'FOUNDER' || a.source === 'VL' || a.source === 'AI_SYNTHESIS' ? a.source : 'AI_SYNTHESIS') as SprintPlanAssumption['source'],
    })),
  }
}
