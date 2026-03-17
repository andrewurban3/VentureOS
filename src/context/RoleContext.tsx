import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const VIEW_PREFERENCE_KEY = 'venture_os_view_preference'
export type Role = 'founder' | 'venture-lead'

function getStoredRole(): Role {
  const stored = sessionStorage.getItem(VIEW_PREFERENCE_KEY)
  return stored === 'founder' ? 'founder' : 'venture-lead'
}

function setStoredRole(role: Role) {
  sessionStorage.setItem(VIEW_PREFERENCE_KEY, role)
}

const RoleContext = createContext<{ role: Role; setRole: (r: Role) => void } | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(getStoredRole)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setRoleState(getStoredRole())
  }, [])

  const setRole = useCallback((r: Role) => {
    setStoredRole(r)
    setRoleState(r)
    const path = r === 'venture-lead' ? '/venture-lead' : '/founder'
    if (location.pathname === '/founder' || location.pathname === '/venture-lead') {
      navigate(path, { replace: true })
    } else {
      navigate(path)
    }
  }, [navigate, location.pathname])

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole(): [Role, (role: Role) => void] {
  const ctx = useContext(RoleContext)
  if (!ctx) return ['venture-lead', () => {}]
  return [ctx.role, ctx.setRole]
}

export function getDefaultRoute(role?: Role): string {
  return role === 'venture-lead' ? '/venture-lead' : '/founder'
}
