import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildRoadmapUpdaterBlocks, parseRoadmapUpdaterResponse } from '@/agents/build/roadmapUpdater'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { createUpdatedRoadmapDocx } from '@/services/export'
import type { UpdatedRoadmap, RoadmapPhase } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function RoadmapUpdater() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const updatedRoadmap = venture?.updatedRoadmap

  const handleUpdate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildRoadmapUpdaterBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON with a "phases" array. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Update the roadmap from pilot learnings.' }],
        maxTokens: 4000,
      })
      const phases = parseRoadmapUpdaterResponse(resp.text)
      const now = new Date().toISOString()
      updateVenture(activeVentureId, {
        updatedRoadmap: {
          phases,
          generatedAt: now,
          source: 'AI_SYNTHESIS',
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to update roadmap')
    } finally {
      setLoading(false)
    }
  }

  const handlePhasesChange = (next: RoadmapPhase[]) => {
    if (!updatedRoadmap || !activeVentureId) return
    updateVenture(activeVentureId, {
      updatedRoadmap: { ...updatedRoadmap, phases: next, source: 'VL' },
    })
  }

  const handleExportDocx = () => {
    if (!venture || !updatedRoadmap) return
    createUpdatedRoadmapDocx(venture.name.value, updatedRoadmap).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-updated-roadmap.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Roadmap Updater</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const hasProductRoadmap = (venture.productRoadmap?.phases?.length ?? 0) > 0
  const hasClientFeedback = !!venture.clientFeedbackSummary

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Roadmap Updater</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Update the product roadmap from pilot learnings and client feedback.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : updatedRoadmap ? 'Update from pilot learnings' : 'Generate updated roadmap'}
          </button>
          {updatedRoadmap && (
            <button
              onClick={handleExportDocx}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Export .docx
            </button>
          )}
        </div>
        {(!hasProductRoadmap || !hasClientFeedback) && (
          <p className="text-xs text-[var(--text-muted)] mb-4">
            For best results, complete Product Roadmap (Stage 05) and Client Feedback Summary first.
          </p>
        )}

        {updatedRoadmap && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <h2 className="font-heading font-semibold text-lg">Updated Roadmap</h2>
              <SourceChip source={updatedRoadmap.source} />
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(updatedRoadmap.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="space-y-6">
              {updatedRoadmap.phases.map((phase, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-4"
                  style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                >
                  <input
                    value={phase.phase}
                    onChange={(e) => {
                      const next = [...updatedRoadmap.phases]
                      next[idx] = { ...phase, phase: e.target.value }
                      handlePhasesChange(next)
                    }}
                    className="font-heading font-semibold text-[var(--text-primary)] bg-transparent border-none outline-none w-full mb-2"
                    placeholder="Phase name"
                  />
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">Milestones: </span>
                      <input
                        value={phase.milestones.join('; ')}
                        onChange={(e) => {
                          const next = [...updatedRoadmap.phases]
                          next[idx] = {
                            ...phase,
                            milestones: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                          }
                          handlePhasesChange(next)
                        }}
                        className="flex-1 min-w-0 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Features: </span>
                      <input
                        value={phase.featuresInScope.join(', ')}
                        onChange={(e) => {
                          const next = [...updatedRoadmap.phases]
                          next[idx] = {
                            ...phase,
                            featuresInScope: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          }
                          handlePhasesChange(next)
                        }}
                        className="flex-1 min-w-0 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Success criteria: </span>
                      <input
                        value={phase.successCriteria.join('; ')}
                        onChange={(e) => {
                          const next = [...updatedRoadmap.phases]
                          next[idx] = {
                            ...phase,
                            successCriteria: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                          }
                          handlePhasesChange(next)
                        }}
                        className="flex-1 min-w-0 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] w-full"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
