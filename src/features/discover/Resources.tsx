export function Resources() {
  const cardStyle = {
    background: 'rgba(30,26,46,0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading font-bold text-2xl mb-1">Resources</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Curated external resources for opportunity discovery and research.
          </p>
        </div>

        <a
          href="https://firstround.com/review"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl p-6 hover:border-[rgba(124,106,247,0.4)] transition-colors group"
          style={cardStyle}
        >
          <div className="flex items-start gap-4">
            <div
              className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-heading font-bold text-lg"
              style={{ background: 'rgba(124,106,247,0.15)', color: 'var(--accent-primary)' }}
            >
              FR
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-semibold text-lg group-hover:text-[var(--accent-primary)] transition-colors">
                First Round Review
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                An editorially curated library of founder and operator insights. Covers company
                building, hiring, culture, product, fundraising, and scaling — drawn from
                interviews with top startup leaders.
              </p>
              <span className="inline-block mt-3 text-xs font-mono text-[var(--accent-primary)]">
                firstround.com/review →
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
