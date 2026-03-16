/**
 * Pressure Test agent — modular prompts with caching.
 */

import type { SystemBlock } from '@/services/ai/types'
import { PRESSURE_TEST_RULES } from './persona'
import type { PERSONAS } from '@/constants/pressureTest'

export { PRESSURE_TEST_RULES } from './persona'

const MAX_MESSAGES = 20

export function buildPressureTestSystemBlocks(
  persona: (typeof PERSONAS)[number],
  ventureContext: string,
  isStart: boolean
): SystemBlock[] {
  const dynamicBlock = isStart
    ? `You are ${persona.name}. Archetype: ${persona.archetype}. Focus: ${persona.focus}.

VENTURE CONTEXT:
${ventureContext}`
    : `You are ${persona.name}. Continue the pressure test. Stay in character. Push back hard on weak answers. Acknowledge strong answers briefly. Ask your next question.

VENTURE CONTEXT:
${ventureContext.slice(0, 4000)}`

  return [
    { type: 'text', text: PRESSURE_TEST_RULES, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}

export function getRecentMessages<T extends { role: string; content: string }>(
  messages: T[]
): T[] {
  return messages.slice(-MAX_MESSAGES)
}
