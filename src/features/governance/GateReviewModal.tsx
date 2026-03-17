import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRole } from '@/components/RolePicker'
import { useVentures } from '@/context/VentureContext'
import { makeTrackedField } from '@/types'
import { STAGES } from '@/constants/stages'
import { evaluateGateOkrs } from '@/constants/gateOkrs'
import { checkGateCriteria } from '@/constants/gateCriteria'
import {
  getPendingGateReview,
  requestGateReview,
  decideGateReview,
  getGateReviewHistory,
  type GateReview,
} from '@/services/gateReviews'
import { GateOkrScorecard } from './GateOkrScorecard'
import type { Venture } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.95)',
  border: '1px solid var(--border)',
}

interface GateReviewModalProps {
  venture: Venture
  fromStage: string
  toStage: string
  onClose: () => void
  onApproved: () => void
}

export function GateReviewModal({ venture, fromStage, toStage, onClose, onApproved }: GateReviewModalProps) {
  const [role] = useRole()
  const { updateVenture } = useVentures()
  const [pendingReview, setPendingReview] = useState<GateReview | null>(null)
  const [history, setHistory] = useState<GateReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const toStageName = STAGES.find((s) => s.id === toStage)?.name ?? toStage
  const { overall } = evaluateGateOkrs(venture, fromStage, toStage)
  const { met } = checkGateCriteria(venture, fromStage, toStage)

  useEffect(() => {
    getPendingGateReview(venture.id).then(setPendingReview).catch(console.error)
  }, [venture.id])

  useEffect(() => {
    getGateReviewHistory(venture.id).then(setHistory).catch(console.error)
  }, [venture.id])

  const handleRequest = async () => {
    setLoading(true)
    setError(null)
    try {
      await requestGateReview(venture.id, fromStage, toStage, role === 'founder' ? 'Founder' : 'VL')
      setPendingReview(await getPendingGateReview(venture.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request advancement')
    } finally {
      setLoading(false)
    }
  }

  const handleStartAssessment = async () => {
    setLoading(true)
    setError(null)
    try {
      await requestGateReview(venture.id, fromStage, toStage, 'VL')
      setPendingReview(await getPendingGateReview(venture.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start gate assessment')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!pendingReview) return
    setLoading(true)
    setError(null)
    try {
      await decideGateReview(pendingReview.id, 'approved', 'VL')
      updateVenture(venture.id, { stage: makeTrackedField(toStage, 'VL') })
      onApproved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!pendingReview) return
    setLoading(true)
    setError(null)
    try {
      await decideGateReview(pendingReview.id, 'rejected', 'VL', rejectNotes)
      setPendingReview(null)
      setRejectNotes('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  const isVl = role === 'venture-lead'

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="rounded-xl max-w-2xl w-full my-4 max-h-[calc(100vh-2rem)] overflow-y-auto shrink-0"
        style={CARD}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-lg text-[var(--text-primary)]">
              Gate Review: Advance to {toStageName}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded border-none bg-transparent cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div
              className="mb-4 px-3 py-2 rounded text-sm"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {error}
            </div>
          )}

          {!showHistory ? (
            <>
              <div className="mb-4">
                <GateOkrScorecard venture={venture} fromStage={fromStage} toStage={toStage} />
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-[var(--text-muted)]">Overall readiness:</span>
                  <span
                    className="font-mono font-semibold"
                    style={{
                      color:
                        overall >= 80
                          ? '#10B981'
                          : overall >= 50
                            ? 'var(--accent-primary)'
                            : 'var(--text-muted)',
                    }}
                  >
                    {overall}%
                  </span>
                </div>
              </div>

              {pendingReview ? (
                isVl ? (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">
                      {pendingReview.requestedBy === 'VL'
                        ? `Gate assessment started on ${new Date(pendingReview.requestedAt).toLocaleString()}. Review criteria and decide.`
                        : `Founder requested advancement on ${new Date(pendingReview.requestedAt).toLocaleString()}. Review and decide.`}
                    </p>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        Rejection notes (if rejecting)
                      </label>
                      <textarea
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        placeholder="Optional feedback for the founder..."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm resize-y"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-[#10B981] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                      >
                        {loading ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-[#EF4444] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                      >
                        {loading ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    Gate review pending. Venture Lead will review your request.
                  </p>
                )
              ) : isVl ? (
                <div>
                  <p className="text-sm text-[var(--text-muted)] mb-3">
                    Start a gate assessment to formally evaluate readiness for the next stage.
                  </p>
                  <button
                    type="button"
                    onClick={handleStartAssessment}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg font-medium text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? 'Starting...' : 'Start Gate Assessment'}
                  </button>
                </div>
              ) : (
                <div>
                  {!met && (
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                      Reach 100% on all OKR key results before requesting advancement.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleRequest}
                    disabled={!met || loading}
                    className="px-4 py-2 rounded-lg font-medium text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Requesting...' : 'Request advancement'}
                  </button>
                </div>
              )}

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="mt-4 text-xs text-[var(--accent-secondary)] hover:underline bg-transparent border-none cursor-pointer p-0"
                >
                  View gate decision history ({history.length})
                </button>
              )}
            </>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setShowHistory(false)}
                className="text-xs text-[var(--accent-secondary)] hover:underline mb-3 bg-transparent border-none cursor-pointer p-0"
              >
                Back
              </button>
              <ul className="space-y-2 max-h-48 overflow-auto">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="text-xs p-2 rounded"
                    style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                  >
                    <span className="font-medium">
                      {h.fromStage} → {h.toStage}
                    </span>
                    {' · '}
                    <span
                      style={{
                        color:
                          h.status === 'approved'
                            ? '#10B981'
                            : h.status === 'rejected'
                              ? '#EF4444'
                              : 'var(--text-muted)',
                      }}
                    >
                      {h.status}
                    </span>
                    {h.decidedBy && ` by ${h.decidedBy}`}
                    {h.decidedAt && ` on ${new Date(h.decidedAt).toLocaleString()}`}
                    {h.notes && (
                      <div className="mt-1 text-[var(--text-muted)]">{h.notes}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}
