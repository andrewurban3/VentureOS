import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildClientFeedbackBlocks, parseClientFeedbackResponse } from '@/agents/build/clientFeedback'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { createClientFeedbackSummaryDocx } from '@/services/export'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

function SummarySection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
  if (!items.length) return null
  return (
    <div className="mb-4">
      <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ClientFeedback() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [pilotNotes, setPilotNotes] = useState('')
  const [companyNames, setCompanyNames] = useState('')

  const summary = venture?.clientFeedbackSummary

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const companyList = companyNames.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      const systemBlocks = await buildClientFeedbackBlocks(venture, pilotNotes, companyList)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Synthesise the pilot client feedback.' }],
        maxTokens: 4000,
      })
      const result = parseClientFeedbackResponse(resp.text, new Date().toISOString())
      updateVenture(activeVentureId, { clientFeedbackSummary: result })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleExportDocx = () => {
    if (!venture || !summary) return
    createClientFeedbackSummaryDocx(venture.name.value, summary).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-client-feedback.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Client Feedback</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Client Feedback Summary</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Paste pilot or interview notes, then generate a synthesis: themes, divergence, top signals, product gaps.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="rounded-xl p-6 mb-6" style={CARD}>
          <h2 className="font-heading font-semibold text-lg mb-2">Pilot feedback notes</h2>
          <textarea
            value={pilotNotes}
            onChange={(e) => setPilotNotes(e.target.value)}
            placeholder="Paste or type notes from pilot clients. You can separate by client using '--- Company Name ---' or leave as one block."
            rows={8}
            className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
          />
          <div className="mt-2">
            <label className="block text-xs text-[var(--text-muted)] mb-1">Client company names (comma-separated, optional)</label>
            <input
              value={companyNames}
              onChange={(e) => setCompanyNames(e.target.value)}
              placeholder="Acme Inc, Beta Co"
              className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading || !pilotNotes.trim()}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Synthesising...' : summary ? 'Regenerate Summary' : 'Generate Summary'}
          </button>
          {summary && (
            <button
              onClick={handleExportDocx}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Export .docx
            </button>
          )}
        </div>

        {summary && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-heading font-semibold text-lg">Synthesis</h2>
                <SourceChip source={summary.source} />
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(summary.generatedAt).toLocaleString()}
                </span>
              </div>
            </div>
            {summary.clientTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {summary.clientTags.map((t) => (
                  <SourceChip key={t.clientId} source="CLIENT_INTERVIEW" subSource={t.companyName} small />
                ))}
              </div>
            )}
            <SummarySection title="Themes" items={summary.content.themes} accentColor="#10B981" />
            <SummarySection title="Divergence" items={summary.content.divergence} accentColor="#F59E0B" />
            <SummarySection title="Top Signals" items={summary.content.topSignals} accentColor="#7C6AF7" />
            <SummarySection title="Product Gaps" items={summary.content.productGaps} accentColor="#EF4444" />
            <div className="mt-4">
              <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">Narrative</h3>
              <div
                className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap rounded-lg p-4"
                style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
              >
                {summary.content.narrative}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
