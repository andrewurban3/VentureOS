import type { SystemBlock } from '@/services/ai/types'
import type { Venture, TechnicalArchitecture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const ARCHITECTURE_PERSONA = `You are a technical architect at KPMG. From the venture's solution definition, idea intake (including any technical requirements), and MVP feature list, produce a technical architecture document.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "techStack": "string — recommended technologies (frontend, backend, data, infra). Be specific (e.g. React, Node, Postgres, AWS).",
  "componentDiagram": "string — high-level component breakdown (e.g. Web App, API, Auth, DB, Integrations). Describe how they connect.",
  "mermaidDiagram": "string — valid Mermaid flowchart code (e.g. flowchart LR or flowchart TB) showing components and their connections. Use simple node IDs like WebApp, API, DB. Example: flowchart LR\\n  WebApp --> API\\n  API --> DB",
  "integrationPoints": "string — external systems, APIs, or data sources the MVP must integrate with.",
  "keyDecisions": "string — 3-6 key architectural decisions with brief rationale (e.g. monolith vs microservices, auth approach).",
  "risksAndOpenQuestions": "string — technical risks and open questions to resolve before or during build."
}

Guidelines:
- Ground everything in the venture data. Do not invent features or integrations not implied by the solution or MVP features.
- Keep the MVP scope realistic; avoid over-engineering.
- Reference the MVP feature list so the architecture supports those features.`

export async function buildArchitectureBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Technical architecture, solution definition, MVP features, tech stack, components, integrations, idea intake technical requirements',
      {
        topK: 25,
        nodeTypes: [
          'solution_definition',
          'mvp_feature_s04',
          'intake_exchange',
          'dimension_insight',
          'technical_architecture',
        ],
        maxChars: 8000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const solution = venture.solutionDefinition
  const mvpFeatures = venture.mvpFeatureList?.features ?? []
  const solutionBlock = solution
    ? `\nSOLUTION: ${solution.whatItDoes}\nDifferentiation: ${solution.differentiation}${solution.whatItDoesNot ? `\nOut of scope: ${solution.whatItDoesNot}` : ''}`
    : ''
  const featuresBlock =
    mvpFeatures.length > 0
      ? `\nMVP FEATURES:\n${mvpFeatures.map((f) => `- ${f.name}: ${f.description}`).join('\n')}`
      : '\nNo MVP feature list yet; infer from solution and idea intake.'

  return [
    { type: 'text', text: ARCHITECTURE_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}${solutionBlock}${featuresBlock}\n\nProduce the technical architecture. Return ONLY valid JSON.`,
    },
  ]
}

export function parseArchitectureResponse(text: string): TechnicalArchitecture['content'] {
  const raw = JSON.parse(text) as Record<string, unknown>
  return {
    techStack: String(raw.techStack ?? ''),
    componentDiagram: String(raw.componentDiagram ?? ''),
    mermaidDiagram: raw.mermaidDiagram != null ? String(raw.mermaidDiagram) : undefined,
    integrationPoints: String(raw.integrationPoints ?? ''),
    keyDecisions: String(raw.keyDecisions ?? ''),
    risksAndOpenQuestions: String(raw.risksAndOpenQuestions ?? ''),
  }
}
