import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { aiService } from '@/services/ai'
import { buildRiskRegisterBlocks } from '@/agents/incubate'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type { RiskRegister, RiskItem, RiskCategory, RiskLevel } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  market: '#3B82F6',
  technical: '#8B5CF6',
  organisational: '#F59E0B',
  financial: '#10B981',
  execution: '#EF4444',
}

const LEVEL_COLORS: Record<RiskLevel, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ background: `${LEVEL_COLORS[level]}22`, color: LEVEL_COLORS[level] }}
    >
      {level}
    </span>
  )
}

function CategoryBadge({ category }: { category: RiskCategory }) {
  const color = CATEGORY_COLORS[category]
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
      style={{ background: `${color}22`, color }}
    >
      {category}
    </span>
  )
}

export function RiskMitigation() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<RiskItem>>({})
  const [addingNew, setAddingNew] = useState(false)
  const [newRisk, setNewRisk] = useState<Partial<RiskItem>>({
    category: 'market',
    likelihood: 'Medium',
    impact: 'Medium',
    source: 'FOUNDER',
  })

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Risk Mitigation</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const rr = venture.riskRegister
  const risks = rr?.risks ?? []
  const canGenerate = !!(venture.ideaIntake?.messages?.length)

  const dataSources = [
    { label: 'Pressure Test Insights', filled: !!(venture.savedInsights?.length) },
    { label: 'Competitors', filled: !!(venture.competitorAnalysis?.competitors?.filter(c => (c.status || 'pending') !== 'rejected').length) },
    { label: 'Interviews', filled: !!(venture.interviews?.uploads?.length) },
    { label: 'Financial Models', filled: !!(venture.financialModels) },
    { label: 'Discover Research', filled: !!(venture.discover?.research?.length) },
  ]

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const blocks = await buildRiskRegisterBlocks(venture)
      const result = await aiService.chatWithStructuredOutput<{ risks?: unknown }>({
        systemPrompt: blocks,
        messages: [{ role: 'user', content: 'Produce a risk register for this venture.' }],
        maxTokens: 3000,
      })
      const rawRisks = Array.isArray(result.risks) ? result.risks : []
      const now = new Date().toISOString()
      const register: RiskRegister = {
        risks: rawRisks.map((r: Record<string, unknown>, i: number) => ({
          id: (r.id as string) ?? `risk-${i + 1}`,
          category: ((r.category as RiskCategory) ?? 'market') as RiskCategory,
          description: (r.description as string) ?? '',
          likelihood: ((r.likelihood as RiskLevel) ?? 'Medium') as RiskLevel,
          impact: ((r.impact as RiskLevel) ?? 'Medium') as RiskLevel,
          mitigation: (r.mitigation as string) ?? '',
          residualRisk: (r.residualRisk as string) ?? '',
          source: 'AI_SYNTHESIS' as const,
        })),
        generatedAt: now,
        founderNotes: rr?.founderNotes,
      }
      updateVenture(activeVentureId, { riskRegister: register })
      // #region agent log
      fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'RiskMitigation.tsx:handleGenerate',message:'Risk register generated OK',data:{ventureId:activeVentureId,riskCount:register.risks.length},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'RiskMitigation.tsx:handleGenerate',message:'Risk generate failed',data:{error:String(e),ventureId:activeVentureId},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setApiError(e instanceof Error ? e.message : 'Failed to generate risk register')
    } finally {
      setLoading(false)
    }
  }

  const saveRiskEdit = (riskId: string) => {
    if (!rr || !activeVentureId) return
    const updated = rr.risks.map((r) => r.id === riskId ? { ...r, ...editDraft } as RiskItem : r)
    updateVenture(activeVentureId, { riskRegister: { ...rr, risks: updated } })
    setEditingId(null)
    setEditDraft({})
  }

  const removeRisk = (riskId: string) => {
    if (!rr || !activeVentureId) return
    updateVenture(activeVentureId, { riskRegister: { ...rr, risks: rr.risks.filter((r) => r.id !== riskId) } })
  }

  const addRisk = () => {
    if (!activeVentureId || !newRisk.description) return
    const risk: RiskItem = {
      id: `risk-${crypto.randomUUID().slice(0, 8)}`,
      category: newRisk.category as RiskCategory,
      description: newRisk.description ?? '',
      likelihood: newRisk.likelihood as RiskLevel,
      impact: newRisk.impact as RiskLevel,
      mitigation: newRisk.mitigation ?? '',
      residualRisk: newRisk.residualRisk ?? '',
      source: 'FOUNDER',
    }
    const register: RiskRegister = rr
      ? { ...rr, risks: [...rr.risks, risk] }
      : { risks: [risk], generatedAt: new Date().toISOString() }
    updateVenture(activeVentureId, { riskRegister: register })
    setAddingNew(false)
    setNewRisk({ category: 'market', likelihood: 'Medium', impact: 'Medium', source: 'FOUNDER' })
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Risk Mitigation</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Structured risk register with likelihood, impact, and mitigation strategies.
          </p>
        </div>

        {apiError && <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />}

        {/* Data source indicators */}
        <div className="rounded-xl p-4" style={CARD}>
          <h3 className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wide">Data Sources</h3>
          <div className="flex flex-wrap gap-3">
            {dataSources.map((ds) => (
              <span
                key={ds.label}
                className="text-[11px] px-2.5 py-1 rounded-full"
                style={{
                  background: ds.filled ? 'rgba(16,185,129,0.12)' : 'rgba(139,135,168,0.1)',
                  color: ds.filled ? '#10B981' : '#8B87A8',
                }}
              >
                {ds.filled ? '✓' : '–'} {ds.label}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="px-6 py-2.5 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : rr ? 'Regenerate' : canGenerate ? 'Generate Risk Register' : 'Complete Intake first'}
          </button>
          <button
            onClick={() => setAddingNew(true)}
            disabled={addingNew}
            className="px-5 py-2.5 rounded-lg font-heading font-semibold text-sm border border-[var(--border)] bg-transparent text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)] disabled:opacity-50"
          >
            + Add Risk
          </button>
        </div>

        {/* Add new risk form */}
        {addingNew && (
          <div className="rounded-xl p-5 space-y-3" style={CARD}>
            <h4 className="font-heading font-semibold text-sm text-[var(--accent-primary)]">Add New Risk</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Category</label>
                <select
                  value={newRisk.category}
                  onChange={(e) => setNewRisk({ ...newRisk, category: e.target.value as RiskCategory })}
                  className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] outline-none"
                >
                  {(['market', 'technical', 'organisational', 'financial', 'execution'] as RiskCategory[]).map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Likelihood</label>
                <select
                  value={newRisk.likelihood}
                  onChange={(e) => setNewRisk({ ...newRisk, likelihood: e.target.value as RiskLevel })}
                  className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] outline-none"
                >
                  {(['High', 'Medium', 'Low'] as RiskLevel[]).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-muted)] block mb-1">Impact</label>
                <select
                  value={newRisk.impact}
                  onChange={(e) => setNewRisk({ ...newRisk, impact: e.target.value as RiskLevel })}
                  className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] outline-none"
                >
                  {(['High', 'Medium', 'Low'] as RiskLevel[]).map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Description</label>
              <textarea
                value={newRisk.description ?? ''}
                onChange={(e) => setNewRisk({ ...newRisk, description: e.target.value })}
                placeholder="Describe the risk..."
                rows={2}
                className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Mitigation Strategy</label>
              <textarea
                value={newRisk.mitigation ?? ''}
                onChange={(e) => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                placeholder="How to mitigate..."
                rows={2}
                className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Residual Risk</label>
              <input
                value={newRisk.residualRisk ?? ''}
                onChange={(e) => setNewRisk({ ...newRisk, residualRisk: e.target.value })}
                placeholder="What remains after mitigation..."
                className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addRisk} disabled={!newRisk.description} className="px-4 py-2 rounded-lg font-heading font-semibold text-xs bg-[#10B981] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50">
                Add
              </button>
              <button onClick={() => setAddingNew(false)} className="px-4 py-2 rounded-lg font-heading font-semibold text-xs border border-[var(--border)] bg-transparent text-[var(--text-muted)] cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Risk table */}
        {risks.length > 0 && (
          <div className="space-y-3">
            {risks.map((risk) => (
              <div key={risk.id} className="rounded-xl p-5" style={CARD}>
                {editingId === risk.id ? (
                  <RiskEditForm
                    risk={risk}
                    draft={editDraft}
                    onChange={setEditDraft}
                    onSave={() => saveRiskEdit(risk.id)}
                    onCancel={() => { setEditingId(null); setEditDraft({}) }}
                  />
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <CategoryBadge category={risk.category} />
                      <span className="text-[10px] text-[var(--text-muted)]">Likelihood:</span>
                      <RiskBadge level={risk.likelihood} />
                      <span className="text-[10px] text-[var(--text-muted)]">Impact:</span>
                      <RiskBadge level={risk.impact} />
                      <SourceChip source={risk.source} small className="ml-auto" />
                    </div>
                    <p className="text-sm text-[var(--text-primary)] font-medium mb-2">{risk.description}</p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <h5 className="text-[10px] text-[var(--accent-secondary)] font-semibold mb-1">Mitigation</h5>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{risk.mitigation || '—'}</p>
                      </div>
                      <div>
                        <h5 className="text-[10px] text-[var(--accent-secondary)] font-semibold mb-1">Residual Risk</h5>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed">{risk.residualRisk || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setEditingId(risk.id); setEditDraft(risk) }}
                        className="text-[10px] text-[var(--accent-primary)] cursor-pointer bg-transparent border-none hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeRisk(risk.id)}
                        className="text-[10px] text-[#EF4444] cursor-pointer bg-transparent border-none hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Founder Notes */}
        {rr && (
          <div className="rounded-xl p-5" style={CARD}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-heading font-semibold text-sm text-[var(--text-muted)]">Founder Notes</h4>
              <SourceChip source="AI_SYNTHESIS" subSource="Risk Register" small />
            </div>
            <textarea
              value={rr.founderNotes ?? ''}
              onChange={(e) =>
                updateVenture(activeVentureId!, { riskRegister: { ...rr, founderNotes: e.target.value } })
              }
              placeholder="Add notes about risks..."
              rows={3}
              className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
            />
            <span className="text-[10px] font-mono text-[var(--text-muted)] mt-2 block">
              Generated {new Date(rr.generatedAt).toLocaleString()}
            </span>
          </div>
        )}

        {risks.length === 0 && !loading && !addingNew && (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            <p className="text-sm text-[var(--text-muted)]">
              Generate a risk register or add risks manually to track and mitigate venture risks.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function RiskEditForm({
  risk,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  risk: RiskItem
  draft: Partial<RiskItem>
  onChange: (d: Partial<RiskItem>) => void
  onSave: () => void
  onCancel: () => void
}) {
  const val = <K extends keyof RiskItem>(k: K): RiskItem[K] => (draft[k] ?? risk[k]) as RiskItem[K]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Category</label>
          <select
            value={val('category')}
            onChange={(e) => onChange({ ...draft, category: e.target.value as RiskCategory })}
            className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] outline-none"
          >
            {(['market', 'technical', 'organisational', 'financial', 'execution'] as RiskCategory[]).map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Likelihood</label>
          <select
            value={val('likelihood')}
            onChange={(e) => onChange({ ...draft, likelihood: e.target.value as RiskLevel })}
            className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] outline-none"
          >
            {(['High', 'Medium', 'Low'] as RiskLevel[]).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-[var(--text-muted)] block mb-1">Impact</label>
          <select
            value={val('impact')}
            onChange={(e) => onChange({ ...draft, impact: e.target.value as RiskLevel })}
            className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] outline-none"
          >
            {(['High', 'Medium', 'Low'] as RiskLevel[]).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        value={val('description')}
        onChange={(e) => onChange({ ...draft, description: e.target.value })}
        rows={2}
        className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
      />
      <textarea
        value={val('mitigation')}
        onChange={(e) => onChange({ ...draft, mitigation: e.target.value })}
        placeholder="Mitigation..."
        rows={2}
        className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
      />
      <input
        value={val('residualRisk')}
        onChange={(e) => onChange({ ...draft, residualRisk: e.target.value })}
        placeholder="Residual risk..."
        className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
      />
      <div className="flex gap-2">
        <button onClick={onSave} className="px-4 py-2 rounded-lg font-heading font-semibold text-xs bg-[#10B981] text-white border-none cursor-pointer hover:opacity-90">Save</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg font-heading font-semibold text-xs border border-[var(--border)] bg-transparent text-[var(--text-muted)] cursor-pointer">Cancel</button>
      </div>
    </div>
  )
}
