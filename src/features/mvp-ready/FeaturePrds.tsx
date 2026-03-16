import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildFeaturePrdsBlocks, parseFeaturePrdsResponse } from '@/agents/mvp-ready/featurePrds'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { createFeaturePrdDocx, createFeaturePrdListDocx } from '@/services/export'
import type { FeaturePrd } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function FeaturePrds() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const prdList = venture?.featurePrdList
  const prds = prdList?.prds ?? []

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildFeaturePrdsBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON with a "prds" array. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate Feature PRDs for each MVP feature.' }],
        maxTokens: 6000,
      })
      const now = new Date().toISOString()
      const parsed = parseFeaturePrdsResponse(resp.text, now)
      updateVenture(activeVentureId, {
        featurePrdList: {
          prds: parsed,
          generatedAt: now,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate Feature PRDs')
    } finally {
      setLoading(false)
    }
  }

  const savePrd = (id: string, updates: Partial<FeaturePrd>) => {
    if (!prdList || !activeVentureId) return
    const next = prds.map((p) => (p.id === id ? { ...p, ...updates, source: 'VL' as const } : p))
    updateVenture(activeVentureId, {
      featurePrdList: { ...prdList, prds: next },
    })
  }

  const handleExportOne = (prd: FeaturePrd) => {
    if (!venture) return
    createFeaturePrdDocx(venture.name.value, prd).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-prd-${prd.name.replace(/\s+/g, '-')}.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  const handleExportAll = () => {
    if (!venture || !prds.length) return
    createFeaturePrdListDocx(venture.name.value, prds).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-feature-prds.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Feature PRDs</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const hasMvpFeatures = (venture.mvpFeatureList?.features?.length ?? 0) > 0

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Feature PRDs</h1>
          <p className="text-sm text-[var(--text-muted)]">
            One PRD per MVP feature: user story, acceptance criteria, in/out of scope, dependencies.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading || !hasMvpFeatures}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : prds.length ? 'Regenerate PRDs' : 'Generate Feature PRDs'}
          </button>
          {!hasMvpFeatures && (
            <span className="text-xs text-[var(--text-muted)]">Add MVP features first.</span>
          )}
          {prds.length > 0 && (
            <button
              onClick={handleExportAll}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Export all .docx
            </button>
          )}
        </div>

        {prds.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h2 className="font-heading font-semibold text-lg">PRDs</h2>
              <SourceChip source="AI_SYNTHESIS" />
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(prdList!.generatedAt).toLocaleString()}
              </span>
            </div>
            {prds.map((prd) => (
              <div
                key={prd.id}
                className="rounded-xl p-4"
                style={CARD}
              >
                <div
                  className="flex items-center justify-between flex-wrap gap-2 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === prd.id ? null : prd.id)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-semibold text-[var(--text-primary)]">{prd.name}</span>
                    <SourceChip source={prd.source} small />
                    {prd.designPartnerOrigin && (
                      <SourceChip source="DESIGN_PARTNER" subSource={prd.designPartnerOrigin} small />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExportOne(prd)
                    }}
                    className="px-2 py-1 rounded text-xs border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
                  >
                    Export .docx
                  </button>
                </div>
                {expandedId === prd.id && (
                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1">User story</label>
                      <textarea
                        value={prd.userStory}
                        onChange={(e) => savePrd(prd.id, { userStory: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1">Acceptance criteria (one per line)</label>
                      <textarea
                        value={prd.acceptanceCriteria.join('\n')}
                        onChange={(e) =>
                          savePrd(prd.id, {
                            acceptanceCriteria: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1">In scope (one per line)</label>
                      <textarea
                        value={prd.inScope.join('\n')}
                        onChange={(e) =>
                          savePrd(prd.id, {
                            inScope: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1">Out of scope (one per line)</label>
                      <textarea
                        value={prd.outOfScope.join('\n')}
                        onChange={(e) =>
                          savePrd(prd.id, {
                            outOfScope: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1">Dependencies (comma-separated)</label>
                      <input
                        value={prd.dependencies.join(', ')}
                        onChange={(e) =>
                          savePrd(prd.id, {
                            dependencies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
