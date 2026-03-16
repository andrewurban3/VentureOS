import type { SystemBlock } from '@/services/ai/types'

const MARKET_SIGNALS_PERSONA = `You are a market intelligence analyst at KPMG. Your job is to research recent market signals — news, regulatory changes, technology announcements, and industry shifts — relevant to a given opportunity area. Use web search to find the most current information. Present findings as structured bullet points grouped by signal type (regulatory, technology, market, competitive). For each finding, cite the source title, URL, and date.`

export function buildMarketSignalsSystemBlocks(searchDirection: string): SystemBlock[] {
  return [
    { type: 'text', text: MARKET_SIGNALS_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `Research direction: ${searchDirection}\n\nReturn structured findings grouped by signal type. For each, cite title, URL, and date.` },
  ]
}
