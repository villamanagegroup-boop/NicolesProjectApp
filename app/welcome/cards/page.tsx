'use client'

import Link from 'next/link'

const GREEN      = '#1f5c3a'
const GREEN_PALE = '#f4faf7'

const STEPS = [
  {
    title: 'One card, every day.',
    body: 'Each morning a new card surfaces — built around your archetype. It takes 2 minutes. The shift builds over time.',
  },
  {
    title: 'Prompts that know you.',
    body: 'Every prompt, action, and reflection is tailored to how your archetype moves through the world. No generic advice.',
  },
  {
    title: 'Track your wins.',
    body: 'Log small victories as they happen. Your journal and win tracker keep the pattern visible — so you can see how far you\'ve come.',
  },
  {
    title: 'A monthly theme ties it together.',
    body: 'Each month has a focus. Cards, prompts, and actions layer on top of it so nothing feels random.',
  },
  {
    title: 'Your 365-day commitment.',
    body: 'This is a practice, not a program. Show up for 5 minutes a day and watch what changes in a year.',
  },
]

export default function WelcomeCardsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: GREEN_PALE,
      fontFamily: 'var(--font-body)',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(31,92,58,0.15)',
          borderRadius: 16,
          padding: '40px 36px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: GREEN, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 22,
          }}>
            🌿
          </div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: GREEN, margin: '0 0 10px',
          }}>
            365 Days of Alignment
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30, fontWeight: 300,
            color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.2,
          }}>
            Payment confirmed. Your practice begins today.
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: 0,
          }}>
            You&apos;ve committed to showing up for yourself every single day.
            Here&apos;s exactly what that looks like inside the app.
          </p>
        </div>

        {/* What to expect */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(31,92,58,0.12)',
          borderRadius: 14, padding: '28px 28px',
        }}>
          <Eyebrow>What to expect</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {STEPS.map(({ title, body }, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: GREEN, color: '#fff',
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
          background: `rgba(31,92,58,0.06)`,
          border: `1px solid rgba(31,92,58,0.15)`,
          borderLeft: `3px solid ${GREEN}`,
          borderRadius: 10, padding: '16px 20px',
        }}>
          <p style={{ fontSize: 13, color: GREEN, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
            📅 Your subscription renews monthly. Cancel anytime from settings — no hoops.
          </p>
        </div>

        {/* CTA — into the portal */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <Link href="/cards" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              background: GREEN, color: '#fff',
              padding: '15px 32px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.01em',
            }}>
              Open today&apos;s card →
            </button>
          </Link>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Or jump to your{' '}
            <Link href="/dashboard" style={{ color: GREEN, textDecoration: 'underline' }}>dashboard →</Link>
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Haven&apos;t taken the archetype quiz yet?{' '}
            <Link href="/quiz/standalone" style={{ color: GREEN, textDecoration: 'underline' }}>
              Take it now →
            </Link>
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
