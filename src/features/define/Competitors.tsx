import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import {
  buildCompetitorSystemBlocks,
  buildCompetitorRefreshBlocks,
} from '@/agents/define/competitor-analysis'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type { CompetitorProfile, CompetitorAnalysis, VentureCitation } from '@/types/venture'

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
}

const THREAT_COLORS: Record<string, string> = {
  High: '#EF4444',
  Medium: '#F59E0B',
  Low: '#10B981',
}

const CATEGORY_COLORS: Record<string, string> = {
  Direct: '#EF4444',
  Adjacent: '#F59E0B',
  Emerging: '#4F9CF9',
  'Do Nothing': '#8B87A8',
}

/** Strip AI citation markers from text (e.g. <cite index="1">) that appear as raw text */
function stripCiteTags(text: string | undefined): string {
  if (!text) return ''
  return text
    .replace(/<cite[^>]*>[\s\S]*?<\/cite>/gi, '')
    .replace(/<cite[^>]*\/?>/gi, '')
    .trim()
}

function CategoryTag({ category }: { category: string }) {
  return (
    <span
      className="text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{
        background: `${CATEGORY_COLORS[category] ?? '#8B87A8'}20`,
        color: CATEGORY_COLORS[category] ?? '#8B87A8',
      }}
    >
      {category}
    </span>
  )
}

function ThreatBadge({ level }: { level: string }) {
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
      style={{
        background: `${THREAT_COLORS[level] ?? '#8B87A8'}20`,
        color: THREAT_COLORS[level] ?? '#8B87A8',
      }}
    >
      {level}
    </span>
  )
}

function CitationChip({ cite }: { cite: { url: string; title: string } }) {
  return (
    <a
      href={cite.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono no-underline hover:opacity-80"
      style={{
        background: 'rgba(14,165,233,0.12)',
        color: '#0EA5E9',
        border: '1px solid rgba(14,165,233,0.3)',
      }}
    >
      <span>↗</span> {cite.title}
    </a>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
        {label}
      </span>
      <p className="text-sm text-[var(--text-primary)] leading-relaxed">{stripCiteTags(value) || '—'}</p>
    </div>
  )
}

/* ── Detail card shown when a table row is expanded ── */
function CompetitorDetail({
  comp,
  role,
  onComment,
}: {
  comp: CompetitorProfile
  role: string
  onComment: (id: string, comment: string) => void
}) {
  const [comment, setComment] = useState('')

  return (
    <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)] pt-4" style={{ background: 'rgba(20,16,36,0.5)' }}>
      {/* Header row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-heading font-semibold text-base text-[var(--text-primary)]">{comp.name}</span>
        <SourceChip source={comp.source} small />
        <CategoryTag category={comp.category} />
        <ThreatBadge level={comp.threatLevel} />
        {comp.websiteUrl && (
          <a
            href={comp.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs no-underline hover:underline"
            style={{ color: '#0EA5E9' }}
          >
            {comp.websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')} ↗
          </a>
        )}
      </div>

      {/* Value proposition */}
      {comp.valueProposition && (
        <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.15)' }}>
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Value Proposition</span>
          <p className="text-sm text-[var(--text-primary)] mt-1">{stripCiteTags(comp.valueProposition)}</p>
        </div>
      )}

      {/* Core info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <Field label="Target ICP" value={comp.targetIcp} />
        <Field label="Funding / Scale" value={comp.fundingScale} />
        <Field label="Key Strengths" value={comp.keyStrengths} />
        <Field label="Key Weaknesses" value={comp.keyWeaknesses} />
        <Field label="Pricing Model" value={comp.pricingModel} />
        <Field label="Threat Rationale" value={comp.threatRationale} />
      </div>

      {/* Feature comparison table */}
      {comp.featureComparison && comp.featureComparison.length > 0 && (
        <div>
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-2">Feature Comparison</span>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(124,106,247,0.08)' }}>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Feature</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: '#10B981' }}>Us</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: '#F59E0B' }}>Them</th>
                </tr>
              </thead>
              <tbody>
                {comp.featureComparison.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{stripCiteTags(row.feature)}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{stripCiteTags(row.us)}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">{stripCiteTags(row.them)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Competitor summary */}
      {comp.competitorSummary && (
        <div className="pt-2 border-t border-[var(--border)]">
          <Field label="How They Compete" value={comp.competitorSummary} />
        </div>
      )}

      {/* Our differentiation */}
      <div className="pt-2 border-t border-[var(--border)]">
        <Field label="Our Differentiation" value={comp.ourDifferentiation} />
      </div>

      {/* Per-competitor citations */}
      {comp.citations && comp.citations.length > 0 && (
        <div className="pt-2 border-t border-[var(--border)]">
          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide block mb-1.5">Sources</span>
          <div className="flex flex-wrap gap-1.5">
            {comp.citations.map((c, ci) => (
              <CitationChip key={ci} cite={{ url: c.url, title: c.title }} />
            ))}
          </div>
        </div>
      )}

      {/* Founder / VL comments */}
      {(comp.founderComments || comp.vlNotes) && (
        <div className="pt-2 border-t border-[var(--border)] space-y-2">
          {comp.founderComments && (
            <div>
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10B981]">FOUNDER</span>
              <p className="text-xs text-[var(--text-primary)] mt-1">{comp.founderComments}</p>
            </div>
          )}
          {comp.vlNotes && (
            <div>
              <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)]">VL</span>
              <p className="text-xs text-[var(--text-primary)] mt-1">{comp.vlNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Add comment */}
      <div className="pt-2 border-t border-[var(--border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={role === 'founder' ? 'Add a correction or comment...' : 'Add VL notes...'}
            className="flex-1 px-3 py-2 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-xs"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && comment.trim()) {
                onComment(comp.id, comment.trim())
                setComment('')
              }
            }}
          />
          <button
            onClick={() => {
              if (comment.trim()) {
                onComment(comp.id, comment.trim())
                setComment('')
              }
            }}
            disabled={!comment.trim()}
            className="px-3 py-2 rounded text-xs font-medium bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Reject modal ── */
function RejectModal({
  compName,
  onConfirm,
  onCancel,
}: {
  compName: string
  onConfirm: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4 space-y-4" style={{ ...CARD, background: 'rgba(30,26,46,0.98)' }}>
        <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">
          Reject "{compName}" as a competitor?
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Provide a reason so future analysis excludes this company.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Not in our market segment, they serve a different industry..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-none"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-xs font-medium bg-transparent text-[var(--text-muted)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded text-xs font-medium text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#EF4444' }}
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ── */
export function Competitors() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)

  const analysis = venture?.competitorAnalysis
  const competitors = analysis?.competitors ?? []
  const hasIntakeData = (venture?.ideaIntake?.dimensionCoverage?.filter(
    (d) => d.status !== 'not_started'
  ).length ?? 0) > 0

  const active = competitors.filter((c) => c.status !== 'rejected')
  const rejected = competitors.filter((c) => c.status === 'rejected')
  const rejectingComp = rejectingId ? competitors.find((c) => c.id === rejectingId) : null

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = buildCompetitorSystemBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Identify and profile competitors for this venture.' }],
        maxTokens: 8000,
        tools: [WEB_SEARCH_TOOL],
      })

      const result = parseJsonFromResponse<CompetitorAnalysis>(resp.text)
      const withIds = result.competitors.map((c) => ({
        ...c,
        id: crypto.randomUUID(),
        source: 'AI_RESEARCH' as const,
        status: 'pending' as const,
      }))

      const webCites = resp.webCitations.map((c) => ({ url: c.url, title: c.title, excerpt: c.citedText || undefined }))
      const ventureCites: VentureCitation[] = resp.webCitations.map((c) => ({
        id: crypto.randomUUID(),
        source: 'AI_RESEARCH' as const,
        title: c.title,
        url: c.url,
        excerpt: c.citedText || undefined,
        context: 'competitor-analysis',
        generatedAt: new Date().toISOString(),
      }))

      updateVenture(activeVentureId, {
        competitorAnalysis: {
          competitors: withIds,
          landscapeSummary: result.landscapeSummary,
          citations: webCites,
          generatedAt: new Date().toISOString(),
        },
        ...(ventureCites.length ? { citations: [...(venture.citations ?? []), ...ventureCites] } : {}),
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate competitor analysis')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setRefreshing(true)
    try {
      const accepted = competitors.filter((c) => c.status === 'accepted')
      const rejectedComps = competitors.filter((c) => c.status === 'rejected')
      const systemBlocks = buildCompetitorRefreshBlocks(
        venture,
        accepted,
        rejectedComps,
        feedback.trim() || undefined
      )
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: feedback.trim() || 'Update and expand the competitor analysis.' }],
        maxTokens: 8000,
        tools: [WEB_SEARCH_TOOL],
      })

      const result = parseJsonFromResponse<CompetitorAnalysis>(resp.text)
      const newComps = result.competitors.map((c) => {
        const existing = accepted.find((a) => a.name.toLowerCase() === c.name.toLowerCase())
        return {
          ...c,
          id: existing?.id || crypto.randomUUID(),
          source: 'AI_RESEARCH' as const,
          status: existing ? ('accepted' as const) : ('pending' as const),
          founderComments: existing?.founderComments,
          vlNotes: existing?.vlNotes,
        }
      })

      const webCites = resp.webCitations.map((c) => ({ url: c.url, title: c.title, excerpt: c.citedText || undefined }))
      const ventureCites: VentureCitation[] = resp.webCitations.map((c) => ({
        id: crypto.randomUUID(),
        source: 'AI_RESEARCH' as const,
        title: c.title,
        url: c.url,
        excerpt: c.citedText || undefined,
        context: 'competitor-analysis',
        generatedAt: new Date().toISOString(),
      }))

      updateVenture(activeVentureId, {
        competitorAnalysis: {
          competitors: [...newComps, ...rejectedComps],
          landscapeSummary: result.landscapeSummary,
          citations: webCites,
          generatedAt: new Date().toISOString(),
        },
        ...(ventureCites.length ? { citations: [...(venture.citations ?? []), ...ventureCites] } : {}),
      })
      setFeedback('')
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to refresh competitor analysis')
    } finally {
      setRefreshing(false)
    }
  }

  const handleAccept = (compId: string) => {
    if (!activeVentureId || !analysis) return
    const updated = analysis.competitors.map((c) =>
      c.id === compId ? { ...c, status: 'accepted' as const } : c
    )
    updateVenture(activeVentureId, {
      competitorAnalysis: { ...analysis, competitors: updated },
    })
  }

  const handleReject = (compId: string, reason: string) => {
    if (!activeVentureId || !analysis) return
    const updated = analysis.competitors.map((c) =>
      c.id === compId
        ? { ...c, status: 'rejected' as const, rejectionReason: reason, rejectedBy: role === 'founder' ? 'founder' as const : 'venture-lead' as const }
        : c
    )
    updateVenture(activeVentureId, {
      competitorAnalysis: { ...analysis, competitors: updated },
    })
    setRejectingId(null)
    if (expandedId === compId) setExpandedId(null)
  }

  const handleRestore = (compId: string) => {
    if (!activeVentureId || !analysis) return
    const updated = analysis.competitors.map((c) =>
      c.id === compId ? { ...c, status: 'pending' as const, rejectionReason: undefined, rejectedBy: undefined } : c
    )
    updateVenture(activeVentureId, {
      competitorAnalysis: { ...analysis, competitors: updated },
    })
  }

  const handleComment = (compId: string, comment: string) => {
    if (!activeVentureId || !analysis) return
    const updated = analysis.competitors.map((c) => {
      if (c.id !== compId) return c
      if (role === 'founder') {
        return { ...c, founderComments: [c.founderComments, comment].filter(Boolean).join('\n') }
      }
      return { ...c, vlNotes: [c.vlNotes, comment].filter(Boolean).join('\n') }
    })
    updateVenture(activeVentureId, {
      competitorAnalysis: { ...analysis, competitors: updated },
    })
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Competitor Analysis</h1>
          <p className="text-sm text-[var(--text-muted)]">
            AI-powered competitive landscape analysis using web research.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        {/* Reject modal */}
        {rejectingComp && (
          <RejectModal
            compName={rejectingComp.name}
            onConfirm={(reason) => handleReject(rejectingComp.id, reason)}
            onCancel={() => setRejectingId(null)}
          />
        )}

        {/* Empty state */}
        {competitors.length === 0 && (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            {hasIntakeData ? (
              <>
                <p className="text-[var(--text-primary)] mb-4">
                  Ready to analyze the competitive landscape for this venture.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Researching...' : 'Run Competitor Analysis'}
                </button>
                {loading && (
                  <p className="mt-3 text-sm text-[var(--text-muted)] animate-pulse">
                    Researching competitors using web search...
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[var(--text-muted)] mb-2">No Idea Intake data found.</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Complete the Idea Intake first so the AI can identify relevant competitors.
                </p>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {active.length > 0 && (
          <>
            {/* Controls */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">
                {active.length} competitor{active.length !== 1 ? 's' : ''}
                {rejected.length > 0 && ` • ${rejected.length} rejected`}
                {' • '}
                {analysis?.generatedAt ? new Date(analysis.generatedAt).toLocaleString() : ''}
              </span>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Running...' : 'Re-run'}
              </button>
            </div>

            {/* Summary table */}
            <div className="rounded-xl overflow-hidden" style={CARD}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(124,106,247,0.06)', borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Name</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Key Features</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Recent News</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Category</th>
                    <th className="text-right px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((comp) => (
                    <tr
                      key={comp.id}
                      onClick={() => setExpandedId(expandedId === comp.id ? null : comp.id)}
                      className="cursor-pointer hover:bg-[rgba(124,106,247,0.04)]"
                      style={{ borderBottom: '1px solid var(--border)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-semibold text-[var(--text-primary)]">{comp.name}</span>
                          <SourceChip source={comp.source} small />
                          <ThreatBadge level={comp.threatLevel} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-[200px]">
                        <span className="line-clamp-2">
                          {stripCiteTags(comp.keyFeatures?.join(', ') || comp.description)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-[180px]">
                        <span className="line-clamp-2">{stripCiteTags(comp.recentNews) || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <CategoryTag category={comp.category} />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const status = comp.status || 'pending'
                          return (
                            <div className="flex items-center justify-end gap-1.5">
                              {status === 'pending' && (
                                <button
                                  onClick={() => handleAccept(comp.id)}
                                  className="px-2.5 py-1 rounded text-[10px] font-medium border-none cursor-pointer hover:opacity-90"
                                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                                >
                                  Accept
                                </button>
                              )}
                              {status === 'accepted' && (
                                <span
                                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}
                                >
                                  Accepted
                                </span>
                              )}
                              {status === 'pending' && (
                                <button
                                  onClick={() => setRejectingId(comp.id)}
                                  className="px-2.5 py-1 rounded text-[10px] font-medium border-none cursor-pointer hover:opacity-90"
                                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded detail card */}
            {expandedId && active.find((c) => c.id === expandedId) && (
              <div className="rounded-xl overflow-hidden" style={CARD}>
                <CompetitorDetail
                  comp={active.find((c) => c.id === expandedId)!}
                  role={role}
                  onComment={handleComment}
                />
              </div>
            )}

            {/* Feedback / refresh */}
            <div className="rounded-xl p-6" style={CARD}>
              <h3 className="font-heading font-semibold text-sm mb-3">
                Suggest Changes or Missing Competitors
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                {role === 'founder'
                  ? 'Know a competitor we missed? Have corrections? Share them here.'
                  : 'Add VL feedback or request specific competitor research.'}
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder='e.g. "You missed Acme Corp — they launched last year" or "Focus more on open-source alternatives"'
                  className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && !refreshing && handleRefresh()}
                />
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-5 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {refreshing ? 'Updating...' : 'Update Analysis'}
                </button>
              </div>
            </div>

            {/* Rejected competitors table */}
            {rejected.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-heading font-semibold text-sm text-[var(--text-muted)]">Rejected Competitors</h3>
                <div className="rounded-xl overflow-hidden" style={CARD}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'rgba(239,68,68,0.04)', borderBottom: '1px solid var(--border)' }}>
                        <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Name</th>
                        <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Category</th>
                        <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Rejection Reason</th>
                        <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Rejected By</th>
                        <th className="text-right px-4 py-3 text-[var(--text-muted)] font-medium text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rejected.map((comp) => (
                        <tr key={comp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-4 py-3 text-[var(--text-primary)]">{comp.name}</td>
                          <td className="px-4 py-3"><CategoryTag category={comp.category} /></td>
                          <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{comp.rejectionReason || '—'}</td>
                          <td className="px-4 py-3 text-xs text-[var(--text-muted)] capitalize">{comp.rejectedBy?.replace('-', ' ') || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleRestore(comp.id)}
                              className="px-2.5 py-1 rounded text-[10px] font-medium border-none cursor-pointer hover:opacity-90"
                              style={{ background: 'rgba(124,106,247,0.15)', color: 'var(--accent-primary)' }}
                            >
                              Restore
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
