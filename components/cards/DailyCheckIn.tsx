'use client'
import React, { useState } from 'react'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'

interface DailyCheckInProps {
  onComplete: (mood: string) => void
}

const moods = [
  { value: 'aligned',      emoji: '🌿', label: 'Aligned',      descriptor: 'I feel like myself today' },
  { value: 'clear',        emoji: '✨', label: 'Clear',         descriptor: 'My mind feels open and focused' },
  { value: 'drained',      emoji: '🌑', label: 'Drained',       descriptor: "I'm running low but I showed up" },
  { value: 'overwhelmed',  emoji: '🌊', label: 'Overwhelmed',   descriptor: "There's a lot moving right now" },
  { value: 'disconnected', emoji: '🪨', label: 'Disconnected',  descriptor: 'I feel distant from myself' },
]

export default function DailyCheckIn({ onComplete }: DailyCheckInProps) {
  const [selected, setSelected] = useState<string | null>(null)

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
        {/* Wordmark */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '16px',
            color: 'var(--ink)',
            marginBottom: '48px',
            letterSpacing: '0.03em',
          }}
        >
          ✦ Clarity
        </p>

        {/* Eyebrow */}
        <div style={{ marginBottom: '16px' }}>
          <EyebrowLabel color="gold">Daily Check-In</EyebrowLabel>
        </div>

        {/* Question */}
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

        {/* Subtext */}
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

        {/* Mood options */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
          }}
        >
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
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--paper2)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ffffff'
                  }
                }}
              >
                {/* Emoji */}
                <span style={{ fontSize: '24px', flexShrink: 0 }}>{mood.emoji}</span>

                {/* Text */}
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: isSelected ? 'var(--gold)' : 'var(--ink)',
                      margin: 0,
                    }}
                  >
                    {mood.label}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: isSelected ? 'var(--gold)' : 'var(--text-soft)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {mood.descriptor}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Continue button */}
        <div style={{ marginTop: '32px', width: '100%', maxWidth: '320px' }}>
          <Button
            variant="green"
            size="md"
            fullWidth
            disabled={!selected}
            onClick={() => {
              if (selected) onComplete(selected)
            }}
          >
            Continue to Today&apos;s Card →
          </Button>
        </div>

        {/* Skip link */}
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
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLParagraphElement).style.color = 'var(--text-soft)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLParagraphElement).style.color = 'var(--text-muted)'
          }}
        >
          Skip for now →
        </p>
      </div>
    </div>
  )
}
