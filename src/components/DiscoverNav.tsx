import { NavLink, Link } from 'react-router-dom'
import { STAGE_FEATURES } from '@/constants/stageFeatures'

const DISCOVER_TOOLS = STAGE_FEATURES['01'] ?? []

export default function DiscoverNav() {
  return (
    <nav
      className="font-heading"
      style={{
        background: 'rgba(19,17,28,0.95)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: 36,
          gap: 2,
          padding: '0 12px',
          overflowX: 'auto',
        }}
      >
        <Link
          to="/venture-lead"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            fontSize: 12,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            borderRadius: 4,
            transition: 'background 0.15s',
            fontWeight: 400,
            color: 'var(--text-muted)',
            marginRight: 8,
          }}
        >
          &larr; Dashboard
        </Link>

        <span
          style={{
            width: 1,
            alignSelf: 'stretch',
            margin: '6px 4px',
            background: 'var(--border)',
          }}
        />

        {DISCOVER_TOOLS.map((tool) => (
          <NavLink
            key={tool.id}
            to={tool.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              fontSize: 12,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              borderRadius: 4,
              transition: 'background 0.15s',
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--accent-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-muted)',
            })}
          >
            {tool.name}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
