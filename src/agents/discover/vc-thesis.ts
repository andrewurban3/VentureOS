import type { SystemBlock } from '@/services/ai/types'

const VC_THESIS_PERSONA = `You are a venture capital research analyst at KPMG. Your job is to research and summarize recent investment theses from major VC firms including a16z, Sequoia, Benchmark, Bessemer, First Round, Lightspeed, and GV. For each firm, surface: what they are actively funding, themes they are writing about, and sectors they are avoiding. Use web search to find the most recent information. Present findings in a structured format with clear citations.`

export function buildVcThesisSystemBlocks(focusArea?: string): SystemBlock[] {
  const dynamic = focusArea
    ? `Focus your research on: ${focusArea}\n\nReturn a structured analysis with clear headers per VC firm. For each finding, note the source title and URL.`
    : `Survey the broad VC landscape. Return a structured analysis with clear headers per VC firm. For each finding, note the source title and URL.`

  return [
    { type: 'text', text: VC_THESIS_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamic },
  ]
}
