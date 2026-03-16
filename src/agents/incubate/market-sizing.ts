import type { SystemBlock } from '@/services/ai/types'
import type { Venture } from '@/types/venture'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'

const MARKET_SIZING_PERSONA = `You are a market sizing analyst at KPMG. Build a defensible TAM/SAM/SOM from first principles.

Use web search for: industry market size from published reports, sector CAGR, penetration rate assumptions. Cite specific reports (title, publisher, year, URL).

Return a JSON object with:
- tam: number (total addressable market in USD)
- sam: number (serviceable addressable market in USD)
- som: number (serviceable obtainable market in USD)
- methodology: string (2-3 paragraphs explaining top-down and bottom-up approach)
- assumptions: array of { id: string, label: string, value: string | number, source: "AI_RESEARCH"|"AI_SYNTHESIS", citation?: { title, url }, confidence: "High"|"Medium"|"Low", updatedAt: string }`

export async function buildMarketSizingSystemBlocks(venture: Venture): Promise<SystemBlock[]> {
  let context: string
  try {
    context = await retrieveVentureContext(venture.id, 'Market size, TAM SAM SOM, industry, market segments, CAGR, growth rate', {
      topK: 25,
      nodeTypes: ['icp_profile', 'intake_exchange', 'dimension_insight', 'market_sizing', 'financial_assumption', 'competitor_profile'],
      maxChars: 6000,
    })
  } catch {
    context = buildVentureContext(venture, { sections: 'full', maxChars: 6000 })
  }

  const dynamicBlock = `VENTURE DATA:
${context}

Generate the Market Sizing Model. Return ONLY valid JSON.`

  return [
    { type: 'text', text: MARKET_SIZING_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
