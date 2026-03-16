import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import type { Venture } from '@/types/venture'
import {
  createVentureInDb,
  listVenturesFromDb,
  hydrateVenture,
  saveVentureUpdates,
} from '@/services/ventures'
import { syncVentureToGraph } from '@/services/knowledgeGraph'
import { getRilletVenturePayload } from '@/data/demoVenture'

interface VentureContextValue {
  ventures: Record<string, Venture>
  activeVentureId: string | null
  setActiveVentureId: (id: string | null) => void
  updateVenture: (id: string, updates: Partial<Venture>) => void
  createVenture: (name: string) => Promise<Venture>
  loadVentures: () => Promise<void>
  loading: boolean
  error: string | null
}

const VentureContext = createContext<VentureContextValue | null>(null)

const DEBOUNCE_MS = 1500

export function VentureProvider({ children }: { children: ReactNode }) {
  const [ventures, setVentures] = useState<Record<string, Venture>>({})
  const [activeVentureId, setActiveVentureIdRaw] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const hydratedIds = useRef<Set<string>>(new Set())

  const rilletSeeded = useRef(false)

  const loadVentures = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let list = await listVenturesFromDb()

      let rilletIdToHydrate: string | null = null
      if (!rilletSeeded.current) {
        rilletSeeded.current = true
        const existing = list.find((v) => v.name?.value === 'Rillet')
        try {
          if (!existing) {
            const rillet = await createVentureInDb('Rillet')
            const payload = getRilletVenturePayload()
            await saveVentureUpdates(rillet.id, payload)
            await syncVentureToGraph(rillet.id, payload).catch((e) =>
              console.warn('RAG sync for Rillet failed:', e)
            )
            list = await listVenturesFromDb()
            rilletIdToHydrate = rillet.id
          } else {
            const full = await hydrateVenture(existing.id)
            const missingStage04 =
              full &&
              (!full.designPartnerPipeline?.candidates?.length ||
                !full.designPartnerFeedbackSummary ||
                !full.mvpFeatureList?.features?.length)
            const missingStage05_07 =
              full &&
              (!full.technicalArchitecture ||
                !full.productRoadmap ||
                !full.featurePrdList?.prds?.length ||
                !full.sprintPlan ||
                !full.clientFeedbackSummary ||
                !full.updatedRoadmap ||
                !full.pricingLab ||
                !full.pricingImplementationTracker ||
                !full.gtmTracker)
            const needsBackfill =
              full &&
              (!full.ideaIntake?.messages?.length || missingStage04 || missingStage05_07)
            if (needsBackfill) {
              const payload = getRilletVenturePayload()
              await saveVentureUpdates(existing.id, payload)
              await syncVentureToGraph(existing.id, payload).catch((e) =>
                console.warn('RAG sync for Rillet failed:', e)
              )
              list = await listVenturesFromDb()
              rilletIdToHydrate = existing.id
            }
          }
        } catch (seedErr) {
          console.warn('Failed to auto-seed Rillet demo venture:', seedErr)
        }
      }

      const map: Record<string, Venture> = {}
      list.forEach((v) => {
        map[v.id] = v
      })
      const rilletFromList = list.find((v) => v.name?.value === 'Rillet')
      if (rilletFromList) {
        const current = map[rilletFromList.id]
        const missingStage04 = !current.designPartnerPipeline?.candidates?.length
        const missingStage05_07 =
          !current.technicalArchitecture ||
          !current.productRoadmap ||
          !current.featurePrdList?.prds?.length ||
          !current.sprintPlan ||
          !current.clientFeedbackSummary ||
          !current.updatedRoadmap ||
          !current.pricingLab ||
          !current.pricingImplementationTracker ||
          !current.gtmTracker
        if (missingStage04 || missingStage05_07) {
          const payload = getRilletVenturePayload()
          map[rilletFromList.id] = {
            ...current,
            ...(missingStage04 && {
              designPartnerPipeline: payload.designPartnerPipeline,
              designPartnerFeedbackSummary: payload.designPartnerFeedbackSummary,
              mvpFeatureList: payload.mvpFeatureList,
            }),
            ...(missingStage05_07 && {
              technicalArchitecture: payload.technicalArchitecture ?? current.technicalArchitecture,
              productRoadmap: payload.productRoadmap ?? current.productRoadmap,
              featurePrdList: payload.featurePrdList ?? current.featurePrdList,
              sprintPlan: payload.sprintPlan ?? current.sprintPlan,
              clientFeedbackSummary: payload.clientFeedbackSummary ?? current.clientFeedbackSummary,
              updatedRoadmap: payload.updatedRoadmap ?? current.updatedRoadmap,
              pricingLab: payload.pricingLab ?? current.pricingLab,
              pricingImplementationTracker: payload.pricingImplementationTracker ?? current.pricingImplementationTracker,
              gtmTracker: payload.gtmTracker ?? current.gtmTracker,
            }),
          }
        }
      }
      if (rilletIdToHydrate) {
        const hydrated = await hydrateVenture(rilletIdToHydrate)
        if (hydrated) {
          let ventureToSet = hydrated
          const missingStage04 =
            !ventureToSet.designPartnerPipeline?.candidates?.length ||
            !ventureToSet.designPartnerFeedbackSummary ||
            !ventureToSet.mvpFeatureList?.features?.length
          const missingStage05_07 =
            !ventureToSet.technicalArchitecture ||
            !ventureToSet.productRoadmap ||
            !ventureToSet.featurePrdList?.prds?.length ||
            !ventureToSet.sprintPlan ||
            !ventureToSet.clientFeedbackSummary ||
            !ventureToSet.updatedRoadmap ||
            !ventureToSet.pricingLab ||
            !ventureToSet.pricingImplementationTracker ||
            !ventureToSet.gtmTracker
          if (missingStage04 || missingStage05_07) {
            const payload = getRilletVenturePayload()
            ventureToSet = {
              ...ventureToSet,
              ...(missingStage04 && {
                designPartnerPipeline: payload.designPartnerPipeline ?? ventureToSet.designPartnerPipeline,
                designPartnerFeedbackSummary: payload.designPartnerFeedbackSummary ?? ventureToSet.designPartnerFeedbackSummary,
                mvpFeatureList: payload.mvpFeatureList ?? ventureToSet.mvpFeatureList,
              }),
              ...(missingStage05_07 && {
                technicalArchitecture: payload.technicalArchitecture ?? ventureToSet.technicalArchitecture,
                productRoadmap: payload.productRoadmap ?? ventureToSet.productRoadmap,
                featurePrdList: payload.featurePrdList ?? ventureToSet.featurePrdList,
                sprintPlan: payload.sprintPlan ?? ventureToSet.sprintPlan,
                clientFeedbackSummary: payload.clientFeedbackSummary ?? ventureToSet.clientFeedbackSummary,
                updatedRoadmap: payload.updatedRoadmap ?? ventureToSet.updatedRoadmap,
                pricingLab: payload.pricingLab ?? ventureToSet.pricingLab,
                pricingImplementationTracker: payload.pricingImplementationTracker ?? ventureToSet.pricingImplementationTracker,
                gtmTracker: payload.gtmTracker ?? ventureToSet.gtmTracker,
              }),
            }
          }
          map[rilletIdToHydrate] = ventureToSet
          hydratedIds.current.add(rilletIdToHydrate)
        }
      }
      setVentures(map)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load ventures')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVentures()
  }, [loadVentures])

  const setActiveVentureId = useCallback(async (id: string | null) => {
    setActiveVentureIdRaw(id)
    if (id && !hydratedIds.current.has(id)) {
      try {
        let full = await hydrateVenture(id)
        if (full) {
          const isRillet = full.name?.value === 'Rillet'
          const missingStage04 =
            isRillet &&
            (!full.designPartnerPipeline?.candidates?.length ||
              !full.designPartnerFeedbackSummary ||
              !full.mvpFeatureList?.features?.length)
          const missingStage05_07 =
            isRillet &&
            (!full.technicalArchitecture ||
              !full.productRoadmap ||
              !full.featurePrdList?.prds?.length ||
              !full.sprintPlan ||
              !full.clientFeedbackSummary ||
              !full.updatedRoadmap ||
              !full.pricingLab ||
              !full.pricingImplementationTracker ||
              !full.gtmTracker)
          if (missingStage04 || missingStage05_07) {
            const payload = getRilletVenturePayload()
            full = {
              ...full,
              ...(missingStage04 && {
                designPartnerPipeline: payload.designPartnerPipeline ?? full.designPartnerPipeline,
                designPartnerFeedbackSummary: payload.designPartnerFeedbackSummary ?? full.designPartnerFeedbackSummary,
                mvpFeatureList: payload.mvpFeatureList ?? full.mvpFeatureList,
              }),
              ...(missingStage05_07 && {
                technicalArchitecture: payload.technicalArchitecture ?? full.technicalArchitecture,
                productRoadmap: payload.productRoadmap ?? full.productRoadmap,
                featurePrdList: payload.featurePrdList ?? full.featurePrdList,
                sprintPlan: payload.sprintPlan ?? full.sprintPlan,
                clientFeedbackSummary: payload.clientFeedbackSummary ?? full.clientFeedbackSummary,
                updatedRoadmap: payload.updatedRoadmap ?? full.updatedRoadmap,
                pricingLab: payload.pricingLab ?? full.pricingLab,
                pricingImplementationTracker: payload.pricingImplementationTracker ?? full.pricingImplementationTracker,
                gtmTracker: payload.gtmTracker ?? full.gtmTracker,
              }),
            }
          }
          hydratedIds.current.add(id)
          setVentures((prev) => ({ ...prev, [id]: full }))
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load venture data')
      }
    }
  }, [])

  const updateVenture = useCallback((id: string, updates: Partial<Venture>) => {
    setVentures((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...updates } as Venture }
      const updatesForSave = updates
      if (saveTimeouts.current[id]) clearTimeout(saveTimeouts.current[id])
      saveTimeouts.current[id] = setTimeout(() => {
        saveVentureUpdates(id, updatesForSave).catch((e) =>
          setError(e instanceof Error ? e.message : 'Failed to save')
        )
        delete saveTimeouts.current[id]
      }, DEBOUNCE_MS)
      return next
    })
  }, [])

  const createVenture = useCallback(async (name: string): Promise<Venture> => {
    setError(null)
    const venture = await createVentureInDb(name.trim())
    hydratedIds.current.add(venture.id)
    setVentures((prev) => ({ ...prev, [venture.id]: venture }))
    setActiveVentureIdRaw(venture.id)
    return venture
  }, [])

  useEffect(() => {
    return () => {
      Object.values(saveTimeouts.current).forEach(clearTimeout)
    }
  }, [])

  return (
    <VentureContext.Provider
      value={{
        ventures,
        activeVentureId,
        setActiveVentureId,
        updateVenture,
        createVenture,
        loadVentures,
        loading,
        error,
      }}
    >
      {children}
    </VentureContext.Provider>
  )
}

export function useVentures() {
  const ctx = useContext(VentureContext)
  if (!ctx) throw new Error('useVentures must be used within VentureProvider')
  return ctx
}
