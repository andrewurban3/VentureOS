import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import type { RoadmapPhase, KpiTracker, TeamMember } from '@/types/venture'
import { KpiTrackerComponent } from './KpiTracker'
import { TeamRoster } from './TeamRoster'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import {
  buildBusinessSuggestionsBlocks,
  parseBusinessSuggestionsResponse,
  applySuggestionsToPhases,
} from '@/agents/build/businessSuggestions'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function Business() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [lastInsight, setLastInsight] = useState<string | null>(null)
  const roadmap = venture?.productRoadmap
  const ventureSuccessCriteria = venture?.ventureSuccessCriteria ?? []
  const revenueModel = venture?.revenueModel ?? ''
  const businessKpis = venture?.businessKpis ?? []
  const kpiTracker = venture?.kpiTracker ?? { definitions: [], snapshots: [] }
  const teamMembers = venture?.teamMembers ?? []

  const handleVentureSuccessCriteriaChange = (next: string[]) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, { ventureSuccessCriteria: next })
  }

  const handleRevenueModelChange = (value: string) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, { revenueModel: value })
  }

  const handleBusinessKpisChange = (next: string[]) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, { businessKpis: next })
  }

  const handleKpiTrackerChange = (next: KpiTracker) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, { kpiTracker: next })
  }

  const handleTeamMembersChange = (next: TeamMember[]) => {
    if (!activeVentureId) return
    updateVenture(activeVentureId, { teamMembers: next })
  }

  const handlePhasesChange = (next: RoadmapPhase[]) => {
    if (!roadmap || !activeVentureId) return
    updateVenture(activeVentureId, {
      productRoadmap: { ...roadmap, phases: next, source: 'VL' },
    })
  }

  const handleSuggest = async () => {
    if (!venture || !activeVentureId) return
    setSuggestError(null)
    setLastInsight(null)
    setSuggesting(true)
    try {
      const blocks = await buildBusinessSuggestionsBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...blocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Suggest business planning fields from the venture context.' }],
        maxTokens: 2000,
      })
      const raw = parseJsonFromResponse<Record<string, unknown>>(resp.text)
      const result = parseBusinessSuggestionsResponse(raw)
      const updates: Parameters<typeof updateVenture>[1] = {
        ventureSuccessCriteria: result.ventureSuccessCriteria,
        revenueModel: result.revenueModel,
        businessKpis: result.businessKpis,
      }
      if (result.capitalByPhase.length && roadmap?.phases?.length) {
        const updatedPhases = applySuggestionsToPhases(roadmap.phases, result.capitalByPhase)
        updates.productRoadmap = { ...roadmap, phases: updatedPhases, source: 'VL' }
      }
      updateVenture(activeVentureId, updates)
      if (result.insight) setLastInsight(result.insight)
    } catch (e) {
      setSuggestError(e instanceof Error ? e.message : 'Failed to generate suggestions')
    } finally {
      setSuggesting(false)
    }
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Venture Business</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading font-bold text-2xl mb-1">Venture Business</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Success criteria, capital requirements, revenue model, and business KPIs.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSuggest}
            disabled={suggesting}
            className="px-4 py-2 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggesting ? 'Suggesting...' : 'Suggest from venture'}
          </button>
        </div>

        {suggestError && (
          <div
            className="mb-4 px-3 py-2 rounded text-sm"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            {suggestError}
          </div>
        )}
        {lastInsight && (
          <div
            className="mb-4 px-3 py-2 rounded text-sm"
            style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)' }}
          >
            <span className="font-medium">Insight: </span>
            {lastInsight}
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-xl p-6" style={CARD}>
            <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
              Venture success criteria
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Overall business targets (e.g. ARR, NRR, market expansion).
            </p>
            <textarea
              value={ventureSuccessCriteria.join('; ')}
              onChange={(e) =>
                handleVentureSuccessCriteriaChange(
                  e.target.value.split(';').map((s) => s.trim()).filter(Boolean)
                )
              }
              rows={4}
              placeholder="e.g. $2M ARR; NRR > 120%; 2 new verticals"
              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
            />
          </div>

          <div className="rounded-xl p-6" style={CARD}>
            <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
              Revenue model
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Monetization strategy (subscription, marketplace, licensing, etc.).
            </p>
            <textarea
              value={revenueModel}
              onChange={(e) => handleRevenueModelChange(e.target.value)}
              rows={4}
              placeholder="e.g. B2B SaaS subscription; usage-based pricing; enterprise tier"
              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
            />
          </div>

          <KpiTrackerComponent kpiTracker={kpiTracker} onUpdate={handleKpiTrackerChange} />

          <TeamRoster teamMembers={teamMembers} onUpdate={handleTeamMembersChange} />

          <div className="rounded-xl p-6" style={CARD}>
            <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
              KPIs and milestones (text)
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Business-level KPIs (CAC, LTV, churn, conversion rates, etc.).
            </p>
            <textarea
              value={businessKpis.join('; ')}
              onChange={(e) =>
                handleBusinessKpisChange(
                  e.target.value.split(';').map((s) => s.trim()).filter(Boolean)
                )
              }
              rows={4}
              placeholder="e.g. CAC < $500; LTV > $5K; Monthly churn < 2%"
              className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
            />
          </div>

          <div className="rounded-xl p-6" style={CARD}>
            <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
              Capital requirements by phase
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Funding or resourcing notes per roadmap phase.
            </p>
            {roadmap?.phases?.length ? (
              <div className="space-y-3">
                {roadmap.phases.map((phase, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-3"
                    style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-xs font-medium text-[var(--text-muted)]">{phase.phase}</span>
                    <textarea
                      value={phase.capitalRequirement ?? ''}
                      onChange={(e) => {
                        const next = [...roadmap.phases]
                        next[idx] = {
                          ...phase,
                          capitalRequirement: e.target.value.trim() || undefined,
                        }
                        handlePhasesChange(next)
                      }}
                      rows={2}
                      placeholder="e.g. Series B runway; no additional raise for MVP"
                      className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                Generate a product roadmap first to define phases and capital requirements.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
