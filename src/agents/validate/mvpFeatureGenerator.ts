import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const MVP_FEATURE_PERSONA = `You are a product strategist at KPMG specialising in MVP scoping. Your task is to generate a ranked MVP feature list by synthesising design partner feedback, solution definition, and idea intake data.

You MUST respond with ONLY a valid JSON object. No conversational preamble, no markdown fences.

Return a JSON object with a single key "features" — an array of 8-15 feature objects ranked by importance (most important first). Each object has:
- name: string — concise feature name (2-6 words)
- description: string — 1-2 sentence description of what this feature does and why it matters
- requestedByPartnerIds: string[] | undefined — IDs of design partners who explicitly requested or implied need for this feature. Omit if no specific partner link.
- moscow: "Must Have" | "Should Have" | "Nice to Have" — MoSCoW priority. You MUST include at least 2 "Must Have", several "Should Have", and a few "Nice to Have".
- complexity: "Low" | "Medium" | "High" — estimated implementation complexity for an MVP

Prioritisation rules:
1. Features solving pain points mentioned by multiple design partners rank higher.
2. Features addressing "Must Have" product gaps rank above nice-to-have enhancements.
3. High complexity features should only be "Must Have" if truly essential.
4. The feature set must be realistic for an MVP — no feature creep. Focus on the core value loop.
5. Ground every feature in the venture data. Do not invent features unrelated to the feedback or solution.`

export async function buildMvpFeatureBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'MVP features, design partner feedback, common themes, product gaps, strongest use cases, solution definition, differentiation, idea intake',
      {
        topK: 30,
        nodeTypes: [
          'design_partner_feedback',
          'design_partner_candidate',
          'solution_definition',
          'icp_profile',
          'intake_exchange',
          'mvp_feature',
        ],
        maxChars: 10000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 10000 })
  }

  const parts: string[] = [`VENTURE DATA:\n${context}`]

  const feedback = venture.designPartnerFeedbackSummary
  if (feedback) {
    const fc = feedback.content
    parts.push(
      `\nDESIGN PARTNER FEEDBACK SUMMARY:` +
      `\n- Common Themes: ${fc.commonThemes.join('; ')}` +
      `\n- Product Gaps: ${fc.productGaps.join('; ')}` +
      `\n- Strongest Use Cases: ${fc.strongestUseCases.join('; ')}` +
      `\n- Divergent Feedback: ${fc.divergentFeedback.join('; ')}` +
      `\n- Narrative: ${fc.narrative}`
    )
  } else {
    parts.push(
      '\nNOTE: No design partner feedback summary is available yet. ' +
      'Derive features primarily from the solution definition, idea intake data, and ICP.'
    )
  }

  const solution = venture.solutionDefinition
  if (solution) {
    parts.push(
      `\nSOLUTION DEFINITION:` +
      `\n- What It Does: ${solution.whatItDoes}` +
      `\n- Differentiation: ${solution.differentiation}` +
      (solution.whatItDoesNot ? `\n- What It Does Not: ${solution.whatItDoesNot}` : '') +
      (solution.tenXClaim ? `\n- 10x Claim: ${solution.tenXClaim}` : '')
    )
  }

  if (venture.ideaIntake?.messages?.length) {
    const founderMessages = venture.ideaIntake.messages
      .filter((m) => m.source === 'FOUNDER')
      .map((m) => m.content)
      .slice(-6)
    if (founderMessages.length) {
      parts.push(`\nIDEA INTAKE (founder's own words):\n${founderMessages.join('\n')}`)
    }
  }

  const candidates = venture.designPartnerPipeline?.candidates
  if (candidates?.length) {
    const partnerList = candidates.map((c) => `  - ${c.id}: ${c.companyName}`).join('\n')
    parts.push(
      `\nDESIGN PARTNERS (reference these IDs in requestedByPartnerIds when a partner's feedback maps to a feature):\n${partnerList}`
    )
  }

  parts.push(
    '\nGenerate 8-15 ranked MVP features. Return ONLY valid JSON with a "features" array.'
  )

  return [
    { type: 'text', text: MVP_FEATURE_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: parts.join('\n') },
  ]
}
