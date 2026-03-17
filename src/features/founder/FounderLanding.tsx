import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'

const STORAGE_KEY = 'founder_venture_ids'

function getMyVentureIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function addToMyVentures(id: string) {
  const ids = getMyVentureIds()
  if (ids.includes(id)) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, id]))
}

export function FounderLanding() {
  const { ventures, setActiveVentureId, createVenture, loadVentures, loading, error } = useVentures()
  const [retrying, setRetrying] = useState(false)
  const navigate = useNavigate()
  const [newName, setNewName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const myIds = getMyVentureIds()
  const myVentures = Object.values(ventures).filter((v) => myIds.includes(v.id))
  const searchResults = searchQuery.trim()
    ? Object.values(ventures).filter((v) =>
        v.name.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const handleCreate = async () => {
    if (!newName.trim() || creating) return
    setCreating(true)
    try {
      const v = await createVenture(newName.trim())
      addToMyVentures(v.id)
      navigate('/define/idea-intake')
    } catch {
      // error shown via context
    } finally {
      setCreating(false)
    }
  }

  const handleSelect = (id: string) => {
    setActiveVentureId(id)
    addToMyVentures(id)
    navigate('/define/idea-intake')
  }

  const cardStyle = {
    background: 'rgba(30,26,46,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Founder</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Create a venture or continue working on one you've started.
          </p>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-lg text-sm space-y-2"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <p>{error}</p>
            <p className="text-xs opacity-90">
              Ensure Supabase migrations are applied (e.g. supabase db push).
            </p>
            <button
              onClick={async () => {
                setRetrying(true)
                await loadVentures()
                setRetrying(false)
              }}
              disabled={retrying}
              className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.3)] border border-[rgba(239,68,68,0.4)] disabled:opacity-50"
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Start new venture */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h2 className="font-heading font-semibold text-lg mb-4">Start new venture</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Venture name..."
              className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>

        {/* My ventures */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h2 className="font-heading font-semibold text-lg mb-4">My ventures</h2>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading...</p>
          ) : myVentures.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No ventures yet. Create one above or find an existing venture below.
            </p>
          ) : (
            <div className="space-y-2">
              {myVentures.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelect(v.id)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-[rgba(124,106,247,0.1)] border border-transparent hover:border-[rgba(124,106,247,0.2)] transition-colors"
                >
                  <span className="font-medium">{v.name.value}</span>
                  <span className="text-xs text-[var(--text-muted)] ml-2">
                    Stage {v.stage.value} · {v.status.value}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Find venture */}
        <div className="rounded-xl p-6" style={cardStyle}>
          <h2 className="font-heading font-semibold text-lg mb-4">Find venture</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full mb-4 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none"
          />
          {searchQuery.trim() && (
            <div className="space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No ventures match.</p>
              ) : (
                searchResults.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)]"
                  >
                    <span className="font-medium">{v.name.value}</span>
                    <button
                      onClick={() => handleSelect(v.id)}
                      className="px-3 py-1.5 rounded text-sm font-medium bg-[var(--accent-primary)] text-white hover:opacity-90"
                    >
                      Open
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
