import { useVentures } from '@/context/VentureContext'
import { SourceChip } from '@/components/SourceChip'
import type { SignedSowEntry } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function GtmTracker() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const gtm = venture?.gtmTracker

  const handleGtmChange = (updates: Partial<NonNullable<typeof gtm>>) => {
    if (!gtm || !activeVentureId) return
    updateVenture(activeVentureId, {
      gtmTracker: { ...gtm, ...updates, source: 'VL' },
    })
  }

  const initGtm = () => {
    if (!activeVentureId) return
    const now = new Date().toISOString()
    updateVenture(activeVentureId, {
      gtmTracker: {
        gtmPlan: '',
        pricingImplementationPlan: '',
        signedSowTracker: [],
        generatedAt: now,
        source: 'VL',
      },
    })
  }

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
            <div className="rounded-xl p-6" style={CARD}>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h2 className="font-heading font-semibold text-lg">GTM plan</h2>
                <SourceChip source={gtm.source} />
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-semibold text-lg">Signed SOW tracker (10 target)</h2>
                <button
                  onClick={addSowEntry}
                  className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
                >
                  + Add company
                </button>
              </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
