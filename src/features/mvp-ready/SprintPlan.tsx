import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildSprintPlanBlocks, parseSprintPlanResponse } from '@/agents/mvp-ready/sprintPlan'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { createSprintPlanDocx } from '@/services/export'
import type { SprintPlan, SprintPlanSprint, SprintPlanAssumption } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function SprintPlanFeature() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const plan = venture?.sprintPlan

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildSprintPlanBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON with "sprints" and "assumptions" arrays. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate the sprint plan.' }],
        maxTokens: 4000,
      })
      const { sprints, assumptions } = parseSprintPlanResponse(resp.text)
      const now = new Date().toISOString()
      updateVenture(activeVentureId, {
        sprintPlan: {
          sprints,
          assumptions,
          generatedAt: now,
          source: 'AI_SYNTHESIS',
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate sprint plan')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanChange = (updates: Partial<SprintPlan>) => {
    if (!plan || !activeVentureId) return
    updateVenture(activeVentureId, {
      sprintPlan: { ...plan, ...updates, source: 'VL' },
    })
  }

  const handleSprintChange = (idx: number, s: SprintPlanSprint) => {
    if (!plan) return
    const next = [...plan.sprints]
    next[idx] = s
    handlePlanChange({ sprints: next })
  }

  const handleAssumptionChange = (idx: number, a: SprintPlanAssumption) => {
    if (!plan) return
    const next = [...plan.assumptions]
    next[idx] = a
    handlePlanChange({ assumptions: next })
  }

  const handleExportDocx = () => {
    if (!venture || !plan) return
    createSprintPlanDocx(venture.name.value, plan).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-sprint-plan.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Sprint Plan</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Sprint Plan</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Sprint-by-sprint delivery plan and assumptions from Feature PRDs and MVP features.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : plan ? 'Regenerate' : 'Generate Sprint Plan'}
          </button>
          {plan && (
            <button
              onClick={handleExportDocx}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Export .docx
            </button>
          )}
        </div>

        {plan && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <h2 className="font-heading font-semibold text-lg">Sprint Plan</h2>
              <SourceChip source={plan.source} />
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(plan.generatedAt).toLocaleString()}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">Assumptions</h3>
              <div className="space-y-2">
                {plan.assumptions.map((a, idx) => (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <input
                      value={a.label}
                      onChange={(e) => handleAssumptionChange(idx, { ...a, label: e.target.value })}
                      placeholder="Label"
                      className="w-32 px-2 py-1 rounded bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
                    />
                    <input
                      value={a.value}
                      onChange={(e) => handleAssumptionChange(idx, { ...a, value: e.target.value })}
                      placeholder="Value"
                      className="flex-1 min-w-0 px-2 py-1 rounded bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
                    />
                    <SourceChip source={a.source} small />
                  </div>
                ))}
              </div>
            </div>

            <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">Sprints</h3>
            <div className="space-y-4">
              {plan.sprints.map((sprint, idx) => (
                <div
                  key={idx}
                  className="rounded-lg p-4"
                  style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                >
                  <div className="grid gap-2 text-sm mb-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-[var(--text-muted)]">Sprint</span>
                      <input
                        type="number"
                        value={sprint.sprintNumber}
                        onChange={(e) =>
                          handleSprintChange(idx, {
                            ...sprint,
                            sprintNumber: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-16 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                      <span className="text-[var(--text-muted)]">Duration (weeks)</span>
                      <input
                        type="number"
                        value={sprint.durationWeeks}
                        onChange={(e) =>
                          handleSprintChange(idx, {
                            ...sprint,
                            durationWeeks: parseInt(e.target.value, 10) || 2,
                          })
                        }
                        className="w-16 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Features: </span>
                      <input
                        value={sprint.featuresInScope.join(', ')}
                        onChange={(e) =>
                          handleSprintChange(idx, {
                            ...sprint,
                            featuresInScope: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="flex-1 min-w-0 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Definition of done: </span>
                      <input
                        value={sprint.definitionOfDone}
                        onChange={(e) => handleSprintChange(idx, { ...sprint, definitionOfDone: e.target.value })}
                        className="flex-1 min-w-0 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] w-full"
                      />
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Acceptance criteria: </span>
                      <input
                        value={sprint.acceptanceCriteria.join('; ')}
                        onChange={(e) =>
                          handleSprintChange(idx, {
                            ...sprint,
                            acceptanceCriteria: e.target.value.split(';').map((s) => s.trim()).filter(Boolean),
                          })
                        }
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
