import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useVentures } from '@/context/VentureContext'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { aiService } from '@/services/ai'
import {
  buildSystemBlocks,
  parseCoverageFromResponse,
  VERA_INTAKE_CONFIG,
  VERA_INTAKE_WEB_SEARCH_TOOL,
} from '@/agents/vera'
import {
  INTAKE_DIMENSIONS,
  DIMENSION_STATUS_COLORS,
  type DimensionCoverage,
  type DimensionStatus,
} from '@/constants/ideaIntake'
import type { IntakeMessage, VentureCitation } from '@/types/venture'
import type { WebCitation } from '@/services/ai'
import { cn } from '@/lib/utils'

function webCitationsToVenture(wc: WebCitation[]): VentureCitation[] {
  return wc.map((c) => ({
    id: crypto.randomUUID(),
    source: 'AI_RESEARCH' as const,
    title: c.title,
    url: c.url,
    excerpt: c.citedText || undefined,
    context: 'idea-intake',
    generatedAt: new Date().toISOString(),
  }))
}

function getDefaultCoverage(): DimensionCoverage[] {
  return INTAKE_DIMENSIONS.map((d) => ({
    id: d.id,
    status: 'not_started' as DimensionStatus,
    summary: '',
    flags: [],
  }))
}

function formatFlagAsRecommendation(flag: string): string {
  if (flag.startsWith('Recommend')) return flag
  const lower = flag.toLowerCase()
  if (lower.startsWith('no ') || lower.startsWith('lack of ') || lower.startsWith('missing '))
    return `Recommend: ${flag.replace(/^(no |lack of |missing )/i, '')}`
  return `Recommend: ${flag}`
}

export function IdeaIntake() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  const venture = activeVentureId ? ventures[activeVentureId] : null
  const messages = venture?.ideaIntake?.messages ?? []
  const started = messages.length > 0

  const coverage = venture?.ideaIntake?.dimensionCoverage?.length
    ? venture.ideaIntake.dimensionCoverage
    : getDefaultCoverage()

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight)
  }, [messages])

  const startSession = useCallback(async () => {
    if (!venture) return
    setLoading(true)
    setApiError(null)
    try {
      const resp = await aiService.chat({
        systemPrompt: buildSystemBlocks(venture),
        messages: [
          {
            role: 'user' as const,
            content: VERA_INTAKE_CONFIG.openingPrompt(venture.name.value),
          },
        ],
        maxTokens: VERA_INTAKE_CONFIG.maxTokens,
        tools: [VERA_INTAKE_WEB_SEARCH_TOOL],
      })
      const parsed = parseCoverageFromResponse(resp.text)
      const aiContent = parsed?.message ?? resp.text
      const newCoverage = parsed?.coverage?.length ? parsed.coverage : getDefaultCoverage()
      const msgCitations = resp.webCitations.length
        ? resp.webCitations.map((c) => ({ url: c.url, title: c.title, excerpt: c.citedText || undefined }))
        : undefined
      const aiMsg: IntakeMessage = {
        role: 'assistant',
        content: aiContent,
        source: 'VERA',
        timestamp: new Date().toISOString(),
        citations: msgCitations,
      }
      const newVentureCitations = webCitationsToVenture(resp.webCitations)
      updateVenture(venture.id, {
        ideaIntake: {
          messages: [aiMsg],
          dimensionCoverage: newCoverage,
          completed: false,
        },
        ...(newVentureCitations.length ? { citations: [...(venture.citations ?? []), ...newVentureCitations] } : {}),
      })
    } catch {
      const fallbackMsg: IntakeMessage = {
        role: 'assistant',
        content: "What's the idea? I'd love to hear about what you're working on.",
        source: 'VERA',
        timestamp: new Date().toISOString(),
      }
      updateVenture(venture.id, {
        ideaIntake: {
          messages: [fallbackMsg],
          dimensionCoverage: getDefaultCoverage(),
          completed: false,
        },
      })
    } finally {
      setLoading(false)
    }
  }, [venture, updateVenture])

  const sendMessage = useCallback(
    async (content: string, voiceInput = false) => {
      if (!content.trim() || !activeVentureId || loading) return

      const userMsg: IntakeMessage = {
        role: 'user',
        content: content.trim(),
        source: 'FOUNDER',
        timestamp: new Date().toISOString(),
        voiceInput,
      }

      updateVenture(activeVentureId, {
        ideaIntake: {
          ...venture!.ideaIntake!,
          messages: [...messages, userMsg],
          dimensionCoverage: coverage,
          completed: false,
        },
      })

      setInput('')
      setLoading(true)
      setApiError(null)

      const fullConversation = [...messages, userMsg]
      let apiMessages = fullConversation.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      // Anthropic requires messages to START with user and alternate
      if (apiMessages.length > 0 && apiMessages[0].role === 'assistant') {
        apiMessages = [
          {
            role: 'user' as const,
            content: `[Session start: discussing "${venture!.name.value}"]`,
          },
          ...apiMessages,
        ]
      }

      try {
        const resp = await aiService.chat({
          systemPrompt: buildSystemBlocks(venture!),
          messages: apiMessages,
          maxTokens: VERA_INTAKE_CONFIG.maxTokens,
          tools: [VERA_INTAKE_WEB_SEARCH_TOOL],
        })

        const parsed = parseCoverageFromResponse(resp.text)
        const aiContent = parsed?.message ?? resp.text
        const newCoverage = parsed?.coverage?.length ? parsed.coverage : coverage

        const msgCitations = resp.webCitations.length
          ? resp.webCitations.map((c) => ({ url: c.url, title: c.title, excerpt: c.citedText || undefined }))
          : undefined
        const aiMsg: IntakeMessage = {
          role: 'assistant',
          content: aiContent,
          source: 'VERA',
          timestamp: new Date().toISOString(),
          citations: msgCitations,
        }
        const newVentureCitations = webCitationsToVenture(resp.webCitations)

        updateVenture(activeVentureId, {
          ideaIntake: {
            messages: [...messages, userMsg, aiMsg],
            dimensionCoverage: newCoverage,
            completed: false,
          },
          ...(newVentureCitations.length ? { citations: [...(venture!.citations ?? []), ...newVentureCitations] } : {}),
        })
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'API request failed')
        const fallbackContent =
          messages.length > 0
            ? "I had trouble processing that. Could you elaborate a bit more, or try rephrasing?"
            : "I'd love to hear about your venture. What problem are you solving, and where did the insight come from?"
        const fallbackMsg: IntakeMessage = {
          role: 'assistant',
          content: fallbackContent,
          source: 'VERA',
          timestamp: new Date().toISOString(),
        }
        updateVenture(activeVentureId, {
          ideaIntake: {
            messages: [...messages, userMsg, fallbackMsg],
            dimensionCoverage: coverage,
            completed: false,
          },
        })
      } finally {
        setLoading(false)
      }
    },
    [activeVentureId, venture, messages, coverage, updateVenture, loading]
  )
  const handleSubmit = () => {
    if (input.trim()) sendMessage(input, false)
  }

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.')
      return
    }
    type SpeechRecognitionCtor = new () => SpeechRecognition
    const SpeechRecCtor = (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition
    if (!SpeechRecCtor) return

    const recognition = new SpeechRecCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('')
      setInput((prev) => prev + transcript)
    }
    recognition.start()
  }

  if (!venture || !started) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div
          className="rounded-xl p-8 max-w-md w-full"
          style={{
            background: 'rgba(30,26,46,0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
          }}
        >
          <h2 className="font-heading font-bold text-xl mb-2">Idea Intake</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Start a live conversation with an AI Venture Lead, Vera, who will guide you through 10 dimensions to capture your venture's key details.
          </p>
          {venture && (
            <>
              <p className="text-sm font-medium mb-4">Venture: {venture.name.value}</p>
              <button
                onClick={startSession}
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Starting...' : 'Begin Interview'}
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Chat - 60% */}
      <div className="flex flex-col flex-[0.6] min-w-0">
        <div
          ref={chatRef}
          className="flex-1 overflow-auto p-6 space-y-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex animate-in fade-in duration-300',
                msg.role === 'assistant' ? 'justify-start' : 'justify-end'
              )}
            >
              <div
                className="rounded-xl px-4 py-3 max-w-[70%]"
                style={{
                  background:
                    msg.role === 'assistant'
                      ? 'rgba(124,106,247,0.1)'
                      : 'rgba(30,26,46,0.8)',
                  border: `1px solid ${msg.role === 'assistant' ? 'rgba(124,106,247,0.2)' : 'var(--border)'}`,
                }}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.citations && msg.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.citations.map((c, ci) => (
                      <a
                        key={ci}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono no-underline hover:opacity-80"
                        style={{
                          background: 'rgba(14,165,233,0.12)',
                          color: '#0EA5E9',
                          border: '1px solid rgba(14,165,233,0.3)',
                        }}
                        title={c.excerpt}
                      >
                        <span>↗</span> {c.title}
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <SourceChip source={msg.source} small />
                  <span className="font-mono text-[9px] text-[var(--text-muted)]">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(124,106,247,0.1)',
                  border: '1px solid rgba(124,106,247,0.2)',
                }}
              >
                <span className="text-sm text-[var(--text-muted)]">Preparing next question...</span>
              </div>
            </div>
          )}
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} className="mx-4 mb-2" />
        <div
          className="p-4 border-t border-[var(--border)]"
          style={{ background: 'rgba(19,17,28,0.5)' }}
        >
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your response..."
              rows={2}
              className="flex-1 px-4 py-3 rounded-lg bg-[rgba(30,26,46,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-y min-h-[60px] focus:border-[var(--accent-primary)] outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
            <button
              onClick={startVoiceInput}
              disabled={isListening}
              className="px-3 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] disabled:opacity-50"
              title="Voice input"
            >
              {isListening ? '●' : '🎤'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="px-4 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Progress Dashboard - 40% */}
      <div
        className="flex-[0.4] flex flex-col min-w-0 border-l border-[var(--border)]"
        style={{ background: 'rgba(19,17,28,0.3)' }}
      >
        <div className="p-6 shrink-0">
          <h3 className="font-heading font-semibold text-sm mb-4">Progress</h3>
        </div>
        <div
          className="flex-1 overflow-auto px-6 space-y-3 min-h-0"
          style={{ scrollbarWidth: 'thin' }}
        >
          {INTAKE_DIMENSIONS.map((dim) => {
            const cov = coverage.find((c) => c.id === dim.id)
            const status = (cov?.status ?? 'not_started') as DimensionStatus
            const color = DIMENSION_STATUS_COLORS[status]
            return (
              <div
                key={dim.id}
                className="rounded-lg p-3 cursor-pointer hover:bg-[rgba(124,106,247,0.06)] transition-colors"
                style={{ border: '1px solid var(--border)' }}
                onClick={() => setInput(`I'd like to add more on ${dim.name}. `)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="font-mono text-xs font-medium" style={{ color }}>
                    {dim.id} {dim.name}
                  </span>
                </div>
                {cov?.summary && (
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {cov.summary}
                  </p>
                )}
                {cov?.flags && cov.flags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {cov.flags.map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: 'rgba(79,156,249,0.15)',
                          color: 'var(--accent-secondary)',
                        }}
                      >
                        {formatFlagAsRecommendation(f)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="shrink-0 p-6 pt-4 border-t border-[var(--border)]">
          {(() => {
            const answeredCount = coverage.filter(
              (c) => ['complete', 'in_progress', 'issue'].includes(c.status ?? '')
            ).length
            const canContinue = answeredCount >= 7
            return (
              <>
                <p
                  className="text-xs mb-2"
                  style={{ color: canContinue ? 'var(--accent-success)' : 'var(--text-muted)' }}
                >
                  {answeredCount} of 10 sections — {canContinue ? 'ready for Scoring' : '7 needed to continue'}
                </p>
                <Link
                  to="/define/scoring"
                  className={`block w-full py-2.5 rounded-lg font-heading font-semibold text-sm text-center border-none cursor-pointer ${
                    canContinue
                      ? 'bg-[var(--accent-success)] text-white hover:opacity-90'
                      : 'bg-[rgba(124,106,247,0.2)] text-[var(--text-muted)] cursor-not-allowed pointer-events-none'
                  }`}
                >
                  Continue to Scoring →
                </Link>
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
