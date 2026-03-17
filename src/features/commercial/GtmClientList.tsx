import { useVentures } from '@/context/VentureContext'
import { Link } from 'react-router-dom'
import type { ClientListEntry } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

type FunnelStage = 'Lead' | 'Qualified' | 'Proposal' | 'Signed'

function getFunnelStage(
  entry: ClientListEntry,
  sowStatus?: string
): FunnelStage {
  if (sowStatus && /signed|closed/i.test(sowStatus)) return 'Signed'
  switch (entry.status) {
    case 'candidate':
      return 'Lead'
    case 'contacted':
      return 'Proposal'
    case 'qualified':
      return 'Qualified'
    case 'declined':
      return 'Lead'
    default:
      return 'Lead'
  }
}

export function GtmClientList() {
  const { ventures, activeVentureId } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const entries = venture?.clientList?.entries ?? []
  const sowTracker = venture?.gtmTracker?.signedSowTracker ?? []
  const sowByCompany = Object.fromEntries(
    sowTracker.map((r) => [r.company.trim().toLowerCase(), r.status])
  )

  const rows = entries.map((e) => {
    const sowStatus = sowByCompany[e.companyName.trim().toLowerCase()]
    return {
      ...e,
      funnelStage: getFunnelStage(e, sowStatus),
      sowStatus: sowStatus ?? null,
    }
  })

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">GTM Client List</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">GTM Client List</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Client list with funnel stage. Add or edit clients in{' '}
            <Link to="/incubate/client-list" className="text-[var(--accent-primary)] hover:underline">
              Incubate → Client List
            </Link>
            .
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            <p className="text-[var(--text-muted)]">No clients yet.</p>
            <Link
              to="/incubate/client-list"
              className="mt-3 inline-block px-4 py-2 rounded-lg text-sm bg-[var(--accent-primary)] text-white no-underline hover:opacity-90"
            >
              Add clients in Incubate
            </Link>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={CARD}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="pb-2 pr-4">Company</th>
                    <th className="pb-2 pr-4">Funnel stage</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Industry</th>
                    <th className="pb-2 pr-4">Contact role</th>
                    <th className="pb-2">SOW status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)]">
                      <td className="py-2 pr-4 font-medium text-[var(--text-primary)]">
                        {r.companyName}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background:
                              r.funnelStage === 'Signed'
                                ? 'rgba(16,185,129,0.2)'
                                : r.funnelStage === 'Qualified'
                                  ? 'rgba(124,106,247,0.2)'
                                  : r.funnelStage === 'Proposal'
                                    ? 'rgba(245,158,11,0.2)'
                                    : 'rgba(255,255,255,0.08)',
                            color:
                              r.funnelStage === 'Signed'
                                ? '#10B981'
                                : r.funnelStage === 'Qualified'
                                  ? 'var(--accent-primary)'
                                  : r.funnelStage === 'Proposal'
                                    ? '#F59E0B'
                                    : 'var(--text-muted)',
                          }}
                        >
                          {r.funnelStage}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-[var(--text-muted)] capitalize">{r.status}</td>
                      <td className="py-2 pr-4 text-[var(--text-muted)]">{r.industry ?? '—'}</td>
                      <td className="py-2 pr-4 text-[var(--text-muted)]">{r.contactRole ?? '—'}</td>
                      <td className="py-2 text-[var(--text-muted)]">{r.sowStatus ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
