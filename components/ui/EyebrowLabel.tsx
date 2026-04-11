import React from 'react'

interface EyebrowLabelProps {
  children: React.ReactNode
  color?: 'gold' | 'green' | 'muted' | 'ink' | 'red'
  className?: string
}

const colorMap: Record<NonNullable<EyebrowLabelProps['color']>, string> = {
  gold: 'var(--gold)',
  green: 'var(--green)',
  muted: 'var(--text-muted)',
  ink: 'var(--ink)',
  red: 'var(--red)',
}

export default function EyebrowLabel({ children, color = 'muted', className = '' }: EyebrowLabelProps) {
  return (
    <p
      className={className}
      style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: colorMap[color],
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        margin: 0,
      }}
    >
      {children}
    </p>
  )
}
