import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { STAGES } from '@/constants/stages'
import { STAGE_BASE_PATHS } from '@/constants/stageFeatures'
import { GateReviewModal } from '@/features/governance/GateReviewModal'
import type { CompositeSignal } from '@/constants/scoring'
import type { KpiDefinition, KpiSnapshot } from '@/types/venture'
import {
  getDesignValidateStatus,
  getMvpReadinessStatus,
  getBuildPilotStatus,
  getCommercialStatus,
} from '@/components/StageProgressSummary'
import type { Venture } from '@/types/venture'
import { ActivityFeed } from './ActivityFeed'

const SIGNAL_COLORS: Record<CompositeSignal, string> = {
  Advance: '#10B981',
  Caution: '#F59E0B',
  Revisit: '#F97316',
  Kill: '#EF4444',
}

function getStageName(stageId: string): string {
  return STAGES.find((s) => s.id === stageId)?.name ?? stageId
}

function getStageProgress(venture: Venture): { completed: number; total: number; label: string } {
  const stageId = venture.stage?.value ?? '02'
  const stageNum = parseInt(stageId, 10)
  if (stageNum <= 2) {
    const done = venture.ideaIntake?.dimensionCoverage?.filter((d) => d.status !== 'not_started').length ?? 0
    return { completed: done, total: 10, label: 'Define' }
  }
  if (stageNum === 3) {
    const items = [
      !!(venture.pressureTests?.length),
      !!(venture.financialModels?.mvpCost || venture.financialModels?.unitEconomics || venture.financialModels?.marketSizing),
      !!(venture.interviews?.uploads?.length),
      !!venture.strategyMoat?.assessment,
      !!venture.solutionDefinition,
      !!(venture.riskRegister?.risks?.length),
      !!(venture.clientList?.entries?.length),
      !!(venture.investmentMemo || venture.pitchDeck),
    ]
    return { completed: items.filter(Boolean).length, total: items.length, label: 'Incubate' }
  }
  if (stageNum === 4) {
    const items = getDesignValidateStatus(venture)
    return { completed: items.filter((i) => i.done).length, total: items.length, label: 'Design & Validate' }
  }
  if (stageNum === 5) {
    const items = getMvpReadinessStatus(venture)
    return { completed: items.filter((i) => i.done).length, total: items.length, label: 'MVP Readiness' }
  }
  if (stageNum === 6) {
    const items = getBuildPilotStatus(venture)
    return { completed: items.filter((i) => i.done).length, total: items.length, label: 'Build & Pilot' }
  }
  if (stageNum >= 7) {
    const items = getCommercialStatus(venture)
    return { completed: items.filter((i) => i.done).length, total: items.length, label: 'Commercial' }
  }
  return { completed: 0, total: 1, label: getStageName(stageId) }
}

function getStatusItems(venture: Venture): { label: string; done: boolean }[] {
  const stageId = venture.stage?.value ?? '02'
  const stageNum = parseInt(stageId, 10)
  if (stageNum <= 2) return []
  if (stageNum === 3) return []
  if (stageNum === 4) return getDesignValidateStatus(venture)
  if (stageNum === 5) return getMvpReadinessStatus(venture)
  if (stageNum === 6) return getBuildPilotStatus(venture)
  if (stageNum >= 7) return getCommercialStatus(venture)
  return []
}

function getIssues(venture: Venture): string[] {
  const issues: string[] = []
  const signal = venture.scoring?.compositeSignal
  if (signal && signal !== 'Advance') {
    issues.push(`Signal: ${signal}`)
  }
  const risks = venture.riskRegister?.risks ?? []
  const highRisks = risks.filter(
    (r) => r.impact === 'High' || r.likelihood === 'High' || (r.impact === 'Medium' && r.likelihood === 'Medium')
  )
  if (highRisks.length > 0) {
    issues.push(`${highRisks.length} risk${highRisks.length > 1 ? 's' : ''} to mitigate`)
  }
  return issues
}

function getRiskNames(venture: Venture): string[] {
  const risks = venture.riskRegister?.risks ?? []
  return risks
    .filter(
      (r) => r.impact === 'High' || r.likelihood === 'High' || (r.impact === 'Medium' && r.likelihood === 'Medium')
    )
    .map((r) => r.description)
}

function getLastUpdated(venture: Venture): string | null {
  const timestamps: string[] = []
  if (venture.ideaIntake?.messages?.length) {
    const last = venture.ideaIntake.messages[venture.ideaIntake.messages.length - 1]
    if (last?.timestamp) timestamps.push(last.timestamp)
  }
  if (venture.scoring?.corporate) timestamps.push(venture.name?.timestamp ?? '')
  if (venture.pressureTests?.length) {
    const last = venture.pressureTests[venture.pressureTests.length - 1]
    const lastMsg = last?.messages?.[last.messages.length - 1]
    if (lastMsg?.timestamp) timestamps.push(lastMsg.timestamp)
  }
  if (venture.icpDocument?.generatedAt) timestamps.push(venture.icpDocument.generatedAt)
  if (venture.productRoadmap?.generatedAt) timestamps.push(venture.productRoadmap.generatedAt)
  timestamps.push(venture.name?.timestamp ?? '')
  const valid = timestamps.filter(Boolean)
  if (!valid.length) return null
  valid.sort()
  return valid[valid.length - 1]
}

function getKpiSparklineData(kpiId: string, snapshots: KpiSnapshot[]): { value: number }[] {
  return snapshots
    .filter((s) => s.kpiId === kpiId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ value: s.value }))
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
}

type SortField = 'name' | 'stage' | 'signal' | 'lastUpdated'
type SortOrder = 'asc' | 'desc'

const SIGNAL_ORDER: Record<CompositeSignal, number> = {
  Advance: 0,
  Caution: 1,
  Revisit: 2,
  Kill: 3,
}

export function PortfolioDashboard() {
  const { ventures, setActiveVentureId } = useVentures()
  const navigate = useNavigate()
  const [role] = useRole()
  const allVentures = Object.values(ventures)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStage, setFilterStage] = useState<string>('')
  const [filterSignal, setFilterSignal] = useState<string>('')
  const [filterFounder, setFilterFounder] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortField>('lastUpdated')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [gateModal, setGateModal] = useState<{ venture: Venture; from: string; to: string } | null>(null)

  const ventureList = useMemo(() => {
    let list = allVentures

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter((v) => (v.name?.value ?? '').toLowerCase().includes(q))
    }
    if (filterStage) {
      list = list.filter((v) => (v.stage?.value ?? '02') === filterStage)
    }
    if (filterSignal) {
      list = list.filter((v) => (v.scoring?.compositeSignal ?? '') === filterSignal)
    }
    if (filterFounder.trim()) {
      const q = filterFounder.trim().toLowerCase()
      list = list.filter((v) => (v.founder?.value ?? '').toLowerCase().includes(q))
    }
    if (filterDateFrom || filterDateTo) {
      list = list.filter((v) => {
        const ts = getLastUpdated(v)
        if (!ts) return false
        const d = new Date(ts).getTime()
        if (filterDateFrom && d < new Date(filterDateFrom).getTime()) return false
        if (filterDateTo && d > new Date(filterDateTo + 'T23:59:59').getTime()) return false
        return true
      })
    }

    const sorted = [...list].sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') {
        cmp = (a.name?.value ?? '').localeCompare(b.name?.value ?? '')
      } else if (sortBy === 'stage') {
        const sa = parseInt(a.stage?.value ?? '02', 10)
        const sb = parseInt(b.stage?.value ?? '02', 10)
        cmp = sa - sb
      } else if (sortBy === 'signal') {
        const sa = a.scoring?.compositeSignal ? SIGNAL_ORDER[a.scoring.compositeSignal] ?? 4 : 4
        const sb = b.scoring?.compositeSignal ? SIGNAL_ORDER[b.scoring.compositeSignal] ?? 4 : 4
        cmp = sa - sb
      } else {
        const ta = getLastUpdated(a) ?? ''
        const tb = getLastUpdated(b) ?? ''
        cmp = ta.localeCompare(tb)
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [
    allVentures,
    searchQuery,
    filterStage,
    filterSignal,
    filterFounder,
    filterDateFrom,
    filterDateTo,
    sortBy,
    sortOrder,
  ])

  const handleSelect = (v: Venture) => {
    setActiveVentureId(v.id)
    const stageId = v.stage?.value === '01' ? '02' : v.stage?.value ?? '02'
    const basePath = STAGE_BASE_PATHS[stageId] ?? '/define'
    navigate(basePath)
  }

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleViewRisks = (v: Venture, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveVentureId(v.id)
    navigate('/incubate/risk')
  }

  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(field)
      setSortOrder(field === 'name' ? 'asc' : 'desc')
    }
  }

  const hasFilters =
    searchQuery.trim() ||
    filterStage ||
    filterSignal ||
    filterFounder.trim() ||
    filterDateFrom ||
    filterDateTo

  const clearFilters = () => {
    setSearchQuery('')
    setFilterStage('')
    setFilterSignal('')
    setFilterFounder('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--text-muted)]">
        All ventures across the lifecycle. Expand for details, or click Open. Gate review: expand a venture → click &quot;Gate: X → Y&quot; to request (Founder) or approve (VL).
      </p>

      <div className="rounded-xl p-4" style={CARD}>
        <h3 className="font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
          Recent activity
        </h3>
        <ActivityFeed limit={10} compact />
      </div>

      <div className="rounded-xl px-3 py-2 flex flex-wrap items-center gap-2" style={CARD}>
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="px-2 py-1.5 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-28" />
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-2 py-1.5 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]">
          <option value="">Stage</option>
          {STAGES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterSignal} onChange={(e) => setFilterSignal(e.target.value)} className="px-2 py-1.5 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]">
          <option value="">Signal</option>
          <option value="Advance">Advance</option>
          <option value="Caution">Caution</option>
          <option value="Revisit">Revisit</option>
          <option value="Kill">Kill</option>
        </select>
        <input type="text" placeholder="Founder" value={filterFounder} onChange={(e) => setFilterFounder(e.target.value)} className="px-2 py-1.5 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] w-24" />
        <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="px-2 py-1.5 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]" />
        <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="px-2 py-1.5 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]" />
        {hasFilters && <button type="button" onClick={clearFilters} className="px-2 py-1 text-xs text-[var(--accent-secondary)] hover:underline border-none cursor-pointer bg-transparent">Clear</button>}
        <span className="text-[var(--text-muted)] text-xs ml-auto flex items-center gap-1">
          Sort:
          {(['name', 'stage', 'signal', 'lastUpdated'] as const).map((f) => (
            <button key={f} type="button" onClick={() => toggleSort(f)} className={`px-1.5 py-0.5 rounded text-xs ${sortBy === f ? 'bg-[var(--accent-primary)] text-white' : 'hover:bg-[rgba(124,106,247,0.15)]'}`}>
              {f === 'lastUpdated' ? 'Updated' : f}
            </button>
          ))}
        </span>
        <span className="text-[var(--text-muted)] text-xs">{ventureList.length}/{allVentures.length}</span>
      </div>

      {ventureList.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={CARD}>
          <p className="text-[var(--text-muted)]">
            {hasFilters ? 'No ventures match your filters.' : 'No ventures yet.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 px-4 py-2 rounded-lg text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ventureList.map((v) => {
            const stageName = getStageName(v.stage?.value ?? '02')
            const progress = getStageProgress(v)
            const signal = v.scoring?.compositeSignal
            const issues = getIssues(v)
            const riskNames = getRiskNames(v)
            const lastTs = getLastUpdated(v)
            const statusItems = getStatusItems(v)
            const isExpanded = expandedIds.has(v.id)
            const pct = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0

            return (
              <div
                key={v.id}
                className="rounded-xl overflow-hidden transition-colors"
                style={CARD}
              >
                <div
                  className="flex items-center gap-4 px-4 py-4 cursor-pointer hover:bg-[rgba(124,106,247,0.04)] transition-colors"
                  onClick={() => handleSelect(v)}
                >
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(v.id, e)}
                    className="shrink-0 p-1 rounded border-none bg-transparent cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg
                      className="w-4 h-4 transition-transform"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-heading font-semibold text-base text-[var(--text-primary)]">
                        {v.name?.value}
                      </span>
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          background: 'rgba(124,106,247,0.15)',
                          color: 'var(--accent-primary)',
                          border: '1px solid rgba(124,106,247,0.3)',
                        }}
                      >
                        {stageName}
                      </span>
                      {signal && (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            background: `${SIGNAL_COLORS[signal]}18`,
                            color: SIGNAL_COLORS[signal],
                            border: `1px solid ${SIGNAL_COLORS[signal]}40`,
                          }}
                        >
                          {signal}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                      <span>
                        {progress.completed}/{progress.total} ({progress.label})
                      </span>
                      {lastTs && <span>· {formatRelativeTime(lastTs)}</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <div
                      className="w-16 h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? '#10B981' : 'var(--accent-primary)',
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(v)
                      }}
                      className="px-4 py-2 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 shrink-0"
                    >
                      Open
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className="px-4 pb-4 pt-0 border-t border-[var(--border)]"
                    style={{ background: 'rgba(20,16,36,0.4)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="pt-4 space-y-4">
                      {(() => {
                        const stagesWithout01 = STAGES.filter((s) => s.id !== '01')
                        const currentIdx = stagesWithout01.findIndex((s) => s.id === (v.stage?.value ?? '02'))
                        const nextStage = currentIdx >= 0 && currentIdx < stagesWithout01.length - 1 ? stagesWithout01[currentIdx + 1] : null
                        return nextStage && (role === 'founder' || role === 'venture-lead') ? (
                          <div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveVentureId(v.id)
                                setGateModal({ venture: v, from: v.stage?.value ?? '02', to: nextStage.id })
                              }}
                              className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:opacity-90"
                            >
                              Gate: {stageName} → {nextStage.name}
                            </button>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                              {role === 'founder' ? 'Request advancement for VL approval' : 'Start or review gate assessment'}
                            </p>
                          </div>
                        ) : null
                      })()}
                      <div>
                        <span className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                          Activity
                        </span>
                        <ActivityFeed ventureId={v.id} limit={5} compact />
                      </div>
                      {v.founder?.value && (
                        <div>
                          <span className="text-xs font-medium text-[var(--text-muted)]">Founder: </span>
                          <span className="text-sm text-[var(--text-primary)]">{v.founder.value}</span>
                        </div>
                      )}
                      {lastTs && (
                        <div>
                          <span className="text-xs font-medium text-[var(--text-muted)]">Last updated: </span>
                          <span className="text-sm text-[var(--text-primary)]">
                            {new Date(lastTs).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {v.kpiTracker?.definitions?.length ? (
                        <div>
                          <span className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                            KPI trends
                          </span>
                          <div className="flex flex-wrap gap-4">
                            {v.kpiTracker.definitions.slice(0, 4).map((def: KpiDefinition) => {
                              const data = getKpiSparklineData(def.id, v.kpiTracker!.snapshots ?? [])
                              if (data.length === 0) return null
                              const latest = data[data.length - 1].value
                              const offTrack =
                                (def.direction ?? 'higher') === 'higher'
                                  ? latest < def.target
                                  : latest > def.target
                              return (
                                <div
                                  key={def.id}
                                  className="flex items-center gap-2 rounded-lg px-3 py-2"
                                  style={{
                                    background: 'rgba(20,16,36,0.6)',
                                    border: `1px solid ${offTrack ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                                  }}
                                >
                                  <div className="w-16 h-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={data}>
                                        <YAxis hide domain={['auto', 'auto']} />
                                        <Line
                                          type="monotone"
                                          dataKey="value"
                                          stroke={offTrack ? '#EF4444' : 'var(--accent-secondary)'}
                                          strokeWidth={1.5}
                                          dot={false}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-[var(--text-primary)]">
                                      {def.name}: {def.unit ?? ''}{latest}
                                    </span>
                                    {offTrack && (
                                      <span className="ml-1 text-xs text-[#EF4444]">(off track)</span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                      {statusItems.length > 0 && (
                        <div>
                          <span className="block text-xs font-medium text-[var(--text-muted)] mb-2">
                            Progress breakdown
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {statusItems.map((item) => (
                              <span
                                key={item.label}
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
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
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {issues.length > 0 && (
                        <div>
                          <span className="block text-xs font-medium text-[var(--text-muted)] mb-2">Issues</span>
                          <div className="space-y-1">
                            {issues.map((issue) => (
                              <div
                                key={issue}
                                className="text-sm px-3 py-1.5 rounded"
                                style={{
                                  background: 'rgba(239,68,68,0.15)',
                                  color: '#EF4444',
                                  border: '1px solid rgba(239,68,68,0.3)',
                                }}
                              >
                                {issue}
                              </div>
                            ))}
                            {riskNames.length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-[var(--text-muted)]">High-impact risks: </span>
                                <ul className="list-disc list-inside text-sm text-[var(--text-primary)] mt-1">
                                  {riskNames.slice(0, 5).map((name, i) => (
                                    <li key={i}>{name}</li>
                                  ))}
                                  {riskNames.length > 5 && (
                                    <li className="text-[var(--text-muted)]">+{riskNames.length - 5} more</li>
                                  )}
                                </ul>
                              </div>
                            )}
                            {v.riskRegister?.risks?.length ? (
                              <button
                                type="button"
                                onClick={(e) => handleViewRisks(v, e)}
                                className="mt-2 text-sm text-[var(--accent-secondary)] hover:underline bg-transparent border-none cursor-pointer p-0"
                              >
                                View risks →
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelect(v)}
                        className="px-4 py-2 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
                      >
                        Open Venture
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {gateModal && (
        <GateReviewModal
          venture={gateModal.venture}
          fromStage={gateModal.from}
          toStage={gateModal.to}
          onClose={() => setGateModal(null)}
          onApproved={() => {
            setGateModal(null)
            setActiveVentureId(gateModal.venture.id)
            const basePath = STAGE_BASE_PATHS[gateModal.to] ?? '/define'
            navigate(basePath)
          }}
        />
      )}
    </div>
  )
}
