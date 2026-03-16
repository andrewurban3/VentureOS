import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildPricingLabRecommendationBlocks, parsePricingLabRecommendationResponse } from '@/agents/build/pricingLab'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { createPricingLabRecommendationDocx } from '@/services/export'
import type { PricingLabAssumption, PricingLabRecommendation } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const SOURCE_OPTIONS: PricingLabAssumption['source'][] = ['FOUNDER', 'VL', 'AI_RESEARCH', 'CLIENT_INTERVIEW']
const CONFIDENCE_OPTIONS: PricingLabAssumption['confidence'][] = ['High', 'Medium', 'Low']

export function PricingLab() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const pricingLab = venture?.pricingLab
  const assumptions = pricingLab?.assumptions ?? []
  const recommendation = pricingLab?.recommendation
  const versionHistory = pricingLab?.versionHistory ?? []

  const saveAssumptions = (next: PricingLabAssumption[]) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, {
      pricingLab: {
        assumptions: next,
        recommendation: pricingLab?.recommendation,
        versionHistory: pricingLab?.versionHistory,
      },
    })
  }

  const addAssumption = () => {
    const now = new Date().toISOString()
    saveAssumptions([
      ...assumptions,
      {
        id: crypto.randomUUID(),
        label: '',
        value: '',
        source: 'FOUNDER',
        confidence: 'Medium',
        updatedAt: now,
      },
    ])
  }

  const updateAssumption = (id: string, updates: Partial<PricingLabAssumption>) => {
    saveAssumptions(
      assumptions.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    )
  }

  const removeAssumption = (id: string) => {
    saveAssumptions(assumptions.filter((a) => a.id !== id))
  }

  const handleGenerateRecommendation = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildPricingLabRecommendationBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate the pricing recommendation.' }],
        maxTokens: 4000,
      })
      const rec = parsePricingLabRecommendationResponse(resp.text)
      const history = recommendation
        ? [...versionHistory, { generatedAt: recommendation.generatedAt, snapshot: recommendation }]
        : versionHistory
      updateVenture(activeVentureId, {
        pricingLab: {
          assumptions,
          recommendation: rec,
          versionHistory: history,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate recommendation')
    } finally {
      setLoading(false)
    }
  }

  const handleExportDocx = () => {
    if (!venture || !recommendation) return
    createPricingLabRecommendationDocx(venture.name.value, recommendation).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-pricing-lab.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Pricing Lab</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Pricing Lab</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Add assumptions (Founder, VL, AI Research, Client Interview), then generate a tier and price recommendation.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="rounded-xl p-6 mb-6" style={CARD}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg">Assumptions</h2>
            <button
              onClick={addAssumption}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              + Add assumption
            </button>
          </div>
          <div className="space-y-3">
            {assumptions.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center gap-2 rounded-lg p-3"
                style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
              >
                <input
                  value={a.label}
                  onChange={(e) => updateAssumption(a.id, { label: e.target.value })}
                  placeholder="Label"
                  className="w-40 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
                />
                <input
                  value={typeof a.value === 'number' ? String(a.value) : a.value}
                  onChange={(e) => {
                    const v = e.target.value
                    updateAssumption(a.id, { value: /^\d+(\.\d+)?$/.test(v) ? parseFloat(v) : v })
                  }}
                  placeholder="Value"
                  className="w-32 px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
                />
                <select
                  value={a.source}
                  onChange={(e) => updateAssumption(a.id, { source: e.target.value as PricingLabAssumption['source'] })}
                  className="px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
                >
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={a.confidence}
                  onChange={(e) => updateAssumption(a.id, { confidence: e.target.value as PricingLabAssumption['confidence'] })}
                  className="px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] text-sm"
                >
                  {CONFIDENCE_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <SourceChip source={a.source} small />
                {a.citation && (
                  <span className="text-xs text-[var(--text-muted)]" title={a.citation.url}>
                    {a.citation.title}
                  </span>
                )}
                <button
                  onClick={() => removeAssumption(a.id)}
                  className="ml-auto text-red-400 hover:underline text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerateRecommendation}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : recommendation ? 'Regenerate recommendation' : 'Generate recommendation'}
          </button>
          {recommendation && (
            <button
              onClick={handleExportDocx}
              className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
            >
              Export .docx
            </button>
          )}
        </div>

        {recommendation && (
          <div className="rounded-xl p-6 mb-6" style={CARD}>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <h2 className="font-heading font-semibold text-lg">Recommendation</h2>
              <SourceChip source={recommendation.source} />
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(recommendation.generatedAt).toLocaleString()}
              </span>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-1">Tier structure</h3>
                <p className="text-[var(--text-primary)] whitespace-pre-wrap">{recommendation.tierStructure}</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-1">Price points</h3>
                <p className="text-[var(--text-primary)] whitespace-pre-wrap">{recommendation.pricePoints}</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-1">Discounting policy</h3>
                <p className="text-[var(--text-primary)] whitespace-pre-wrap">{recommendation.discountingPolicy}</p>
              </div>
              <div>
                <h3 className="font-heading font-semibold text-[var(--text-primary)] mb-1">Rationale</h3>
                <p className="text-[var(--text-primary)] whitespace-pre-wrap">{recommendation.rationale}</p>
              </div>
            </div>
          </div>
        )}

        {versionHistory.length > 0 && (
          <div className="rounded-xl p-4" style={CARD}>
            <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-muted)]">Version history</h3>
            <ul className="space-y-1 text-xs text-[var(--text-muted)]">
              {versionHistory.map((v, i) => (
                <li key={i}>
                  v{i + 1}: {new Date(v.generatedAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
