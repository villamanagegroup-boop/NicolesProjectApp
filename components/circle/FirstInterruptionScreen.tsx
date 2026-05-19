'use client'

// components/circle/FirstInterruptionScreen.tsx
// Full-screen celebration shown when the member completes their very first
// weekly action. This is a one-shot moment — server stamps
// first_action_completed_at the moment it fires, so subsequent action
// completions get the standard ActionCompleteScreen instead.
//
// CTA deep-links to /circle/coach with the composer pre-seeded so the
// member doesn't stare at a blank textarea after the emotional beat.

import { useEffect } from 'react'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'
const GREEN       = '#1F5C3A'

interface Props {
  open: boolean
  onTellNicole: () => void
  onClose: () => void
}

export default function FirstInterruptionScreen({ open, onTellNicole, onClose }: Props) {
  // Trap Escape so users can dismiss without scrolling for the close button.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 950,
      background: `linear-gradient(180deg, ${ORANGE_PALE} 0%, #fff 65%)`,
      overflowY: 'auto',
      padding: '60px 20px',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
        {/* Glyph */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: GREEN, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, fontFamily: 'var(--font-display)', lineHeight: 1,
          marginBottom: 24, boxShadow: `0 8px 24px ${GREEN}33`,
        }}>
          ✦
        </div>

        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: ORANGE, margin: '0 0 12px',
        }}>
          A moment that matters
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 300,
          color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1,
          margin: '0 0 22px',
        }}>
          Your first interruption.
        </h1>

        <p style={{
          fontSize: 16, color: 'var(--text-soft)', lineHeight: 1.75,
          margin: '0 0 36px', maxWidth: 460, marginLeft: 'auto', marginRight: 'auto',
        }}>
          You just did something different than you have ever done before.
          <br />
          That is not small. That is everything.
          <br /><br />
          Tell Nicole what just happened.
        </p>

        <button
          onClick={onTellNicole}
          style={{
            background: ORANGE, color: '#fff',
            padding: '14px 28px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'block', width: '100%', maxWidth: 340,
            margin: '0 auto 12px',
            boxShadow: `0 6px 18px ${ORANGE}44`,
          }}
        >
          Tell Nicole →
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none',
            color: 'var(--text-muted)', fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            padding: '8px 12px',
          }}
        >
          Not yet
        </button>
      </div>
    </div>
  )
}
