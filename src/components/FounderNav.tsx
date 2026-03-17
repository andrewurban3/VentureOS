import { NavLink, useLocation } from 'react-router-dom'
import { FOUNDER_STAGES } from '@/constants/stageFeatures'
import { useVentures } from '@/context/VentureContext'

function getActiveFounderStageId(pathname: string): string {
  if (pathname === '/founder') return 'my-idea'
  if (pathname.startsWith('/stage-gate')) return 'stage-gate'

  for (const stage of FOUNDER_STAGES) {
    if (stage.features.some((f) => pathname === f.path)) return stage.id
    if (stage.basePaths.some((bp) => pathname.startsWith(bp))) return stage.id
  }
  return 'my-idea'
}

export default function FounderNav() {
  const { pathname } = useLocation()
  const { ventures, activeVentureId } = useVentures()

  const activeStageId = getActiveFounderStageId(pathname)
  const activeStage = FOUNDER_STAGES.find((s) => s.id === activeStageId)
  const features = activeStage?.features ?? []

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
      {/* Founder stage tabs */}
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
        {FOUNDER_STAGES.map((stage) => {
          const isActive = stage.id === activeStageId
          const stageNum = parseInt(stage.vlStageId, 10)
          const isFuture = stageNum > ventureStageNum
          const defaultPath = stage.features[0]?.path ?? '/'

          return (
            <NavLink
              key={stage.id}
              to={defaultPath}
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
