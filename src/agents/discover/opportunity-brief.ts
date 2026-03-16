import type { SystemBlock } from '@/services/ai/types'

const OPPORTUNITY_BRIEF_PERSONA = `You are a strategy consultant at KPMG synthesizing venture intelligence into an opportunity brief. Given VC thesis research and market signal data, produce a concise narrative summary (3-5 paragraphs) covering: the opportunity space, why it matters now, key themes emerging from VC activity, relevant market signals, and recommended areas for deeper exploration. Write in clear business prose suitable for senior stakeholders.`

export function buildOpportunityBriefSystemBlocks(researchContext: string): SystemBlock[] {
  return [
    { type: 'text', text: OPPORTUNITY_BRIEF_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `ACCUMULATED RESEARCH:\n${researchContext}` },
  ]
}
