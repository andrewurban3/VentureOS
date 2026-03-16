/**
 * Vera — AI Venture Lead agent for Idea Intake
 *
 * Knowledge is split into cacheable files:
 *   persona.ts — identity & behavioral rules  (static, cached)
 *   rubric.ts  — scoring rubric & output format (static, cached)
 *
 * This module composes them into system prompt blocks that leverage
 * Anthropic's prompt caching so the static parts aren't re-tokenized
 * on every turn.
 */

import type { Venture } from '@/types/venture'
import { INTAKE_DIMENSIONS } from '@/constants/ideaIntake'
import { VERA_PERSONA } from './persona'
import { VERA_RUBRIC } from './rubric'
import type { SystemBlock } from '@/services/ai/types'

export const VERA = {
  name: 'Vera',
  role: 'Venture Lead',
} as const

export const COVERAGE_MARKER = '---COVERAGE---'

export interface DimensionCoverage {
  id: string
  status: string
  summary: string
  flags: string[]
}

export interface ParsedIntakeResponse {
  message: string
  coverage: DimensionCoverage[]
}

export function buildVentureRecord(venture: Venture): string {
  const lines: string[] = []

  lines.push(`Name: ${venture.name.value}`)
  lines.push(`Stage: ${venture.stage.value}`)
  lines.push(`Founder: ${venture.founder.value}`)
  lines.push(`Status: ${venture.status.value}`)
  if (venture.description?.value) lines.push(`Description: ${venture.description.value}`)

  if (venture.ideaIntake?.dimensionCoverage?.length) {
    lines.push('\nCoverage so far:')
    for (const cov of venture.ideaIntake.dimensionCoverage) {
      const dim = INTAKE_DIMENSIONS.find((d) => d.id === cov.id)
      const name = dim?.name ?? cov.id
      lines.push(`  ${cov.id} ${name}: ${cov.status}${cov.summary ? ` — ${cov.summary}` : ''}`)
      if (cov.flags?.length) cov.flags.forEach((f) => lines.push(`    - ${f}`))
    }
  }

  if (venture.scoring) {
    lines.push('\nScoring:')
    if (venture.scoring.corporate)
      lines.push(`  Corporate: ${venture.scoring.corporate.average}${venture.scoring.corporate.recommendation ? ` — ${venture.scoring.corporate.recommendation}` : ''}`)
    if (venture.scoring.vc)
      lines.push(`  VC: ${venture.scoring.vc.average}${venture.scoring.vc.recommendation ? ` — ${venture.scoring.vc.recommendation}` : ''}`)
    if (venture.scoring.studio)
      lines.push(`  Studio: ${venture.scoring.studio.average}${venture.scoring.studio.recommendation ? ` — ${venture.scoring.studio.recommendation}` : ''}`)
    if (venture.scoring.compositeSignal) lines.push(`  Composite: ${venture.scoring.compositeSignal}`)
  }

  return lines.join('\n')
}

/**
 * Build system prompt as an array of content blocks.
 * The first two blocks (persona + rubric) are marked for caching —
 * Anthropic will cache them across turns so they only count against
 * your rate limit once.
 * The third block (venture record) is dynamic and changes each turn.
 */
export function buildSystemBlocks(venture: Venture): SystemBlock[] {
  const ventureRecord = buildVentureRecord(venture)
  return [
    { type: 'text', text: VERA_PERSONA, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: VERA_RUBRIC, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: `VENTURE RECORD:\n${ventureRecord}` },
  ]
}

export function parseCoverageFromResponse(response: string): ParsedIntakeResponse | null {
  const idx = response.indexOf(COVERAGE_MARKER)
  if (idx === -1) return null

  const message = response.slice(0, idx).trim()
  const jsonStr = response.slice(idx + COVERAGE_MARKER.length).trim()
  try {
    const parsed = JSON.parse(jsonStr)
    const dimensions = Array.isArray(parsed.dimensions) ? parsed.dimensions : []
    return { message, coverage: dimensions }
  } catch {
    return { message, coverage: [] }
  }
}

export const VERA_INTAKE_WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 3,
} as const

export const VERA_INTAKE_CONFIG = {
  maxTokens: 400,
  openingPrompt: (ventureName: string) =>
    `The founder wants to discuss an early-stage venture called "${ventureName}". Start with a warm, inviting opener — one short question to get them talking. Keep it brief and encouraging.`,
} as const
