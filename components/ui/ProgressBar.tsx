import React from 'react'

interface ProgressBarProps {
  value: number
  height?: number
  color?: 'green' | 'gold'
  background?: string
  className?: string
  animated?: boolean
}

const colorMap: Record<NonNullable<ProgressBarProps['color']>, string> = {
  green: 'var(--green)',
  gold: 'var(--gold)',
}

export default function ProgressBar({
  value,
  height = 3,
  color = 'green',
  background,
  className = '',
  animated = true,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: background ?? 'var(--line)',
        borderRadius: '9999px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${clampedValue}%`,
          backgroundColor: colorMap[color],
          borderRadius: '9999px',
          transition: animated ? 'width 0.4s ease' : undefined,
        }}
      />
    </div>
  )
}
