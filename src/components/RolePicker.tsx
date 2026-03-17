import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRole, type Role } from '@/context/RoleContext'

export { useRole, getDefaultRoute } from '@/context/RoleContext'
export type { Role } from '@/context/RoleContext'

export function RolePicker() {
  const [role, setRole] = useRole()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (newRole: Role) => {
    if (newRole === role) {
      setOpen(false)
      return
    }
    setRole(newRole)
    setOpen(false)
    const path = newRole === 'venture-lead' ? '/venture-lead' : '/founder'
    if (location.pathname === '/founder' || location.pathname === '/venture-lead') {
      navigate(path, { replace: true })
    } else {
      navigate(path)
    }
  }

  const label = role === 'founder' ? 'Founder' : 'Venture Lead'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-[var(--border)] hover:bg-[rgba(124,106,247,0.08)] hover:border-[rgba(124,106,247,0.3)] transition-colors"
        aria-expanded={open}
      >
        <span className="text-[var(--text-primary)] truncate max-w-[120px]">
          {label}
        </span>
        <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 rounded-lg min-w-[160px] z-50"
          style={{
            background: 'rgba(30,26,46,0.98)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <button
            onClick={() => handleSelect('founder')}
            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
              role === 'founder'
                ? 'bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:bg-[rgba(124,106,247,0.1)]'
            }`}
          >
            View as Founder
          </button>
          <button
            onClick={() => handleSelect('venture-lead')}
            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
              role === 'venture-lead'
                ? 'bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)]'
                : 'text-[var(--text-primary)] hover:bg-[rgba(124,106,247,0.1)]'
            }`}
          >
            View as Venture Lead
          </button>
        </div>
      )}
    </div>
  )
}
