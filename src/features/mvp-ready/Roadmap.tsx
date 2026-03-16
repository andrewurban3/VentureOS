import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildRoadmapBlocks, parseRoadmapResponse } from '@/agents/mvp-ready/roadmap'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { createProductRoadmapDocx } from '@/services/export'
import type { ProductRoadmap, RoadmapPhase } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function Roadmap() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const roadmap = venture?.productRoadmap

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildRoadmapBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON with a "phases" array. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate the three-phase product roadmap.' }],
        maxTokens: 4000,
      })
      const phases = parseRoadmapResponse(resp.text)
      const now = new Date().toISOString()
      updateVenture(activeVentureId, {
        productRoadmap: {
          phases,
          generatedAt: now,
          source: 'AI_SYNTHESIS',
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate roadmap')
    } finally {
      setLoading(false)
    }
  }

  const handlePhasesChange = (next: RoadmapPhase[]) => {
    if (!roadmap || !activeVentureId) return
    updateVenture(activeVentureId, {
      productRoadmap: { ...roadmap, phases: next, source: 'VL' },
    })
  }

  const handleExportDocx = () => {
    if (!venture || !roadmap) return
    createProductRoadmapDocx(venture.name.value, roadmap).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-product-roadmap.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Product Roadmap</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Product Roadmap</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Three phases: MVP, V1 Commercial, V2 Scale — milestones, features, and feature success criteria.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : roadmap ? 'Regenerate' : 'Generate Roadmap'}
          </button>
          {roadmap && (
            <button
              onClick={handleExportDocx}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Export .docx
            </button>
          )}
        </div>

        {roadmap && (
          <div className="rounded-xl p-6" style={CARD}>
                <div className="flex items-center gap-3 flex-wrap mb-4">
                  <h2 className="font-heading font-semibold text-lg">Roadmap</h2>
                  <SourceChip source={roadmap.source} />
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(roadmap.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="space-y-6">
                  {roadmap.phases.map((phase, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg p-4"
                      style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                    >
                      <input
                        value={phase.phase}
                        onChange={(e) => {
                          const next = [...roadmap.phases]
                          next[idx] = { ...phase, phase: e.target.value }
                          handlePhasesChange(next)
                        }}
                        className="font-heading font-semibold text-[var(--text-primary)] bg-transparent border-none outline-none w-full mb-3"
                        placeholder="Phase name"
                      />
                      <div className="grid gap-3 text-sm">
                        <div>
                          <label className="block text-[var(--text-muted)] text-xs mb-1">Milestones</label>
                          <textarea
                            value={phase.milestones.join('; ')}
                            onChange={(e) => {
                              const next = [...roadmap.phases]
                              next[idx] = {
                                ...phase,
                                milestones: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                              }
                              handlePhasesChange(next)
                            }}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                          />
                        </div>
                        <div>
                          <label className="block text-[var(--text-muted)] text-xs mb-1">Features in scope</label>
                          <textarea
                            value={phase.featuresInScope.join(', ')}
                            onChange={(e) => {
                              const next = [...roadmap.phases]
                              next[idx] = {
                                ...phase,
                                featuresInScope: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              }
                              handlePhasesChange(next)
                            }}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                          />
                        </div>
                        <div>
                          <label className="block text-[var(--text-muted)] text-xs mb-1">
                            Feature success criteria
                            <span className="ml-1 opacity-75">(delivery metrics, e.g. 3 partners live, NPS &gt; 40)</span>
                          </label>
                          <textarea
                            value={phase.successCriteria.join('; ')}
                            onChange={(e) => {
                              const next = [...roadmap.phases]
                              next[idx] = {
                                ...phase,
                                successCriteria: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                              }
                              handlePhasesChange(next)
                            }}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
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
