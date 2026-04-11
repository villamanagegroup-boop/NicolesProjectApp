'use client'
import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'outline' | 'ghost' | 'gold' | 'green'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--ink)',
    color: '#ffffff',
    border: 'none',
  },
  gold: {
    backgroundColor: 'var(--gold)',
    color: '#ffffff',
    border: 'none',
  },
  green: {
    backgroundColor: 'var(--green)',
    color: '#ffffff',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--ink)',
    border: '1px solid var(--line-md)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-soft)',
    border: 'none',
  },
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '12px' },
  md: { padding: '8px 16px', fontSize: '14px' },
  lg: { padding: '12px 24px', fontSize: '16px' },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: '8px',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: fullWidth ? '100%' : undefined,
        transition: 'opacity 0.15s ease, background-color 0.15s ease',
      }}
    >
      {children}
    </button>
  )
}
