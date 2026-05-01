'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { supabaseClient } from '@/lib/supabase/client'

const PROGRAM_CONTENT: Record<string, {
  icon: string
  accent: string
  heading: string
  body: string
  steps: string[]
  cta: string
}> = {
  B: {
    icon: '🌿',
    accent: '#1f5c3a',
    heading: "Welcome to 365 Days of Alignment.",
    body: "Your daily practice starts today. Every morning a new card surfaces — built around your archetype. Two minutes a day. A year of shifts.",
    steps: [
      'Your first card is waiting on the dashboard',
      'Journal your reflections as you go',
      'Log wins — small ones count',
      'A new card unlocks every day',
    ],
    cta: 'Start My Practice →',
  },
  A: {
    icon: '🔥',
    accent: '#b8922a',
    heading: "Welcome to Seal the Leak.",
    body: "You're here because you're ready to go to the root. Your 7-day reset starts now — daily prompts, actions, and shifts built around your archetype.",
    steps: [
      'Head to The Work to begin Day 1',
      'One session per day — takes 10–15 minutes',
      'Days 6 & 7 unlock your first Alignment cards',
      'After Day 7 you choose whether to keep the daily practice',
    ],
    cta: 'Begin Day 1 →',
  },
  C: {
    icon: '👑',
    accent: '#0c0c0a',
    heading: "Welcome to The Circle.",
    body: "90 days of identity-level work with direct access to Nicole. Your cohort intake is the first step — it shapes your experience for the full program.",
    steps: [
      'Complete your cohort intake first',
      "You'll be matched with an accountability partner",
      'Weekly teachings drop every Monday',
      'Live calls every other week — replays posted',
    ],
    cta: 'Complete Intake →',
  },
}

export default function WelcomeModal() {
  const { user, authUser, refreshUser } = useApp()
  const [dismissing, setDismissing] = useState(false)

  if (user.hasSeenWelcome || !user.selectedPath) return null

  const content = PROGRAM_CONTENT[user.selectedPath]
  if (!content) return null

  const firstName = user.name?.split(' ')[0] || 'there'

  async function dismiss() {
    setDismissing(true)
    if (authUser) {
      await supabaseClient.from('users')
        .update({ has_seen_welcome: true })
        .eq('id', authUser.id)
      await refreshUser()
    }
  }

  const DEST: Record<string, string> = { A: '/program', B: '/dashboard', C: '/circle/intake' }
  const dest = DEST[user.selectedPath] ?? '/dashboard'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(12,12,10,0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        maxWidth: 520,
        width: '100%',
        padding: '44px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        boxShadow: '0 24px 80px rgba(12,12,10,0.18)',
        animation: 'modalIn 0.25s ease forwards',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: content.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          {content.icon}
        </div>

        {/* Heading */}
        <div>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: content.accent,
            margin: '0 0 8px', fontFamily: 'var(--font-body)',
          }}>
            Hey {firstName} —
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26, fontWeight: 300,
            color: 'var(--ink)', margin: '0 0 10px', lineHeight: 1.2,
          }}>
            {content.heading}
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-soft)',
            lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)',
          }}>
            {content.body}
          </p>
        </div>

        {/* Steps */}
        <div style={{
          background: `${content.accent}08`,
          border: `1px solid ${content.accent}18`,
          borderRadius: 10, padding: '16px 18px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {content.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                background: content.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
              }}>{i + 1}</div>
              <p style={{
                fontSize: 13, color: 'var(--ink)',
                margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)',
              }}>{step}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <a
            href={dest}
            onClick={dismiss}
            style={{
              display: 'block',
              padding: '13px',
              background: content.accent,
              color: '#fff',
              borderRadius: 10,
              textAlign: 'center',
              fontSize: 14, fontWeight: 600,
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              cursor: dismissing ? 'not-allowed' : 'pointer',
              opacity: dismissing ? 0.7 : 1,
            }}
          >
            {content.cta}
          </a>
          <button
            onClick={dismiss}
            disabled={dismissing}
            style={{
              background: 'transparent', border: 'none',
              fontSize: 12, color: 'var(--text-muted)',
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              padding: '4px',
            }}
          >
            I&apos;ll explore on my own
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
