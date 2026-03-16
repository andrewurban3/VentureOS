import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#7C6AF7',
    primaryTextColor: '#E5E2F0',
    primaryBorderColor: '#7C6AF7',
    lineColor: '#8B87A8',
    secondaryColor: 'rgba(124,106,247,0.2)',
    tertiaryColor: 'rgba(30,26,46,0.8)',
  },
})

interface MermaidDiagramProps {
  code: string
  className?: string
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code.trim() || !containerRef.current) return
    setError(null)
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
    containerRef.current.innerHTML = ''
    const pre = document.createElement('pre')
    pre.className = 'mermaid'
    pre.id = id
    pre.textContent = code
    containerRef.current.appendChild(pre)
    mermaid
      .run({ nodes: [pre], suppressErrors: false })
      .then(() => {})
      .catch((e) => {
        setError(e.message ?? 'Failed to render diagram')
      })
  }, [code])

  if (error) {
    return (
      <div
        className={`rounded-lg p-4 text-sm ${className ?? ''}`}
        style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#EF4444',
        }}
      >
        <span className="font-medium">Diagram error:</span> {error}
        <pre className="mt-2 text-xs overflow-auto max-h-32 text-[var(--text-muted)]">{code}</pre>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`mermaid-container overflow-auto ${className ?? ''}`} style={{ minHeight: 120 }} />
  )
}
