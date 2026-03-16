import { SOURCE_COLORS, SOURCE_LABELS } from '@/constants/sourceTags'
import type { SourceTag } from '@/types'
import { cn } from '@/lib/utils'

interface SourceChipProps {
  source: SourceTag
  subSource?: string | null
  small?: boolean
  className?: string
  /** Tooltip shown on hover (e.g. citation, source name) */
  title?: string
}

export function SourceChip({ source, subSource, small = false, className, title }: SourceChipProps) {
  const color = SOURCE_COLORS[source] ?? '#8B87A8'
  const label = SOURCE_LABELS[source] ?? source
  const displayLabel = subSource ? `${label} · ${subSource}` : label

  return (
    <span
      title={title}
      className={cn(
        'font-mono inline-flex items-center rounded-full whitespace-nowrap',
        className
      )}
      style={{
        fontSize: small ? '9px' : '10px',
        padding: small ? '1px 6px' : '2px 8px',
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        letterSpacing: '0.02em',
        fontWeight: 500,
      }}
    >
      {displayLabel}
    </span>
  )
}
