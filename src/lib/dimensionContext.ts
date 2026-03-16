// TODO: Migrate to RAG retrieval (Supabase pgvector) when venture record exceeds ~50K tokens.
// Current approach: serialize dimension summaries into strings for AI prompts.
// Revisit when Stage 03-04 features land (interview transcripts, financial models).

import type { Venture } from '@/types/venture'
import { INTAKE_DIMENSIONS } from '@/constants/ideaIntake'

export function getDimensionSummaries(venture: Venture, dimensionIds?: string[]): string {
  const dims = venture.ideaIntake?.dimensionCoverage ?? []
  const filtered = dimensionIds
    ? dims.filter((d) => dimensionIds.includes(d.id) && d.status !== 'not_started')
    : dims.filter((d) => d.status !== 'not_started')

  return filtered
    .map((d) => {
      const def = INTAKE_DIMENSIONS.find((def) => def.id === d.id)
      const label = def?.name ?? `Dimension ${d.id}`
      return `[${d.id} ${label}] (${d.status}) ${d.summary}${d.flags.length ? ` | Flags: ${d.flags.join('; ')}` : ''}`
    })
    .join('\n')
}

export function getDimensionSummary(venture: Venture, dimensionId: string): string | null {
  const dim = venture.ideaIntake?.dimensionCoverage?.find((d) => d.id === dimensionId)
  return dim && dim.status !== 'not_started' ? dim.summary : null
}
