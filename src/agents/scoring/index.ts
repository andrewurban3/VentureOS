/**
 * Scoring agent — modular prompts with caching.
 */

import type { SystemBlock } from '@/services/ai/types'
import { LENS_CONFIG } from '@/constants/scoring'
import { SCORING_PERSONA } from './persona'

export { SCORING_PERSONA } from './persona'

export function buildScoringSystemBlocks(
  lensId: 'corporate' | 'vc' | 'studio',
  ventureContext: string
): SystemBlock[] {
  const config = LENS_CONFIG[lensId]
  const dimensionIds = config.dimensions.map((d) => d.id).join(', ')
  const dynamicBlock = `Framework: ${config.name}
Research basis: ${config.researchBasis}
Dimension IDs to score: ${dimensionIds}

VENTURE CONTEXT:
${ventureContext}`

  return [
    { type: 'text', text: SCORING_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: dynamicBlock },
  ]
}
