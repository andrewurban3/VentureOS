import { useState } from 'react'
import { useDiscoverResearch } from '@/hooks/useDiscoverResearch'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildMarketSignalsSystemBlocks } from '@/agents/discover/market-signals'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { formatResearchContent } from '@/lib/formatResearchContent'
import type { DiscoverResearch } from '@/types/venture'

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }

export function MarketSignals() {
  const { research: allResearch, addResearch } = useDiscoverResearch()

  const [searchDirection, setSearchDirection] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const research = allResearch.filter((r) => r.type === 'market_signal')

  const handleSearch = async () => {
    if (!searchDirection.trim()) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = buildMarketSignalsSystemBlocks(searchDirection.trim())
      const resp = await anthropicProvider.chat({
        systemPrompt: systemBlocks,
        messages: [{ role: 'user', content: searchDirection.trim() }],
        maxTokens: 4000,
        tools: [WEB_SEARCH_TOOL],
      })

      const entry: DiscoverResearch = {
        id: crypto.randomUUID(),
        type: 'market_signal',
        query: searchDirection.trim(),
        content: resp.text,
        citations: resp.webCitations.map((c) => ({ title: c.title, url: c.url })),
        source: 'AI_RESEARCH',
        generatedAt: new Date().toISOString(),
      }

      addResearch(entry)
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
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
          <h1 className="font-heading font-bold text-2xl mb-1">Market Signal Research</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Search for recent market signals — news, regulatory changes, tech announcements, and industry shifts.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="rounded-xl p-6" style={cardStyle}>
          <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
            Search direction
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchDirection}
              onChange={(e) => setSearchDirection(e.target.value)}
              placeholder="e.g. AI in financial services compliance, ESG regulation trends..."
              className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !searchDirection.trim()}
              className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Scanning...' : 'Search Market Signals'}
            </button>
          </div>
          {loading && (
            <p className="mt-3 text-sm text-[var(--text-muted)] animate-pulse">
              Scanning market signals...
            </p>
          )}
        </div>

        {research.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg">Previous Searches</h2>
            {[...research].reverse().map((r) => (
              <div key={r.id} className="rounded-xl p-6" style={cardStyle}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-[var(--accent-primary)]">{r.query}</span>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(r.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                  {formatResearchContent(r.content)}
                </div>
                {r.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Sources</span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {r.citations.map((c, ci) => (
                        <a
                          key={ci}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono no-underline hover:opacity-80"
                          style={{
                            background: 'rgba(14,165,233,0.12)',
                            color: '#0EA5E9',
                            border: '1px solid rgba(14,165,233,0.3)',
                          }}
                        >
                          <span>↗</span> {c.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {research.length === 0 && !loading && (
          <div className="rounded-xl p-12 text-center" style={cardStyle}>
            <p className="text-[var(--text-muted)]">No market signals yet.</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Enter a search direction above to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
