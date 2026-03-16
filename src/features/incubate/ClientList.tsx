import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import { buildClientListSystemBlocks } from '@/agents/incubate/client-list'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import type { ClientListEntry, ClientList } from '@/types/venture'

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function ClientList() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const list = venture?.clientList
  const entries = list?.entries ?? []
  const hasIcp = !!venture?.icpDocument

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildClientListSystemBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON with an "entries" array. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate the target client list for design partner outreach.' }],
        maxTokens: 4000,
        tools: [WEB_SEARCH_TOOL],
      })

      const result = parseJsonFromResponse<{ entries: Omit<ClientListEntry, 'id' | 'status' | 'source' | 'generatedAt'>[] }>(resp.text)
      const now = new Date().toISOString()
      const withIds: ClientListEntry[] = (result.entries ?? []).map((e) => ({
        ...e,
        id: crypto.randomUUID(),
        status: 'candidate' as const,
        source: 'AI_RESEARCH' as const,
        generatedAt: now,
      }))

      updateVenture(activeVentureId, {
        clientList: {
          entries: withIds,
          generatedAt: now,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate client list')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = (id: string, status: ClientListEntry['status']) => {
    if (!venture || !activeVentureId) return
    const next = entries.map((e) => (e.id === id ? { ...e, status } : e))
    updateVenture(activeVentureId, {
      clientList: { entries: next, generatedAt: list?.generatedAt ?? new Date().toISOString() },
    })
  }

  const handleAddEntry = (entry: Omit<ClientListEntry, 'id' | 'source' | 'generatedAt'>) => {
    if (!venture || !activeVentureId) return
    const now = new Date().toISOString()
    const newEntry: ClientListEntry = {
      ...entry,
      id: crypto.randomUUID(),
      source: role === 'founder' ? 'FOUNDER' : 'VL',
      generatedAt: now,
    }
    updateVenture(activeVentureId, {
      clientList: {
        entries: [...entries, newEntry],
        generatedAt: list?.generatedAt ?? now,
      },
    })
    setShowAdd(false)
  }

  const handleRemoveEntry = (id: string) => {
    if (!venture || !activeVentureId) return
    const next = entries.filter((e) => e.id !== id)
    updateVenture(activeVentureId, {
      clientList: { entries: next, generatedAt: list?.generatedAt ?? new Date().toISOString() },
    })
  }

  const handleExportCsv = () => {
    const headers = ['Company', 'Industry', 'Company Size', 'Rationale', 'Contact Role', 'Status', 'LinkedIn']
    const rows = entries.map((e) => [
      e.companyName,
      e.industry ?? '',
      e.companySize ?? '',
      `"${(e.rationale ?? '').replace(/"/g, '""')}"`,
      e.contactRole ?? '',
      e.status,
      e.linkedInUrl ?? '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${venture?.name.value ?? 'venture'}-client-list.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Client List</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">0–20 Client List</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Target companies for design partner outreach. Generated from your ICP.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        {!list && (
          <div className="rounded-xl p-8 text-center" style={CARD}>
            {hasIcp ? (
              <>
                <p className="text-[var(--text-primary)] mb-4">
                  Generate a list of target companies from your ICP.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generating...' : 'Generate Client List'}
                </button>
                {loading && (
                  <p className="mt-3 text-sm text-[var(--text-muted)] animate-pulse">
                    Searching for companies that match your ICP...
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-[var(--text-muted)] mb-2">No ICP found.</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Complete the ICP Builder first — the client list is generated from your ICP.
                </p>
              </>
            )}
          </div>
        )}

        {list && (
          <>
            <div className="rounded-xl p-6 mb-4" style={CARD}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-heading font-semibold text-lg">Target List</h3>
                  <SourceChip source="AI_RESEARCH" small />
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(list.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(124,106,247,0.15)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Regenerating...' : 'Regenerate'}
                  </button>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-[rgba(16,185,129,0.15)] text-[#10B981] border border-[rgba(16,185,129,0.3)] cursor-pointer hover:bg-[rgba(16,185,129,0.25)]"
                  >
                    Add Entry
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'rgba(124,106,247,0.08)' }}>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Company</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Source</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Industry</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Size</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Rationale</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} style={{ borderTop: '1px solid var(--border)' }}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text-primary)]">{e.companyName}</div>
                        {e.contactRole && (
                          <div className="text-[10px] text-[var(--text-muted)]">{e.contactRole}</div>
                        )}
                        {e.linkedInUrl && (
                          <a
                            href={e.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-[var(--accent-secondary)] hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <SourceChip source={e.source} small />
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">{e.industry ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">{e.companySize ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--text-primary)] max-w-[200px] truncate" title={e.rationale}>
                        {e.rationale}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={e.status}
                          onChange={(ev) => handleUpdateStatus(e.id, ev.target.value as ClientListEntry['status'])}
                          className="text-[10px] px-2 py-1 rounded bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] cursor-pointer"
                        >
                          <option value="candidate">Candidate</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="declined">Declined</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRemoveEntry(e.id)}
                          className="text-[10px] text-[#EF4444] hover:underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {entries.length === 0 && (
              <div className="rounded-xl p-8 text-center" style={CARD}>
                <p className="text-[var(--text-muted)]">No entries yet. Generate or add manually.</p>
              </div>
            )}
          </>
        )}

        {showAdd && (
          <AddEntryModal
            onSave={handleAddEntry}
            onCancel={() => setShowAdd(false)}
          />
        )}
      </div>
    </div>
  )
}

function AddEntryModal({
  onSave,
  onCancel,
}: {
  onSave: (e: Omit<ClientListEntry, 'id' | 'source' | 'generatedAt'>) => void
  onCancel: () => void
}) {
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [rationale, setRationale] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [linkedInUrl, setLinkedInUrl] = useState('')

  const handleSubmit = () => {
    if (!companyName.trim() || !rationale.trim()) return
    onSave({
      companyName: companyName.trim(),
      industry: industry.trim() || undefined,
      companySize: companySize.trim() || undefined,
      rationale: rationale.trim(),
      contactRole: contactRole.trim() || undefined,
      linkedInUrl: linkedInUrl.trim() || undefined,
      status: 'candidate',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-xl p-6 max-w-md w-full mx-4 space-y-4" style={{ ...CARD, background: 'rgba(30,26,46,0.98)' }}>
        <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Add Client</h3>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name *"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          placeholder="Industry"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <input
          type="text"
          value={companySize}
          onChange={(e) => setCompanySize(e.target.value)}
          placeholder="Company size"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Why this company fits? *"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-none"
        />
        <input
          type="text"
          value={contactRole}
          onChange={(e) => setContactRole(e.target.value)}
          placeholder="Contact role (e.g. VP Compliance)"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <input
          type="url"
          value={linkedInUrl}
          onChange={(e) => setLinkedInUrl(e.target.value)}
          placeholder="LinkedIn URL"
          className="w-full px-3 py-2 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-xs font-medium bg-transparent text-[var(--text-muted)] border border-[var(--border)] cursor-pointer hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!companyName.trim() || !rationale.trim()}
            className="px-4 py-2 rounded text-xs font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
