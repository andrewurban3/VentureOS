import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { retrieveVentureContext } from '@/services/knowledgeGraph'
import { buildVentureContext } from '@/lib/ventureContext'
import { buildPressureTestSystemBlocks, getRecentMessages } from '@/agents/pressure-test'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { aiService } from '@/services/ai'
import { PERSONAS } from '@/constants/pressureTest'

export function PressureTest() {
  const { pathname } = useLocation()
  const isDefine = pathname.startsWith('/define')
  const title = isDefine ? 'Shark Tank Pressure Test' : 'Pressure Test'
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [activeSession, setActiveSession] = useState<{
    personaId: string
    personaName: string
    color: string
  } | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const currentSession = venture?.pressureTests?.find(
    (s) => s.personaId === activeSession?.personaId
  )
  const messages = currentSession?.messages ?? []

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages])

  const getVentureContext = async () => {
    if (!venture) return ''
    try {
      return await retrieveVentureContext(venture.id, 'Pressure test: problem, solution, ICP, market, team, strategy, traction', {
        topK: 20,
        nodeTypes: ['intake_exchange', 'dimension_insight', 'icp_profile', 'pain_point', 'scoring_result', 'saved_insight'],
        maxChars: 6000,
      })
    } catch {
      return buildVentureContext(venture, { sections: 'intake', maxChars: 6000 })
    }
  }

  const startSession = async (persona: (typeof PERSONAS)[number]) => {
    setActiveSession({
      personaId: persona.id,
      personaName: persona.name,
      color: persona.color,
    })
    setLoading(true)
    setApiError(null)

    try {
      const ventureContext = await getVentureContext()
      const resp = await aiService.chat({
        systemPrompt: buildPressureTestSystemBlocks(persona, ventureContext, true),
        messages: [
          {
            role: 'user' as const,
            content: `Begin the pressure test of "${venture!.name.value}". Ask your first, sharpest question.`,
          },
        ],
        maxTokens: 1000,
      })

      const newSession = {
        personaId: persona.id,
        personaName: persona.name,
        messages: [
          {
            role: 'assistant' as const,
            content: resp.text,
            timestamp: new Date().toISOString(),
          },
        ],
        startedAt: new Date().toISOString(),
      }

      const existing = venture!.pressureTests ?? []
      const updated = existing.filter((s) => s.personaId !== persona.id)
      updateVenture(venture!.id, {
        pressureTests: [...updated, newSession],
      })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Pressure test failed')
      const newSession = {
        personaId: persona.id,
        personaName: persona.name,
        messages: [
          {
            role: 'assistant' as const,
            content: "Let's examine this venture. Tell me — why should anyone invest in this?",
            timestamp: new Date().toISOString(),
          },
        ],
        startedAt: new Date().toISOString(),
      }
      const existing = venture!.pressureTests ?? []
      const updated = existing.filter((s) => s.personaId !== persona.id)
      updateVenture(venture!.id, {
        pressureTests: [...updated, newSession],
      })
    } finally {
      setLoading(false)
    }
  }

  const sendResponse = async () => {
    if (!input.trim() || !activeSession || !venture || loading) return

    const userMsg = {
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    const updatedMessages = [...messages, userMsg]
    const existing = venture.pressureTests ?? []
    const otherSessions = existing.filter((s) => s.personaId !== activeSession.personaId)
    const current = existing.find((s) => s.personaId === activeSession.personaId) ?? {
      personaId: activeSession.personaId,
      personaName: activeSession.personaName,
      messages: [],
      startedAt: new Date().toISOString(),
    }

    updateVenture(venture.id, {
      pressureTests: [
        ...otherSessions,
        { ...current, messages: updatedMessages },
      ],
    })
    setInput('')
    setLoading(true)
    setApiError(null)

    const persona = PERSONAS.find((p) => p.id === activeSession.personaId)!
    const recentMessages = getRecentMessages(updatedMessages)
    let apiMessages = recentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    if (apiMessages.length > 0 && apiMessages[0].role === 'assistant') {
      apiMessages = [
        {
          role: 'user' as const,
          content: `[Pressure test started. ${activeSession.personaName} asked the first question. The founder's responses follow.]`,
        },
        ...apiMessages,
      ]
    }

    try {
      const ventureContext = await getVentureContext()
      const resp = await aiService.chat({
        systemPrompt: buildPressureTestSystemBlocks(persona, ventureContext, false),
        messages: apiMessages,
        maxTokens: 1000,
      })

      const aiMsg = {
        role: 'assistant' as const,
        content: resp.text,
        timestamp: new Date().toISOString(),
      }

      updateVenture(venture.id, {
        pressureTests: [
          ...otherSessions,
          { ...current, messages: [...updatedMessages, aiMsg] },
        ],
      })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Pressure test failed')
      const aiMsg = {
        role: 'assistant' as const,
        content: "Interesting. Let me push on a different angle — what happens when your biggest competitor copies this in 6 months?",
        timestamp: new Date().toISOString(),
      }
      updateVenture(venture.id, {
        pressureTests: [
          ...otherSessions,
          { ...current, messages: [...updatedMessages, aiMsg] },
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  const savedContentSet = useMemo(() => {
    const set = new Set<string>()
    venture?.savedInsights?.forEach((ins) => set.add(ins.content))
    return set
  }, [venture?.savedInsights])

  const handleSaveInsight = (msgIndex: number) => {
    if (!venture || !activeVentureId || !activeSession) return
    const msg = messages[msgIndex]
    if (!msg || msg.role !== 'assistant') return

    const founderMsg = msgIndex > 0 && messages[msgIndex - 1].role === 'user'
      ? messages[msgIndex - 1].content
      : undefined

    const insight = {
      id: `${activeSession.personaId}-${Date.now()}`,
      personaId: activeSession.personaId,
      personaName: activeSession.personaName,
      content: msg.content,
      founderResponse: founderMsg,
      savedAt: new Date().toISOString(),
    }

    const existing = venture.savedInsights ?? []
    updateVenture(activeVentureId, {
      savedInsights: [...existing, insight],
    })
  }

  const endSession = () => {
    setActiveSession(null)
    setApiError(null)
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div
          className="rounded-xl p-8 max-w-md text-center"
          style={{
            background: 'rgba(30,26,46,0.7)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 className="font-heading font-bold text-xl mb-2">{title}</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Complete an Idea Intake session first to pressure test a venture.
          </p>
        </div>
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        <h2 className="font-heading font-bold text-xl mb-2">{title}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Select a persona to challenge {venture.name.value}. Each persona asks the hardest questions from their domain.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAS.map((p) => {
            const insightCount = venture.savedInsights?.filter((ins) => ins.personaId === p.id).length ?? 0
            return (
              <div
                key={p.id}
                className="rounded-xl p-4 cursor-pointer transition-all hover:border-[var(--accent-primary)]"
                style={{
                  background: 'rgba(30,26,46,0.7)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(12px)',
                }}
                onClick={() => startSession(p)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="font-heading font-semibold text-sm">{p.name}</span>
                  {insightCount > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10B981]">
                      {insightCount} saved
                    </span>
                  )}
                </div>
                <p className="font-mono text-xs text-[var(--text-muted)] mb-1">
                  {p.archetype}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Will pressure test: {p.focus}
                </p>
              </div>
            )
          })}
        </div>

        {(venture.savedInsights?.length ?? 0) > 0 && (
          <div
            className="mt-6 rounded-xl p-5"
            style={{ background: 'rgba(30,26,46,0.7)', border: '1px solid var(--border)' }}
          >
            <h3 className="font-heading font-semibold text-sm mb-3">
              Saved Insights ({venture.savedInsights!.length})
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] mb-3">
              These insights will be incorporated into your Business Brief and other outputs.
            </p>
            <div className="space-y-2">
              {venture.savedInsights!.map((ins) => {
                const persona = PERSONAS.find((p) => p.id === ins.personaId)
                return (
                  <div
                    key={ins.id}
                    className="rounded-lg px-3 py-2"
                    style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: persona?.color ?? '#8B87A8' }}
                      />
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">
                        {ins.personaName}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed line-clamp-2">
                      {ins.content}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(19,17,28,0.5)',
        }}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ background: activeSession.color }}
        />
        <span className="font-heading font-semibold text-sm">
          {activeSession.personaName}
        </span>
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {PERSONAS.find((p) => p.id === activeSession.personaId)?.archetype}
        </span>
        <button
          onClick={endSession}
          className="ml-auto px-3 py-1 rounded font-mono text-xs border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface)]"
        >
          ← Back to Personas
        </button>
      </div>

      <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} className="mx-6 mt-4" />
      <div
        ref={chatRef}
        className="flex-1 overflow-auto p-6 space-y-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg, i) => {
          const isSaved = msg.role === 'assistant' && savedContentSet.has(msg.content)
          return (
            <div
              key={i}
              className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className="rounded-xl px-4 py-3 max-w-[70%]"
                style={{
                  background:
                    msg.role === 'assistant'
                      ? `${activeSession.color}15`
                      : 'rgba(30,26,46,0.8)',
                  border: `1px solid ${msg.role === 'assistant' ? `${activeSession.color}40` : 'var(--border)'}`,
                }}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <div className="flex items-center gap-2 mt-2">
                  {msg.role === 'assistant' ? (
                    <>
                      <SourceChip source="PRESSURE_TEST" subSource={activeSession.personaName} small />
                      {isSaved ? (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[rgba(16,185,129,0.15)] text-[#10B981]">
                          Saved
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSaveInsight(i)}
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[rgba(124,106,247,0.12)] text-[var(--accent-primary)] border border-[rgba(124,106,247,0.25)] cursor-pointer hover:bg-[rgba(124,106,247,0.25)] transition-colors"
                        >
                          Save Insight
                        </button>
                      )}
                    </>
                  ) : (
                    <SourceChip source="FOUNDER" small />
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: `${activeSession.color}15`,
                border: `1px solid ${activeSession.color}40`,
              }}
            >
              <span className="text-sm text-[var(--text-muted)]">
                The {activeSession.personaName.replace('The ', '')} is reviewing your venture...
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        className="p-4 border-t border-[var(--border)] shrink-0"
        style={{ background: 'rgba(19,17,28,0.5)' }}
      >
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Defend your venture..."
            rows={2}
            className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-y min-h-[60px] focus:border-[var(--accent-primary)] outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendResponse()
              }
            }}
          />
          <button
            onClick={sendResponse}
            disabled={loading || !input.trim()}
            className="px-4 rounded-lg font-heading font-semibold text-sm self-end"
            style={{
              background: loading || !input.trim() ? 'var(--border)' : activeSession.color,
              color: '#fff',
              border: 'none',
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
          >
            Respond
          </button>
        </div>
      </div>
    </div>
  )
}
