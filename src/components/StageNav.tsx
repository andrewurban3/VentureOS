import { NavLink, useLocation } from 'react-router-dom'
import { STAGES } from '@/constants/stages'
import { STAGE_FEATURES, STAGE_BASE_PATHS } from '@/constants/stageFeatures'
import { useVentures } from '@/context/VentureContext'

function getActiveStageId(pathname: string): string {
  for (const [id, basePath] of Object.entries(STAGE_BASE_PATHS)) {
    if (pathname.startsWith(basePath)) return id
  }
  return '02'
}

export default function StageNav() {
  const { pathname } = useLocation()
  const { ventures, activeVentureId } = useVentures()

  const activeStageId = getActiveStageId(pathname)
  const features = STAGE_FEATURES[activeStageId] ?? []

  const venture = activeVentureId ? ventures[activeVentureId] : null
  const ventureStageNum = venture ? parseInt(venture.stage?.value ?? '02', 10) : 99

  return (
    <nav
      className="font-heading"
      style={{
        background: 'rgba(19,17,28,0.95)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {/* Stage tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: 40,
          gap: 2,
          padding: '0 12px',
          overflowX: 'auto',
        }}
      >
        {STAGES.filter((s) => s.id !== '01').map((stage) => {
          const basePath = STAGE_BASE_PATHS[stage.id]
          const isActive = stage.id === activeStageId
          const stageNum = parseInt(stage.id, 10)
          const isFuture = stageNum > ventureStageNum

          return (
            <NavLink
              key={stage.id}
              to={basePath}
              className="font-mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                borderRadius: '6px 6px 0 0',
                transition: 'background 0.15s, opacity 0.15s',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-primary)',
                opacity: isFuture ? 0.45 : 1,
              }}
            >
              {stage.name}
            </NavLink>
          )
        })}
        <NavLink
          to="/stage-gate"
          className="font-mono"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 14px',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            textDecoration: 'none',
            borderRadius: '6px 6px 0 0',
            transition: 'background 0.15s, opacity 0.15s',
            background: activeStageId === 'stage-gate' ? 'var(--accent-primary)' : 'transparent',
            color: activeStageId === 'stage-gate' ? '#fff' : 'var(--text-primary)',
          }}
        >
          Stage Gate
        </NavLink>
      </div>

      {/* Feature sub-nav */}
      {features.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            height: 36,
            gap: 2,
            padding: '0 12px',
            borderTop: '1px solid var(--border)',
            overflowX: 'auto',
          }}
        >
          {features.map((feature) => (
            <NavLink
              key={feature.id}
              to={feature.path}
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
              {feature.name}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
