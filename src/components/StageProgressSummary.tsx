import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Venture } from '@/types/venture'

export interface StatusItem {
  label: string
  done: boolean
  path: string
}

interface StageProgressSummaryProps {
  title: string
  items: StatusItem[]
}

export function StageProgressSummary({ title, items }: StageProgressSummaryProps) {
  const [collapsed, setCollapsed] = useState(true)
  const completed = items.filter((i) => i.done).length
  const total = items.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'rgba(30,26,46,0.7)',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="p-0.5 rounded border-none bg-transparent cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className="w-4 h-4 transition-transform"
              style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <span className="font-heading font-semibold text-sm text-[var(--text-primary)]">{title}</span>
          <span className="text-xs text-[var(--text-muted)]">
            {completed}/{total} complete
          </span>
        </div>
        <span
          className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: pct === 100 ? 'rgba(16,185,129,0.15)' : 'rgba(124,106,247,0.15)',
            color: pct === 100 ? '#10B981' : 'var(--accent-primary)',
          }}
        >
          {pct}%
        </span>
      </div>

      <div
        className="rounded-full overflow-hidden mb-3"
        style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? '#10B981' : 'var(--accent-primary)',
          }}
        />
      </div>

      {!collapsed && (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full no-underline"
            style={{
              background: item.done ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
              color: item.done ? '#10B981' : 'var(--text-muted)',
              border: `1px solid ${item.done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {item.done ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="w-3 h-3 inline-flex items-center justify-center">
                <span className="block w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              </span>
            )}
            {item.label}
          </Link>
        ))}
      </div>
      )}
    </div>
  )
}

export function getDesignValidateStatus(venture: Venture): StatusItem[] {
  return [
    { label: 'Design Partners', done: !!(venture.designPartnerPipeline?.candidates?.length), path: '/validate/design-partners' },
    { label: 'Feedback Summary', done: !!venture.designPartnerFeedbackSummary, path: '/validate/feedback' },
    { label: 'MVP Features', done: !!(venture.mvpFeatureList?.features?.length), path: '/validate/mvp-features' },
  ]
}

export function getMvpReadinessStatus(venture: Venture): StatusItem[] {
  return [
    { label: 'Architecture', done: !!venture.technicalArchitecture, path: '/mvp-ready/architecture' },
    { label: 'Roadmap', done: !!(venture.productRoadmap?.phases?.length), path: '/mvp-ready/roadmap' },
    {
      label: 'Business',
      done: !!(
        (venture.ventureSuccessCriteria?.length ?? 0) > 0 ||
        ((venture.revenueModel ?? '').trim().length > 0) ||
        (venture.businessKpis?.length ?? 0) > 0
      ),
      path: '/mvp-ready/business',
    },
    { label: 'Feature PRDs', done: !!(venture.featurePrdList?.prds?.length), path: '/mvp-ready/prds' },
    { label: 'Sprint Plan', done: !!venture.sprintPlan, path: '/mvp-ready/sprints' },
  ]
}

export function getBuildPilotStatus(venture: Venture): StatusItem[] {
  const businessDone = !!(
    (venture.ventureSuccessCriteria?.length ?? 0) > 0 ||
    ((venture.revenueModel ?? '').trim().length > 0) ||
    (venture.businessKpis?.length ?? 0) > 0
  )
  return [
    { label: 'Client Feedback', done: !!venture.clientFeedbackSummary, path: '/build/client-feedback' },
    { label: 'Roadmap Updater', done: !!venture.updatedRoadmap, path: '/build/roadmap' },
    { label: 'Pricing Lab', done: !!venture.pricingLab, path: '/build/pricing-lab' },
    { label: 'Business', done: businessDone, path: '/build/business' },
  ]
}

export function getCommercialStatus(venture: Venture): StatusItem[] {
  const businessDone = !!(
    (venture.ventureSuccessCriteria?.length ?? 0) > 0 ||
    ((venture.revenueModel ?? '').trim().length > 0) ||
    (venture.businessKpis?.length ?? 0) > 0
  )
  return [
    { label: 'Pricing Tracker', done: !!venture.pricingImplementationTracker, path: '/commercial/pricing' },
    { label: 'GTM Tracker', done: !!venture.gtmTracker, path: '/commercial/gtm' },
    { label: 'Client List', done: !!(venture.clientList?.entries?.length), path: '/commercial/client-list' },
    { label: 'Business', done: businessDone, path: '/commercial/business' },
  ]
}
