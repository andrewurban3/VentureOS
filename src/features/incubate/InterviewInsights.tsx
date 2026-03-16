import { useState, useCallback } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import { buildInterviewExtractionBlocks, buildSynthesisBlocks } from '@/agents/incubate'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type {
  InterviewUpload,
  InterviewExtraction,
  CrossInterviewSynthesis,
  InterviewRole,
  InterviewConductedBy,
} from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const ROLES: InterviewRole[] = ['Prospect', 'Client', 'VC', 'Expert', 'Partner', 'Competitor', 'Other']
const CONDUCTED_BY: InterviewConductedBy[] = ['Founder', 'Venture Lead']
const TYPES = ['Discovery call', 'Validation interview', 'Expert interview', 'Investor call', 'Design partner session']

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string) ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export function InterviewInsights() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [transcript, setTranscript] = useState('')
  const [intervieweeRole, setIntervieweeRole] = useState<InterviewRole>('Prospect')
  const [intervieweeCompany, setIntervieweeCompany] = useState('')
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().slice(0, 10))
  const [conductedBy, setConductedBy] = useState<InterviewConductedBy>(role === 'founder' ? 'Founder' : 'Venture Lead')
  const [interviewType, setInterviewType] = useState(TYPES[0])
  const [loading, setLoading] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const interviews = venture?.interviews
  const uploads = interviews?.uploads ?? []
  const extractions = interviews?.extractions ?? {}
  const synthesis = interviews?.synthesis

  const handleFileDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (!file) return
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'txt' || ext === 'md') {
        try {
          const text = await readFileAsText(file)
          setTranscript(text)
        } catch {
          setApiError('Could not read file')
        }
      } else {
        setApiError('Supported: .txt, .md. Paste .docx content manually.')
      }
    },
    []
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext === 'txt' || ext === 'md') {
        try {
          const text = await readFileAsText(file)
          setTranscript(text)
        } catch {
          setApiError('Could not read file')
        }
      } else {
        setApiError('Supported: .txt, .md')
      }
      e.target.value = ''
    },
    []
  )

  const handleAddUpload = () => {
    if (!venture || !activeVentureId || !transcript.trim()) return
    const now = new Date().toISOString()
    const upload: InterviewUpload = {
      id: crypto.randomUUID(),
      transcript: transcript.trim(),
      intervieweeRole,
      intervieweeCompany: intervieweeCompany.trim() || 'Unknown',
      interviewDate,
      conductedBy,
      interviewType,
      uploadedBy: role === 'founder' ? 'FOUNDER' : 'VL',
      uploadedAt: now,
    }
    updateVenture(activeVentureId, {
      interviews: {
        uploads: [...uploads, upload],
        extractions,
        synthesis,
      },
    })
    setTranscript('')
    setIntervieweeCompany('')
  }

  const handleExtract = async (uploadId: string) => {
    if (!venture || !activeVentureId) return
    const upload = uploads.find((u) => u.id === uploadId)
    if (!upload) return
    setApiError(null)
    setLoading(uploadId)
    try {
      const blocks = await buildInterviewExtractionBlocks(venture, {
        intervieweeRole: upload.intervieweeRole,
        intervieweeCompany: upload.intervieweeCompany,
        interviewType: upload.interviewType,
      }, upload.transcript)
      const resp = await anthropicProvider.chat({
        systemPrompt: [...blocks, { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences.' }],
        messages: [{ role: 'user', content: 'Extract insights from this transcript.' }],
        maxTokens: 3000,
      })
      const raw = parseJsonFromResponse<InterviewExtraction & { uploadId?: string }>(resp.text)
      const extraction: InterviewExtraction = {
        uploadId,
        painPoints: raw.painPoints ?? [],
        workarounds: raw.workarounds ?? [],
        willingnessToPay: raw.willingnessToPay ?? [],
        icpMatch: raw.icpMatch ?? '',
        featureRequests: raw.featureRequests ?? [],
        objections: raw.objections ?? [],
        keyQuotes: raw.keyQuotes ?? [],
        signalQuality: raw.signalQuality ?? 'Moderate',
        generatedAt: new Date().toISOString(),
      }
      updateVenture(activeVentureId, {
        interviews: {
          uploads,
          extractions: { ...extractions, [uploadId]: extraction },
          synthesis,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setLoading(null)
    }
  }

  const handleSynthesize = async () => {
    if (!venture || !activeVentureId || uploads.filter((u) => extractions[u.id]).length < 3) return
    setApiError(null)
    setLoading('synthesis')
    try {
      const blocks = await buildSynthesisBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [...blocks, { type: 'text', text: '\n\nReturn ONLY valid JSON.' }],
        messages: [{ role: 'user', content: 'Synthesise patterns across these interviews.' }],
        maxTokens: 2000,
      })
      const raw = parseJsonFromResponse<CrossInterviewSynthesis>(resp.text)
      const syn: CrossInterviewSynthesis = {
        themes: raw.themes ?? [],
        contradictions: raw.contradictions ?? [],
        topQuotes: raw.topQuotes ?? [],
        signalQuality: raw.signalQuality ?? '',
        generatedAt: new Date().toISOString(),
      }
      updateVenture(activeVentureId, {
        interviews: { uploads, extractions, synthesis: syn },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Synthesis failed')
    } finally {
      setLoading(null)
    }
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Interview Insights</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const extractedCount = uploads.filter((u) => extractions[u.id]).length
  const canSynthesize = extractedCount >= 3

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Interview Insights</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Upload transcripts, extract insights, and synthesise patterns across interviews.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="rounded-xl p-6 mb-6" style={CARD}>
          <h3 className="font-heading font-semibold text-sm mb-3">Add Interview</h3>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="rounded-lg border-2 border-dashed border-[var(--border)] p-4 mb-4 cursor-pointer hover:border-[var(--accent-primary)] transition-colors"
          >
            <input
              type="file"
              accept=".txt,.md"
              onChange={handleFileSelect}
              className="hidden"
              id="interview-file"
            />
            <label htmlFor="interview-file" className="cursor-pointer block text-center text-sm text-[var(--text-muted)]">
              Drop .txt or .md file here, or click to select
            </label>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Or paste transcript here..."
            rows={6}
            className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1">Interviewee Role</label>
              <select
                value={intervieweeRole}
                onChange={(e) => setIntervieweeRole(e.target.value as InterviewRole)}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1">Company</label>
              <input
                type="text"
                value={intervieweeCompany}
                onChange={(e) => setIntervieweeCompany(e.target.value)}
                placeholder="Company name"
                className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1">Date</label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1">Conducted By</label>
              <select
                value={conductedBy}
                onChange={(e) => setConductedBy(e.target.value as InterviewConductedBy)}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
              >
                {CONDUCTED_BY.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase mb-1">Interview Type</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleAddUpload}
            disabled={!transcript.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Interview
          </button>
        </div>

        {uploads.length > 0 && (
          <div className="space-y-4">
            {uploads.map((u) => {
              const ext = extractions[u.id]
              return (
                <div key={u.id} className="rounded-xl p-5" style={CARD}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-[var(--text-primary)]">
                        {u.intervieweeCompany} — {u.intervieweeRole}
                      </h4>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {u.interviewType} · {u.interviewDate} · {u.conductedBy}
                      </p>
                      <SourceChip source={u.uploadedBy} small />
                    </div>
                    {!ext ? (
                      <button
                        onClick={() => handleExtract(u.id)}
                        disabled={!!loading}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] disabled:opacity-50"
                      >
                        {loading === u.id ? 'Extracting...' : 'Extract'}
                      </button>
                    ) : (
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded"
                        style={{
                          background: ext.signalQuality === 'Strong' ? 'rgba(16,185,129,0.15)' : ext.signalQuality === 'Moderate' ? 'rgba(245,158,11,0.15)' : 'rgba(139,135,168,0.15)',
                          color: ext.signalQuality === 'Strong' ? '#10B981' : ext.signalQuality === 'Moderate' ? '#F59E0B' : '#8B87A8',
                        }}
                      >
                        {ext.signalQuality} signal
                      </span>
                    )}
                  </div>
                  {ext && (
                    <div className="space-y-3 text-sm">
                      {ext.painPoints?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Pain Points</span>
                          <ul className="mt-1 space-y-1">
                            {ext.painPoints.map((p, i) => (
                              <li key={i} className="text-[var(--text-primary)]">
                                "{p.quote}" — {p.paraphrase}
                                {p.dimensionId && <span className="text-[var(--text-muted)] ml-1">(dim {p.dimensionId})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ext.workarounds?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Workarounds</span>
                          <p className="text-[var(--text-primary)] mt-1">{ext.workarounds.join('; ')}</p>
                        </div>
                      )}
                      {ext.willingnessToPay?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">WTP Signals</span>
                          <p className="text-[var(--text-primary)] mt-1">{ext.willingnessToPay.join('; ')}</p>
                        </div>
                      )}
                      {ext.icpMatch && (
                        <div>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">ICP Match</span>
                          <p className="text-[var(--text-primary)] mt-1">{ext.icpMatch}</p>
                        </div>
                      )}
                      {ext.keyQuotes?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Key Quotes</span>
                          <ul className="mt-1 space-y-1">
                            {ext.keyQuotes.map((q, i) => (
                              <li key={i} className="text-[var(--text-primary)] italic">"{q}"</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {canSynthesize && (
          <div className="rounded-xl p-6 mt-6" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-sm">Cross-Interview Synthesis</h3>
              <button
                onClick={handleSynthesize}
                disabled={!!loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loading === 'synthesis' ? 'Synthesising...' : synthesis ? 'Regenerate' : 'Synthesise'}
              </button>
            </div>
            {synthesis && (
              <div className="space-y-4">
                {synthesis.themes?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Themes</span>
                    <ul className="mt-1 space-y-1">
                      {synthesis.themes.map((t, i) => (
                        <li key={i} className="text-[var(--text-primary)]">
                          {t.theme} ({t.count} interviews)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {synthesis.contradictions?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Contradictions</span>
                    <ul className="mt-1 space-y-1">
                      {synthesis.contradictions.map((c, i) => (
                        <li key={i} className="text-[var(--text-primary)]">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {synthesis.topQuotes?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Top Quotes</span>
                    <ul className="mt-1 space-y-1">
                      {synthesis.topQuotes.map((q, i) => (
                        <li key={i} className="text-[var(--text-primary)] italic">"{q}"</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {!synthesis && (
              <p className="text-sm text-[var(--text-muted)]">
                {extractedCount} interviews extracted. Click Synthesise to find patterns.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
