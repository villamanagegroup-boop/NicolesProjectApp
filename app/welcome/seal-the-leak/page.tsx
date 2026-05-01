'use client'

import Link from 'next/link'

const GOLD      = '#b8922a'
const GOLD_PALE = '#fffdf7'

const STEPS = [
  {
    title: 'Day 1 — Identify your leak.',
    body: 'Your archetype reveals the specific pattern draining your energy. You\'ll name it, understand it, and stop pretending it\'s not there.',
  },
  {
    title: 'Days 2–4 — Daily prompt + action + shift.',
    body: 'Three layers every day. A reflection prompt to see the pattern. An action to interrupt it. A shift — a reframe that rewires how you respond.',
  },
  {
    title: 'Days 5–6 — Go deeper.',
    body: 'You\'ll work through the root. Not the symptom. The prompts get more direct here — this is where most people have the breakthrough.',
  },
  {
    title: 'Day 7 — Seal it.',
    body: 'Your final day is integration. You\'ll write your own reset declaration and set the intention you carry forward.',
  },
  {
    title: 'Bonus — 30 days of 365 Alignment.',
    body: 'After the 7-day reset, you unlock 30 days of the daily cards app. Keep the momentum going with prompts built around your archetype.',
  },
]

export default function WelcomeSealTheLeak() {
  return (
    <div style={{
      minHeight: '100vh',
      background: GOLD_PALE,
      fontFamily: 'var(--font-body)',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(184,146,42,0.2)',
          borderRadius: 16,
          padding: '40px 36px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: GOLD, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 22,
          }}>
            🔥
          </div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: GOLD, margin: '0 0 10px',
          }}>
            Seal the Leak — 7-Day Reset
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30, fontWeight: 300,
            color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.2,
          }}>
            Payment confirmed. The work starts now.
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: 0,
          }}>
            You&apos;ve chosen the path most people avoid — going directly to the root.
            Here&apos;s your 7-day roadmap so you know exactly what&apos;s coming.
          </p>
        </div>

        {/* Day-by-day breakdown */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(184,146,42,0.15)',
          borderRadius: 14, padding: '28px 28px',
        }}>
          <Eyebrow>Your 7-day roadmap</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {STEPS.map(({ title, body }, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: GOLD, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 3px' }}>{title}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.65, margin: 0 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminder */}
        <div style={{
          background: `rgba(184,146,42,0.07)`,
          border: `1px solid rgba(184,146,42,0.2)`,
          borderLeft: `3px solid ${GOLD}`,
          borderRadius: 10, padding: '16px 20px',
        }}>
          <p style={{ fontSize: 13, color: GOLD, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
            💡 One-time purchase — you keep lifetime access to the 7-day program plus your 30-day card trial.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <Link href="/signup?path=A" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              background: GOLD, color: '#fff',
              padding: '15px 32px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.01em',
            }}>
              Create your account &amp; start Day 1 →
            </button>
          </Link>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: GOLD, textDecoration: 'underline' }}>Log in →</Link>
          </p>
        </div>

      </div>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}>
      {children}
    </span>
  )
}
