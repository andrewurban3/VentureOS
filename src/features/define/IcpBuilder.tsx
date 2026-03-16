import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildIcpSystemBlocks, buildIcpRefinementBlocks } from '@/agents/define/icp-builder'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type { IcpDocument } from '@/types/venture'

function parseFieldValue(raw: string): { displayText: string; isHypothesis: boolean } {
  const hypothesisMatch = raw?.match(/^\[Hypothesis\]\s*(.*)$/i)
  if (hypothesisMatch) {
    return { displayText: hypothesisMatch[1].trim() || '—', isHypothesis: true }
  }
  return { displayText: raw?.trim() || '—', isHypothesis: false }
}

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
}

const SEVERITY_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
}

function SeverityBadge({ level }: { level: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{
        background: `${SEVERITY_COLORS[level] ?? '#8B87A8'}20`,
        color: SEVERITY_COLORS[level] ?? '#8B87A8',
      }}
    >
      {level}
    </span>
  )
}

const SIMPLE_FIELDS: { key: keyof IcpDocument; label: string }[] = [
  { key: 'companySize', label: 'Company Size' },
  { key: 'buyerRole', label: 'Primary Buyer Role' },
  { key: 'decisionMakingUnit', label: 'Decision-Making Unit' },
  { key: 'currentAlternatives', label: 'Current Alternatives' },
  { key: 'willingnessToPay', label: 'Willingness to Pay' },
]

export function IcpBuilder() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [refining, setRefining] = useState(false)

  const icp = venture?.icpDocument
  const hasIntakeData = (venture?.ideaIntake?.dimensionCoverage?.filter(
    (d) => d.status !== 'not_started'
  ).length ?? 0) > 0

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = buildIcpSystemBlocks(venture)
      const result = await anthropicProvider.chatWithStructuredOutput<IcpDocument>({
        systemPrompt: systemBlocks,
        messages: [{ role: 'user', content: 'Generate the ICP document.' }],
        maxTokens: 3000,
      })
      updateVenture(activeVentureId, {
        icpDocument: { ...result, generatedAt: new Date().toISOString(), source: 'AI_SYNTHESIS' },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate ICP')
    } finally {
      setLoading(false)
    }
  }

  const handleRefine = async () => {
    if (!venture || !activeVentureId || !feedback.trim()) return
    setApiError(null)
    setRefining(true)
    try {
      const systemBlocks = buildIcpRefinementBlocks(venture, feedback.trim())
      const result = await anthropicProvider.chatWithStructuredOutput<IcpDocument>({
        systemPrompt: systemBlocks,
        messages: [{ role: 'user', content: feedback.trim() }],
        maxTokens: 3000,
      })
      const notes = role === 'founder'
        ? { founderNotes: [venture.icpDocument?.founderNotes, feedback.trim()].filter(Boolean).join('\n') }
        : { vlNotes: [venture.icpDocument?.vlNotes, feedback.trim()].filter(Boolean).join('\n') }
      updateVenture(activeVentureId, {
        icpDocument: { ...result, ...notes, generatedAt: new Date().toISOString(), source: 'AI_SYNTHESIS' },
      })
      setFeedback('')
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to refine ICP')
    } finally {
      setRefining(false)
    }
  }

  const painPointsArray = icp
    ? typeof icp.painPoints === 'string'
      ? null
      : icp.painPoints
    : null
  const painPointsLegacy = icp && typeof icp.painPoints === 'string' ? icp.painPoints : null

  const buyingChars = icp?.buyingCharacteristics
  const buyingTriggerLegacy = icp && !buyingChars ? icp.buyingTrigger ?? null : null

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">ICP Builder</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Build a structured Ideal Customer Profile from your Idea Intake conversation.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        {!icp && (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            {hasIntakeData ? (
              <>
                <p className="text-[var(--text-primary)] mb-4">
                  Ready to generate your ICP from Idea Intake data.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate ICP'}
                </button>
                {loading && (
                  <p className="mt-3 text-sm text-[var(--text-muted)] animate-pulse">
                    Synthesizing ICP from your intake dimensions...
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[var(--text-muted)] mb-2">No Idea Intake data found.</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Complete the Idea Intake first — the ICP will be generated from that conversation.
                </p>
              </>
            )}
          </div>
        )}

        {icp && (
          <>
            <div className="rounded-xl p-6 space-y-5" style={CARD}>
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg">Ideal Customer Profile</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(icp.generatedAt).toLocaleString()}
                  </span>
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>

              {/* ── Industry + Segments ── */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                      Industry / Vertical
                    </label>
                    <SourceChip source={icp.industry?.startsWith('[Hypothesis]') ? 'AI_SYNTHESIS' : 'FOUNDER'} small />
                  </div>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {parseFieldValue(icp.industry).displayText}
                  </p>
                </div>

                {icp.industrySegments && icp.industrySegments.length > 0 && (
                  <div className="space-y-2 pl-3 border-l-2 border-[rgba(124,106,247,0.3)]">
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Target Segments</span>
                    {icp.industrySegments.map((seg, i) => (
                      <div key={i} className="space-y-0.5">
                        <p className="text-sm text-[var(--text-primary)] font-medium">{seg.segment}</p>
                        <p className="text-xs text-[var(--text-muted)]">{seg.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Simple fields grid ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SIMPLE_FIELDS.map(({ key, label }) => {
                  const raw = (icp as unknown as Record<string, string>)[key] || ''
                  const { displayText, isHypothesis } = parseFieldValue(raw)
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="block text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                          {label}
                        </label>
                        <SourceChip source={isHypothesis ? 'AI_SYNTHESIS' : 'FOUNDER'} small />
                      </div>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {displayText}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* ── Pain Points ── */}
              <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Pain Points</span>

                {painPointsArray && painPointsArray.length > 0 ? (
                  <div className="space-y-3">
                    {painPointsArray.map((pp, i) => (
                      <div key={i} className="rounded-lg p-3" style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}>
                        <div className="flex items-start gap-2">
                          <SeverityBadge level={pp.severity} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[var(--text-primary)] font-medium">{pp.pain}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">{pp.evidence}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : painPointsLegacy ? (
                  <div className="space-y-1">
                    <SourceChip source={painPointsLegacy.startsWith('[Hypothesis]') ? 'AI_SYNTHESIS' : 'FOUNDER'} small />
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                      {parseFieldValue(painPointsLegacy).displayText}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">—</p>
                )}
              </div>

              {/* ── Buying Characteristics ── */}
              <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Buying Characteristics</span>
                <p className="text-[10px] text-[var(--text-muted)] -mt-1">Observable signals that identify a company as a potential customer</p>

                {buyingChars && buyingChars.length > 0 ? (
                  <div className="space-y-2">
                    {buyingChars.map((bc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <SeverityBadge level={bc.importance} />
                        <span className="text-sm text-[var(--text-primary)]">{bc.characteristic}</span>
                      </div>
                    ))}
                  </div>
                ) : buyingTriggerLegacy ? (
                  <div className="space-y-1">
                    <SourceChip source={buyingTriggerLegacy.startsWith('[Hypothesis]') ? 'AI_SYNTHESIS' : 'FOUNDER'} small />
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                      {parseFieldValue(buyingTriggerLegacy).displayText}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">—</p>
                )}
              </div>
            </div>

            {/* ── Notes ── */}
            {(icp.founderNotes || icp.vlNotes) && (
              <div className="rounded-xl p-6 space-y-3" style={CARD}>
                <h3 className="font-heading font-semibold text-sm">Notes</h3>
                {icp.founderNotes && (
                  <div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10B981]">FOUNDER</span>
                    <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap">{icp.founderNotes}</p>
                  </div>
                )}
                {icp.vlNotes && (
                  <div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)]">VL</span>
                    <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap">{icp.vlNotes}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Refine ── */}
            <div className="rounded-xl p-6" style={CARD}>
              <h3 className="font-heading font-semibold text-sm mb-3">Refine ICP</h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Provide corrections or additional context and the ICP will be updated.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={role === 'founder'
                    ? 'e.g. "Our buyer is actually the VP of Compliance, not the CFO"'
                    : 'e.g. "Focus on mid-market companies with 500-2000 employees"'}
                  className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && !refining && feedback.trim() && handleRefine()}
                />
                <button
                  onClick={handleRefine}
                  disabled={refining || !feedback.trim()}
                  className="px-5 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {refining ? 'Updating...' : 'Update ICP'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
