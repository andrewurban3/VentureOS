import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import type { SystemBlock } from '@/services/ai/types'
import {
  buildMvpCostSystemBlocks,
  buildUnitEconomicsSystemBlocks,
  buildMarketSizingSystemBlocks,
} from '@/agents/incubate'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type {
  MvpCostModel,
  UnitEconomicsModel,
  MarketSizingModel,
  FinancialAssumption,
} from '@/types/venture'

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

type TabId = 'mvp' | 'unit' | 'market'

function runWithWebSearch<T>(
  systemBlocks: SystemBlock[],
  userMessage: string
): Promise<T> {
  return anthropicProvider
    .chat({
      systemPrompt: [
        ...systemBlocks,
        { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
      ],
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 4000,
      tools: [WEB_SEARCH_TOOL],
    })
    .then((r) => parseJsonFromResponse<T>(r.text))
}

function AssumptionRow({ a }: { a: FinancialAssumption }) {
  return (
    <div className="flex items-start gap-2 py-2" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--text-primary)]">{a.label}</span>
          <SourceChip source={a.source} small />
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: a.confidence === 'High' ? 'rgba(16,185,129,0.15)' : a.confidence === 'Medium' ? 'rgba(245,158,11,0.15)' : 'rgba(139,135,168,0.15)',
              color: a.confidence === 'High' ? '#10B981' : a.confidence === 'Medium' ? '#F59E0B' : '#8B87A8',
            }}
          >
            {a.confidence}
          </span>
        </div>
        <p className="text-sm text-[var(--text-primary)] mt-0.5">
          {typeof a.value === 'number' ? a.value.toLocaleString() : a.value}
        </p>
        {a.citation && (
          <a
            href={a.citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[var(--accent-secondary)] hover:underline"
          >
            {a.citation.title}
          </a>
        )}
      </div>
    </div>
  )
}

export function FinancialModels() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [tab, setTab] = useState<TabId>('mvp')
  const [loading, setLoading] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const models = venture?.financialModels
  const mvp = models?.mvpCost
  const unit = models?.unitEconomics
  const market = models?.marketSizing

  const addIds = <T extends { id?: string }>(arr: T[]): T[] =>
    arr.map((a) => ({ ...a, id: a.id ?? crypto.randomUUID() }))

  const handleGenerateMvp = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading('mvp')
    try {
      const blocks = await buildMvpCostSystemBlocks(venture)
      const raw = await runWithWebSearch<MvpCostModel & { assumptions?: FinancialAssumption[] }>(
        blocks,
        'Generate the MVP Cost Model.'
      )
      const now = new Date().toISOString()
      const assumptions = addIds((raw.assumptions ?? []).map((a) => ({ ...a, updatedAt: now })))
      const model: MvpCostModel = {
        mvpFeatures: raw.mvpFeatures ?? [],
        scenarios: raw.scenarios ?? { conservative: 0, base: 0, aggressive: 0 },
        lineItems: raw.lineItems ?? [],
        assumptions,
        generatedAt: now,
      }
      updateVenture(activeVentureId, {
        financialModels: {
          ...venture.financialModels,
          mvpCost: model,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate MVP Cost')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateUnit = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading('unit')
    try {
      const blocks = await buildUnitEconomicsSystemBlocks(venture)
      const raw = await runWithWebSearch<UnitEconomicsModel & { assumptions?: FinancialAssumption[] }>(
        blocks,
        'Generate the Unit Economics Model.'
      )
      const now = new Date().toISOString()
      const assumptions = addIds((raw.assumptions ?? []).map((a) => ({ ...a, updatedAt: now })))
      const model: UnitEconomicsModel = {
        inputs: raw.inputs ?? {},
        outputs: raw.outputs ?? { ltv: 0, ltvCac: 0, paybackMonths: 0 },
        assumptions,
        generatedAt: now,
      }
      updateVenture(activeVentureId, {
        financialModels: {
          ...venture.financialModels,
          unitEconomics: model,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate Unit Economics')
    } finally {
      setLoading(null)
    }
  }

  const handleGenerateMarket = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading('market')
    try {
      const blocks = await buildMarketSizingSystemBlocks(venture)
      const raw = await runWithWebSearch<MarketSizingModel & { assumptions?: FinancialAssumption[] }>(
        blocks,
        'Generate the Market Sizing Model.'
      )
      const now = new Date().toISOString()
      const assumptions = addIds((raw.assumptions ?? []).map((a) => ({ ...a, updatedAt: now })))
      const model: MarketSizingModel = {
        tam: raw.tam ?? 0,
        sam: raw.sam ?? 0,
        som: raw.som ?? 0,
        methodology: raw.methodology ?? '',
        assumptions,
        generatedAt: now,
      }
      updateVenture(activeVentureId, {
        financialModels: {
          ...venture.financialModels,
          marketSizing: model,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate Market Sizing')
    } finally {
      setLoading(null)
    }
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Financial Models</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'mvp', label: 'MVP Cost' },
    { id: 'unit', label: 'Unit Economics' },
    { id: 'market', label: 'Market Sizing' },
  ]

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Financial Models</h1>
          <p className="text-sm text-[var(--text-muted)]">
            MVP Cost, Unit Economics, and Market Sizing — all with transparent assumptions.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="flex gap-2 mb-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: tab === t.id ? 'rgba(124,106,247,0.2)' : 'transparent',
                color: tab === t.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                border: `1px solid ${tab === t.id ? 'rgba(124,106,247,0.4)' : 'var(--border)'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'mvp' && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg">MVP Cost Model</h3>
              <button
                onClick={handleGenerateMvp}
                disabled={!!loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'mvp' ? 'Generating...' : mvp ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {mvp ? (
              <div className="space-y-4">
                {mvp.mvpFeatures && mvp.mvpFeatures.length > 0 && (
                  <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)' }}>
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-3">MVP Features (in scope)</h4>
                    <ul className="space-y-2">
                      {mvp.mvpFeatures.map((f, i) => (
                        <li key={i} className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-[var(--text-primary)]">{f.feature}</span>
                          {f.description && (
                            <span className="text-xs text-[var(--text-muted)]">{f.description}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Conservative</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(mvp.scenarios.conservative ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Base</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(mvp.scenarios.base ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Aggressive</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(mvp.scenarios.aggressive ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                {mvp.lineItems?.length > 0 && (
                  <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: 'rgba(124,106,247,0.08)' }}>
                          <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">Category</th>
                          <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Conservative</th>
                          <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Base</th>
                          <th className="text-right px-3 py-2 text-[var(--text-muted)] font-medium">Aggressive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mvp.lineItems.map((li, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td className="px-3 py-2 text-[var(--text-primary)]">{li.category}</td>
                            <td className="px-3 py-2 text-right text-[var(--text-primary)]">${(li.conservative ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-[var(--text-primary)]">${(li.base ?? 0).toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-[var(--text-primary)]">${(li.aggressive ?? 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {mvp.assumptions?.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Assumptions</h4>
                    {mvp.assumptions.map((a) => (
                      <AssumptionRow key={a.id} a={a} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Generate to see the MVP cost estimate.</p>
            )}
          </div>
        )}

        {tab === 'unit' && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg">Unit Economics Model</h3>
              <button
                onClick={handleGenerateUnit}
                disabled={!!loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'unit' ? 'Generating...' : unit ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {unit ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">LTV</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(unit.outputs.ltv ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">LTV:CAC</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {(unit.outputs.ltvCac ?? 0).toFixed(1)}x
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Payback (mo)</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      {(unit.outputs.paybackMonths ?? 0).toFixed(0)}
                    </div>
                  </div>
                  {unit.outputs.ruleOf40 != null && (
                    <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                      <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Rule of 40</div>
                      <div className="text-lg font-bold text-[var(--text-primary)]">
                        {(unit.outputs.ruleOf40 ?? 0).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
                {unit.assumptions?.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Assumptions</h4>
                    {unit.assumptions.map((a) => (
                      <AssumptionRow key={a.id} a={a} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Generate to see unit economics.</p>
            )}
          </div>
        )}

        {tab === 'market' && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg">Market Sizing Model</h3>
              <button
                onClick={handleGenerateMarket}
                disabled={!!loading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading === 'market' ? 'Generating...' : market ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {market ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">TAM</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(market.tam ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">SAM</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(market.sam ?? 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
                    <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase">SOM</div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">
                      ${(market.som ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                {market.methodology && (
                  <div className="pt-2">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Methodology</h4>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                      {market.methodology}
                    </p>
                  </div>
                )}
                {market.assumptions?.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-xs font-medium text-[var(--text-muted)] uppercase mb-2">Assumptions</h4>
                    {market.assumptions.map((a) => (
                      <AssumptionRow key={a.id} a={a} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Generate to see market sizing.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
