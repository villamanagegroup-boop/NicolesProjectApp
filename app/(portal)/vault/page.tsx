'use client'
import React from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'

const VAULT_OPENS_DAY = 30

export default function VaultPage() {
  const { vaultCards, dayNumber } = useApp()

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
        <VaultLockedState dayNumber={dayNumber} />
      ) : (
        <>
          {/* Stats summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12, marginBottom: 24,
          }}>
            <StatTile value={vaultCards.length} label="Cards preserved" accent="var(--gold)" />
            <StatTile value={vaultCards[vaultCards.length - 1]?.dayNumber ?? 1} label="Earliest day" accent="var(--text-soft)" />
            <StatTile value={`Day ${dayNumber}`} label="Where you are now" accent="var(--green)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {vaultCards.map((card) => (
              <VaultRow key={card.id} card={card} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

interface StatTileProps {
  value: string | number
  label: string
  accent: string
}

function StatTile({ value, label, accent }: StatTileProps) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line)',
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: accent }}>{value}</div>
      <div style={{
        fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        color: 'var(--text-muted)', marginTop: 6, fontFamily: 'var(--font-body)',
      }}>{label}</div>
    </div>
  )
}

function VaultLockedState({ dayNumber }: { dayNumber: number }) {
  const daysToGo = Math.max(0, VAULT_OPENS_DAY - dayNumber)
  const progressPct = Math.min(100, Math.round((dayNumber / VAULT_OPENS_DAY) * 100))

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--paper2) 0%, #fff 100%)',
      border: '1px solid var(--line)',
      borderRadius: 16, padding: '40px 32px',
      textAlign: 'center',
    }}>
      {/* Progress ring */}
      <div style={{
        width: 120, height: 120, margin: '0 auto 24px',
        position: 'relative',
      }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke="var(--gold)" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${(progressPct / 100) * 326.7} 326.7`}
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: 'var(--font-display)', color: 'var(--ink)', lineHeight: 1 }}>
            {dayNumber}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-muted)', marginTop: 4,
          }}>
            of {VAULT_OPENS_DAY}
          </div>
        </div>
      </div>

      {/* Headline */}
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 22, fontStyle: 'italic', fontWeight: 300,
        color: 'var(--ink)',
        margin: '0 0 8px',
      }}>
        {daysToGo === 0 ? 'Your vault opens today.' : `${daysToGo} ${daysToGo === 1 ? 'day' : 'days'} until your vault opens.`}
      </h2>
      <p style={{
        fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6,
        margin: '0 auto', maxWidth: 380,
      }}>
        On Day {VAULT_OPENS_DAY}, the cards from your earliest weeks will be preserved
        here — a record of where you started, ready to revisit any time.
      </p>

      {/* Preview tiles — what's coming */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 10, marginTop: 28,
        maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
      }}>
        {[
          { day: 1, theme: 'The first arrival' },
          { day: 7, theme: 'A week in' },
          { day: 14, theme: 'Mid-stretch' },
          { day: 21, theme: 'The shift begins' },
        ].map(t => (
          <div key={t.day} style={{
            background: '#fff', border: '1px dashed var(--line-md)',
            borderRadius: 10, padding: '14px 10px',
            opacity: 0.7,
          }}>
            <div style={{
              fontSize: 18, fontWeight: 300,
              fontFamily: 'var(--font-display)', color: 'var(--gold)',
              opacity: dayNumber >= t.day ? 1 : 0.4,
            }}>
              Day {t.day}
            </div>
            <div style={{
              fontSize: 9, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text-muted)', marginTop: 6,
            }}>
              {dayNumber >= t.day ? t.theme : 'Coming'}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link href="/card" style={{
        display: 'inline-block', marginTop: 28,
        padding: '10px 20px', borderRadius: 999,
        background: 'var(--ink)', color: '#fff',
        fontSize: 12, fontWeight: 600,
        textDecoration: 'none', fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
      }}>
        Today&apos;s card →
      </Link>
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
