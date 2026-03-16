import { useVentures } from '@/context/VentureContext'
import { SourceChip } from '@/components/SourceChip'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function PricingTracker() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const tracker = venture?.pricingImplementationTracker
  const pricingRecommendation = venture?.pricingLab?.recommendation

  const handleTrackerChange = (updates: Partial<typeof tracker>) => {
    if (!tracker || !activeVentureId) return
    updateVenture(activeVentureId, {
      pricingImplementationTracker: { ...tracker, ...updates, source: 'VL' },
    })
  }

  const initTracker = () => {
    if (!activeVentureId) return
    const now = new Date().toISOString()
    updateVenture(activeVentureId, {
      pricingImplementationTracker: {
        pricingLabSnapshot: pricingRecommendation,
        rolloutStatus: '',
        milestones: [],
        generatedAt: now,
        source: 'VL',
      },
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Pricing Implementation Tracker</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Pricing Implementation Tracker</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Track rollout of the Pricing Lab recommendation and milestones.
          </p>
        </div>

        {!tracker ? (
          <div className="rounded-xl p-6" style={CARD}>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {pricingRecommendation
                ? 'Create a tracker to monitor rollout of your pricing recommendation.'
                : 'Complete Pricing Lab (Stage 06) to get a recommendation, then track rollout here.'}
            </p>
            <button
              onClick={initTracker}
              disabled={!pricingRecommendation}
              className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start pricing tracker
            </button>
          </div>
        ) : (
          <>
            {pricingRecommendation && (
              <div className="rounded-xl p-6 mb-6" style={CARD}>
                <h2 className="font-heading font-semibold text-lg mb-2">Pricing recommendation (from Stage 06)</h2>
                <div className="text-sm text-[var(--text-primary)] space-y-2">
                  <p><strong>Tiers:</strong> {pricingRecommendation.tierStructure}</p>
                  <p><strong>Price points:</strong> {pricingRecommendation.pricePoints}</p>
                  <p><strong>Discounting:</strong> {pricingRecommendation.discountingPolicy}</p>
                </div>
              </div>
            )}

            <div className="rounded-xl p-6 mb-6" style={CARD}>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <h2 className="font-heading font-semibold text-lg">Tracker</h2>
                <SourceChip source={tracker.source} />
                <span className="text-xs text-[var(--text-muted)]">
                  {new Date(tracker.generatedAt).toLocaleString()}
                </span>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">Rollout status</label>
                  <textarea
                    value={tracker.rolloutStatus}
                    onChange={(e) => handleTrackerChange({ rolloutStatus: e.target.value })}
                    placeholder="e.g. Pilot with 3 clients; full rollout Q2"
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">Milestones (one per line)</label>
                  <textarea
                    value={tracker.milestones.join('\n')}
                    onChange={(e) =>
                      handleTrackerChange({
                        milestones: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g. Finalise contract templates\nTrain sales on new pricing"
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
