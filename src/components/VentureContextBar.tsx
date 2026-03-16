import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { useRole } from '@/components/RolePicker'
import { STAGES } from '@/constants/stages'
import { makeTrackedField } from '@/types'

export function VentureContextBar() {
  const { ventures, activeVentureId, setActiveVentureId, updateVenture } = useVentures()
  const [role] = useRole()
  const navigate = useNavigate()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [stageOpen, setStageOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setStageOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!venture) return null

  const currentStageId = venture.stage.value === '01' ? '02' : venture.stage.value
  const currentStage = STAGES.find((s) => s.id === currentStageId)
  const currentIndex = STAGES.findIndex((s) => s.id === currentStageId)

  const signedCount = currentStageId === '04'
    ? (venture.designPartnerPipeline?.candidates ?? []).filter((c) => c.pipelineStage === 'signed').length
    : null

  const needsConfirmation = (from: string, to: string) => {
    if (from === '02' && to === '03') return 'Business Brief generated and shared with founder?'
    if (from === '03' && to === '04') return 'Investment Memo generated and reviewed?'
    if (from === '04' && to === '05') {
      const signed = (venture.designPartnerPipeline?.candidates ?? []).filter((c) => c.pipelineStage === 'signed').length
      return `${signed}/3 design partners signed. Proceed?`
    }
    return null
  }

  const handleAdvance = (newStageId: string) => {
    const confirmMsg = needsConfirmation(currentStageId, newStageId)
    if (confirmMsg && !window.confirm(`${confirmMsg}\n\nAdvance to ${STAGES.find((s) => s.id === newStageId)?.name}?`)) {
      return
    }
    updateVenture(venture.id, { stage: makeTrackedField(newStageId, 'VL') })
    setStageOpen(false)
  }

  const handleChangeVenture = () => {
    setActiveVentureId(null)
    navigate(role === 'venture-lead' ? '/venture-lead' : '/founder')
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)]">
        <span className="text-sm font-medium text-[var(--text-primary)]">{venture.name.value}</span>
        {role === 'venture-lead' && (
          <>
            <span className="text-xs text-[var(--text-muted)]">·</span>
            <div className="relative" ref={ref}>
              <button
                onClick={() => setStageOpen((o) => !o)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:underline"
              >
                {currentStage?.name ?? '—'}
                {signedCount !== null && (
                  <span
                    className="ml-1 text-[10px] font-mono rounded-full px-1.5 py-0.5"
                    style={{
                      background: signedCount >= 3 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                      color: signedCount >= 3 ? '#10B981' : '#F59E0B',
                      border: `1px solid ${signedCount >= 3 ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)'}`,
                    }}
                  >
                    {signedCount}/3 Signed
                  </span>
                )}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {stageOpen && (
                <div
                  className="absolute left-0 top-full mt-1 py-1 rounded-lg min-w-[180px] z-50"
                  style={{
                    background: 'rgba(30,26,46,0.98)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {STAGES.filter((st) => st.id !== '01').map((s) => {
                    const sIdx = STAGES.findIndex((x) => x.id === s.id)
                    const isCurrent = s.id === currentStageId
                    const isPast = sIdx < currentIndex
                    const isNext = sIdx === currentIndex + 1
                    const canAdvance = isNext
                    return (
                      <button
                        key={s.id}
                        onClick={() => canAdvance && handleAdvance(s.id)}
                        disabled={!canAdvance && !isCurrent}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          isCurrent
                            ? 'bg-[rgba(124,106,247,0.2)] text-[var(--accent-primary)] font-medium'
                            : isPast
                              ? 'text-[var(--text-muted)] opacity-60 cursor-default'
                              : canAdvance
                                ? 'text-[var(--text-primary)] hover:bg-[rgba(124,106,247,0.1)] cursor-pointer'
                                : 'text-[var(--text-muted)] cursor-default'
                        }`}
                      >
                        <span className="font-mono text-xs">{s.name}</span>
                        {canAdvance && <span className="ml-1 text-[10px] text-[var(--accent-primary)]">(advance)</span>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <button
        onClick={handleChangeVenture}
        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        Dashboard
      </button>
    </div>
  )
}
