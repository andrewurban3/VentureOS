import { Outlet } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { StageProgressSummary, getCommercialStatus } from '@/components/StageProgressSummary'

export function CommercialLayout() {
  const { ventures, activeVentureId } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {venture && (
        <div className="shrink-0 px-6 pt-4 pb-2">
          <StageProgressSummary title="Commercial Validation Progress" items={getCommercialStatus(venture)} />
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
