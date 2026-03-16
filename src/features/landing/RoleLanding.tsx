import { useNavigate } from 'react-router-dom'
import { useRole } from '@/components/RolePicker'
import type { Role } from '@/components/RolePicker'

export function RoleLanding() {
  const [, setRole] = useRole()
  const navigate = useNavigate()

  const handleSelect = (role: Role) => {
    setRole(role)
    const path = role === 'venture-lead' ? '/venture-lead' : '/founder'
    navigate(path)
  }

  const cardStyle = {
    background: 'rgba(30,26,46,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1
          className="font-heading font-bold mb-2"
          style={{ fontSize: 32, color: 'var(--accent-primary)', letterSpacing: '-0.02em' }}
        >
          Venture OS
        </h1>
        <p className="text-[var(--text-muted)]">Select your role to continue</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 max-w-2xl w-full">
        <button
          onClick={() => handleSelect('founder')}
          className="flex-1 rounded-xl p-8 text-left transition-colors hover:border-[rgba(124,106,247,0.4)] hover:bg-[rgba(124,106,247,0.06)]"
          style={cardStyle}
        >
          <h2 className="font-heading font-semibold text-xl mb-2 text-[var(--text-primary)]">
            I'm a Founder
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Start a new venture, work on your ideas, or find an existing venture to continue.
          </p>
        </button>

        <button
          onClick={() => handleSelect('venture-lead')}
          className="flex-1 rounded-xl p-8 text-left transition-colors hover:border-[rgba(124,106,247,0.4)] hover:bg-[rgba(124,106,247,0.06)]"
          style={cardStyle}
        >
          <h2 className="font-heading font-semibold text-xl mb-2 text-[var(--text-primary)]">
            I'm a Venture Lead
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            View and manage all ventures in the portfolio. Research opportunities and guide founders.
          </p>
        </button>
      </div>
    </div>
  )
}
