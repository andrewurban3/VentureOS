import { useState, useEffect, useRef } from 'react'
import { useVentures } from '@/context/VentureContext'
import { SourceChip } from '@/components/SourceChip'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { aiService } from '@/services/ai'
import { buildGtmStrategyBlocks } from '@/agents/commercial/gtmStrategy'
import { buildSowTemplateBlocks } from '@/agents/commercial/sowTemplate'
import type { SignedSowEntry, AcquisitionFunnelStage } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const DEFAULT_FUNNEL_STAGES: AcquisitionFunnelStage[] = [
  { stage: 'Lead', count: 0 },
  { stage: 'Qualified', count: 0 },
  { stage: 'Proposal', count: 0 },
  { stage: 'Signed', count: 0 },
]

export function GtmTracker() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const gtm = venture?.gtmTracker
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [sowTemplate, setSowTemplate] = useState<string | null>(null)

  const handleGtmChange = (updates: Partial<NonNullable<typeof gtm>>) => {
    if (!gtm || !activeVentureId) return
    updateVenture(activeVentureId, {
      gtmTracker: { ...gtm, ...updates, source: 'VL' },
    })
  }

  const initGtm = () => {
    if (!activeVentureId || !venture) return
    const now = new Date().toISOString()
    const computed = computeFunnelFromClientList(venture.clientList, [])
    const funnel = computed.some((s) => s.count > 0) ? computed : DEFAULT_FUNNEL_STAGES
    updateVenture(activeVentureId, {
      gtmTracker: {
        gtmPlan: '',
        pricingImplementationPlan: '',
        signedSowTracker: [],
        acquisitionFunnel: funnel,
        generatedAt: now,
        source: 'VL',
      },
    })
  }

  const generateGtmStrategy = async () => {
    if (!venture || !activeVentureId) return
    setLoading(true)
    setApiError(null)
    setLoadingStep('Generating GTM strategy...')
    try {
      const blocks = await buildGtmStrategyBlocks(venture)
      const result = await aiService.chatWithStructuredOutput<{ gtmPlan: string; pricingImplementationPlan: string }>({
        systemPrompt: blocks,
        messages: [{ role: 'user', content: 'Generate the GTM plan.' }],
        maxTokens: 3000,
      })
      handleGtmChange({
        gtmPlan: result.gtmPlan ?? '',
        pricingImplementationPlan: result.pricingImplementationPlan ?? '',
        source: 'AI_SYNTHESIS',
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate GTM strategy')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const generateSowTemplate = async () => {
    if (!venture || !activeVentureId) return
    setLoading(true)
    setApiError(null)
    setLoadingStep('Generating SOW template...')
    try {
      const blocks = await buildSowTemplateBlocks(venture)
      const result = await aiService.chatWithStructuredOutput<{ template: string }>({
        systemPrompt: blocks,
        messages: [{ role: 'user', content: 'Generate the SOW template.' }],
        maxTokens: 2000,
      })
      setSowTemplate(result.template ?? '')
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate SOW template')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const updateFunnelStage = (idx: number, count: number) => {
    if (!gtm) return
    const funnel = gtm.acquisitionFunnel ?? DEFAULT_FUNNEL_STAGES
    const next = funnel.map((s, i) => (i === idx ? { ...s, count } : s))
    handleGtmChange({ acquisitionFunnel: next })
  }

  const ensureFunnel = () => {
    handleGtmChange({ acquisitionFunnel: DEFAULT_FUNNEL_STAGES })
  }

  const syncFunnelFromClientList = () => {
    const computed = computeFunnelFromClientList(venture?.clientList, gtm?.signedSowTracker)
    handleGtmChange({ acquisitionFunnel: computed })
  }

  const hasAutoSynced = useRef(false)
  useEffect(() => {
    if (!gtm || !venture || hasAutoSynced.current) return
    const hasClientData = (venture.clientList?.entries?.length ?? 0) > 0 || (gtm.signedSowTracker?.length ?? 0) > 0
    const funnelEmpty = !gtm.acquisitionFunnel?.length || gtm.acquisitionFunnel.every((s) => s.count === 0)
    if (hasClientData && funnelEmpty) {
      const computed = computeFunnelFromClientList(venture.clientList, gtm.signedSowTracker)
      if (computed.some((s) => s.count > 0)) {
        hasAutoSynced.current = true
        handleGtmChange({ acquisitionFunnel: computed })
      }
    }
  }, [venture?.id, venture?.clientList?.entries?.length, gtm?.signedSowTracker?.length])

  const addSowEntry = () => {
    if (!gtm) return
    handleGtmChange({
      signedSowTracker: [...gtm.signedSowTracker, { company: '', status: '' }],
    })
  }

  const updateSowEntry = (idx: number, updates: Partial<SignedSowEntry>) => {
    if (!gtm) return
    const next = gtm.signedSowTracker.map((e, i) => (i === idx ? { ...e, ...updates } : e))
    handleGtmChange({ signedSowTracker: next })
  }

  const removeSowEntry = (idx: number) => {
    if (!gtm) return
    handleGtmChange({
      signedSowTracker: gtm.signedSowTracker.filter((_, i) => i !== idx),
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">GTM Tracker</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">GTM Tracker</h1>
          <p className="text-sm text-[var(--text-muted)]">
            GTM plan (10/50/100 trajectory), pricing implementation plan, and signed SOW tracker.
          </p>
        </div>

        {!gtm ? (
          <div className="rounded-xl p-6" style={CARD}>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Create a GTM tracker to plan and track go-to-market execution.
            </p>
            <button
              onClick={initGtm}
              className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
            >
              Start GTM tracker
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
            {loadingStep && (
              <p className="text-sm text-[var(--text-muted)]">{loadingStep}</p>
            )}
            <div className="rounded-xl p-6" style={CARD}>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h2 className="font-heading font-semibold text-lg">GTM plan</h2>
                <SourceChip source={gtm.source} />
                <button
                  onClick={generateGtmStrategy}
                  disabled={loading}
                  className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Generating...' : 'Generate with AI'}
                </button>
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(gtm.generatedAt).toLocaleString()}
                </span>
              </div>
              <textarea
                value={gtm.gtmPlan}
                onChange={(e) => handleGtmChange({ gtmPlan: e.target.value })}
                placeholder="10/50/100 trajectory: first 10 customers, next 50, scale to 100. Channels, timelines, ownership."
                rows={5}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
              />
            </div>

            <div className="rounded-xl p-6" style={CARD}>
              <h2 className="font-heading font-semibold text-lg mb-2">Pricing implementation plan</h2>
              <textarea
                value={gtm.pricingImplementationPlan}
                onChange={(e) => handleGtmChange({ pricingImplementationPlan: e.target.value })}
                placeholder="How pricing from Stage 06 will be rolled out (contracts, sales enablement, timing). Link to Pricing Lab output."
                rows={4}
                className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
              />
            </div>

            <div className="rounded-xl p-6" style={CARD}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-heading font-semibold text-lg">Signed SOW tracker (10 target)</h2>
                <div className="flex gap-2">
                  <button
                    onClick={generateSowTemplate}
                    disabled={loading}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? '...' : 'SOW template'}
                  </button>
                  <button
                    onClick={addSowEntry}
                    className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
                  >
                    + Add company
                  </button>
                </div>
              </div>
              {sowTemplate && (
                <div className="mb-4 p-4 rounded-lg" style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-[var(--text-muted)]">SOW template</span>
                    <button
                      onClick={() => setSowTemplate(null)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Close
                    </button>
                  </div>
                  <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap font-sans max-h-48 overflow-auto">
                    {sowTemplate}
                  </pre>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                      <th className="pb-2 pr-4">Company</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2 w-16" />
                    </tr>
                  </thead>
                  <tbody>
                    {gtm.signedSowTracker.map((row, idx) => (
                      <tr key={idx} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-4">
                          <input
                            value={row.company}
                            onChange={(e) => updateSowEntry(idx, { company: e.target.value })}
                            placeholder="Company name"
                            className="w-full px-2 py-1 rounded bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                          />
                        </td>
                        <td className="py-2">
                          <input
                            value={row.status}
                            onChange={(e) => updateSowEntry(idx, { status: e.target.value })}
                            placeholder="e.g. Signed / In progress / Pipeline"
                            className="w-full px-2 py-1 rounded bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)]"
                          />
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => removeSowEntry(idx)}
                            className="text-red-400 hover:underline text-xs"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {gtm.signedSowTracker.length > 0 && (
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Target: 10 signed SOWs. Current: {gtm.signedSowTracker.filter((r) => /signed|closed/i.test(r.status)).length}.
                </p>
              )}
            </div>

            <div className="rounded-xl p-6" style={CARD}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-heading font-semibold text-lg">Acquisition funnel</h2>
                <div className="flex gap-2">
                  <button
                    onClick={syncFunnelFromClientList}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:opacity-90"
                  >
                    Sync from client list
                  </button>
                  <button
                    onClick={ensureFunnel}
                    className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-primary)]"
                  >
                    {gtm.acquisitionFunnel?.length ? 'Reset' : 'Add funnel'}
                  </button>
                </div>
              </div>
              {(gtm.acquisitionFunnel ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {(gtm.acquisitionFunnel ?? DEFAULT_FUNNEL_STAGES).map((s, idx) => (
                    <div
                      key={s.stage}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg"
                      style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">{s.stage}</span>
                      <input
                        type="number"
                        min={0}
                        value={s.count}
                        onChange={(e) => updateFunnelStage(idx, parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">
                  Track leads through the funnel: Lead → Qualified → Proposal → Signed.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
