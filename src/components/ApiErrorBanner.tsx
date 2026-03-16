interface ApiErrorBannerProps {
  message: string | null
  onDismiss?: () => void
  className?: string
}

export function ApiErrorBanner({ message, onDismiss, className = '' }: ApiErrorBannerProps) {
  if (!message) return null

  return (
    <div
      className={`px-4 py-3 rounded-lg text-sm font-mono flex items-center justify-between gap-3 ${className}`}
      style={{
        background: 'rgba(239,68,68,0.15)',
        color: '#EF4444',
        border: '1px solid rgba(239,68,68,0.3)',
      }}
    >
      <span className="flex-1 min-w-0 truncate">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 px-2 py-1 rounded text-xs hover:bg-[rgba(239,68,68,0.2)]"
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      )}
    </div>
  )
}
