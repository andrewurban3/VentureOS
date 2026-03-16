import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'
import { buildScoringSystemBlocks } from '@/agents/scoring'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { aiService } from '@/services/ai'
import {
  LENS_CONFIG,
  type LensScoreResult,
  type CompositeSignal,
  type DimensionScore,
} from '@/constants/scoring'

type LensId = 'corporate' | 'vc' | 'studio'

const COMPOSITE_COLORS: Record<CompositeSignal, string> = {
  Advance: '#10B981',
  Caution: '#F59E0B',
  Revisit: '#F97316',
  Kill: '#EF4444',
}

function computeCompositeSignal(
  corporate?: LensScoreResult,
  vc?: LensScoreResult,
  studio?: LensScoreResult
): CompositeSignal {
  const scores = [corporate?.average, vc?.average, studio?.average].filter(
    (s): s is number => typeof s === 'number'
  )
  if (scores.length === 0) return 'Caution'
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  if (avg >= 4) return 'Advance'
  if (avg >= 3) return 'Caution'
  if (avg >= 2) return 'Revisit'
  return 'Kill'
}

export function Scoring() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loadingLens, setLoadingLens] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedLens, setSelectedLens] = useState<LensId | null>(null)

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div
          className="rounded-xl p-8 max-w-md text-center"
          style={{
            background: 'rgba(30,26,46,0.7)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 className="font-heading font-bold text-xl mb-2">Scoring Models</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Select a venture and start an Idea Intake to score it. You can move to Scoring anytime — no need to complete every section.
          </p>
        </div>
      </div>
    )
  }

  const runScoring = async (lensId: 'corporate' | 'vc' | 'studio') => {
    const config = LENS_CONFIG[lensId]
    setLoadingLens(lensId)
    setApiError(null)
    try {
      let ventureContext: string
      try {
        ventureContext = await retrieveVentureContext(venture.id, `Score venture: ${config.name} lens, ${config.dimensions.map(d => d.name).join(', ')}`, {
          topK: 20,
          nodeTypes: ['intake_exchange', 'dimension_insight', 'icp_profile', 'pain_point'],
          maxChars: 4000,
        })
      } catch {
        ventureContext = buildVentureContext(venture, { sections: 'intake', maxChars: 4000 })
      }
      const result = await aiService.chatWithStructuredOutput<{
        dimensions: { id: string; name: string; score: number; explanation: string }[]
        recommendation?: string
      }>({
        systemPrompt: buildScoringSystemBlocks(lensId, ventureContext),
        messages: [{ role: 'user', content: 'Score this venture.' }],
        maxTokens: 2000,
      })

      const dimensions: DimensionScore[] = config.dimensions.map((d) => {
        const found = result.dimensions?.find((r) => r.id === d.id)
        return {
          id: d.id,
          name: d.name,
          score: found?.score ?? 3,
          explanation: found?.explanation ?? '',
          whyItMatters: d.whyItMatters,
        }
      })
      const average =
        dimensions.reduce((a, b) => a + b.score, 0) / dimensions.length

      const lensResult: LensScoreResult = {
        dimensions,
        average: Math.round(average * 10) / 10,
        recommendation: result.recommendation,
      }

      const currentScoring = venture.scoring ?? {}
      const newScoring = {
        ...currentScoring,
        [lensId]: lensResult,
        compositeSignal: computeCompositeSignal(
          lensId === 'corporate' ? lensResult : currentScoring.corporate,
          lensId === 'vc' ? lensResult : currentScoring.vc,
          lensId === 'studio' ? lensResult : currentScoring.studio
        ),
      }

      updateVenture(venture.id, { scoring: newScoring })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Scoring failed')
    } finally {
      setLoadingLens(null)
    }
  }

  const scoring = venture.scoring ?? {}
  const hasAnyScore = !!(scoring.corporate || scoring.vc || scoring.studio)

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">
          Scoring — {venture.name.value}
        </h1>
        <SourceChip source="SCORING" small />
      </div>

      <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} className="mb-4" />

      {/* Three tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['corporate', 'vc', 'studio'] as const).map((lensId) => {
          const config = LENS_CONFIG[lensId]
          const result = scoring[lensId]
          const isLoading = loadingLens === lensId
          const isExpanded = selectedLens === lensId

          return (
            <div
              key={lensId}
              role={result ? 'button' : undefined}
              tabIndex={result ? 0 : undefined}
              onClick={result ? () => setSelectedLens(isExpanded ? null : lensId) : undefined}
              onKeyDown={result ? (e) => e.key === 'Enter' && setSelectedLens(isExpanded ? null : lensId) : undefined}
              className="rounded-xl p-4 cursor-pointer"
              style={{
                background: 'rgba(30,26,46,0.7)',
                border: `1px solid ${isExpanded ? 'var(--accent-primary)' : 'var(--border)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <h3 className="font-heading font-semibold text-sm mb-1">
                {config.name}
              </h3>
              <p className="font-mono text-[10px] text-[var(--text-muted)] mb-3">
                {config.researchBasis}
              </p>

              {!result && !isLoading && (
                <div className="space-y-2 mb-4">
                  {config.dimensions.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-[var(--text-muted)]">{d.name}</span>
                      <span className="font-mono">{d.weight}%</span>
                    </div>
                  ))}
                  <button
                    onClick={(e) => { e.stopPropagation(); runScoring(lensId) }}
                    className="w-full mt-4 py-2 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
                  >
                    Run Scoring
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  {config.loadingMessage}
                </div>
              )}

              {result && !isLoading && (
                <div className="space-y-2">
                  <div className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                    Avg: {result.average}/5
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-auto">
                    {result.dimensions.map((d) => (
                      <div key={d.id} className="text-xs">
                        <div className="flex justify-between mb-0.5">
                          <span className="truncate">{d.name}</span>
                          <span className="font-mono shrink-0">{d.score}/5</span>
                        </div>
                        <div
                          className="h-1 rounded mb-0.5"
                          style={{
                            background: 'var(--border)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            className="h-full rounded"
                            style={{
                              width: `${(d.score / 5) * 100}%`,
                              background: 'var(--accent-primary)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Click to expand rubric
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded rubric when a lens is selected */}
      {selectedLens && scoring[selectedLens] && (
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            background: 'rgba(30,26,46,0.7)',
            border: '1px solid var(--accent-primary)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg">
              {LENS_CONFIG[selectedLens].name} — Full Rubric
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                Avg: {scoring[selectedLens]!.average}/5
              </span>
              <button
                onClick={() => setSelectedLens(null)}
                className="px-3 py-1 rounded text-xs border border-[var(--border)] hover:bg-[rgba(124,106,247,0.1)] text-[var(--text-muted)]"
              >
                Close
              </button>
              <button
                onClick={() => runScoring(selectedLens)}
                className="px-3 py-1 rounded text-xs font-mono border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface)]"
              >
                Re-run
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {scoring[selectedLens]!.dimensions.map((d) => (
              <div key={d.id} className="border-b border-[var(--border)] pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{d.name}</span>
                  <span className="font-mono text-sm font-semibold text-[var(--accent-primary)]">
                    {d.score}/5
                  </span>
                </div>
                <div
                  className="h-2 rounded mb-2"
                  style={{
                    background: 'var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${(d.score / 5) * 100}%`,
                      background: 'var(--accent-primary)',
                    }}
                  />
                </div>
                {d.explanation && (
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    {d.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combined Score Summary */}
      {hasAnyScore && (
        <div
          className="rounded-xl p-4"
          style={{
            background: 'rgba(30,26,46,0.7)',
            border: '1px solid var(--border)',
          }}
        >
          <h3 className="font-heading font-semibold text-sm mb-3">
            Combined Score Summary
          </h3>
          <div className="flex flex-wrap gap-6">
            {scoring.corporate && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">
                  Corporate
                </span>
                <span className="font-mono block text-lg font-semibold">
                  {scoring.corporate.average}/5
                </span>
              </div>
            )}
            {scoring.vc && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">VC</span>
                <span className="font-mono block text-lg font-semibold">
                  {scoring.vc.average}/5
                </span>
              </div>
            )}
            {scoring.studio && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Studio</span>
                <span className="font-mono block text-lg font-semibold">
                  {scoring.studio.average}/5
                </span>
              </div>
            )}
            {scoring.compositeSignal && (
              <div>
                <span className="text-xs text-[var(--text-muted)]">Signal</span>
                <span
                  className="font-mono block text-lg font-semibold"
                  style={{
                    color: COMPOSITE_COLORS[scoring.compositeSignal],
                  }}
                >
                  {scoring.compositeSignal}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
