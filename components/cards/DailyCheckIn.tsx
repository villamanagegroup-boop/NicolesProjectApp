'use client'

// components/cards/DailyCheckIn.tsx
// Dashboard daily check-in. Two visual states:
//
//   • Natural (collapsed): a slim, single-row card that takes almost no
//     vertical space — just the eyebrow + prompt + "Check in →". Tapping
//     anywhere on the card expands it.
//
//   • Expanded: the full mood picker — 15 moods grouped under FLOWING /
//     MOVING THROUGH / RUNNING LOW, plus a free-text "Something else"
//     field, Continue + Skip controls.
//
// Both legacy props (`compact`, `onComplete`, `onDismiss`) are preserved
// so /dashboard doesn't need to change to pick up the new behavior.
// `compact` no longer controls anything visual — every embed starts
// collapsed; the full-screen variant lives at the bottom of this file
// for callers that opt out of compact.
//
// onComplete payload:
//   - selected mood → its `value` (e.g. "aligned")
//   - custom text  → the trimmed text the user typed
//   - skip         → empty string ""

import React, { useState } from 'react'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'

interface DailyCheckInProps {
  onComplete: (mood: string) => void
  onDismiss?: () => void
  /** Kept for API compatibility — both true/false start collapsed now. */
  compact?: boolean
}

interface Mood { value: string; emoji: string; label: string }
interface MoodGroup { label: string; tint: string; moods: Mood[] }

const MOOD_GROUPS: MoodGroup[] = [
  {
    label: 'Flowing',
    tint: '#1F5C3A',
    moods: [
      { value: 'aligned',  emoji: '🌿', label: 'Aligned'  },
      { value: 'clear',    emoji: '✨', label: 'Clear'    },
      { value: 'grounded', emoji: '🌱', label: 'Grounded' },
      { value: 'hopeful',  emoji: '🌅', label: 'Hopeful'  },
      { value: 'grateful', emoji: '🤍', label: 'Grateful' },
    ],
  },
  {
    label: 'Moving through',
    tint: '#B8862E',
    moods: [
      { value: 'heavy',     emoji: '☁️',  label: 'Heavy'     },
      { value: 'tender',    emoji: '💗', label: 'Tender'    },
      { value: 'restless',  emoji: '💧', label: 'Restless'  },
      { value: 'scattered', emoji: '🍃', label: 'Scattered' },
      { value: 'numb',      emoji: '◯',  label: 'Numb'      },
    ],
  },
  {
    label: 'Running low',
    tint: '#7A1F1F',
    moods: [
      { value: 'drained',      emoji: '🔋', label: 'Drained'      },
      { value: 'overwhelmed',  emoji: '🌀', label: 'Overwhelmed'  },
      { value: 'disconnected', emoji: '🌑', label: 'Disconnected' },
      { value: 'anxious',      emoji: '⚡', label: 'Anxious'      },
      { value: 'frustrated',   emoji: '🔥', label: 'Frustrated'   },
    ],
  },
]

export default function DailyCheckIn({ onComplete, onDismiss, compact = false }: DailyCheckInProps) {
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')

  // Legacy callers pass `compact={false}` to get the fullscreen reveal.
  // Preserve that behavior — it's used by standalone landings.
  if (!compact) return <FullScreenCheckIn onComplete={onComplete} onDismiss={onDismiss} />

  const hasInput = !!selected || customText.trim().length > 0

  // ── Collapsed (natural) state ──────────────────────────────────────────
  if (!expanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(true)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(true) } }}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px',
          border: '1px solid var(--line-md)',
          borderRadius: 12,
          background: 'var(--paper)',
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#fffaf0'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--paper)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line-md)' }}
      >
        <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>✦</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 1 }}>
            <EyebrowLabel color="gold">Daily Check-In</EyebrowLabel>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>optional</span>
          </div>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13, fontWeight: 500,
            color: 'var(--ink)', margin: 0, lineHeight: 1.4,
          }}>
            How are you arriving today?
          </p>
        </div>
        <span style={{
          flexShrink: 0,
          fontSize: 12, fontWeight: 600,
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap',
        }}>
          Check in →
        </span>
        {onDismiss && (
          <button
            onClick={e => { e.stopPropagation(); onDismiss() }}
            aria-label="Dismiss check-in"
            style={{
              flexShrink: 0,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, color: 'var(--text-muted)',
              padding: '2px 4px', lineHeight: 1,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
          >
            ×
          </button>
        )}
      </div>
    )
  }

  // ── Expanded state ─────────────────────────────────────────────────────
  return (
    <div
      style={{
        border: '1px solid var(--line-md)',
        borderRadius: 12,
        padding: '20px 24px',
        background: 'var(--paper)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EyebrowLabel color="gold">Daily Check-In</EyebrowLabel>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>optional</span>
        </div>
        <button
          onClick={() => setExpanded(false)}
          aria-label="Collapse"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '4px 6px',
          }}
        >
          ⌃ Collapse
        </button>
      </div>

      <p style={{
        fontFamily: 'var(--font-display)', fontWeight: 300,
        fontSize: 18, color: 'var(--ink)',
        margin: '0 0 18px', lineHeight: 1.3,
      }}>
        How are you arriving today?
      </p>

      {MOOD_GROUPS.map(group => (
        <MoodRow
          key={group.label}
          group={group}
          selected={selected}
          onPick={v => { setSelected(v); setCustomText('') }}
        />
      ))}

      {/* Something else — free-text input */}
      <div style={{ marginTop: 18 }}>
        <p style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--text-muted)',
          margin: '0 0 8px', fontFamily: 'var(--font-body)',
        }}>
          Something else
        </p>
        <input
          type="text"
          value={customText}
          onChange={e => { setCustomText(e.target.value); if (e.target.value) setSelected(null) }}
          placeholder="Describe how you&apos;re arriving…"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid var(--line-md)',
            borderRadius: 8,
            background: '#fff',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            color: 'var(--ink)',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button
          disabled={!hasInput}
          onClick={() => onComplete(customText.trim() || selected || '')}
          style={{
            padding: '9px 18px',
            background: hasInput ? 'var(--green)' : 'var(--line)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-body)',
            cursor: hasInput ? 'pointer' : 'not-allowed',
            opacity: hasInput ? 1 : 0.55,
            transition: 'opacity 0.15s',
          }}
        >
          Continue
        </button>
        <button
          onClick={() => onComplete('')}
          style={{
            padding: '9px 16px',
            background: 'transparent',
            color: 'var(--text-soft)',
            border: '1px solid var(--line-md)',
            borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)' }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ── Mood row ─────────────────────────────────────────────────────────────

function MoodRow({
  group, selected, onPick,
}: {
  group: MoodGroup
  selected: string | null
  onPick: (value: string) => void
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: '0 0 8px', fontFamily: 'var(--font-body)',
      }}>
        {group.label}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {group.moods.map(m => {
          const isSelected = selected === m.value
          return (
            <button
              key={m.value}
              onClick={() => onPick(m.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                border: `1px solid ${isSelected ? group.tint : 'var(--line-md)'}`,
                borderRadius: 999,
                background: isSelected ? `${group.tint}14` : '#ffffff',
                color: isSelected ? group.tint : 'var(--ink)',
                fontSize: 12, fontWeight: isSelected ? 600 : 500,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.12s, border-color 0.12s, color 0.12s',
              }}
              onMouseEnter={e => {
                if (isSelected) return
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)'
              }}
              onMouseLeave={e => {
                if (isSelected) return
                ;(e.currentTarget as HTMLButtonElement).style.background = '#ffffff'
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden>{m.emoji}</span>
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Full-screen variant (kept for standalone use, e.g. first-load) ───────

function FullScreenCheckIn({ onComplete, onDismiss }: { onComplete: (m: string) => void; onDismiss?: () => void }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customText, setCustomText] = useState('')
  const hasInput = !!selected || customText.trim().length > 0

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        background: 'rgba(247,244,239,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '32px 20px',
      }}
    >
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'left' }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 16,
          color: 'var(--ink)', margin: '0 0 32px', textAlign: 'center',
          letterSpacing: '0.03em',
        }}>
          ✦ The Energy Leader
        </p>

        <div style={{ marginBottom: 10 }}>
          <EyebrowLabel color="gold">Daily Check-In</EyebrowLabel>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 30, color: 'var(--ink)',
          lineHeight: 1.2, margin: '0 0 24px',
        }}>
          How are you arriving today?
        </h1>

        {MOOD_GROUPS.map(group => (
          <MoodRow
            key={group.label}
            group={group}
            selected={selected}
            onPick={v => { setSelected(v); setCustomText('') }}
          />
        ))}

        <div style={{ marginTop: 18 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            margin: '0 0 8px', fontFamily: 'var(--font-body)',
          }}>
            Something else
          </p>
          <input
            type="text"
            value={customText}
            onChange={e => { setCustomText(e.target.value); if (e.target.value) setSelected(null) }}
            placeholder="Describe how you&apos;re arriving…"
            style={{
              width: '100%', padding: '10px 14px',
              border: '1px solid var(--line-md)', borderRadius: 8,
              background: '#fff', fontSize: 13,
              fontFamily: 'var(--font-body)', color: 'var(--ink)',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, alignItems: 'center' }}>
          <Button
            variant="green"
            size="md"
            disabled={!hasInput}
            onClick={() => { if (hasInput) onComplete(customText.trim() || selected || '') }}
          >
            Continue →
          </Button>
          <button
            onClick={() => (onDismiss ?? (() => onComplete('')))()}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: 'none',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              padding: '6px 8px',
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
