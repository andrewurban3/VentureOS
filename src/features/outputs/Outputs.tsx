import { useState, useMemo } from 'react'
import { useVentures } from '@/context/VentureContext'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'
import { buildBusinessBriefSystemBlocks } from '@/agents/outputs'
import { aiService } from '@/services/ai'
import { createBusinessBriefDocx } from '@/services/export'
import { SourceChip } from '@/components/SourceChip'
import { INTAKE_DIMENSIONS, DIMENSION_STATUS_COLORS } from '@/constants/ideaIntake'
import type { DimensionStatus } from '@/constants/ideaIntake'
import type { BusinessBriefDocument, VentureCitation } from '@/types/venture'

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const SECTION_LABELS: Record<string, string> = {
  opportunityOverview: 'Opportunity Overview',
  problemAndPainPoints: 'Problem & Pain Points',
  idealCustomerProfile: 'Ideal Customer Profile',
  solutionOverview: 'Solution Overview',
  marketAnalysis: 'Market Analysis',
  recommendations: 'Recommendations',
}

function CheckIcon({ filled }: { filled: boolean }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full text-center text-[10px] leading-4 font-bold shrink-0"
      style={{
        background: filled ? 'rgba(16,185,129,0.2)' : 'rgba(139,135,168,0.15)',
        color: filled ? '#10B981' : '#8B87A8',
      }}
    >
      {filled ? '✓' : '–'}
    </span>
  )
}

function DimStatusDot({ status }: { status: DimensionStatus }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: DIMENSION_STATUS_COLORS[status] ?? '#8B87A8' }}
    />
  )
}

export function Outputs() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userGuidance, setUserGuidance] = useState('')

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Business Brief</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const hasIntake = !!(venture.ideaIntake?.messages?.length)
  const canGenerate = hasIntake
  const saved = venture.businessBrief
  const citations = venture.citations ?? []

  const referencedCitations = saved
    ? saved.citationIds
        .map((idx) => citations[idx - 1])
        .filter((c): c is VentureCitation => !!c)
    : []

  const dataInventory = useMemo(() => {
    const icp = venture.icpDocument
    const comps = venture.competitorAnalysis?.competitors?.filter(
      (c) => (c.status || 'pending') !== 'rejected'
    ) ?? []
    const insights = venture.savedInsights ?? []
    const dims = venture.ideaIntake?.dimensionCoverage ?? []

    const dimDetails = INTAKE_DIMENSIONS.map((dim) => {
      const coverage = dims.find((d) => d.id === dim.id)
      return {
        id: dim.id,
        name: dim.name,
        status: (coverage?.status ?? 'not_started') as DimensionStatus,
        summary: coverage?.summary ?? '',
      }
    })

    const completeDims = dimDetails.filter(
      (d) => d.status === 'complete' || d.status === 'in_progress'
    )

    return {
      hasIntake,
      dimDetails,
      intakeCovered: completeDims.length,
      totalDimensions: INTAKE_DIMENSIONS.length,
      hasIcp: !!icp,
      icpIndustry: icp?.industry,
      icpPainCount: typeof icp?.painPoints === 'string' ? 0 : (icp?.painPoints?.length ?? 0),
      icpSegments: icp?.industrySegments?.length ?? 0,
      confirmedCompetitors: comps,
      competitorCount: comps.length,
      savedInsights: insights,
      insightCount: insights.length,
      citationCount: citations.length,
    }
  }, [venture, hasIntake, citations.length])

  const generate = async () => {
    if (!venture || !activeVentureId) return
    setLoading(true)
    setError(null)

    try {
      // Step 1: Market research via web search
      setLoadingStep('Researching market data...')
      const marketContext = venture.icpDocument?.industry ?? venture.name.value
      const marketResp = await aiService.chat({
        systemPrompt: `You are a market research analyst. Given a venture's market context, provide a concise market analysis covering: total addressable market size, market growth rate (CAGR), key market segments, recent trends, and notable players. Be specific with numbers and cite your sources. Output in plain prose, 3-4 paragraphs.`,
        messages: [{
          role: 'user',
          content: `Research the market for: ${marketContext}. Provide market size, CAGR, key segments, and trends.`,
        }],
        maxTokens: 2000,
        tools: [WEB_SEARCH_TOOL],
      })

      const marketResearchText = marketResp.text
      const newCitations: VentureCitation[] = marketResp.webCitations.map((wc, i) => ({
        id: `market-research-${Date.now()}-${i}`,
        source: 'AI_RESEARCH' as const,
        title: wc.title,
        url: wc.url,
        excerpt: wc.citedText,
        context: 'Market Research (Business Brief)',
        generatedAt: new Date().toISOString(),
      }))

      if (newCitations.length > 0) {
        const existingCitations = venture.citations ?? []
        updateVenture(activeVentureId, {
          citations: [...existingCitations, ...newCitations],
        })
      }

      // Step 2: Generate structured brief
      setLoadingStep('Synthesizing brief...')
      let ventureContext: string
      try {
        ventureContext = await retrieveVentureContext(venture.id, 'Business brief: opportunity, problem, ICP, solution, market analysis, competitors, recommendations', {
          topK: 30,
          maxChars: 10000,
        })
      } catch {
        ventureContext = buildVentureContext(venture, { sections: 'full' })
      }

      const guidanceBlock = userGuidance.trim()
        ? `\n\nUSER GUIDANCE FOR THIS BRIEF:\n${userGuidance.trim()}`
        : ''

      const fullContext = [
        ventureContext,
        `\n\n---\n\nMARKET RESEARCH:\n${marketResearchText}`,
        guidanceBlock,
      ].join('')

      const result = await aiService.chatWithStructuredOutput<{
        opportunityOverview: string
        problemAndPainPoints: string
        idealCustomerProfile: string
        solutionOverview: string
        marketAnalysis: string
        recommendations: string
        citationIds?: number[]
      }>({
        systemPrompt: buildBusinessBriefSystemBlocks(fullContext.slice(0, 14000)),
        messages: [{ role: 'user', content: 'Generate a Business Brief from this venture data.' }],
        maxTokens: 4000,
      })

      const { citationIds, ...content } = result
      const doc: BusinessBriefDocument = {
        content,
        citationIds: citationIds ?? [],
        generatedAt: new Date().toISOString(),
        version: (saved?.version ?? 0) + 1,
      }

      updateVenture(activeVentureId, { businessBrief: doc })
      setUserGuidance('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const handleDownload = async () => {
    if (!saved) return
    try {
      const blob = await createBusinessBriefDocx(venture.name.value, saved.content, referencedCitations)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value.replace(/\s+/g, '-')}-Business-Brief.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Business Brief</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Early-stage articulation of the venture opportunity — synthesized from all venture data.
          </p>
        </div>

        {/* ── Data Inventory / Pre-generation outline ── */}
        {canGenerate && (
          <div className="rounded-xl p-5 mb-4" style={CARD}>
            <h3 className="font-heading font-semibold text-sm mb-3">
              What this Brief will cover
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] mb-4">
              The brief synthesizes everything below. Add more data to enrich the output.
            </p>

            <div className="space-y-3">
              {/* Idea Intake -- expanded per dimension */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckIcon filled={hasIntake} />
                  <span className="text-xs text-[var(--text-primary)] font-medium">
                    Idea Intake
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {dataInventory.intakeCovered}/{dataInventory.totalDimensions} dimensions covered
                  </span>
                </div>
                <div className="ml-6 space-y-1.5">
                  {dataInventory.dimDetails.map((dim) => {
                    const isActive = dim.status !== 'not_started'
                    return (
                      <div key={dim.id} className="flex items-start gap-2">
                        <DimStatusDot status={dim.status} />
                        <div className="min-w-0 flex-1">
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }}
                          >
                            {dim.name}
                          </span>
                          {dim.summary && (
                            <p className="text-[10px] text-[var(--text-muted)] leading-snug mt-0.5 line-clamp-2">
                              {dim.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ICP */}
              <div className="flex items-start gap-2">
                <CheckIcon filled={dataInventory.hasIcp} />
                <div>
                  <span className="text-xs text-[var(--text-primary)] font-medium">ICP</span>
                  {dataInventory.hasIcp ? (
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">
                      {dataInventory.icpIndustry}
                      {dataInventory.icpSegments > 0 && ` · ${dataInventory.icpSegments} segments`}
                      {dataInventory.icpPainCount > 0 && ` · ${dataInventory.icpPainCount} pain points`}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">
                      Not generated yet — brief will use intake data only
                    </span>
                  )}
                </div>
              </div>

              {/* Competitors */}
              <div className="flex items-start gap-2">
                <CheckIcon filled={dataInventory.competitorCount > 0} />
                <div>
                  <span className="text-xs text-[var(--text-primary)] font-medium">Competitors</span>
                  {dataInventory.competitorCount > 0 ? (
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">
                      {dataInventory.confirmedCompetitors.map((c) => c.name).join(', ')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">
                      None confirmed — competitive landscape will be generic
                    </span>
                  )}
                </div>
              </div>

              {/* Pressure Test Insights */}
              <div className="flex items-start gap-2">
                <CheckIcon filled={dataInventory.insightCount > 0} />
                <div>
                  <span className="text-xs text-[var(--text-primary)] font-medium">Pressure Test Insights</span>
                  {dataInventory.insightCount > 0 ? (
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">
                      {dataInventory.insightCount} saved from{' '}
                      {[...new Set(dataInventory.savedInsights.map((i) => i.personaName))].join(', ')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)] ml-2">
                      None saved — run Pressure Test and save valuable feedback
                    </span>
                  )}
                </div>
              </div>

              {/* Market Research (always runs live) */}
              <div className="flex items-start gap-2">
                <CheckIcon filled />
                <div>
                  <span className="text-xs text-[var(--text-primary)] font-medium">Market Research</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-2">
                    Live web research for market size, CAGR, and trends will run at generation time
                  </span>
                </div>
              </div>

              {dataInventory.citationCount > 0 && (
                <div className="flex items-start gap-2">
                  <CheckIcon filled />
                  <span className="text-xs text-[var(--text-primary)] font-medium">
                    {dataInventory.citationCount} sources available for citation
                  </span>
                </div>
              )}
            </div>

            {/* Guidance input */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                Any specific guidance for this brief? (optional)
              </label>
              <textarea
                value={userGuidance}
                onChange={(e) => setUserGuidance(e.target.value)}
                placeholder='e.g. "Emphasize the regulatory compliance angle" or "Focus more on the mid-market segment"'
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-xs resize-y"
              />
            </div>
          </div>
        )}

        {/* ── Generate / Actions bar ── */}
        <div className="rounded-xl p-6 mb-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-heading font-semibold text-lg">
                {saved ? 'Business Brief' : 'Generate Business Brief'}
              </h3>
              <SourceChip source="AI_SYNTHESIS" subSource="Business Brief" small />
            </div>
            {saved && (
              <span className="text-[10px] font-mono text-[var(--text-muted)]">
                v{saved.version} — {new Date(saved.generatedAt).toLocaleString()}
              </span>
            )}
          </div>

          {!hasIntake && (
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Complete the Idea Intake conversation first.
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={!canGenerate || loading}
              className="flex-1 py-2.5 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : saved ? 'Regenerate' : canGenerate ? 'Generate' : 'Complete Intake first'}
            </button>
            {saved && (
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-lg font-heading font-semibold text-sm border border-[var(--border)] bg-transparent text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
              >
                Download .docx
              </button>
            )}
          </div>
          {loading && loadingStep && (
            <p className="mt-3 text-xs text-[var(--text-muted)] animate-pulse">
              {loadingStep}
            </p>
          )}
          {error && <p className="mt-2 text-xs font-mono" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        {/* ── Generated content ── */}
        {saved && (
          <div className="space-y-4">
            {Object.entries(saved.content).map(([key, text]) => (
              <div key={key} className="rounded-xl p-5" style={CARD}>
                <h4 className="font-heading font-semibold text-sm mb-2 text-[var(--accent-primary)]">
                  {SECTION_LABELS[key] ?? key}
                </h4>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {text}
                </p>
              </div>
            ))}

            {referencedCitations.length > 0 && (
              <div className="rounded-xl p-5" style={CARD}>
                <h4 className="font-heading font-semibold text-sm mb-3 text-[var(--accent-primary)]">
                  Sources
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {referencedCitations.map((c) => (
                    <li key={c.id} className="text-xs text-[var(--text-primary)] leading-relaxed">
                      <span className="font-medium">{c.title}</span>
                      {c.url && (
                        <>
                          {' — '}
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent-secondary)] hover:underline"
                          >
                            {c.url}
                          </a>
                        </>
                      )}
                      <span className="text-[var(--text-muted)]"> (via {c.context})</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {citations.length > 0 && referencedCitations.length === 0 && (
              <div className="rounded-xl p-5" style={CARD}>
                <h4 className="font-heading font-semibold text-sm mb-3 text-[var(--accent-primary)]">
                  All Venture Sources
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {citations.map((c) => (
                    <li key={c.id} className="text-xs text-[var(--text-primary)] leading-relaxed">
                      <span className="font-medium">{c.title}</span>
                      {c.url && (
                        <>
                          {' — '}
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent-secondary)] hover:underline"
                          >
                            {c.url}
                          </a>
                        </>
                      )}
                      <span className="text-[var(--text-muted)]"> (via {c.context})</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
