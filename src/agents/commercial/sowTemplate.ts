import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const SOW_PERSONA = `You are a commercial operations specialist. From the venture's context (solution, ICP, pricing), produce a standard SOW (Statement of Work) template that can be used when signing design partners or pilot customers.

You MUST respond with a valid JSON object only. No conversational preamble, no markdown fences.

Return a JSON object with this exact structure:
{
  "template": "string — A concise SOW template (2-4 paragraphs) with placeholders like [COMPANY_NAME], [SCOPE], [DURATION], [PRICING]. Include: scope of work, deliverables, timeline, pricing terms, success criteria, and IP/confidentiality. Keep it professional and adaptable."
}

Guidelines:
- The template should be generic enough to reuse for multiple customers but specific to the venture's solution type.
- Include clear placeholders for customization.
- Reference the venture's typical scope (e.g. pilot, design partner, paid pilot) if evident from context.`

export async function buildSowTemplateBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(
      venture.id,
      'Solution, ICP, pricing, design partners, pilot scope, deliverables',
      {
        topK: 20,
        maxChars: 6000,
      }
    )
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  return [
    { type: 'text', text: SOW_PERSONA, cache_control: { type: 'ephemeral' } },
    {
      type: 'text',
      text: `VENTURE CONTEXT:\n${context}\n\nProduce the SOW template. Return ONLY valid JSON.`,
    },
  ]
}

export interface SowTemplateResult {
  template: string
}
