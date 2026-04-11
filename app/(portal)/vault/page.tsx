'use client'
import React from 'react'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'

export default function VaultPage() {
  const { vaultCards } = useApp()

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <EyebrowLabel color="muted">Long-Term Collection</EyebrowLabel>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 300,
            color: 'var(--ink)',
            marginTop: '4px',
            marginBottom: '8px',
          }}
        >
          The Vault
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', margin: 0, fontFamily: 'var(--font-body)' }}>
          Insights from your earliest days — the foundation of who you are becoming.
        </p>
      </div>

      {/* Empty state */}
      {vaultCards.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80, paddingBottom: 80 }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontStyle: 'italic',
              color: 'var(--text-muted)',
            }}
          >
            Your vault fills after Day 30.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Keep showing up — your earliest cards will be preserved here.
          </p>
        </div>
      ) : (
        /* Vault card list */
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {vaultCards.map((card) => (
            <VaultRow key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

interface VaultRowProps {
  card: {
    id: string
    dayNumber: number
    theme: string
    title: string
  }
}

function VaultRow({ card }: VaultRowProps) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        paddingLeft: hovered ? '6px' : '4px',
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingRight: '4px',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
        transition: 'padding-left 0.15s ease',
      }}
    >
      {/* Day number */}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '48px',
          fontWeight: 300,
          color: 'rgba(var(--gold-rgb, 184, 148, 83), 0.6)',
          width: '60px',
          flexShrink: 0,
          lineHeight: 1,
          display: 'block',
        }}
      >
        <span style={{ color: 'var(--gold)', opacity: 0.6 }}>{card.dayNumber}</span>
      </span>

      {/* Middle content */}
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            margin: 0,
          }}
        >
          {card.theme}
        </p>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--ink)',
            fontFamily: 'var(--font-body)',
            margin: '4px 0 0 0',
          }}
        >
          {card.title}
        </p>
      </div>

      {/* Arrow */}
      <span style={{ color: 'var(--text-soft)', fontSize: '14px' }}>→</span>
    </div>
  )
}
