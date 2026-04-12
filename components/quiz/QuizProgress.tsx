'use client'

interface QuizProgressProps {
  current: number // 1-indexed
  total: number
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = (current / total) * 100

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${current} of ${total}`}
        style={{
          flex: 1,
          height: '2px',
          background: 'rgba(12,12,10,0.08)',
          borderRadius: '1px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: '#1f5c3a',
            borderRadius: '1px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap',
        }}
      >
        {current} / {total}
      </span>
    </div>
  )
}
