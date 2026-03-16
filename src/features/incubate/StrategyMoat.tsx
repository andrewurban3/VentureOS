import { useState, useRef, useEffect } from 'react'
import { useVentures } from '@/context/VentureContext'
import { aiService } from '@/services/ai'
import { anthropicProvider, parseJsonFromResponse } from '@/services/ai/anthropic'
import { buildStrategyMoatBlocks, buildStrategyPressureTestBlocks } from '@/agents/incubate'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { PERSONAS } from '@/constants/pressureTest'
import type { MoatAssessment } from '@/types/venture'

const WEB_SEARCH_TOOL = { type: 'web_search_20250305', name: 'web_search', max_uses: 5 }

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

export function StrategyMoat() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null

  const [activeSession, setActiveSession] = useState<{
    personaId: string
    personaName: string
    color: string
  } | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRecommend, setLoadingRecommend] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const strategyMoat = venture?.strategyMoat
  const assessment = strategyMoat?.assessment
  const sessions = strategyMoat?.sessions ?? []
  const currentSession = sessions.find((s) => s.personaId === activeSession?.personaId)
  const messages = currentSession?.messages ?? []

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages])

  const handleRecommendMoats = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoadingRecommend(true)
    try {
      const blocks = await buildStrategyMoatBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...blocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences.' },
        ],
        messages: [{ role: 'user', content: 'Recommend moats for this venture.' }],
        maxTokens: 3000,
        tools: [WEB_SEARCH_TOOL],
      })
      const raw = parseJsonFromResponse<MoatAssessment>(resp.text)
      const now = new Date().toISOString()
      const model: MoatAssessment = {
        recommendedMoats: raw.recommendedMoats ?? [],
        currentClaims: raw.currentClaims ?? [],
        narrative: raw.narrative,
        generatedAt: now,
      }
      updateVenture(activeVentureId, {
        strategyMoat: {
          ...strategyMoat,
          assessment: model,
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to recommend moats')
    } finally {
      setLoadingRecommend(false)
    }
  }

  const startStrategySession = async (persona: (typeof PERSONAS)[number]) => {
    setActiveSession({ personaId: persona.id, personaName: persona.name, color: persona.color })
    setLoading(true)
    setApiError(null)

    try {
      const blocks = await buildStrategyPressureTestBlocks(venture!, persona)
      const resp = await aiService.chat({
        systemPrompt: blocks,
        messages: [{
          role: 'user' as const,
          content: `Challenge the moat strategy for "${venture!.name.value}". Ask your first, sharpest question.`,
        }],
        maxTokens: 1000,
      })

      const newSession = {
        personaId: persona.id,
        personaName: persona.name,
        messages: [{ role: 'assistant' as const, content: resp.text, timestamp: new Date().toISOString() }],
        startedAt: new Date().toISOString(),
      }

      const existing = strategyMoat?.sessions ?? []
      const updated = existing.filter((s) => s.personaId !== persona.id)
      updateVenture(venture!.id, {
        strategyMoat: { ...strategyMoat, sessions: [...updated, newSession] },
      })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Strategy pressure test failed')
      const newSession = {
        personaId: persona.id,
        personaName: persona.name,
        messages: [{
          role: 'assistant' as const,
          content: "Let's examine this venture's strategy. What moats are you building, and why will they hold in 18-36 months?",
          timestamp: new Date().toISOString(),
        }],
        startedAt: new Date().toISOString(),
      }
      const existing = strategyMoat?.sessions ?? []
      const updated = existing.filter((s) => s.personaId !== persona.id)
      updateVenture(venture!.id, {
        strategyMoat: { ...strategyMoat, sessions: [...updated, newSession] },
      })
    } finally {
      setLoading(false)
    }
  }

  const sendResponse = async () => {
    if (!input.trim() || !activeSession || !venture || loading) return

    const userMsg = { role: 'user' as const, content: input.trim(), timestamp: new Date().toISOString() }
    const updatedMessages = [...messages, userMsg]
    const existing = strategyMoat?.sessions ?? []
    const otherSessions = existing.filter((s) => s.personaId !== activeSession.personaId)
    const current = existing.find((s) => s.personaId === activeSession.personaId) ?? {
      personaId: activeSession.personaId,
      personaName: activeSession.personaName,
      messages: [],
      startedAt: new Date().toISOString(),
    }

    updateVenture(venture.id, {
      strategyMoat: {
        ...strategyMoat,
        sessions: [...otherSessions, { ...current, messages: updatedMessages }],
      },
    })
    setInput('')
    setLoading(true)
    setApiError(null)

    const persona = PERSONAS.find((p) => p.id === activeSession.personaId)!
    const apiMessages = updatedMessages.slice(-8).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      const blocks = await buildStrategyPressureTestBlocks(venture, persona)
      const resp = await aiService.chat({
        systemPrompt: blocks,
        messages: apiMessages,
        maxTokens: 1000,
      })
      const aiMsg = { role: 'assistant' as const, content: resp.text, timestamp: new Date().toISOString() }
      updateVenture(venture.id, {
        strategyMoat: {
          ...strategyMoat,
          sessions: [...otherSessions, { ...current, messages: [...updatedMessages, aiMsg] }],
        },
      })
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed')
      const aiMsg = {
        role: 'assistant' as const,
        content: "Interesting. What happens when a well-funded incumbent copies this in 12 months?",
        timestamp: new Date().toISOString(),
      }
      updateVenture(venture.id, {
        strategyMoat: {
          ...strategyMoat,
          sessions: [...otherSessions, { ...current, messages: [...updatedMessages, aiMsg] }],
        },
      })
    } finally {
      setLoading(false)
    }
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Strategy & Moat</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="font-heading font-bold text-2xl mb-1">Strategy & Moat</h1>
            <p className="text-sm text-[var(--text-muted)]">
              Develop long-term competitive position. Get moat recommendations and pressure test with personas.
            </p>
          </div>

          <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

          <div className="rounded-xl p-6 mb-6" style={CARD}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-sm">Moat Recommendations</h3>
              <button
                onClick={handleRecommendMoats}
                disabled={loadingRecommend}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRecommend ? 'Analysing...' : assessment ? 'Regenerate' : 'Recommend Moats'}
              </button>
            </div>
            {assessment ? (
              <div className="space-y-4">
                {assessment.recommendedMoats?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Recommended</span>
                    <ul className="mt-2 space-y-2">
                      {assessment.recommendedMoats.map((m, i) => (
                        <li key={i} className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div className="font-medium text-[var(--text-primary)]">{m.type}</div>
                          <p className="text-sm text-[var(--text-primary)] mt-1">{m.rationale}</p>
                          {m.examples?.length && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">Examples: {m.examples.join(', ')}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.currentClaims?.length > 0 && (
                  <div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Current Claims</span>
                    <ul className="mt-2 space-y-1">
                      {assessment.currentClaims.map((c, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className={c.supported ? 'text-[#10B981]' : 'text-[#F59E0B]'}>
                            {c.supported ? '✓' : '!'}
                          </span>
                          <span className="text-[var(--text-primary)]">{c.moatType}: {c.claim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessment.narrative && (
                  <div>
                    <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase">Narrative</span>
                    <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap">{assessment.narrative}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Click Recommend Moats to get AI analysis.</p>
            )}
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm mb-3">Challenge Strategy with Personas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PERSONAS.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl p-4 cursor-pointer transition-all hover:border-[var(--accent-primary)]"
                  style={{ ...CARD }}
                  onClick={() => startStrategySession(p)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                    <span className="font-heading font-semibold text-sm">{p.name}</span>
                  </div>
                  <p className="font-mono text-xs text-[var(--text-muted)] mb-1">{p.archetype}</p>
                  <p className="text-xs text-[var(--text-muted)]">Focus: {p.focus}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', background: 'rgba(19,17,28,0.5)' }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: activeSession.color }} />
        <span className="font-heading font-semibold text-sm">{activeSession.personaName}</span>
        <span className="font-mono text-xs text-[var(--text-muted)]">
          {PERSONAS.find((p) => p.id === activeSession.personaId)?.archetype}
        </span>
        <button
          onClick={() => setActiveSession(null)}
          className="ml-auto px-3 py-1 rounded font-mono text-xs border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] cursor-pointer"
        >
          ← Back
        </button>
      </div>

      <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} className="mx-6 mt-4" />
      <div ref={chatRef} className="flex-1 overflow-auto p-6 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
            <div
              className="rounded-xl px-4 py-3 max-w-[70%]"
              style={{
                background: msg.role === 'assistant' ? `${activeSession.color}15` : 'rgba(30,26,46,0.8)',
                border: `1px solid ${msg.role === 'assistant' ? `${activeSession.color}40` : 'var(--border)'}`,
              }}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-xl px-4 py-3"
              style={{ background: `${activeSession.color}15`, border: `1px solid ${activeSession.color}40` }}
            >
              <span className="text-sm text-[var(--text-muted)]">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border)] shrink-0" style={{ background: 'rgba(19,17,28,0.5)' }}>
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Respond to the challenge..."
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
            className="px-4 rounded-lg font-heading font-semibold text-sm self-end text-white border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loading || !input.trim() ? 'var(--border)' : activeSession.color,
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
