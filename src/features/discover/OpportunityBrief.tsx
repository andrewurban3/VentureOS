import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useDiscoverResearch } from '@/hooks/useDiscoverResearch'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildOpportunityBriefSystemBlocks } from '@/agents/discover/opportunity-brief'
import { createOpportunityBriefDocx } from '@/services/export'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { formatResearchContent } from '@/lib/formatResearchContent'
import type { DiscoverResearch } from '@/types/venture'

export function OpportunityBrief() {
  const { ventures, activeVentureId } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const { research: allResearch, addResearch } = useDiscoverResearch()

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const sourceResearch = allResearch.filter((r) => r.type === 'vc_thesis' || r.type === 'market_signal')
  const briefs = allResearch.filter((r) => r.type === 'opportunity_brief')

  const hasSourceData = sourceResearch.length > 0

  const handleGenerate = async () => {
    if (!hasSourceData) return
    setApiError(null)
    setLoading(true)
    try {
      const researchContext = sourceResearch
        .map((r) => `[${r.type.toUpperCase()} — ${r.query}]\n${r.content}`)
        .join('\n\n---\n\n')

      const systemBlocks = buildOpportunityBriefSystemBlocks(researchContext)
      const resp = await anthropicProvider.chat({
        systemPrompt: systemBlocks,
        messages: [{ role: 'user', content: 'Synthesize all the accumulated research into an opportunity brief.' }],
        maxTokens: 4000,
      })

      const sourceCitations = sourceResearch.flatMap((r) =>
        r.citations.map((c) => ({ title: c.title, url: c.url, date: c.date }))
      )

      const entry: DiscoverResearch = {
        id: crypto.randomUUID(),
        type: 'opportunity_brief',
        query: `Synthesis of ${sourceResearch.length} research items`,
        content: resp.text,
        citations: sourceCitations,
        source: 'AI_SYNTHESIS',
        generatedAt: new Date().toISOString(),
      }

      addResearch(entry)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (brief: DiscoverResearch) => {
    try {
      const blob = await createOpportunityBriefDocx(
        venture?.name.value ?? 'Venture',
        brief.content
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Opportunity_Brief_${new Date().toISOString().slice(0, 10)}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setApiError('Export failed')
    }
  }

  const cardStyle = {
    background: 'rgba(30,26,46,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Opportunity Brief</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Synthesize VC thesis and market signal research into a narrative opportunity brief.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="rounded-xl p-6" style={cardStyle}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[var(--text-primary)]">
                <span className="font-semibold">{sourceResearch.length}</span> research item{sourceResearch.length !== 1 ? 's' : ''} available
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {sourceResearch.filter((r) => r.type === 'vc_thesis').length} VC theses, {sourceResearch.filter((r) => r.type === 'market_signal').length} market signals
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !hasSourceData}
              className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Drafting...' : 'Generate Brief'}
            </button>
          </div>
          {!hasSourceData && (
            <p className="text-sm text-[var(--text-muted)]">
              Run VC Thesis or Market Signal research first to provide source data.
            </p>
          )}
          {loading && (
            <p className="mt-2 text-sm text-[var(--text-muted)] animate-pulse">
              Drafting opportunity brief...
            </p>
          )}
        </div>

        {briefs.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg">Generated Briefs</h2>
            {[...briefs].reverse().map((b) => (
              <div key={b.id} className="rounded-xl p-6" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(b.generatedAt).toLocaleString()} — {b.query}
                  </span>
                  <button
                    onClick={() => handleExport(b)}
                    className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] hover:bg-[rgba(124,106,247,0.1)] text-[var(--text-primary)]"
                  >
                    Export .docx
                  </button>
                </div>
                <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {formatResearchContent(b.content)}
                </div>
              </div>
            ))}
          </div>
        )}

        {briefs.length === 0 && !loading && hasSourceData && (
          <div className="rounded-xl p-12 text-center" style={cardStyle}>
            <p className="text-[var(--text-muted)]">No briefs generated yet.</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Click Generate Brief to synthesize your research.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
