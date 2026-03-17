import { evaluateGateOkrs, type OkrEvaluationResult } from '@/constants/gateOkrs'
import { STAGES } from '@/constants/stages'
import type { Venture } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
}

function getStageName(id: string): string {
  return STAGES.find((s) => s.id === id)?.name ?? id
}

interface GateOkrScorecardProps {
  venture: Venture
  fromStage: string
  toStage: string
}

export function GateOkrScorecard({ venture, fromStage, toStage }: GateOkrScorecardProps) {
  const { categories, overall } = evaluateGateOkrs(venture, fromStage, toStage)

  if (categories.length === 0) {
    return (
      <div className="rounded-xl p-6" style={CARD}>
        <p className="text-sm text-[var(--text-muted)]">
          No OKR criteria defined for gate {fromStage} → {toStage}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={CARD}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg text-[var(--text-primary)]">
            Gate: {getStageName(fromStage)} → {getStageName(toStage)}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-muted)]">Overall Readiness</span>
            <span
              className="font-mono font-bold text-lg"
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
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(124,106,247,0.2)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${overall}%`,
              background: overall >= 80 ? '#10B981' : 'var(--accent-primary)',
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.categoryId} category={cat} />
        ))}
      </div>
    </div>
  )
}

function CategoryCard({ category }: { category: OkrEvaluationResult }) {
  return (
    <div className="rounded-xl p-4" style={CARD}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-heading font-bold text-sm text-[var(--text-primary)]">
          {category.categoryLabel}
        </h4>
        <span
          className="text-xs font-mono font-semibold"
          style={{
            color:
              category.categoryScore >= 80
                ? '#10B981'
                : category.categoryScore >= 50
                  ? 'var(--accent-primary)'
                  : 'var(--text-muted)',
          }}
        >
          {category.categoryScore}%
        </span>
      </div>
      <ul className="space-y-2">
        {category.keyResults.map((kr) => (
          <li key={kr.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-primary)]">{kr.label}</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">{kr.score}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(124,106,247,0.15)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${kr.score}%`,
                  background: kr.score >= 100 ? '#10B981' : kr.score >= 50 ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
