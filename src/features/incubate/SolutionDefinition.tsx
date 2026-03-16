import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { aiService } from '@/services/ai'
import { buildSolutionBlocks } from '@/agents/incubate'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type { SolutionDefinition as SolutionDef } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function SolutionDefinition() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Partial<SolutionDef> | null>(null)

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Solution</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const sd = venture.solutionDefinition
  const canGenerate = !!(venture.ideaIntake?.messages?.length)

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const blocks = await buildSolutionBlocks(venture)
      const result = await aiService.chatWithStructuredOutput<Omit<SolutionDef, 'generatedAt'>>({
        systemPrompt: blocks,
        messages: [{ role: 'user', content: 'Define the solution narrative for this venture.' }],
        maxTokens: 2500,
      })
      const evidence = Array.isArray(result.evidence) ? result.evidence : []
      const now = new Date().toISOString()
      const model: SolutionDef = {
        whatItDoes: typeof result.whatItDoes === 'string' ? result.whatItDoes : '',
        differentiation: typeof result.differentiation === 'string' ? result.differentiation : '',
        whatItDoesNot: typeof result.whatItDoesNot === 'string' ? result.whatItDoesNot : '',
        tenXClaim: typeof result.tenXClaim === 'string' ? result.tenXClaim : undefined,
        evidence,
        generatedAt: now,
      }
      updateVenture(activeVentureId, { solutionDefinition: model })
      setEditing(null)
      // #region agent log
      fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'SolutionDefinition.tsx:handleGenerate',message:'Solution generated OK',data:{ventureId:activeVentureId},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7526/ingest/2e1cc1bb-e928-47a7-9500-4d4a43c53b51',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f586c6'},body:JSON.stringify({sessionId:'f586c6',location:'SolutionDefinition.tsx:handleGenerate',message:'Solution generate failed',data:{error:String(e),ventureId:activeVentureId},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      setApiError(e instanceof Error ? e.message : 'Failed to generate solution')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdits = () => {
    if (!editing || !activeVentureId || !sd) return
    updateVenture(activeVentureId, {
      solutionDefinition: { ...sd, ...editing },
    })
    setEditing(null)
  }

  const editVal = (key: keyof SolutionDef) =>
    editing?.[key] as string | undefined ?? sd?.[key] as string | undefined ?? ''

  const dataSources = [
    { label: 'Idea Intake (dim 04)', filled: !!(venture.ideaIntake?.dimensionCoverage?.find(d => d.id === '04' && d.status !== 'not_started')) },
    { label: 'ICP', filled: !!venture.icpDocument },
    { label: 'Competitors', filled: !!(venture.competitorAnalysis?.competitors?.filter(c => (c.status || 'pending') !== 'rejected').length) },
    { label: 'Strategy & Moat', filled: !!venture.strategyMoat?.assessment },
  ]

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Solution</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Define what the product does, how it differentiates, and what it explicitly does not do.
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

        {/* Generate button */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="px-6 py-2.5 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : sd ? 'Regenerate' : canGenerate ? 'Generate Solution' : 'Complete Intake first'}
          </button>
          {sd && !editing && (
            <button
              onClick={() => setEditing({})}
              className="px-5 py-2.5 rounded-lg font-heading font-semibold text-sm border border-[var(--border)] bg-transparent text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Edit
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={handleSaveEdits}
                className="px-5 py-2.5 rounded-lg font-heading font-semibold text-sm bg-[#10B981] text-white border-none cursor-pointer hover:opacity-90"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 rounded-lg font-heading font-semibold text-sm border border-[var(--border)] bg-transparent text-[var(--text-muted)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
              >
                Cancel
              </button>
            </>
          )}
        </div>

        {/* Solution content */}
        {sd && (
          <div className="space-y-4">
            <SolutionField
              label="What It Does"
              value={editVal('whatItDoes')}
              editing={!!editing}
              onChange={(v) => setEditing({ ...editing, whatItDoes: v })}
            />
            <SolutionField
              label="What Makes It Different"
              value={editVal('differentiation')}
              editing={!!editing}
              onChange={(v) => setEditing({ ...editing, differentiation: v })}
            />
            <SolutionField
              label="What It Does NOT Do"
              value={editVal('whatItDoesNot')}
              editing={!!editing}
              onChange={(v) => setEditing({ ...editing, whatItDoesNot: v })}
            />
            <SolutionField
              label="10x Improvement Claim"
              value={editVal('tenXClaim')}
              editing={!!editing}
              onChange={(v) => setEditing({ ...editing, tenXClaim: v })}
            />

            {/* Evidence */}
            <div className="rounded-xl p-5" style={CARD}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-heading font-semibold text-sm text-[var(--accent-primary)]">Evidence</h4>
                <SourceChip source="AI_SYNTHESIS" subSource="Solution" small />
              </div>
              {(editing ? (editing.evidence ?? sd.evidence) : sd.evidence)?.map((item, i) => (
                <div key={i} className="flex items-start gap-2 mb-2">
                  <span className="text-[10px] text-[var(--accent-secondary)] mt-0.5 shrink-0">•</span>
                  {editing ? (
                    <input
                      value={item}
                      onChange={(e) => {
                        const arr = [...(editing.evidence ?? sd.evidence ?? [])]
                        arr[i] = e.target.value
                        setEditing({ ...editing, evidence: arr })
                      }}
                      className="flex-1 text-sm bg-transparent border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                    />
                  ) : (
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">{item}</p>
                  )}
                </div>
              )) ?? <p className="text-xs text-[var(--text-muted)]">No evidence generated yet.</p>}
            </div>

            {/* Founder Notes */}
            <div className="rounded-xl p-5" style={CARD}>
              <h4 className="font-heading font-semibold text-sm text-[var(--text-muted)] mb-2">Founder Notes</h4>
              <textarea
                value={editing?.founderNotes ?? sd.founderNotes ?? ''}
                onChange={(e) =>
                  editing
                    ? setEditing({ ...editing, founderNotes: e.target.value })
                    : updateVenture(activeVentureId!, { solutionDefinition: { ...sd, founderNotes: e.target.value } })
                }
                placeholder="Add notes about the solution..."
                rows={3}
                className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
              />
            </div>

            <span className="text-[10px] font-mono text-[var(--text-muted)]">
              Generated {new Date(sd.generatedAt).toLocaleString()}
            </span>
          </div>
        )}

        {!sd && !loading && (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            <p className="text-sm text-[var(--text-muted)]">
              Generate a solution narrative to define what the product does, its differentiation, and scope boundaries.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function SolutionField({
  label,
  value,
  editing,
  onChange,
}: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-xl p-5" style={CARD}>
      <h4 className="font-heading font-semibold text-sm mb-2 text-[var(--accent-primary)]">{label}</h4>
      {editing ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full text-sm bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)] resize-y"
        />
      ) : (
        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{value || '—'}</p>
      )}
    </div>
  )
}
