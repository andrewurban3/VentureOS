import { Navigate } from 'react-router-dom'
import { useRole } from '@/components/RolePicker'
import type { ReactNode } from 'react'

interface RequireVentureLeadProps {
  children: ReactNode
}

/**
 * Redirects founders to /founder. Use for routes that are venture-lead only (e.g. Discover).
 */
export function RequireVentureLead({ children }: RequireVentureLeadProps) {
  const [role] = useRole()

  if (role === 'founder') {
    return <Navigate to="/founder" replace />
  }

  return <>{children}</>
}
