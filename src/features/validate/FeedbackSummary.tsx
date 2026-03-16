import { useState, useRef } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import { buildFeedbackSummaryBlocks } from '@/agents/validate/feedbackSummary'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { Document, Paragraph, HeadingLevel, Packer } from 'docx'
import type { DesignPartnerFeedbackSummary, DesignPartnerCandidate } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

function exportFeedbackDocx(ventureName: string, summary: DesignPartnerFeedbackSummary) {
  const sectionParagraphs = (title: string, items: string[]) => [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 200 },
    }),
    ...items.map(
      (item) => new Paragraph({ text: `• ${item}`, spacing: { after: 120 } })
    ),
  ]

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: ventureName,
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: 'Design Partner Feedback Summary',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            text: `Generated ${new Date(summary.generatedAt).toLocaleDateString()} · Partners: ${summary.partnerTags.map((p) => p.companyName).join(', ')}`,
            spacing: { after: 300 },
          }),
          ...sectionParagraphs('Common Themes', summary.content.commonThemes),
          ...sectionParagraphs('Divergent Feedback', summary.content.divergentFeedback),
          ...sectionParagraphs('Strongest Use Cases', summary.content.strongestUseCases),
          ...sectionParagraphs('Product Gaps', summary.content.productGaps),
          new Paragraph({
            text: 'Narrative Summary',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 200 },
          }),
          ...summary.content.narrative
            .split(/\n{2,}/)
            .filter(Boolean)
            .map((p) => new Paragraph({ text: p.trim(), spacing: { after: 200 } })),
        ],
      },
    ],
  })

  Packer.toBlob(doc).then((blob) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${ventureName}-feedback-summary.docx`
    a.click()
    URL.revokeObjectURL(a.href)
  })
}

export function FeedbackSummary() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const notesRef = useRef<Record<string, string>>({})

  const candidates = venture?.designPartnerPipeline?.candidates ?? []
  const withNotes = candidates.filter((c) => c.conversationNotes?.trim())
  const summary = venture?.designPartnerFeedbackSummary

  const handleNotesChange = (candidateId: string, value: string) => {
    notesRef.current[candidateId] = value
  }

  const handleNotesBlur = (candidate: DesignPartnerCandidate) => {
    if (!venture || !activeVentureId) return
    const newValue = notesRef.current[candidate.id]
    if (newValue === undefined || newValue === (candidate.conversationNotes ?? '')) return

    const updatedCandidates = candidates.map((c) =>
      c.id === candidate.id
        ? { ...c, conversationNotes: newValue, updatedAt: new Date().toISOString() }
        : c
    )
    updateVenture(activeVentureId, {
      designPartnerPipeline: {
        candidates: updatedCandidates,
        generatedAt: venture.designPartnerPipeline?.generatedAt ?? new Date().toISOString(),
      },
    })
  }

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildFeedbackSummaryBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON matching the schema. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Synthesize the design partner feedback into a structured summary.' }],
        maxTokens: 4000,
      })

      const result = parseJsonFromResponse<DesignPartnerFeedbackSummary['content']>(resp.text)
      const now = new Date().toISOString()
      const partnerTags = withNotes.map((c) => ({ partnerId: c.id, companyName: c.companyName }))

      updateVenture(activeVentureId, {
        designPartnerFeedbackSummary: {
          content: result,
          partnerTags,
          generatedAt: now,
          version: (summary?.version ?? 0) + 1,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate feedback summary')
    } finally {
      setLoading(false)
    }
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Feedback Summary</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  if (candidates.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Feedback Summary</h2>
          <p className="text-sm text-[var(--text-muted)]">
            No design partners yet. Add candidates in the Design Partner Pipeline first.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Design Partner Feedback Summary</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Record conversation notes per partner, then synthesize common themes and insights.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        {/* Conversation Notes Section */}
        <div className="rounded-xl p-6 mb-6" style={CARD}>
          <h2 className="font-heading font-semibold text-lg mb-4">Conversation Notes</h2>
          <div className="space-y-4">
            {candidates.map((c) => (
              <div key={c.id} className="rounded-lg p-4" style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-[var(--text-primary)]">{c.companyName}</span>
                  <span className="text-xs text-[var(--text-muted)]">{c.contactName}, {c.contactTitle}</span>
                  <SourceChip source={c.source} small />
                </div>
                <textarea
                  defaultValue={c.conversationNotes ?? ''}
                  onChange={(e) => handleNotesChange(c.id, e.target.value)}
                  onBlur={() => handleNotesBlur(c)}
                  placeholder="Paste or type conversation notes, key quotes, feedback..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading || withNotes.length === 0}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Synthesizing...' : summary ? 'Regenerate Summary' : 'Generate Summary'}
          </button>
          {withNotes.length === 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              Add conversation notes to at least one partner to generate a summary.
            </span>
          )}
          {loading && (
            <span className="text-sm text-[var(--text-muted)] animate-pulse">
              Analyzing feedback across {withNotes.length} partner{withNotes.length !== 1 ? 's' : ''}...
            </span>
          )}
        </div>

        {/* Summary Display */}
        {summary && (
          <div className="space-y-4">
            <div className="rounded-xl p-6" style={CARD}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading font-semibold text-lg">Synthesis</h2>
                  <SourceChip source="DESIGN_PARTNER" />
                  <span className="text-xs text-[var(--text-muted)]">
                    v{summary.version} · {new Date(summary.generatedAt).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => exportFeedbackDocx(venture.name.value, summary)}
                  className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
                >
                  Export .docx
                </button>
              </div>

              {/* Partner tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {summary.partnerTags.map((tag) => (
                  <SourceChip
                    key={tag.partnerId}
                    source="DESIGN_PARTNER"
                    subSource={tag.companyName}
                    small
                  />
                ))}
              </div>

              {/* Common Themes */}
              <SummarySection title="Common Themes" items={summary.content.commonThemes} accentColor="#10B981" />

              {/* Divergent Feedback */}
              <SummarySection title="Divergent Feedback" items={summary.content.divergentFeedback} accentColor="#F59E0B" />

              {/* Strongest Use Cases */}
              <SummarySection title="Strongest Use Cases" items={summary.content.strongestUseCases} accentColor="#7C6AF7" />

              {/* Product Gaps */}
              <SummarySection title="Product Gaps" items={summary.content.productGaps} accentColor="#EF4444" />

              {/* Narrative */}
              <div className="mt-5">
                <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
                  Narrative Summary
                </h3>
                <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap rounded-lg p-4"
                  style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                >
                  {summary.content.narrative}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummarySection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
  if (!items.length) return null
  return (
    <div className="mb-4">
      <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: accentColor }}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
