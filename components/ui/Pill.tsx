import React from 'react'

interface PillProps {
  children: React.ReactNode
  variant?: 'gold' | 'green' | 'outline' | 'ink'
  size?: 'sm' | 'md'
}

const variantStyles: Record<NonNullable<PillProps['variant']>, React.CSSProperties> = {
  gold: {
    backgroundColor: 'var(--gold-pale)',
    color: 'var(--gold)',
    border: '1px solid var(--gold-line)',
  },
  green: {
    backgroundColor: 'var(--green-pale)',
    color: 'var(--green)',
    border: 'none',
  },
  ink: {
    backgroundColor: 'var(--ink)',
    color: '#ffffff',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--text-soft)',
    border: '1px solid var(--line-md)',
  },
}

const sizeStyles: Record<NonNullable<PillProps['size']>, React.CSSProperties> = {
  sm: { padding: '2px 8px' },
  md: { padding: '3px 10px' },
}

export default function Pill({ children, variant = 'gold', size = 'md' }: PillProps) {
  return (
    <span
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: '9999px',
        fontFamily: 'var(--font-body)',
        fontSize: '10px',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {children}
    </span>
  )
}
