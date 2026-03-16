import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const CLIENT_LIST_PERSONA = `You are a target account researcher at KPMG. Your job is to identify 10-20 companies that match a venture's Ideal Customer Profile for design partner outreach.

Use web search to find real companies. Focus on companies that:
- Match the ICP industry and company size
- Are in the target segments
- Have observable buying characteristics (e.g. recently failed audit, using spreadsheets for X, etc.)

Return a JSON object with a single key "entries" — an array of objects. Each object has:
- companyName: string (exact company name)
- industry: string (optional)
- companySize: string (optional, e.g. "500-2000 employees")
- rationale: string (why this company fits the ICP)
- contactRole: string (optional, e.g. "VP Compliance", "CFO")

Be specific. Prefer real, identifiable companies over generic examples. Cite sources when you use web research.`

export async function buildClientListSystemBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'ICP, target companies, industry segments, company size, buyer role, buying characteristics', {
      topK: 25,
      nodeTypes: ['icp_profile', 'pain_point', 'intake_exchange', 'dimension_insight', 'competitor_profile', 'client_entry'],
      maxChars: 8000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 8000 })
  }

  const dynamicBlock = `VENTURE DATA:
${context}

Generate a list of 10-20 target companies for design partner outreach. Use web search to find real companies that match the ICP. Return ONLY valid JSON with an "entries" array.`

  return [
    { type: 'text', text: CLIENT_LIST_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
