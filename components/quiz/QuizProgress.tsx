'use client'

interface QuizProgressProps {
  current: number // 1-indexed
  total: number
}

export default function QuizProgress({ current, total }: QuizProgressProps) {
  const pct = ((current - 1) / total) * 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 200,
          height: 2,
          backgroundColor: 'var(--line)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: 'var(--green)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-body)',
          color: 'var(--text-muted)',
          letterSpacing: '0.02em',
        }}
      >
        Question {current} of {total}
      </span>
    </div>
  )
}
