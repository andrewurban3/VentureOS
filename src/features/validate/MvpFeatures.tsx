import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import { buildMvpFeatureBlocks } from '@/agents/validate/mvpFeatureGenerator'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { Link } from 'react-router-dom'
import type { MvpFeatureItem, MoscowPriority, ComplexityEstimate, MvpFeatureScope } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const MOSCOW_COLORS: Record<MoscowPriority, string> = {
  'Must Have': '#EF4444',
  'Should Have': '#F59E0B',
  'Nice to Have': '#10B981',
}

const COMPLEXITY_COLORS: Record<ComplexityEstimate, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
}

const MOSCOW_OPTIONS: MoscowPriority[] = ['Must Have', 'Should Have', 'Nice to Have']
const COMPLEXITY_OPTIONS: ComplexityEstimate[] = ['Low', 'Medium', 'High']
const SCOPE_OPTIONS: MvpFeatureScope[] = ['mvp', 'roadmap']

export function MvpFeatures() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<{ name: string; description: string }>({ name: '', description: '' })

  const featureList = venture?.mvpFeatureList
  const features = featureList?.features ?? []
  const hasFeedback = !!venture?.designPartnerFeedbackSummary

  const candidates = venture?.designPartnerPipeline?.candidates ?? []
  const partnerNameMap = new Map(candidates.map((c) => [c.id, c.companyName]))

  const saveFeatures = (next: MvpFeatureItem[]) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, {
      mvpFeatureList: {
        features: next,
        generatedAt: featureList?.generatedAt ?? new Date().toISOString(),
      },
    })
  }

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildMvpFeatureBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON with a "features" array. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate the ranked MVP feature list.' }],
        maxTokens: 4000,
      })

      const result = parseJsonFromResponse<{
        features: Omit<MvpFeatureItem, 'id' | 'source' | 'addedAt'>[]
      }>(resp.text)

      const now = new Date().toISOString()
      const withIds: MvpFeatureItem[] = (result.features ?? []).map((f) => ({
        ...f,
        id: crypto.randomUUID(),
        scope: (f as { scope?: MvpFeatureScope }).scope ?? 'mvp',
        source: 'AI_SYNTHESIS' as const,
        addedAt: now,
      }))

      updateVenture(activeVentureId, {
        mvpFeatureList: { features: withIds, generatedAt: now },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate MVP features')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (id: string) => {
    saveFeatures(features.filter((f) => f.id !== id))
  }

  const handleCycleMoscow = (id: string) => {
    saveFeatures(
      features.map((f) => {
        if (f.id !== id) return f
        const idx = MOSCOW_OPTIONS.indexOf(f.moscow)
        return { ...f, moscow: MOSCOW_OPTIONS[(idx + 1) % MOSCOW_OPTIONS.length] }
      })
    )
  }

  const handleCycleComplexity = (id: string) => {
    saveFeatures(
      features.map((f) => {
        if (f.id !== id) return f
        const idx = COMPLEXITY_OPTIONS.indexOf(f.complexity)
        return { ...f, complexity: COMPLEXITY_OPTIONS[(idx + 1) % COMPLEXITY_OPTIONS.length] }
      })
    )
  }

  const startEdit = (f: MvpFeatureItem) => {
    setEditingId(f.id)
    setEditDraft({ name: f.name, description: f.description })
  }

  const commitEdit = () => {
    if (!editingId || !editDraft.name.trim()) return
    saveFeatures(
      features.map((f) =>
        f.id === editingId ? { ...f, name: editDraft.name.trim(), description: editDraft.description.trim() } : f
      )
    )
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const handleCycleScope = (id: string) => {
    saveFeatures(
      features.map((f) => {
        if (f.id !== id) return f
        const scope = (f.scope ?? 'mvp') as MvpFeatureScope
        const idx = SCOPE_OPTIONS.indexOf(scope)
        return { ...f, scope: SCOPE_OPTIONS[(idx + 1) % SCOPE_OPTIONS.length] }
      })
    )
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">MVP Features</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">MVP Feature List</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Ranked features for your minimum viable product, synthesised from design partner feedback.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        {!featureList && (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            {hasFeedback ? (
              <>
                <p className="text-[var(--text-primary)] mb-4">
                  Generate a ranked MVP feature list from your design partner feedback and solution definition.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate MVP Features'}
                </button>
                {loading && (
                  <p className="mt-3 text-sm text-[var(--text-muted)] animate-pulse">
                    Analysing feedback and building your feature list...
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[var(--text-muted)] mb-2">No feedback summary found.</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Complete the Design Partner Feedback Summary first — the MVP feature list is synthesised from partner feedback.
                </p>
              </>
            )}
          </div>
        )}

        {featureList && (
          <>
            <div className="rounded-xl p-6 mb-4" style={CARD}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-semibold text-lg">Features</h3>
                  <SourceChip source="AI_SYNTHESIS" small />
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(featureList.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)] cursor-pointer hover:bg-[rgba(16,185,129,0.25)]"
                  >
                    Add Feature
                  </button>
                </div>
              </div>
            </div>

            {features.length > 0 ? (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'rgba(124,106,247,0.08)' }}>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">#</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Feature</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Partners</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Scope</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">MoSCoW</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Complexity</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Source</th>
                      <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((f, i) => (
                      <tr key={f.id} style={{ borderTop: '1px solid var(--border)' }}>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">{i + 1}</td>
                        <td className="px-4 py-3 max-w-[280px]">
                          {editingId === f.id ? (
                            <div className="space-y-1">
                              <input
                                value={editDraft.name}
                                onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                                className="w-full px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[var(--accent-primary)]"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') commitEdit()
                                  if (e.key === 'Escape') cancelEdit()
                                }}
                              />
                              <textarea
                                value={editDraft.description}
                                onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                                rows={2}
                                className="w-full px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent-primary)] resize-none"
                              />
                              <div className="flex gap-1">
                                <button onClick={commitEdit} className="text-[10px] text-[#10B981] hover:underline">Save</button>
                                <button onClick={cancelEdit} className="text-[10px] text-[var(--text-muted)] hover:underline">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer hover:opacity-80"
                              onClick={() => startEdit(f)}
                              title="Click to edit"
                            >
                              <div className="font-medium text-[var(--text-primary)]">{f.name}</div>
                              <div className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{f.description}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {f.requestedByPartnerIds?.length
                            ? f.requestedByPartnerIds.map((pid) => {
                                const name = partnerNameMap.get(pid) ?? pid.slice(0, 8)
                                return (
                                  <Link
                                    key={pid}
                                    to={`/validate/design-partners?highlight=${pid}`}
                                    className="text-[var(--accent-secondary)] hover:underline mr-1"
                                  >
                                    {name}
                                  </Link>
                                )
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCycleScope(f.id)}
                            title="Click to toggle MVP vs Roadmap"
                            className="text-[10px] px-2 py-1 rounded-full font-medium border-none cursor-pointer capitalize"
                            style={{
                              background: ((f.scope ?? 'mvp') === 'mvp' ? 'rgba(16,185,129,0.18)' : 'rgba(124,106,247,0.18)'),
                              color: ((f.scope ?? 'mvp') === 'mvp' ? '#10B981' : 'var(--accent-primary)'),
                              border: `1px solid ${((f.scope ?? 'mvp') === 'mvp' ? 'rgba(16,185,129,0.4)' : 'rgba(124,106,247,0.4)')}`,
                            }}
                          >
                            {(f.scope ?? 'mvp')}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCycleMoscow(f.id)}
                            title="Click to cycle"
                            className="text-[10px] px-2 py-1 rounded-full font-medium border-none cursor-pointer"
                            style={{
                              background: `${MOSCOW_COLORS[f.moscow]}18`,
                              color: MOSCOW_COLORS[f.moscow],
                              border: `1px solid ${MOSCOW_COLORS[f.moscow]}40`,
                            }}
                          >
                            {f.moscow}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleCycleComplexity(f.id)}
                            title="Click to cycle"
                            className="text-[10px] px-2 py-1 rounded-full font-medium border-none cursor-pointer"
                            style={{
                              background: `${COMPLEXITY_COLORS[f.complexity]}18`,
                              color: COMPLEXITY_COLORS[f.complexity],
                              border: `1px solid ${COMPLEXITY_COLORS[f.complexity]}40`,
                            }}
                          >
                            {f.complexity}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <SourceChip source={f.source} small />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleRemove(f.id)}
                            className="text-[10px] text-[#EF4444] hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl p-8 text-center" style={CARD}>
                <p className="text-[var(--text-muted)]">No features yet. Generate or add manually.</p>
              </div>
            )}
          </>
        )}

        {showAdd && (
          <AddFeatureModal
            role={role}
            onSave={(f) => {
              const now = new Date().toISOString()
              const newFeature: MvpFeatureItem = {
                ...f,
                id: crypto.randomUUID(),
                source: role === 'founder' ? 'FOUNDER' : 'VL',
                addedAt: now,
              }
              saveFeatures([...features, newFeature])
              setShowAdd(false)
            }}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </div>
    </div>
  )
}

function AddFeatureModal({
  role,
  onSave,
  onCancel,
}: {
  role: string
  onSave: (f: Omit<MvpFeatureItem, 'id' | 'source' | 'addedAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [moscow, setMoscow] = useState<MoscowPriority>('Should Have')
  const [complexity, setComplexity] = useState<ComplexityEstimate>('Medium')
  const [scope, setScope] = useState<MvpFeatureScope>('mvp')

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim(),
      moscow,
      complexity,
      scope,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4 space-y-4" style={{ ...CARD, background: 'rgba(30,26,46,0.98)' }}>
        <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Add Feature</h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Feature name *"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description *"
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-none"
        />

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">Scope</label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as MvpFeatureScope)}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm cursor-pointer"
            >
              <option value="mvp">MVP</option>
              <option value="roadmap">Roadmap</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">MoSCoW Priority</label>
            <select
              value={moscow}
              onChange={(e) => setMoscow(e.target.value as MoscowPriority)}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm cursor-pointer"
            >
              {MOSCOW_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-[var(--text-muted)] mb-1">Complexity</label>
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as ComplexityEstimate)}
              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm cursor-pointer"
            >
              {COMPLEXITY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[10px] text-[var(--text-muted)]">
          Source: <span className="text-[var(--text-primary)]">{role === 'founder' ? 'Founder' : 'Venture Lead'}</span>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-xs font-medium bg-transparent text-[var(--text-muted)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !description.trim()}
            className="px-4 py-2 rounded text-xs font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
