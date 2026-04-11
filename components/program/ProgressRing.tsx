import React from 'react'

interface ProgressRingProps {
  value: number       // 0–100
  size?: number       // default 100
  strokeWidth?: number // default 6
  color?: string      // default 'var(--green)'
}

export default function ProgressRing({
  value,
  size = 100,
  strokeWidth = 6,
  color = 'var(--green)',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clampedValue = Math.min(100, Math.max(0, value))
  const offset = circumference * (1 - clampedValue / 100)
  const center = size / 2

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {/* Track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="var(--line)"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
      {/* Center text */}
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.2,
          fill: 'var(--green)',
        }}
      >
        {clampedValue}%
      </text>
    </svg>
  )
}
