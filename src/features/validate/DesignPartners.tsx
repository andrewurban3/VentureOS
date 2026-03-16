import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import { buildDesignPartnerScoringBlocks } from '@/agents/validate/designPartnerScoring'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type {
  DesignPartnerCandidate,
  DesignPartnerPipelineStage,
  DesignPartnerQualification,
} from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const STAGES: { key: DesignPartnerPipelineStage; label: string }[] = [
  { key: 'identified', label: 'Identified' },
  { key: 'outreach_sent', label: 'Outreach Sent' },
  { key: 'response_received', label: 'Response Received' },
  { key: 'conversation', label: 'Conversation' },
  { key: 'loi', label: 'LOI' },
  { key: 'signed', label: 'Signed' },
]

const VERDICT_COLORS: Record<string, string> = {
  'Strong Candidate': '#10B981',
  Conditional: '#F59E0B',
  'Low Priority': '#EF4444',
  Disqualify: '#6B7280',
}

function verdictBg(verdict: string): string {
  const map: Record<string, string> = {
    'Strong Candidate': 'rgba(16,185,129,0.15)',
    Conditional: 'rgba(245,158,11,0.15)',
    'Low Priority': 'rgba(239,68,68,0.15)',
    Disqualify: 'rgba(107,114,128,0.15)',
  }
  return map[verdict] ?? 'rgba(107,114,128,0.1)'
}

export function DesignPartners() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [apiError, setApiError] = useState<string | null>(null)
  const [scoringId, setScoringId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (highlightId) {
      setExpandedId(highlightId)
      requestAnimationFrame(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      setSearchParams({}, { replace: true })
    }
  }, [highlightId, setSearchParams])

  const pipeline = venture?.designPartnerPipeline
  const candidates = pipeline?.candidates ?? []

  const stageCounts = useMemo(() => {
    const counts: Record<DesignPartnerPipelineStage, number> = {
      identified: 0,
      outreach_sent: 0,
      response_received: 0,
      conversation: 0,
      loi: 0,
      signed: 0,
    }
    for (const c of candidates) counts[c.pipelineStage]++
    return counts
  }, [candidates])

  const sorted = useMemo(
    () => [...candidates].sort((a, b) => (b.qualification?.total ?? -1) - (a.qualification?.total ?? -1)),
    [candidates],
  )

  const saveCandidates = (next: DesignPartnerCandidate[]) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, {
      designPartnerPipeline: {
        candidates: next,
        generatedAt: pipeline?.generatedAt ?? new Date().toISOString(),
      },
    })
  }

  const handleStageChange = (id: string, stage: DesignPartnerPipelineStage) => {
    const now = new Date().toISOString()
    saveCandidates(candidates.map((c) => (c.id === id ? { ...c, pipelineStage: stage, updatedAt: now } : c)))
  }

  const handleScore = async (candidate: DesignPartnerCandidate) => {
    if (!venture) return
    setScoringId(candidate.id)
    setApiError(null)
    try {
      const systemBlocks = await buildDesignPartnerScoringBlocks(venture, {
        companyName: candidate.companyName,
        contactName: candidate.contactName,
        contactTitle: candidate.contactTitle,
        linkedInUrl: candidate.linkedInUrl,
        whyFit: candidate.whyFit,
      })
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: `Score design partner candidate: ${candidate.companyName} (${candidate.contactName}, ${candidate.contactTitle})` }],
        maxTokens: 3000,
      })

      const qualification = parseJsonFromResponse<DesignPartnerQualification>(resp.text)
      if (!qualification.generatedAt) qualification.generatedAt = new Date().toISOString()

      const now = new Date().toISOString()
      saveCandidates(
        candidates.map((c) => (c.id === candidate.id ? { ...c, qualification, updatedAt: now } : c)),
      )
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Scoring failed')
    } finally {
      setScoringId(null)
    }
  }

  const handleAddCandidate = (data: {
    companyName: string
    contactName: string
    contactTitle: string
    linkedInUrl?: string
    whyFit?: string
  }) => {
    const now = new Date().toISOString()
    const newCandidate: DesignPartnerCandidate = {
      id: crypto.randomUUID(),
      ...data,
      pipelineStage: 'identified',
      source: role === 'founder' ? 'FOUNDER' : 'VL',
      addedAt: now,
      updatedAt: now,
    }
    saveCandidates([...candidates, newCandidate])
    setShowAdd(false)
  }

  const handleRemove = (id: string) => {
    saveCandidates(candidates.filter((c) => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleSaveNotes = (id: string) => {
    const now = new Date().toISOString()
    saveCandidates(
      candidates.map((c) => (c.id === id ? { ...c, conversationNotes: noteDraft, updatedAt: now } : c)),
    )
    setEditingNotesId(null)
    setNoteDraft('')
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Design Partners</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Design Partner Pipeline</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track, qualify, and convert design partner candidates toward 3 signed commitments.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        {/* Funnel visualization */}
        <div className="rounded-xl p-5 mb-5" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Pipeline Funnel</h3>
            <span
              className="text-lg font-heading font-bold"
              style={{ color: stageCounts.signed >= 3 ? '#10B981' : 'var(--accent-primary)' }}
            >
              {stageCounts.signed}/3 Signed
            </span>
          </div>
          <div className="flex items-end gap-1">
            {STAGES.map((s, i) => {
              const count = stageCounts[s.key]
              const maxCount = Math.max(1, ...Object.values(stageCounts))
              const height = Math.max(24, (count / maxCount) * 80)
              const opacity = 0.3 + (i / (STAGES.length - 1)) * 0.7
              return (
                <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{count}</span>
                  <div
                    className="w-full rounded-t"
                    style={{
                      height,
                      background: `rgba(124,106,247,${opacity})`,
                      minHeight: 24,
                    }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)] text-center leading-tight mt-1">
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions bar */}
        <div className="rounded-xl p-4 mb-4" style={CARD}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-muted)]">
                {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 rounded-lg text-xs font-heading font-semibold bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
            >
              Add Candidate
            </button>
          </div>
        </div>

        {/* Candidate list */}
        {sorted.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            <p className="text-[var(--text-muted)] mb-2">No candidates yet.</p>
            <p className="text-sm text-[var(--text-muted)]">
              Add design partner candidates to start building your pipeline.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((c) => {
              const isExpanded = expandedId === c.id
              const isScoring = scoringId === c.id
              const isEditingNotes = editingNotesId === c.id
              const isHighlighted = highlightId === c.id
              return (
                <div
                  key={c.id}
                  ref={isHighlighted ? highlightRef : undefined}
                  className="rounded-xl overflow-hidden transition-all"
                  style={{
                    ...CARD,
                    ...(isHighlighted ? { boxShadow: '0 0 0 2px var(--accent-primary)', borderColor: 'var(--accent-primary)' } : {}),
                  }}
                >
                  {/* Row header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[rgba(124,106,247,0.04)]"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-[var(--text-primary)] truncate">
                          {c.companyName}
                        </span>
                        <SourceChip source={c.source} small />
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
                        {c.contactName} &middot; {c.contactTitle}
                        {c.linkedInUrl && (
                          <a
                            href={c.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-[var(--accent-secondary)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Qualification badge */}
                    {c.qualification && (
                      <div
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium shrink-0"
                        style={{
                          background: verdictBg(c.qualification.verdict),
                          color: VERDICT_COLORS[c.qualification.verdict] ?? '#6B7280',
                        }}
                      >
                        <span>{c.qualification.total}</span>
                        <span>&middot;</span>
                        <span>{c.qualification.verdict}</span>
                      </div>
                    )}

                    {/* Stage dropdown */}
                    <select
                      value={c.pipelineStage}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleStageChange(c.id, e.target.value as DesignPartnerPipelineStage)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer shrink-0"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    {/* Score button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleScore(c)
                      }}
                      disabled={isScoring}
                      className="px-3 py-1.5 rounded text-[10px] font-medium border shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'rgba(124,106,247,0.15)',
                        color: 'var(--accent-primary)',
                        borderColor: 'rgba(124,106,247,0.3)',
                      }}
                    >
                      {isScoring ? 'Scoring...' : c.qualification ? 'Re-score' : 'Score'}
                    </button>

                    {/* Expand chevron */}
                    <span
                      className="text-[var(--text-muted)] text-xs shrink-0 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      ▼
                    </span>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
                      {/* Why fit */}
                      {c.whyFit && (
                        <div className="pt-3">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                            Why this is a fit
                          </span>
                          <p className="text-sm text-[var(--text-primary)] mt-1">{c.whyFit}</p>
                        </div>
                      )}

                      {/* Qualification details */}
                      {c.qualification && (
                        <div className="pt-2">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                            Qualification Scorecard
                          </span>
                          <div className="mt-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                            <table className="w-full text-xs">
                              <thead>
                                <tr style={{ background: 'rgba(124,106,247,0.08)' }}>
                                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Dimension</th>
                                  <th className="text-center px-3 py-2 text-[var(--text-muted)] font-medium w-16">Weight</th>
                                  <th className="text-center px-3 py-2 text-[var(--text-muted)] font-medium w-16">Score</th>
                                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Explanation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.qualification.scores.map((s) => (
                                  <tr key={s.dimension} style={{ borderTop: '1px solid var(--border)' }}>
                                    <td className="px-3 py-2 text-[var(--text-primary)] font-medium">{s.dimension}</td>
                                    <td className="px-3 py-2 text-center text-[var(--text-muted)]">
                                      {Math.round(s.weight * 100)}%
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <span
                                        className="inline-block w-6 h-6 leading-6 rounded text-center font-bold text-white text-[10px]"
                                        style={{
                                          background:
                                            s.score >= 4 ? '#10B981' : s.score >= 3 ? '#F59E0B' : '#EF4444',
                                        }}
                                      >
                                        {s.score}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-[var(--text-muted)]">{s.explanation}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.06)' }}>
                            <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                              Recommendation
                            </span>
                            <p className="text-sm text-[var(--text-primary)] mt-1">
                              {c.qualification.recommendation}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Conversation notes */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                            Conversation Notes
                          </span>
                          {!isEditingNotes && (
                            <button
                              onClick={() => {
                                setEditingNotesId(c.id)
                                setNoteDraft(c.conversationNotes ?? '')
                              }}
                              className="text-[10px] text-[var(--accent-primary)] hover:underline cursor-pointer bg-transparent border-none"
                            >
                              {c.conversationNotes ? 'Edit' : 'Add Notes'}
                            </button>
                          )}
                        </div>
                        {isEditingNotes ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-none"
                              placeholder="Capture notes from conversations..."
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setEditingNotesId(null)
                                  setNoteDraft('')
                                }}
                                className="px-3 py-1 rounded text-[10px] font-medium bg-transparent text-[var(--text-muted)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-primary)]"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveNotes(c.id)}
                                className="px-3 py-1 rounded text-[10px] font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : c.conversationNotes ? (
                          <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                            {c.conversationNotes}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)] italic">No notes yet.</p>
                        )}
                      </div>

                      {/* Remove */}
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleRemove(c.id)}
                          className="text-[10px] text-[#EF4444] hover:underline cursor-pointer bg-transparent border-none"
                        >
                          Remove Candidate
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add modal */}
        {showAdd && (
          <AddCandidateModal
            onSave={handleAddCandidate}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </div>
    </div>
  )
}

function AddCandidateModal({
  onSave,
  onCancel,
}: {
  onSave: (data: {
    companyName: string
    contactName: string
    contactTitle: string
    linkedInUrl?: string
    whyFit?: string
  }) => void
  onCancel: () => void
}) {
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactTitle, setContactTitle] = useState('')
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [whyFit, setWhyFit] = useState('')

  const canSubmit = companyName.trim() && contactName.trim() && contactTitle.trim()

  const handleSubmit = () => {
    if (!canSubmit) return
    onSave({
      companyName: companyName.trim(),
      contactName: contactName.trim(),
      contactTitle: contactTitle.trim(),
      linkedInUrl: linkedInUrl.trim() || undefined,
      whyFit: whyFit.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="rounded-xl p-6 max-w-md w-full mx-4 space-y-4"
        style={{ ...CARD, background: 'rgba(30,26,46,0.98)' }}
      >
        <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Add Design Partner Candidate</h3>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company Name *"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Contact Name *"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <input
          type="text"
          value={contactTitle}
          onChange={(e) => setContactTitle(e.target.value)}
          placeholder="Contact Title *"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <input
          type="url"
          value={linkedInUrl}
          onChange={(e) => setLinkedInUrl(e.target.value)}
          placeholder="LinkedIn URL (optional)"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <textarea
          value={whyFit}
          onChange={(e) => setWhyFit(e.target.value)}
          placeholder="Why is this a fit? (optional)"
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
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2 rounded text-xs font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Candidate
          </button>
        </div>
      </div>
    </div>
  )
}
