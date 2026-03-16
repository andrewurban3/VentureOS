import { Outlet } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { StageProgressSummary, getDesignValidateStatus } from '@/components/StageProgressSummary'

export function ValidateLayout() {
  const { ventures, activeVentureId } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {venture && (
        <div className="shrink-0 px-6 pt-4 pb-2">
          <StageProgressSummary title="Design & Validate Progress" items={getDesignValidateStatus(venture)} />
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
