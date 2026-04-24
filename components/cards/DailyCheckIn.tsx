'use client'
import React, { useState } from 'react'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'

interface DailyCheckInProps {
  onComplete: (mood: string) => void
  onDismiss?: () => void
  compact?: boolean
}

const moods = [
  { value: 'aligned',      emoji: '🌿', label: 'Aligned',      descriptor: 'I feel like myself today' },
  { value: 'clear',        emoji: '✨', label: 'Clear',         descriptor: 'My mind feels open and focused' },
  { value: 'drained',      emoji: '🌑', label: 'Drained',       descriptor: "I'm running low but I showed up" },
  { value: 'overwhelmed',  emoji: '🌊', label: 'Overwhelmed',   descriptor: "There's a lot moving right now" },
  { value: 'disconnected', emoji: '🪨', label: 'Disconnected',  descriptor: 'I feel distant from myself' },
]

export default function DailyCheckIn({ onComplete, onDismiss, compact = false }: DailyCheckInProps) {
  const [selected, setSelected] = useState<string | null>(null)

  if (compact) {
    return (
      <div
        style={{
          border: '1px solid var(--line-md)',
          borderRadius: '12px',
          padding: '20px 24px',
          background: 'var(--paper)',
          position: 'relative',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <EyebrowLabel color="gold">Daily Check-In</EyebrowLabel>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>optional</span>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: 'var(--text-muted)',
                lineHeight: 1,
                padding: '2px 4px',
              }}
              aria-label="Dismiss check-in"
            >
              ×
            </button>
          )}
        </div>

        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '18px',
          color: 'var(--ink)',
          margin: '0 0 16px 0',
          lineHeight: 1.3,
        }}>
          How are you arriving today?
        </p>

        {/* Mood options — horizontal scroll row */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {moods.map((mood) => {
            const isSelected = selected === mood.value
            return (
              <button
                key={mood.value}
                onClick={() => setSelected(mood.value)}
                title={mood.descriptor}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  border: isSelected ? '1.5px solid var(--gold)' : '1px solid var(--line-md)',
                  borderRadius: '24px',
                  backgroundColor: isSelected ? 'var(--gold-pale)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background-color 0.12s ease, border-color 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--paper2)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff'
                }}
              >
                <span style={{ fontSize: '16px' }}>{mood.emoji}</span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? 'var(--gold)' : 'var(--ink)',
                }}>
                  {mood.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Action row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
          <button
            disabled={!selected}
            onClick={() => { if (selected) onComplete(selected) }}
            style={{
              padding: '8px 18px',
              background: selected ? 'var(--green)' : 'var(--line)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              cursor: selected ? 'pointer' : 'not-allowed',
              opacity: selected ? 1 : 0.5,
              transition: 'opacity 0.15s ease',
            }}
          >
            Confirm →
          </button>
          <span
            onClick={() => onComplete('')}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-soft)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-muted)' }}
          >
            Skip for now
          </span>
        </div>
      </div>
    )
  }

  // Full-screen version (kept for potential standalone use)
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(247,244,239,0.97)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
          padding: '0 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            color: 'var(--ink)',
            marginBottom: '48px',
            letterSpacing: '0.03em',
          }}
        >
          ✦ Seal Your Leak
        </p>

        <div style={{ marginBottom: '16px' }}>
          <EyebrowLabel color="gold">Daily Check-In</EyebrowLabel>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: '36px',
            color: 'var(--ink)',
            lineHeight: 1.2,
            margin: '0 0 12px 0',
          }}
        >
          How are you arriving today?
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--text-soft)',
            margin: '0 0 40px 0',
          }}
        >
          There is no wrong answer — just notice.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
          {moods.map((mood) => {
            const isSelected = selected === mood.value
            return (
              <button
                key={mood.value}
                onClick={() => setSelected(mood.value)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '16px 24px',
                  border: isSelected ? '1px solid var(--gold)' : '1px solid var(--line-md)',
                  borderRadius: '12px',
                  backgroundColor: isSelected ? 'var(--gold-pale)' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, border-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--paper2)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff'
                }}
              >
                <span style={{ fontSize: '24px', flexShrink: 0 }}>{mood.emoji}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: 500, color: isSelected ? 'var(--gold)' : 'var(--ink)', margin: 0 }}>
                    {mood.label}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: isSelected ? 'var(--gold)' : 'var(--text-soft)', margin: '2px 0 0 0' }}>
                    {mood.descriptor}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: '32px', width: '100%', maxWidth: '320px' }}>
          <Button
            variant="green"
            size="md"
            fullWidth
            disabled={!selected}
            onClick={() => { if (selected) onComplete(selected) }}
          >
            Continue to Today&apos;s Card →
          </Button>
        </div>

        <p
          onClick={() => onComplete('')}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '16px',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLParagraphElement).style.color = 'var(--text-soft)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLParagraphElement).style.color = 'var(--text-muted)' }}
        >
          Skip for now →
        </p>
      </div>
    </div>
  )
}
