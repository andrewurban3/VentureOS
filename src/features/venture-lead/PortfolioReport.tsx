import { useMemo, useRef } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Document, Paragraph, HeadingLevel, Packer } from 'docx'
import { useVentures } from '@/context/VentureContext'
import { STAGES } from '@/constants/stages'
import type { Venture } from '@/types/venture'
import type { CompositeSignal } from '@/constants/scoring'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border)',
}

const SIGNAL_COLORS: Record<CompositeSignal, string> = {
  Advance: '#10B981',
  Caution: '#F59E0B',
  Revisit: '#F97316',
  Kill: '#EF4444',
}

function getStageName(stageId: string): string {
  return STAGES.find((s) => s.id === stageId)?.name ?? stageId
}

function getHighRisks(venture: Venture): { name: string; risk: string }[] {
  const risks = venture.riskRegister?.risks ?? []
  return risks
    .filter(
      (r) =>
        r.impact === 'High' ||
        r.likelihood === 'High' ||
        (r.impact === 'Medium' && r.likelihood === 'Medium')
    )
    .map((r) => ({ name: venture.name?.value ?? 'Unknown', risk: r.description }))
}

export function PortfolioReport() {
  const { ventures } = useVentures()
  const printRef = useRef<HTMLDivElement>(null)
  const ventureList = Object.values(ventures)

  const stageData = useMemo(() => {
    const counts: Record<string, number> = {}
    STAGES.forEach((s) => (counts[s.name] = 0))
    ventureList.forEach((v) => {
      const stageId = v.stage?.value ?? '02'
      const name = getStageName(stageId)
      counts[name] = (counts[name] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }, [ventureList])

  const signalData = useMemo(() => {
    const counts: Record<string, number> = { Advance: 0, Caution: 0, Revisit: 0, Kill: 0 }
    ventureList.forEach((v) => {
      const s = v.scoring?.compositeSignal ?? 'Advance'
      counts[s] = (counts[s] ?? 0) + 1
    })
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .map(([name, count]) => ({ name, count }))
  }, [ventureList])

  const keyRisks = useMemo(() => {
    return ventureList.flatMap(getHighRisks)
  }, [ventureList])

  const handleExportDocx = async () => {
    const now = new Date()
    const quarter = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
    const children: Paragraph[] = [
      new Paragraph({
        text: 'Portfolio Report',
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: `${quarter} - ${now.toLocaleDateString()}`,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: 'Stage Distribution',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      }),
    ]
    stageData.forEach(({ name, count }) => {
      children.push(...[
        new Paragraph({ text: `${name}: ${count}`, spacing: { after: 100 } }),
      ])
    })
    children.push(
      new Paragraph({
        text: 'Signal Distribution',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    )
    signalData.forEach(({ name, count }) => {
      children.push(new Paragraph({ text: `${name}: ${count}`, spacing: { after: 100 } }))
    })
    children.push(
      new Paragraph({
        text: 'Venture Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
      })
    )
    ventureList.forEach((v) => {
      const stage = getStageName(v.stage?.value ?? '02')
      const signal = v.scoring?.compositeSignal ?? '—'
      children.push(
        new Paragraph({
          text: `${v.name?.value ?? 'Unknown'} — Stage: ${stage}, Signal: ${signal}, Founder: ${v.founder?.value ?? '—'}`,
          spacing: { after: 120 },
        })
      )
    })
    if (keyRisks.length > 0) {
      children.push(
        new Paragraph({
          text: 'Key Risks',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      )
      keyRisks.slice(0, 20).forEach(({ name, risk }) => {
        children.push(
          new Paragraph({
            text: `[${name}] ${risk}`,
            spacing: { after: 100 },
          })
        )
      })
    }
    const doc = new Document({
      sections: [{ properties: {}, children }],
    })
    const blob = await Packer.toBlob(doc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Portfolio-Report-${quarter.replace(/\s/g, '-')}.docx`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  if (ventureList.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={CARD}>
        <p className="text-[var(--text-muted)]">No ventures to report. Add ventures to generate a portfolio report.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading font-semibold text-lg">Quarterly Portfolio Report</h2>
          <p className="text-xs text-[var(--text-muted)] -mt-1">
            Stage distribution, signal, and key risks. Export to .docx or print to PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportDocx}
            className="px-4 py-2 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90"
          >
            Download .docx
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg font-heading font-semibold text-sm bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.4)] cursor-pointer hover:opacity-90"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div ref={printRef} className="space-y-6">
        <div className="rounded-xl p-6" style={CARD}>
          <h3 className="font-heading font-semibold text-sm mb-4 text-[var(--text-primary)]">
            Pipeline by stage
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted)" />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,26,46,0.95)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Bar dataKey="count" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl p-6" style={CARD}>
          <h3 className="font-heading font-semibold text-sm mb-4 text-[var(--text-primary)]">
            Signal distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={signalData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {signalData.map((entry, i) => (
                    <Cell key={entry.name} fill={SIGNAL_COLORS[entry.name as CompositeSignal] ?? '#888'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(30,26,46,0.95)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {keyRisks.length > 0 && (
          <div className="rounded-xl p-6" style={CARD}>
            <h3 className="font-heading font-semibold text-sm mb-4 text-[var(--text-primary)]">
              Key risks (high impact / likelihood)
            </h3>
            <div className="space-y-2 max-h-64 overflow-auto">
              {keyRisks.length > 20 ? (
                <p className="text-xs text-[var(--text-muted)] mb-2">Showing top 20</p>
              ) : null}
              {keyRisks.slice(0, 20).map(({ name, risk }, i) => (
                <div
                  key={i}
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                  }}
                >
                  <span className="font-medium text-[var(--text-primary)]">{name}:</span>{' '}
                  <span className="text-[var(--text-muted)]">{risk}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ventureList.some((v) => v.teamMembers?.length) ? (
          <div className="rounded-xl p-6" style={CARD}>
            <h3 className="font-heading font-semibold text-sm mb-4 text-[var(--text-primary)]">
              Team across portfolio
            </h3>
            <div className="space-y-3">
              {ventureList
                .filter((v) => v.teamMembers?.length)
                .map((v) => {
                  const total = v.teamMembers!.reduce((s, m) => s + (m.allocationPct ?? 100), 0)
                  return (
                    <div key={v.id} className="text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{v.name?.value}:</span>{' '}
                      {v.teamMembers!.map((m) => `${m.name} (${m.role}, ${m.allocationPct ?? 100}%)`).join('; ')}
                      {total > 100 && (
                        <span className="ml-2 text-[#F59E0B] text-xs">(overallocated)</span>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl p-6" style={CARD}>
          <h3 className="font-heading font-semibold text-sm mb-4 text-[var(--text-primary)]">
            Venture summary
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="pb-2 pr-4">Venture</th>
                  <th className="pb-2 pr-4">Stage</th>
                  <th className="pb-2 pr-4">Signal</th>
                  <th className="pb-2">Founder</th>
                </tr>
              </thead>
              <tbody>
                {ventureList.map((v) => (
                  <tr key={v.id} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">
                      {v.name?.value ?? '—'}
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-muted)]">
                      {getStageName(v.stage?.value ?? '02')}
                    </td>
                    <td className="py-2 pr-4">
                      {v.scoring?.compositeSignal ? (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: `${SIGNAL_COLORS[v.scoring.compositeSignal]}18`,
                            color: SIGNAL_COLORS[v.scoring.compositeSignal],
                          }}
                        >
                          {v.scoring.compositeSignal}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 text-[var(--text-muted)]">{v.founder?.value ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
