'use client'

import Link from 'next/link'

const INK      = '#0c0c0a'
const INK_PALE = '#f8f8f7'

const STEPS = [
  {
    title: 'Complete your intake.',
    body: 'A short onboarding survey tells us your archetype, your 90-day focus, and your preferred coaching style. Takes 10 minutes. Shapes everything.',
  },
  {
    title: 'Meet your accountability partner.',
    body: 'You\'ll be matched with one other Circle member whose archetype complements yours. You check in on Wednesdays — a simple prompted exchange.',
  },
  {
    title: 'Weekly teachings drop every Monday.',
    body: 'Each week a new teaching, journal prompt, and action step arrive — all tailored to your archetype and the cohort\'s shared theme.',
  },
  {
    title: 'Live group calls every other week.',
    body: 'Six calls across the 90 days. Direct access to Nicole, Q&A, and hot-seat coaching. Replays are posted within 24 hours.',
  },
  {
    title: 'Community wins feed on Fridays.',
    body: 'Every member posts one win per week — big or small. The practice of noticing is part of the work.',
  },
  {
    title: 'Re-pair option at Day 30.',
    body: 'If the accountability match isn\'t working, request a new pairing at Day 30. No explanation required.',
  },
]

export default function WelcomeTheCirclePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: INK_PALE,
      fontFamily: 'var(--font-body)',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero */}
        <div style={{
          background: '#fff',
          border: `1px solid rgba(12,12,10,0.12)`,
          borderRadius: 16,
          padding: '40px 36px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: INK, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 22,
          }}>
            👑
          </div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: INK, margin: '0 0 10px',
            opacity: 0.7,
          }}>
            The Circle — 90-Day Intensive
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30, fontWeight: 300,
            color: 'var(--ink)', margin: '0 0 14px', lineHeight: 1.2,
          }}>
            Payment confirmed. Welcome to the inner work.
          </h1>
          <p style={{
            fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: 0,
          }}>
            You&apos;ve committed to the deepest level of this work — identity-level shift with direct access to Nicole
            and a community of people doing the same.
            Here&apos;s everything you need to know before your cohort begins.
          </p>
        </div>

        {/* What to expect */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(12,12,10,0.08)',
          borderRadius: 14, padding: '28px 28px',
        }}>
          <Eyebrow>How the next 90 days work</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
            {STEPS.map(({ title, body }, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: INK, color: '#fff',
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

        {/* What to bring */}
        <div style={{
          background: '#fff',
          border: '1px solid rgba(12,12,10,0.08)',
          borderRadius: 14, padding: '24px 28px',
        }}>
          <Eyebrow>Come ready with</Eyebrow>
          <ul style={{ margin: '14px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Your 90-day focus in one sentence',
              'One pattern you\'re ready to stop repeating',
              'Honesty — this work doesn\'t do well with performance',
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>
                <span style={{ color: INK, fontWeight: 700, flexShrink: 0 }}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment note */}
        <div style={{
          background: `rgba(12,12,10,0.04)`,
          border: `1px solid rgba(12,12,10,0.1)`,
          borderLeft: `3px solid ${INK}`,
          borderRadius: 10, padding: '16px 20px',
        }}>
          <p style={{ fontSize: 13, color: INK, margin: 0, lineHeight: 1.6, fontWeight: 500, opacity: 0.75 }}>
            💳 If you chose the 3-payment plan, your next payment processes automatically in 30 days.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <Link href="/signup?path=C" style={{ textDecoration: 'none' }}>
            <button style={{
              width: '100%',
              background: INK, color: '#fff',
              padding: '15px 32px', borderRadius: 12,
              fontSize: 15, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.01em',
            }}>
              Create your account &amp; enter The Circle →
            </button>
          </Link>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: INK, textDecoration: 'underline', opacity: 0.7 }}>Log in →</Link>
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
