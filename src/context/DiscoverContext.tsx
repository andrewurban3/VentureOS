import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { useVentures } from '@/context/VentureContext'
import type { DiscoverResearch } from '@/types/venture'

const SESSION_KEY = 'venture_os_discover_research'

function loadSessionResearch(): DiscoverResearch[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessionResearch(items: DiscoverResearch[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(items))
}

interface DiscoverContextValue {
  research: DiscoverResearch[]
  addResearch: (entry: DiscoverResearch) => void
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null)

export function DiscoverProvider({ children }: { children: ReactNode }) {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [sessionResearch, setSessionResearch] = useState<DiscoverResearch[]>(loadSessionResearch)

  const research =
    activeVentureId && venture?.discover?.research
      ? venture.discover.research
      : sessionResearch

  const addResearch = useCallback(
    (entry: DiscoverResearch) => {
      if (activeVentureId && venture) {
        const existing = venture.discover?.research ?? []
        updateVenture(activeVentureId, { discover: { research: [...existing, entry] } })
      } else {
        setSessionResearch((prev) => {
          const next = [...prev, entry]
          saveSessionResearch(next)
          return next
        })
      }
    },
    [activeVentureId, venture, updateVenture]
  )

  return (
    <DiscoverContext.Provider value={{ research, addResearch }}>
      {children}
    </DiscoverContext.Provider>
  )
}

export function useDiscoverResearch() {
  const ctx = useContext(DiscoverContext)
  if (!ctx) throw new Error('useDiscoverResearch must be used within DiscoverProvider')
  return ctx
}
