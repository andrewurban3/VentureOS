import { useState, useMemo } from 'react'
import { useVentures } from '@/context/VentureContext'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'
import {
  buildInvestmentMemoSystemBlocks,
  buildPitchDeckSystemBlocks,
} from '@/agents/outputs'
import { aiService } from '@/services/ai'
import {
  createInvestmentMemoDocx,
  createPitchDeckPptx,
  type InvestmentMemoSections,
  type PitchDeckSlides,
} from '@/services/export'
import { SourceChip } from '@/components/SourceChip'
import type { InvestmentMemoDocument, PitchDeckDocument, Venture, VentureCitation } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const MEMO_LABELS: Record<string, string> = {
  executiveSummary: 'Executive Summary',
  whyNowAndMarket: 'Why Now & Market Context',
  solutionAndDifferentiation: 'Solution & Differentiation',
  icpAndMarketSize: 'Ideal Customer Profile & Market Size',
  competitiveLandscape: 'Competitive Landscape',
  revenueModelAndUnitEconomics: 'Revenue Model & Unit Economics',
  validationEvidence: 'Validation Evidence',
  risksAndMitigation: 'Risks & Mitigation Strategy',
  recommendations: 'Recommendations & Next Steps',
}

const DECK_LABELS: Record<string, string> = {
  theHook: 'The Hook',
  theProblem: 'The Problem',
  whyNow: 'Why Now',
  theSolution: 'The Solution',
  productVision: 'Product Vision',
  idealCustomerProfile: 'Ideal Customer Profile',
  businessModel: 'Business Model',
  marketOpportunity: 'Market Opportunity',
  competitiveLandscape: 'Competitive Landscape',
  tractionAndValidation: 'Traction & Validation',
  theTeam: 'The Team',
  theAsk: 'The Ask',
}

function renderValidationBadges(text: string): (string | JSX.Element)[] {
  const TAG_REGEX = /\[(Validated|Contradicted):\s*([^\]]+)\]/g
  const parts: (string | JSX.Element)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = TAG_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const status = match[1] as 'Validated' | 'Contradicted'
    const detail = match[2].trim()
    const isContradicted = status === 'Contradicted'
    parts.push(
      <span
        key={`${match.index}-${status}`}
        className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded mx-0.5"
        style={{
          background: isContradicted ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
          color: isContradicted ? '#F59E0B' : '#10B981',
        }}
      >
        {isContradicted ? '⚠' : '✓'} {status}: {detail}
      </span>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
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

// ── Investment Memo Preview ──────────────────────────────────

interface MemoSectionSource {
  filled: boolean
  text: string
}

interface MemoSectionPreview {
  title: string
  description: string
  sources: MemoSectionSource[]
}

function MemoPreview({ venture }: { venture: Venture }) {
  const sections = useMemo((): MemoSectionPreview[] => {
    const icp = venture.icpDocument
    const comps = venture.competitorAnalysis?.competitors?.filter(
      (c) => (c.status || 'pending') !== 'rejected'
    ) ?? []
    const fm = venture.financialModels
    const moat = venture.strategyMoat
    const discover = venture.discover?.research ?? []
    const insights = venture.savedInsights ?? []
    const clients = venture.clientList?.entries ?? []
    const citations = venture.citations ?? []
    const solution = venture.solutionDefinition
    const riskReg = venture.riskRegister
    const interviews = venture.interviews

    return [
      {
        title: 'Executive Summary',
        description: 'Synthesized from all venture data collected during incubation.',
        sources: [],
      },
      {
        title: 'Why Now & Market Context',
        description: 'Market, technology, or regulatory shift creating the timing window.',
        sources: [
          { filled: discover.length > 0, text: discover.length > 0 ? `Discover Research (${discover.length} ${discover.length === 1 ? 'entry' : 'entries'})` : 'Discover Research (none yet)' },
          { filled: !!(venture.ideaIntake?.dimensionCoverage?.find(d => d.id === '07' && d.status !== 'not_started')), text: 'Idea Intake market context' },
        ],
      },
      {
        title: 'Solution & Differentiation',
        description: 'What the product does, 10x claim, differentiation from alternatives, and what it doesn\'t do.',
        sources: [
          { filled: !!solution, text: solution ? `Solution defined: "${solution.whatItDoes.slice(0, 60)}..."` : 'Solution (not defined yet)' },
          { filled: !!(moat?.assessment), text: moat?.assessment ? `Strategy & Moat: ${moat.assessment.recommendedMoats.length} moats` : 'Strategy & Moat (not generated yet)' },
          { filled: comps.length > 0, text: comps.length > 0 ? `${comps.length} competitors for differentiation` : 'No competitors for differentiation' },
        ],
      },
      {
        title: 'Ideal Customer Profile & Market Size',
        description: 'Precise ICP detail with TAM/SAM/SOM and market growth data.',
        sources: [
          {
            filled: !!icp,
            text: icp
              ? `ICP: ${icp.industry}${icp.industrySegments?.length ? `, ${icp.industrySegments.length} segments` : ''}${(typeof icp.painPoints !== 'string' && icp.painPoints?.length) ? `, ${icp.painPoints.length} pain points` : ''}`
              : 'ICP (not generated yet)',
          },
          {
            filled: !!fm?.marketSizing,
            text: fm?.marketSizing
              ? `Market Sizing: TAM $${fmtNum(fm.marketSizing.tam)} / SAM $${fmtNum(fm.marketSizing.sam)} / SOM $${fmtNum(fm.marketSizing.som)}`
              : 'Market Sizing (not generated yet)',
          },
        ],
      },
      {
        title: 'Competitive Landscape',
        description: 'Current alternatives, white space, differentiation, and moat strategy.',
        sources: [
          { filled: comps.length > 0, text: comps.length > 0 ? `${comps.length} confirmed competitors (${comps.map(c => c.name).join(', ')})` : 'No competitors confirmed' },
          { filled: !!(moat?.assessment), text: moat?.assessment ? `Strategy & Moat: ${moat.assessment.recommendedMoats.length} recommended moats` : 'Strategy & Moat (not generated yet)' },
        ],
      },
      {
        title: 'Revenue Model & Unit Economics',
        description: 'Pricing, gross margin, LTV/CAC, payback period, and build investment.',
        sources: [
          {
            filled: !!fm?.unitEconomics,
            text: fm?.unitEconomics
              ? `Unit Economics: LTV/CAC ${fm.unitEconomics.outputs.ltvCac.toFixed(1)}, payback ${fm.unitEconomics.outputs.paybackMonths} months`
              : 'Unit Economics (not generated yet)',
          },
          { filled: !!fm?.mvpCost, text: fm?.mvpCost ? `MVP Cost: $${fmtNum(fm.mvpCost.scenarios.base)} base scenario` : 'MVP Cost (not generated yet)' },
        ],
      },
      {
        title: 'Validation Evidence',
        description: 'Interview findings, client pipeline traction, and signal strength assessment.',
        sources: [
          { filled: !!(interviews?.uploads?.length), text: interviews?.uploads?.length ? `${interviews.uploads.length} interview(s) conducted` : 'No interviews yet' },
          { filled: !!(interviews?.synthesis), text: interviews?.synthesis ? `Synthesis: ${interviews.synthesis.themes.length} themes identified` : 'No cross-interview synthesis yet' },
          { filled: clients.length > 0, text: clients.length > 0 ? `Client pipeline: ${clients.length} targets` : 'No client targets yet' },
        ],
      },
      {
        title: 'Risks & Mitigation Strategy',
        description: 'Structured risks with likelihood, impact, and mitigation. Draws from Risk Register.',
        sources: [
          { filled: !!(riskReg?.risks?.length), text: riskReg?.risks?.length ? `Risk Register: ${riskReg.risks.length} risks identified` : 'Risk Register (not generated yet)' },
          { filled: insights.length > 0, text: insights.length > 0 ? `${insights.length} pressure test insights will be layered in` : 'No pressure test insights yet' },
        ],
      },
      {
        title: 'Recommendations & Next Steps',
        description: 'Investment recommendation, capital ask, use of funds, and Stage 04 milestones.',
        sources: [
          { filled: clients.length > 0, text: clients.length > 0 ? `Client pipeline: ${clients.length} targets` : 'No client targets yet' },
          { filled: citations.length > 0, text: citations.length > 0 ? `${citations.length} sources available for citation` : 'No citations yet' },
        ],
      },
    ]
  }, [venture])

  return (
    <div className="rounded-xl p-5 mb-4" style={CARD}>
      <h3 className="font-heading font-semibold text-sm mb-1">What this Memo will cover</h3>
      <p className="text-[10px] text-[var(--text-muted)] mb-4">
        Each section draws from specific venture data. Add more data to enrich the output.
      </p>
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx}>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[10px] font-mono text-[var(--text-muted)] w-4 shrink-0 text-right">{idx + 1}.</span>
              <span className="text-xs text-[var(--text-primary)] font-semibold">{section.title}</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] ml-6 mb-1">{section.description}</p>
            {section.sources.length > 0 && (
              <div className="ml-6 space-y-1">
                {section.sources.map((src, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <CheckIcon filled={src.filled} />
                    <span className="text-[10px]" style={{ color: src.filled ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {src.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pitch Deck Preview ───────────────────────────────────────

interface SlidePreview {
  number: string
  title: string
  description: string
  sourceLabel: string
  filled: boolean
}

function DeckPreview({ venture }: { venture: Venture }) {
  const slides = useMemo((): SlidePreview[] => {
    const dims = venture.ideaIntake?.dimensionCoverage ?? []
    const dimActive = (id: string) => !!dims.find(d => d.id === id && d.status !== 'not_started')
    const hasIntake = !!(venture.ideaIntake?.messages?.length)
    const icp = venture.icpDocument
    const comps = venture.competitorAnalysis?.competitors?.filter(c => (c.status || 'pending') !== 'rejected') ?? []
    const fm = venture.financialModels
    const moat = venture.strategyMoat
    const discover = venture.discover?.research ?? []
    const insights = venture.savedInsights ?? []
    const clients = venture.clientList?.entries ?? []
    const solution = venture.solutionDefinition
    const interviews = venture.interviews

    return [
      { number: '01', title: 'The Hook', description: 'One-sentence problem statement.', sourceLabel: 'Idea Intake (dim 02) + ICP pain points', filled: dimActive('02') },
      { number: '02', title: 'The Problem', description: 'Quantified pain: who, how often, what it costs.', sourceLabel: [dimActive('02') ? 'Idea Intake' : '', interviews?.uploads?.length ? `${interviews.uploads.length} interview(s)` : ''].filter(Boolean).join(' + ') || 'Idea Intake + Interviews', filled: dimActive('02') || !!(interviews?.uploads?.length) },
      { number: '03', title: 'Why Now', description: 'Market/tech/regulatory unlock creating the window.', sourceLabel: discover.length > 0 ? `Discover Research (${discover.length})` : 'Discover Research + dim 07', filled: discover.length > 0 || dimActive('07') },
      { number: '04', title: 'The Solution', description: 'What it does, what makes it different, what it does not do.', sourceLabel: solution ? `Solution: "${solution.whatItDoes.slice(0, 40)}..."` : 'Solution Definition (not yet defined)', filled: !!solution },
      { number: '05', title: 'Product Vision', description: '3-year roadmap headline + moat milestones.', sourceLabel: moat?.assessment ? `Strategy & Moat (${moat.assessment.recommendedMoats.length} moats)` : 'Strategy & Moat + Idea Intake', filled: hasIntake || !!(moat?.assessment) },
      { number: '06', title: 'Ideal Customer Profile', description: 'Firmographic and behavioural ICP.', sourceLabel: icp ? `ICP: ${icp.industry}` : 'ICP Document', filled: !!icp },
      { number: '07', title: 'Business Model', description: 'Revenue model, pricing, unit economics snapshot.', sourceLabel: fm?.unitEconomics ? `Unit Economics: LTV/CAC ${fm.unitEconomics.outputs.ltvCac.toFixed(1)}` : 'Financial Models (Unit Economics)', filled: !!fm?.unitEconomics },
      { number: '08', title: 'Market Opportunity', description: 'TAM/SAM/SOM with sizing methodology.', sourceLabel: fm?.marketSizing ? `TAM $${fmtNum(fm.marketSizing.tam)} / SAM $${fmtNum(fm.marketSizing.sam)}` : 'Financial Models (Market Sizing)', filled: !!fm?.marketSizing },
      { number: '09', title: 'Competitive Landscape', description: 'Alternatives, limitations, white space, differentiation.', sourceLabel: comps.length > 0 ? `${comps.length} competitors (${comps.map(c => c.name).join(', ')})` : 'Competitor Analysis', filled: comps.length > 0 },
      { number: '10', title: 'Traction & Validation', description: 'Evidence ranked by signal strength.', sourceLabel: [interviews?.uploads?.length ? `${interviews.uploads.length} interview(s)` : '', insights.length > 0 ? `${insights.length} insights` : '', clients.length > 0 ? `${clients.length} client targets` : ''].filter(Boolean).join(' + ') || 'Interviews + Insights + Client List', filled: !!(interviews?.uploads?.length) || insights.length > 0 || clients.length > 0 },
      { number: '11', title: 'The Team', description: 'Founder background, domain expertise, known gaps.', sourceLabel: 'Idea Intake (dim 08)', filled: dimActive('08') },
      { number: '12', title: 'The Ask', description: 'Capital requested, use of funds, Stage 04 milestones.', sourceLabel: fm?.mvpCost ? `MVP Cost: $${fmtNum(fm.mvpCost.scenarios.base)} base` : 'Financial Models (MVP Cost)', filled: !!fm?.mvpCost },
    ]
  }, [venture])

  return (
    <div className="rounded-xl p-5 mb-4" style={CARD}>
      <h3 className="font-heading font-semibold text-sm mb-1">What this Deck will include</h3>
      <p className="text-[10px] text-[var(--text-muted)] mb-4">
        12 slides following the PRD structure. Each slide draws from specific venture data.
      </p>
      <div className="space-y-2.5">
        {slides.map((slide) => (
          <div key={slide.number} className="flex items-start gap-2.5">
            <span
              className="text-[10px] font-mono w-5 text-right shrink-0 pt-0.5"
              style={{ color: slide.filled ? 'var(--accent-primary)' : 'var(--text-muted)' }}
            >
              {slide.number}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <CheckIcon filled={slide.filled} />
                <span className="text-xs text-[var(--text-primary)] font-semibold">{slide.title}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 ml-6">{slide.description}</p>
              <p className="text-[10px] mt-0.5 ml-6" style={{ color: slide.filled ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
                ← {slide.sourceLabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toLocaleString()
}

function SourcesSection({ citations, citationIds }: { citations: VentureCitation[]; citationIds: number[] }) {
  const referenced = citationIds
    .map((idx) => citations[idx - 1])
    .filter((c): c is VentureCitation => !!c)

  const toShow = referenced.length > 0 ? referenced : citations

  if (toShow.length === 0) return null

  return (
    <div className="rounded-xl p-5 mt-4" style={CARD}>
      <h4 className="font-heading font-semibold text-sm mb-3 text-[var(--accent-primary)]">
        Sources
      </h4>
      <ol className="space-y-2 list-decimal list-inside">
        {toShow.map((c) => (
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
  )
}

// ── Investment Memo Card ─────────────────────────────────────

function InvestmentMemoCard() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!venture) return null

  const saved = venture.investmentMemo
  const citations = venture.citations ?? []
  const canGenerate = !!(venture.ideaIntake?.messages?.length)

  const generate = async () => {
    if (!venture || !activeVentureId) return
    setLoading(true)
    setError(null)
    try {
      let fullContext: string
      try {
        fullContext = await retrieveVentureContext(venture.id, 'Investment memo: executive summary, why now, market context, ICP, market size, competitive landscape, revenue model, unit economics, risks, mitigation, recommendations, solution definition, differentiation, interview insights, validation evidence, traction, client pipeline', {
          topK: 35,
          maxChars: 16000,
        })
      } catch {
        fullContext = buildVentureContext(venture, { sections: 'full' })
      }
      const result = await aiService.chatWithStructuredOutput<InvestmentMemoSections & { citationIds?: number[] }>({
        systemPrompt: buildInvestmentMemoSystemBlocks(fullContext.slice(0, 16000)),
        messages: [{ role: 'user', content: 'Generate an Investment Memo from this venture data.' }],
        maxTokens: 6000,
      })

      const { citationIds, ...content } = result
      const doc: InvestmentMemoDocument = {
        content,
        citationIds: citationIds ?? [],
        generatedAt: new Date().toISOString(),
        version: (saved?.version ?? 0) + 1,
      }

      updateVenture(activeVentureId, { investmentMemo: doc })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!saved) return
    try {
      const referenced = (saved.citationIds ?? [])
        .map((idx) => citations[idx - 1])
        .filter((c): c is VentureCitation => !!c)
      const blob = await createInvestmentMemoDocx(venture.name.value, saved.content as unknown as InvestmentMemoSections, referenced)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value.replace(/\s+/g, '-')}-Investment-Memo.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  return (
    <div>
      {canGenerate && <MemoPreview venture={venture} />}
      <div className="rounded-xl p-6" style={CARD}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-lg">Investment Memo</h3>
          <SourceChip source="AI_SYNTHESIS" subSource="Investment Memo" small />
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-1">
          Full incubation document for Investment Committee — 10-20 pages.
        </p>
        {saved && (
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            v{saved.version} — {new Date(saved.generatedAt).toLocaleString()}
          </span>
        )}
        <div className="flex gap-3 mt-3">
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
        {error && <p className="mt-2 text-xs font-mono" style={{ color: '#EF4444' }}>{error}</p>}
      </div>

      {saved && (
        <div className="mt-4 space-y-3">
          {Object.entries(saved.content).map(([key, text]) => (
            <div key={key} className="rounded-xl p-5" style={CARD}>
              <h4 className="font-heading font-semibold text-sm mb-2 text-[var(--accent-primary)]">
                {MEMO_LABELS[key] ?? key}
              </h4>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {renderValidationBadges(text)}
              </p>
            </div>
          ))}
          <SourcesSection citations={citations} citationIds={saved.citationIds} />
        </div>
      )}
    </div>
  )
}

// ── Pitch Deck Card ──────────────────────────────────────────

const AUDIENCES = [
  'Studio Investment Committee',
  'Design Partner / Potential Client',
  'External VC / Co-investor',
  'Executive Sponsor',
] as const

const PURPOSES = [
  'Stage Gate Advancement',
  'Design Partner Recruitment',
  'Investment Ask',
  'Internal Alignment',
] as const

function PitchDeckCard() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audience, setAudience] = useState<string>(AUDIENCES[0])
  const [purpose, setPurpose] = useState<string>(PURPOSES[0])

  if (!venture) return null

  const saved = venture.pitchDeck
  const citations = venture.citations ?? []
  const canGenerate = !!(venture.ideaIntake?.messages?.length)

  const generate = async () => {
    if (!venture || !activeVentureId) return
    setLoading(true)
    setError(null)
    try {
      let fullContext: string
      try {
        fullContext = await retrieveVentureContext(venture.id, 'Pitch deck: hook, problem, why now, solution, product vision, ICP, business model, market opportunity, competitive landscape, traction, validation, interview insights, team, the ask', {
          topK: 30,
          maxChars: 14000,
        })
      } catch {
        fullContext = buildVentureContext(venture, { sections: 'full' })
      }
      const contextWithAudience = `AUDIENCE: ${audience}\nPURPOSE: ${purpose}\n\n${fullContext.slice(0, 13800)}`
      const result = await aiService.chatWithStructuredOutput<PitchDeckSlides & { citationIds?: number[] }>({
        systemPrompt: buildPitchDeckSystemBlocks(contextWithAudience),
        messages: [{ role: 'user', content: 'Generate a Pitch Deck from this venture data.' }],
        maxTokens: 4000,
      })

      const { citationIds, ...content } = result
      const doc: PitchDeckDocument = {
        content,
        citationIds: citationIds ?? [],
        generatedAt: new Date().toISOString(),
        version: (saved?.version ?? 0) + 1,
      }

      updateVenture(activeVentureId, { pitchDeck: doc })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!saved) return
    try {
      const blob = await createPitchDeckPptx(venture.name.value, saved.content as unknown as PitchDeckSlides)
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value.replace(/\s+/g, '-')}-Pitch-Deck.pptx`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  return (
    <div>
      {canGenerate && <DeckPreview venture={venture} />}
      <div className="rounded-xl p-6" style={CARD}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-semibold text-lg">Pitch Deck</h3>
          <SourceChip source="AI_SYNTHESIS" subSource="Pitch Deck" small />
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-1">
          12-slide visual narrative tailored to your audience.
        </p>
        {saved && (
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            v{saved.version} — {new Date(saved.generatedAt).toLocaleString()}
          </span>
        )}
        {/* Audience / Purpose selector */}
        <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1 uppercase tracking-wide font-semibold">Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-muted)] block mb-1 uppercase tracking-wide font-semibold">Purpose</label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full text-sm bg-[rgba(19,17,28,0.8)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
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
              Download .pptx
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs font-mono" style={{ color: '#EF4444' }}>{error}</p>}
      </div>

      {saved && (
        <div className="mt-4 space-y-3">
          {Object.entries(saved.content).map(([key, text]) => (
            <div key={key} className="rounded-xl p-5" style={CARD}>
              <h4 className="font-heading font-semibold text-sm mb-2 text-[var(--accent-primary)]">
                {DECK_LABELS[key] ?? key}
              </h4>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {renderValidationBadges(text)}
              </p>
            </div>
          ))}
          <SourcesSection citations={citations} citationIds={saved.citationIds} />
        </div>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────

export function IncubateOutputs() {
  const { ventures, activeVentureId } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Outputs</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl mb-1">Outputs</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Investment Memo and Pitch Deck — generated from the full venture record.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <InvestmentMemoCard />
        <PitchDeckCard />
      </div>
    </div>
  )
}
