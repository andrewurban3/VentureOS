/**
 * Output document agents — modular prompts with caching.
 */

import type { SystemBlock } from '@/services/ai/types'
import {
  BUSINESS_BRIEF_PROMPT,
  INVESTMENT_MEMO_PROMPT,
  PITCH_DECK_PROMPT,
} from './prompts'

export function buildBusinessBriefSystemBlocks(ventureContext: string): SystemBlock[] {
  return [
    { type: 'text', text: BUSINESS_BRIEF_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `VENTURE DATA:\n${ventureContext}` },
  ]
}

export function buildInvestmentMemoSystemBlocks(fullContext: string): SystemBlock[] {
  return [
    { type: 'text', text: INVESTMENT_MEMO_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `VENTURE DATA:\n${fullContext}` },
  ]
}

export function buildPitchDeckSystemBlocks(fullContext: string): SystemBlock[] {
  return [
    { type: 'text', text: PITCH_DECK_PROMPT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `VENTURE DATA:\n${fullContext}` },
  ]
}
