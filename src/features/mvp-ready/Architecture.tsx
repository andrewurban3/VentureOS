import { useState } from 'react'
import { useVentures } from '@/context/VentureContext'
import { anthropicProvider } from '@/services/ai/anthropic'
import { buildArchitectureBlocks, parseArchitectureResponse } from '@/agents/mvp-ready/architecture'
import { ApiErrorBanner } from '@/components/ApiErrorBanner'
import { SourceChip } from '@/components/SourceChip'
import { MermaidDiagram } from '@/components/MermaidDiagram'
import { createTechnicalArchitectureDocx, createTechnicalArchitectureMarkdown } from '@/services/export'
import type { TechnicalArchitecture } from '@/types/venture'

const CARD = {
  background: 'rgba(30,26,46,0.7)',
  border: '1px solid var(--border)',
}

const SECTIONS: (keyof TechnicalArchitecture['content'])[] = [
  'techStack',
  'componentDiagram',
  'integrationPoints',
  'keyDecisions',
  'risksAndOpenQuestions',
]

const SECTION_LABELS: Record<string, string> = {
  techStack: 'Tech Stack',
  componentDiagram: 'Component Diagram',
  integrationPoints: 'Integration Points',
  keyDecisions: 'Key Decisions',
  risksAndOpenQuestions: 'Risks & Open Questions',
}

const TEXT_SECTIONS = SECTIONS.filter((k) => k !== 'mermaidDiagram')

export function Architecture() {
  const { ventures, activeVentureId, updateVenture } = useVentures()
  const venture = activeVentureId ? ventures[activeVentureId] : null
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const arch = venture?.technicalArchitecture

  const handleGenerate = async () => {
    if (!venture || !activeVentureId) return
    setApiError(null)
    setLoading(true)
    try {
      const systemBlocks = await buildArchitectureBlocks(venture)
      const resp = await anthropicProvider.chat({
        systemPrompt: [
          ...systemBlocks,
          { type: 'text', text: '\n\nReturn ONLY valid JSON. No markdown fences, no extra text.' },
        ],
        messages: [{ role: 'user', content: 'Generate the technical architecture.' }],
        maxTokens: 4000,
      })
      const content = parseArchitectureResponse(resp.text)
      const now = new Date().toISOString()
      updateVenture(activeVentureId, {
        technicalArchitecture: {
          content,
          generatedAt: now,
          source: 'AI_SYNTHESIS',
        },
      })
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Failed to generate architecture')
    } finally {
      setLoading(false)
    }
  }

  const handleSectionChange = (key: keyof TechnicalArchitecture['content'], value: string) => {
    if (!arch || !activeVentureId) return
    updateVenture(activeVentureId, {
      technicalArchitecture: {
        ...arch,
        content: { ...arch.content, [key]: value },
        source: 'VL',
      },
    })
  }

  const handleExportDocx = () => {
    if (!venture || !arch) return
    createTechnicalArchitectureDocx(venture.name.value, arch).then((blob) => {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `${venture.name.value}-technical-architecture.docx`
      a.click()
      URL.revokeObjectURL(a.href)
    })
  }

  if (!venture) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="rounded-xl p-8 max-w-md text-center" style={CARD}>
          <h2 className="font-heading font-bold text-xl mb-2">Technical Architecture</h2>
          <p className="text-sm text-[var(--text-muted)]">Select a venture first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-heading font-bold text-2xl mb-1">Technical Architecture</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Tech stack, components, integrations, key decisions, and risks derived from solution and MVP features.
          </p>
        </div>

        <ApiErrorBanner message={apiError} onDismiss={() => setApiError(null)} />

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-heading font-semibold text-sm bg-[var(--accent-primary)] text-white border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : arch ? 'Regenerate' : 'Generate Architecture'}
          </button>
          {arch && (
            <>
              <button
                onClick={handleExportDocx}
                className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
              >
                Export .docx
              </button>
              <button
                onClick={() => {
                  if (!venture || !arch) return
                  createTechnicalArchitectureMarkdown(venture.name.value, arch).then((blob) => {
                    const a = document.createElement('a')
                    a.href = URL.createObjectURL(blob)
                    a.download = `${venture.name.value}-technical-architecture.md`
                    a.click()
                    URL.revokeObjectURL(a.href)
                  })
                }}
                className="px-3 py-1.5 rounded text-xs font-medium border border-[var(--border)] text-[var(--text-primary)] cursor-pointer hover:bg-[rgba(124,106,247,0.1)]"
              >
                Export for developers (.md)
              </button>
            </>
          )}
        </div>

        {arch && (
          <div className="rounded-xl p-6" style={CARD}>
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <h2 className="font-heading font-semibold text-lg">Architecture</h2>
              <SourceChip source={arch.source} />
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(arch.generatedAt).toLocaleString()}
              </span>
            </div>
            {arch.content.mermaidDiagram && (
              <div className="mb-6">
                <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
                  Architecture Diagram
                </label>
                <div className="rounded-lg p-4" style={{ background: 'rgba(20,16,36,0.5)', border: '1px solid var(--border)' }}>
                  <MermaidDiagram code={arch.content.mermaidDiagram} />
                </div>
              </div>
            )}
            {TEXT_SECTIONS.map((key) => (
              <div key={key} className="mb-5">
                <label className="block font-heading font-semibold text-sm mb-2 text-[var(--text-primary)]">
                  {SECTION_LABELS[key]}
                </label>
                <textarea
                  value={arch.content[key] as string}
                  onChange={(e) => handleSectionChange(key, e.target.value)}
                  rows={key === 'techStack' ? 2 : 4}
                  className="w-full px-3 py-2 rounded-lg bg-[rgba(20,16,36,0.5)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] outline-none text-sm resize-y"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
