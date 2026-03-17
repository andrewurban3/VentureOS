import { useState, useEffect, useCallback } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { hydrateVenture } from '@/services/ventures'
import { listAllPendingGateReviews, type GateReviewWithVenture } from '@/services/gateReviews'
import { generateGateRecommendations, type GateRecommendation } from '@/services/gateRecommendations'
import { GateReviewModal } from './GateReviewModal'
import { GateOkrScorecard } from './GateOkrScorecard'
import { STAGES } from '@/constants/stages'
import { evaluateGateOkrs } from '@/constants/gateOkrs'
import { checkGateCriteria } from '@/constants/gateCriteria'
import { requestGateReview } from '@/services/gateReviews'
import type { Venture } from '@/types/venture'

function getStageName(id: string): string {
  return STAGES.find((s) => s.id === id)?.name ?? id
}

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
}

export function StageGate() {
  const [role] = useRole()
  const { ventures, activeVentureId, setActiveVentureId } = useVentures()
  const [reviews, setReviews] = useState<GateReviewWithVenture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<GateReviewWithVenture | null>(null)
  const [reviewVenture, setReviewVenture] = useState<Venture | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [scorecardVenture, setScorecardVenture] = useState<Venture | null>(null)
  const [recommendations, setRecommendations] = useState<GateRecommendation[]>([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)

  const loadReviews = useCallback(() => {
    setLoading(true)
    setError(null)
    listAllPendingGateReviews()
      .then(setReviews)
      .catch((e) => {
        const msg =
          e instanceof Error
            ? e.message
            : e && typeof e === 'object' && 'message' in e
              ? String((e as { message: unknown }).message)
              : e != null
                ? String(e)
                : 'Failed to load gate reviews'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  useEffect(() => {
    const vid = activeVentureId ?? reviewing?.ventureId
    if (!vid) {
      setScorecardVenture(null)
      return
    }
    const cached = reviewVenture ?? ventures[vid]
    if (cached && Object.keys(cached).length > 10) {
      setScorecardVenture(cached)
      return
    }
    hydrateVenture(vid).then((v) => {
      if (v) setScorecardVenture(v)
    })
  }, [activeVentureId, reviewing?.ventureId, reviewVenture, ventures])

  const venture = reviewVenture ?? (reviewing && ventures[reviewing.ventureId] ? ventures[reviewing.ventureId] : scorecardVenture ?? (activeVentureId ? ventures[activeVentureId] : null))
  const currentStage = venture?.stage?.value ?? '02'
  const fromStage = currentStage
  const toStageNum = Math.min(parseInt(currentStage, 10) + 1, 7)
  const toStage = toStageNum.toString().padStart(2, '0')
  const isFinalStage = currentStage === '07'
  const { overall } = venture && !isFinalStage ? evaluateGateOkrs(venture, fromStage, toStage) : { overall: 0 }
  const { met } = venture && !isFinalStage ? checkGateCriteria(venture, fromStage, toStage) : { met: false }

  const handleGenerateRecommendations = async () => {
    if (!venture || isFinalStage) return
    setRecommendationsLoading(true)
    setRecommendations([])
    try {
      const recs = await generateGateRecommendations(venture, fromStage, toStage)
      setRecommendations(recs)
    } catch {
      setRecommendations(['Failed to generate recommendations.'])
    } finally {
      setRecommendationsLoading(false)
    }
  }

  const handleReview = async (r: GateReviewWithVenture) => {
    setReviewLoading(true)
    setReviewing(r)
    try {
      const hydrated = await hydrateVenture(r.ventureId)
      if (hydrated) {
        setActiveVentureId(r.ventureId)
        setReviewVenture(hydrated)
      } else {
        setReviewing(null)
      }
    } catch {
      setReviewing(null)
    } finally {
      setReviewLoading(false)
    }
  }

  const handleRequestAdvancement = async () => {
    if (!venture || !met || isFinalStage) return
    try {
      await requestGateReview(venture.id, fromStage, toStage, role === 'founder' ? 'Founder' : 'VL')
      loadReviews()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request advancement')
    }
  }

  const handleStartAssessment = async () => {
    if (!venture || isFinalStage) return
    try {
      await requestGateReview(venture.id, fromStage, toStage, 'VL')
      loadReviews()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start gate assessment')
    }
  }

  const pendingForVenture = venture ? reviews.find((r) => r.ventureId === venture.id) : null

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Stage Gate</h1>
          <p className="text-sm text-[var(--text-muted)]">
            OKR-based gate readiness, AI recommendations, and pending reviews. Venture Leads approve or reject; Founders request advancement.
          </p>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {error}
          </div>
        )}

        {!venture ? (
          <div className="rounded-xl p-6" style={CARD}>
            <p className="text-sm text-[var(--text-muted)]">
              Select a venture from the header dropdown to view its gate readiness and OKR scorecard.
            </p>
          </div>
        ) : isFinalStage ? (
          <div className="rounded-xl p-6" style={CARD}>
            <p className="text-sm text-[var(--text-muted)]">
              {venture.name?.value ?? 'This venture'} is at Commercial Validation (final stage). No gate advancement.
            </p>
          </div>
        ) : (
          <>
            <GateOkrScorecard venture={venture} fromStage={fromStage} toStage={toStage} />

            {overall < 100 && !isFinalStage && (
              <div className="rounded-xl p-6" style={CARD}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-base text-[var(--text-primary)]">
                    AI Recommendations to Close Gaps
                  </h3>
                  <button
                    type="button"
                    onClick={handleGenerateRecommendations}
                    disabled={recommendationsLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {recommendationsLoading ? 'Generating...' : recommendations.length ? 'Regenerate' : 'Generate'}
                  </button>
                </div>
                {recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-lg p-4 border border-[var(--border)] bg-[var(--bg-secondary)]/50 space-y-3"
                      >
                        <h4 className="font-medium text-[var(--text-primary)] text-sm">{r.krLabel}</h4>
                        <div>
                          <p className="text-xs font-medium text-[var(--accent-primary)] uppercase tracking-wide mb-1">
                            Approach
                          </p>
                          <p className="text-sm text-[var(--text-primary)]">{r.approach}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-amber-500/90 uppercase tracking-wide mb-1">
                            Risk if unmet
                          </p>
                          <p className="text-sm text-[var(--text-muted)]">{r.risk}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    Click Generate to get AI-powered recommendations for closing OKR gaps.
                  </p>
                )}
              </div>
            )}

            <div className="rounded-xl p-6" style={CARD}>
              <div className="flex flex-wrap items-center gap-3">
                {pendingForVenture ? (
                  <p className="text-sm text-[var(--text-muted)]">
                    Gate review pending. Venture Lead will review.
                  </p>
                ) : role === 'venture-lead' ? (
                  <button
                    type="button"
                    onClick={handleStartAssessment}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
                  >
                    Start Gate Assessment
                  </button>
                ) : (
                  <>
                    {!met && (
                      <p className="text-sm text-[var(--text-muted)]">
                        Complete all gate criteria before requesting advancement.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleRequestAdvancement}
                      disabled={!met}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Request Advancement
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <div className="rounded-xl p-6" style={CARD}>
          <h2 className="font-heading font-semibold text-lg mb-4">Pending Reviews</h2>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading...</p>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No pending gate reviews. Use the venture dropdown to request advancement (Founder) or start a gate assessment (Venture Lead).
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">Venture</th>
                    <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">From</th>
                    <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">To</th>
                    <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">Requested by</th>
                    <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">Requested at</th>
                    {role === 'venture-lead' && (
                      <th className="text-left py-3 px-2 font-medium text-[var(--text-muted)]">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3 px-2 text-[var(--text-primary)]">
                        {ventures[r.ventureId]?.name?.value ?? r.ventureId.slice(0, 8) + '...'}
                      </td>
                      <td className="py-3 px-2 text-[var(--text-primary)]">{getStageName(r.fromStage)}</td>
                      <td className="py-3 px-2 text-[var(--text-primary)]">{getStageName(r.toStage)}</td>
                      <td className="py-3 px-2 text-[var(--text-primary)]">{r.requestedBy}</td>
                      <td className="py-3 px-2 text-[var(--text-muted)]">
                        {new Date(r.requestedAt).toLocaleString()}
                      </td>
                      {role === 'venture-lead' && (
                        <td className="py-3 px-2">
                          <button
                            type="button"
                            onClick={() => handleReview(r)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent-primary)] text-white hover:opacity-90"
                          >
                            Review
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {reviewing && venture && (
        <GateReviewModal
          venture={venture}
          fromStage={reviewing.fromStage}
          toStage={reviewing.toStage}
          onClose={() => {
            setReviewing(null)
            setReviewVenture(null)
          }}
          onApproved={() => {
            setReviewing(null)
            setReviewVenture(null)
            loadReviews()
          }}
        />
      )}
    </div>
  )
}
