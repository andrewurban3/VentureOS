import { Navigate } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import type { ReactNode } from 'react'

interface RequireVentureProps {
  children: ReactNode
}

/**
 * Redirects to /founder or /venture-lead when no venture is selected.
 * Use for routes that require an active venture (Idea Intake, Scoring, Pressure Test, Outputs).
 */
export function RequireVenture({ children }: RequireVentureProps) {
  const { activeVentureId } = useVentures()
  const [role] = useRole()

  if (!activeVentureId) {
    const redirectTo = role === 'venture-lead' ? '/venture-lead' : '/founder'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
