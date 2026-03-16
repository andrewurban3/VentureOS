import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { PortfolioDashboard } from './PortfolioDashboard'
import { useVentures } from '@/context/VentureContext'
import { STAGES } from '@/constants/stages'
import { STAGE_BASE_PATHS } from '@/constants/stageFeatures'
import { getDemoVenturePayload } from '@/data/demoVenture'
import { saveVentureUpdates } from '@/services/ventures'
import type { Venture } from '@/types/venture'
import type { CompositeSignal } from '@/constants/scoring'

const SIGNAL_COLORS: Record<CompositeSignal, string> = {
  Advance: '#10B981',
  Caution: '#F59E0B',
  Revisit: '#F97316',
  Kill: '#EF4444',
}

const DISCOVER_TOOLS = [
  { name: 'VC Thesis Intelligence', path: '/discover/vc-thesis', desc: 'Research VC investment theses' },
  { name: 'Market Signals', path: '/discover/market-signals', desc: 'Scan market trends and shifts' },
  { name: 'Opportunity Brief', path: '/discover/opportunity-brief', desc: 'Synthesize research into a brief' },
  { name: 'Resources', path: '/discover/resources', desc: 'Curated external resources' },
]

function getStageName(stageId: string): string {
  return STAGES.find((s) => s.id === stageId)?.name ?? stageId
}

function getIntakeCompletion(venture: Venture): number {
  return venture.ideaIntake?.dimensionCoverage?.filter(
    (d) => d.status !== 'not_started'
  ).length ?? 0
}

function getLastUpdated(venture: Venture): string | null {
  const timestamps: string[] = []

  const msgs = venture.ideaIntake?.messages
  if (msgs?.length) timestamps.push(msgs[msgs.length - 1].timestamp)

  if (venture.scoring?.corporate) timestamps.push(venture.name.timestamp)
  if (venture.scoring?.vc) timestamps.push(venture.name.timestamp)
  if (venture.scoring?.studio) timestamps.push(venture.name.timestamp)

  const tests = venture.pressureTests
  if (tests?.length) {
    const lastTest = tests[tests.length - 1]
    const lastMsg = lastTest.messages[lastTest.messages.length - 1]
    if (lastMsg) timestamps.push(lastMsg.timestamp)
  }

  if (venture.icpDocument?.generatedAt) timestamps.push(venture.icpDocument.generatedAt)
  if (venture.competitorAnalysis?.generatedAt) timestamps.push(venture.competitorAnalysis.generatedAt)

  timestamps.push(venture.name.timestamp)

  if (!timestamps.length) return null
  timestamps.sort()
  return timestamps[timestamps.length - 1]
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

export function VentureLeadDashboard() {
  const { ventures, setActiveVentureId, loadVentures, createVenture, updateVenture, loading, error } = useVentures()
  const navigate = useNavigate()
  const [creatingDemo, setCreatingDemo] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newVentureName, setNewVentureName] = useState('')
  const [view, setView] = useState<'list' | 'dashboard'>('dashboard')
  const ventureList = Object.values(ventures)

  const handleStartNew = async () => {
    if (!newVentureName.trim() || creatingNew) return
    setCreatingNew(true)
    try {
      const venture = await createVenture(newVentureName.trim())
      setActiveVentureId(venture.id)
      setNewVentureName('')
      const stageId = venture.stage?.value === '01' ? '02' : venture.stage?.value ?? '02'
      const basePath = STAGE_BASE_PATHS[stageId] ?? '/define'
      navigate(basePath)
    } catch {
      // error shown via context
    } finally {
      setCreatingNew(false)
    }
  }

  const handleCreateDemo = async () => {
    setCreatingDemo(true)
    try {
      const venture = await createVenture('Demo: B2B Compliance SaaS')
      const payload = getDemoVenturePayload()
      updateVenture(venture.id, payload)
      await saveVentureUpdates(venture.id, payload)
      const stageId = venture.stage?.value === '01' ? '02' : venture.stage?.value ?? '02'
      const basePath = STAGE_BASE_PATHS[stageId] ?? '/define'
      navigate(basePath)
    } catch (e) {
      console.error('Demo venture creation failed:', e)
      alert(e instanceof Error ? e.message : 'Failed to create demo venture. Check the console for details.')
    } finally {
      setCreatingDemo(false)
    }
  }

  const handleSelect = (v: Venture) => {
    setActiveVentureId(v.id)
    const stageId = v.stage.value === '01' ? '02' : v.stage.value
    const basePath = STAGE_BASE_PATHS[stageId] ?? '/define'
    navigate(basePath)
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Venture Lead</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Research the opportunity space, then manage your venture portfolio.
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

        {/* Start new venture */}
        <section>
          <div className="rounded-xl p-6" style={CARD}>
            <h2 className="font-heading font-semibold text-lg mb-4">Start new venture</h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={newVentureName}
                onChange={(e) => setNewVentureName(e.target.value)}
                placeholder="Venture name..."
                className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleStartNew()}
              />
              <button
                onClick={handleStartNew}
                disabled={!newVentureName.trim() || creatingNew}
                className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingNew ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </section>

        {/* Research Lab */}
        <section>
          <h2 className="font-heading font-semibold text-lg mb-3">Research Lab</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Venture-agnostic research tools. Use these before selecting a venture.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DISCOVER_TOOLS.map((tool) => (
              <Link
                key={tool.path}
                to={tool.path}
                className="rounded-xl p-4 transition-all hover:border-[var(--accent-primary)] group no-underline"
                style={{
                  ...CARD,
                  borderColor: 'rgba(124,106,247,0.25)',
                }}
              >
                <span className="block font-heading font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] mb-1">
                  {tool.name}
                </span>
                <span className="block text-[11px] text-[var(--text-muted)] leading-snug">
                  {tool.desc}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Portfolio */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-semibold text-lg">Portfolio</h2>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setView('dashboard')}
                  className="px-3 py-1.5 text-xs font-medium border-none cursor-pointer"
                  style={{
                    background: view === 'dashboard' ? 'rgba(124,106,247,0.2)' : 'transparent',
                    color: view === 'dashboard' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="px-3 py-1.5 text-xs font-medium border-none cursor-pointer"
                  style={{
                    background: view === 'list' ? 'rgba(124,106,247,0.2)' : 'transparent',
                    color: view === 'list' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  }}
                >
                  List
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreateDemo}
                disabled={creatingDemo}
                className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] hover:bg-[rgba(124,106,247,0.1)] text-[var(--text-muted)] disabled:opacity-50"
              >
                {creatingDemo ? 'Creating...' : 'Create demo venture'}
              </button>
              <button
                onClick={() => loadVentures()}
                className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] hover:bg-[rgba(124,106,247,0.1)] text-[var(--text-muted)]"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading ventures...</p>
          ) : ventureList.length === 0 ? (
            <div className="rounded-xl p-12 text-center" style={CARD}>
              <p className="text-[var(--text-muted)]">No ventures yet.</p>
              <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">
                Founders can create ventures from the Founder view, or create a demo venture to explore all sections.
              </p>
              <button
                onClick={handleCreateDemo}
                disabled={creatingDemo}
                className="px-5 py-2.5 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingDemo ? 'Creating...' : 'Create demo venture'}
              </button>
            </div>
          ) : view === 'dashboard' ? (
            <PortfolioDashboard />
          ) : (
            <div className="space-y-3">
              {ventureList.map((v) => {
                const stageName = getStageName(v.stage.value)
                const signal = v.scoring?.compositeSignal
                const intakeDone = getIntakeCompletion(v)
                const lastTs = getLastUpdated(v)

                return (
                  <button
                    key={v.id}
                    onClick={() => handleSelect(v)}
                    className="w-full text-left rounded-xl p-5 transition-colors hover:bg-[rgba(124,106,247,0.06)]"
                    style={CARD}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-heading font-semibold text-base">
                            {v.name.value}
                          </span>
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full"
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
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
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
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                          {v.founder?.value && (
                            <span>Founder: {v.founder.value}</span>
                          )}
                          <span>
                            Intake: {intakeDone}/10
                          </span>
                          {lastTs && (
                            <span>Updated {formatRelativeTime(lastTs)}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[var(--accent-primary)] font-medium text-sm shrink-0 mt-1">
                        Open →
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
