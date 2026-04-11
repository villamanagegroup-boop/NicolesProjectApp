interface QuoteStripProps {
  text: string
  source: string
}

export default function QuoteStrip({ text, source }: QuoteStripProps) {
  return (
    <div
      style={{
        width: '100%',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '2rem',
        backgroundColor: 'var(--gold-pale)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
      }}
    >
      {/* Gold accent bar */}
      <div style={{ width: '3px', backgroundColor: 'var(--gold)', flexShrink: 0 }} />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          padding: '20px 24px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '19px',
            fontWeight: 300,
            color: 'var(--ink)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          &ldquo;{text}&rdquo;
        </p>
        <p
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            marginTop: '8px',
            marginBottom: 0,
            fontFamily: 'var(--font-body)',
          }}
        >
          {source}
        </p>

        {/* Decorative large quote mark */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: '96px',
            color: 'rgba(184,146,42,0.15)',
            lineHeight: 1,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          ❝
        </span>
      </div>
    </div>
  )
}
