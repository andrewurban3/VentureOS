import { useState, useEffect } from 'react'
import {
  getActivityForVenture,
  getRecentActivityAcrossPortfolio,
  type ActivityEvent,
} from '@/services/activityFeed'
import { STAGES } from '@/constants/stages'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

function getStageName(stageId: string): string {
  return STAGES.find((s) => s.id === stageId)?.name ?? stageId
}

function formatActionLabel(event: ActivityEvent): string {
  const d = event.details as Record<string, unknown>
  switch (event.action) {
    case 'venture_created':
      return `Venture created`
    case 'stage_changed':
      return `Stage: ${getStageName(String(d.fromStage ?? '?'))} → ${getStageName(String(d.toStage ?? '?'))}`
    case 'gate_requested':
      return `Gate review requested: ${getStageName(String(d.fromStage ?? '?'))} → ${getStageName(String(d.toStage ?? '?'))}`
    case 'gate_approved':
      return `Gate approved: ${getStageName(String(d.fromStage ?? '?'))} → ${getStageName(String(d.toStage ?? '?'))}`
    case 'gate_rejected':
      return `Gate rejected: ${getStageName(String(d.fromStage ?? '?'))} → ${getStageName(String(d.toStage ?? '?'))}`
    case 'risk_added':
      return d.count ? `Added ${d.count} risks` : 'Risk added'
    case 'kpi_snapshot_added':
      return 'KPI snapshot recorded'
    case 'document_generated':
      return `Document: ${d.entityType ?? 'generated'}`
    default:
      return event.action.replace(/_/g, ' ')
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

interface ActivityFeedProps {
  ventureId?: string | null
  limit?: number
  compact?: boolean
}

export function ActivityFeed({ ventureId, limit = 15, compact = false }: ActivityFeedProps) {
  const [events, setEvents] = useState<(ActivityEvent & { venture_name?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    if (ventureId) {
      getActivityForVenture(ventureId, limit).then((data) => {
        if (!cancelled) {
          setEvents(data)
          setLoading(false)
        }
      })
    } else {
      getRecentActivityAcrossPortfolio(limit).then((data) => {
        if (!cancelled) {
          setEvents(data)
          setLoading(false)
        }
      })
    }
    return () => { cancelled = true }
  }, [ventureId, limit])

  if (loading) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-2">
        Loading activity...
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-xs text-[var(--text-muted)] py-2">
        No activity yet.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {events.map((e) => (
        <div
          key={e.id}
          className={`flex items-start gap-2 ${compact ? 'py-1' : 'py-2 px-2 rounded-lg'}`}
          style={compact ? {} : { background: 'rgba(20,16,36,0.4)' }}
        >
          <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-14">
            {formatTime(e.created_at)}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-xs text-[var(--text-primary)]">
              {formatActionLabel(e)}
            </span>
            {!ventureId && e.venture_name && (
              <span className="text-[10px] text-[var(--text-muted)] ml-1">
                · {e.venture_name}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
