import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts'
import type { KpiDefinition, KpiSnapshot, KpiTracker } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

function getSnapshotsForKpi(kpiId: string, snapshots: KpiSnapshot[]): { date: string; value: number }[] {
  return snapshots
    .filter((s) => s.kpiId === kpiId)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, value: s.value }))
}

function isOffTrack(
  def: KpiDefinition,
  latestValue: number | null
): boolean {
  if (latestValue == null) return false
  const dir = def.direction ?? 'higher'
  if (dir === 'higher') return latestValue < def.target
  return latestValue > def.target
}

interface KpiTrackerProps {
  kpiTracker: KpiTracker
  onUpdate: (next: KpiTracker) => void
}

export function KpiTrackerComponent({ kpiTracker, onUpdate }: KpiTrackerProps) {
  const [newName, setNewName] = useState('')
  const [newTarget, setNewTarget] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newDirection, setNewDirection] = useState<'higher' | 'lower'>('higher')
  const [addingSnapshot, setAddingSnapshot] = useState<{ kpiId: string } | null>(null)
  const [snapshotValue, setSnapshotValue] = useState('')
  const [snapshotDate, setSnapshotDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  )

  const definitions = kpiTracker.definitions ?? []
  const snapshots = kpiTracker.snapshots ?? []

  const addDefinition = () => {
    if (!newName.trim() || isNaN(Number(newTarget))) return
    const id = crypto.randomUUID()
    onUpdate({
      definitions: [
        ...definitions,
        {
          id,
          name: newName.trim(),
          target: Number(newTarget),
          unit: newUnit.trim() || undefined,
          direction: newDirection,
        },
      ],
      snapshots,
    })
    setNewName('')
    setNewTarget('')
    setNewUnit('')
  }

  const removeDefinition = (id: string) => {
    onUpdate({
      definitions: definitions.filter((d) => d.id !== id),
      snapshots: snapshots.filter((s) => s.kpiId !== id),
    })
  }

  const addSnapshot = () => {
    if (!addingSnapshot || isNaN(Number(snapshotValue))) return
    onUpdate({
      definitions,
      snapshots: [
        ...snapshots,
        {
          kpiId: addingSnapshot.kpiId,
          date: snapshotDate,
          value: Number(snapshotValue),
        },
      ],
    })
    setAddingSnapshot(null)
    setSnapshotValue('')
  }

  return (
    <div className="rounded-xl p-6 space-y-4" style={CARD}>
      <div>
        <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
          Numeric KPI tracking
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Define KPIs with targets and record monthly snapshots. Sparklines show progress; off-track KPIs are flagged.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="KPI name (e.g. Monthly revenue)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-[160px]"
          />
          <input
            type="number"
            placeholder="Target"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] w-24"
          />
          <input
            type="text"
            placeholder="Unit (e.g. $)"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] w-20"
          />
          <select
            value={newDirection}
            onChange={(e) => setNewDirection(e.target.value as 'higher' | 'lower')}
            className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
          >
            <option value="higher">Higher is better</option>
            <option value="lower">Lower is better</option>
          </select>
          <button
            type="button"
            onClick={addDefinition}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
          >
            Add KPI
          </button>
        </div>

        {definitions.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No KPIs defined yet. Add one above.</p>
        ) : (
          <div className="space-y-4">
            {definitions.map((def) => {
              const data = getSnapshotsForKpi(def.id, snapshots)
              const latestValue = data.length ? data[data.length - 1].value : null
              const offTrack = isOffTrack(def, latestValue)
              return (
                <div
                  key={def.id}
                  className="rounded-lg p-4"
                  style={{
                    background: 'rgba(20,16,36,0.5)',
                    border: `1px solid ${offTrack ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-sm text-[var(--text-primary)]">
                        {def.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        Target: {def.unit ?? ''}{def.target}
                        {def.direction === 'lower' ? ' (lower is better)' : ''}
                      </span>
                      {offTrack && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{
                            background: 'rgba(239,68,68,0.2)',
                            color: '#EF4444',
                          }}
                        >
                          Off track
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDefinition(def.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-secondary)] bg-transparent border-none cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0" style={{ height: 60 }}>
                      {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v) => v.slice(5)}
                            />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip
                              contentStyle={{
                                background: 'rgba(30,26,46,0.95)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                              }}
                              formatter={(val: number) => [`${def.unit ?? ''}${val}`, def.name]}
                              labelFormatter={(l) => l}
                            />
                            {def.target != null && (
                              <ReferenceLine
                                y={def.target}
                                stroke="var(--accent-primary)"
                                strokeDasharray="3 3"
                              />
                            )}
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="var(--accent-secondary)"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)]">No data yet</p>
                      )}
                    </div>
                    {addingSnapshot?.kpiId === def.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="date"
                          value={snapshotDate}
                          onChange={(e) => setSnapshotDate(e.target.value)}
                          className="px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                        />
                        <input
                          type="number"
                          placeholder="Value"
                          value={snapshotValue}
                          onChange={(e) => setSnapshotValue(e.target.value)}
                          className="w-20 px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                        />
                        <button
                          type="button"
                          onClick={addSnapshot}
                          className="px-2 py-1 rounded text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingSnapshot(null)
                            setSnapshotValue('')
                          }}
                          className="px-2 py-1 rounded text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAddingSnapshot({ kpiId: def.id })}
                        className="shrink-0 px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:opacity-90"
                      >
                        + Add snapshot
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
