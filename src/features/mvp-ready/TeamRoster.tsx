import { useState } from 'react'
import type { TeamMember } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

interface TeamRosterProps {
  teamMembers: TeamMember[]
  onUpdate: (members: TeamMember[]) => void
}

export function TeamRoster({ teamMembers, onUpdate }: TeamRosterProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newAllocation, setNewAllocation] = useState(100)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<TeamMember>>({})

  const members = teamMembers ?? []

  const addMember = () => {
    if (!newName.trim() || !newRole.trim()) return
    const now = new Date().toISOString()
    const m: TeamMember = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      role: newRole.trim(),
      email: newEmail.trim() || undefined,
      allocationPct: Math.min(100, Math.max(0, newAllocation)),
      addedAt: now,
      updatedAt: now,
    }
    onUpdate([...members, m])
    setNewName('')
    setNewRole('')
    setNewEmail('')
    setNewAllocation(100)
    setAdding(false)
  }

  const updateMember = (id: string) => {
    const next = members.map((m) =>
      m.id === id ? { ...m, ...editDraft, updatedAt: new Date().toISOString() } : m
    )
    onUpdate(next)
    setEditingId(null)
    setEditDraft({})
  }

  const removeMember = (id: string) => {
    onUpdate(members.filter((m) => m.id !== id))
  }

  const totalAllocation = members.reduce((sum, m) => sum + (m.allocationPct ?? 100), 0)
  const isOverallocated = totalAllocation > 100

  return (
    <div className="rounded-xl p-6 space-y-4" style={CARD}>
      <div>
        <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
          Team roster
        </label>
        <p className="text-xs text-[var(--text-muted)] mb-3">
          Add team members with role and allocation. Track who&apos;s working on what across the portfolio.
        </p>
        {isOverallocated && (
          <p className="text-xs text-[#F59E0B] mb-2">
            Total allocation ({totalAllocation}%) exceeds 100% — consider rebalancing.
          </p>
        )}

        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
            >
              {editingId === m.id ? (
                <>
                  <input
                    type="text"
                    value={editDraft.name ?? m.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Name"
                    className="flex-1 min-w-0 px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                  <input
                    type="text"
                    value={editDraft.role ?? m.role}
                    onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value }))}
                    placeholder="Role"
                    className="w-28 px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                  <input
                    type="email"
                    value={editDraft.email ?? m.email ?? ''}
                    onChange={(e) => setEditDraft((d) => ({ ...d, email: e.target.value || undefined }))}
                    placeholder="Email"
                    className="w-36 px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editDraft.allocationPct ?? m.allocationPct ?? 100}
                    onChange={(e) => setEditDraft((d) => ({ ...d, allocationPct: parseInt(e.target.value, 10) || 0 }))}
                    className="w-14 px-2 py-1 rounded text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
                  />
                  <span className="text-xs text-[var(--text-muted)]">%</span>
                  <button
                    type="button"
                    onClick={() => updateMember(m.id)}
                    className="px-2 py-1 rounded text-xs bg-[var(--accent-primary)] text-white border-none cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); setEditDraft({}) }}
                    className="px-2 py-1 rounded text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 min-w-0 font-medium text-sm text-[var(--text-primary)] truncate">
                    {m.name}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{m.role}</span>
                  {m.email && (
                    <span className="text-xs text-[var(--text-muted)] truncate max-w-[140px]">{m.email}</span>
                  )}
                  <span className="text-xs font-mono text-[var(--accent-primary)] shrink-0">
                    {m.allocationPct ?? 100}%
                  </span>
                  <button
                    type="button"
                    onClick={() => { setEditingId(m.id); setEditDraft({}) }}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-secondary)] bg-transparent border-none cursor-pointer shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="text-xs text-[#EF4444] hover:underline bg-transparent border-none cursor-pointer shrink-0"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {adding ? (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-[120px]"
            />
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role"
              className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-[100px]"
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email"
              className="px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] min-w-[140px]"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={newAllocation}
              onChange={(e) => setNewAllocation(parseInt(e.target.value, 10) || 0)}
              className="w-16 px-3 py-2 rounded-lg text-sm bg-[rgba(20,16,36,0.6)] border border-[var(--border)] text-[var(--text-primary)]"
            />
            <span className="text-xs text-[var(--text-muted)]">%</span>
            <button
              type="button"
              onClick={addMember}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--accent-primary)] text-white border-none cursor-pointer"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNewName(''); setNewRole(''); setNewEmail(''); setNewAllocation(100) }}
              className="px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent border-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.3)] cursor-pointer hover:opacity-90"
          >
            + Add team member
          </button>
        )}
      </div>
    </div>
  )
}
