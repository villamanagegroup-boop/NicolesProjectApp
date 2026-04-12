'use client'

import Link from 'next/link'
import PathTile from '@/components/result/PathTile'

export default function QuizPathsPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        fontFamily: 'var(--font-body)',
        padding: '64px 40px',
        animation: 'fadeUp 0.3s ease forwards',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Home link */}
      <div style={{ position: 'absolute', top: '24px', left: '32px' }}>
        <Link
          href="/"
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
          }}
        >
          ← Home
        </Link>
      </div>

      <div style={{ maxWidth: '1020px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <p style={{
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--green)',
            margin: '0 0 16px',
            fontWeight: 500,
          }}>
            Your Path
          </p>
          <h1
            className="paths-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '44px',
              fontWeight: 300,
              color: 'var(--ink)',
              margin: '0 0 16px',
              lineHeight: 1.1,
            }}
          >
            Three ways to begin.
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-soft)',
            margin: 0,
            lineHeight: 1.7,
          }}>
            Every path is built around your archetype.
            <br />
            Choose the one that meets you where you are.
          </p>
        </div>

        {/* Tiles */}
        <div
          className="paths-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.08fr 1fr',
            gap: '20px',
            alignItems: 'start',
            marginBottom: '44px',
          }}
        >
          {/* OPTION 1 — Stay Aligned Daily */}
          <PathTile
            path="B"
            icon="🌿"
            title="Stay Aligned Daily"
            subtitle="Higher Self Woke App"
            price="$12/mo"
            priceNote="Cancel anytime"
            description="Daily check-ins, reflection prompts, and a way to track your growth — all built around your archetype. Consistency without pressure."
            includes={[
              'Daily check-ins',
              'Reflection prompts',
              'Growth tracking',
              'Archive & Vault access',
            ]}
            bestFor="Best if you want consistent support"
            ctaLabel="Start Daily Practice →"
            ctaHref="/signup?path=B"
          />

          {/* OPTION 2 — Fix This Now (Featured) */}
          <PathTile
            path="A"
            icon="🔥"
            title="Fix This Now"
            subtitle="Seal the Leak Program"
            price="$27"
            priceNote="One-time · Instant access"
            description="Personalized to your energy pattern. A step-by-step reset built around exactly where you are — designed for immediate shifts, not slow burns."
            includes={[
              'Personalized to your energy pattern',
              'Step-by-step reset',
              'Immediate shifts',
              '7 daily clarity cards',
              'Journal prompts + progress tracking',
            ]}
            bestFor="Best if you're tired of feeling like this"
            ctaLabel="Get the Program →"
            ctaHref="/signup?path=A"
            featured
          />

          {/* OPTION 3 — Go Deeper With Me */}
          <PathTile
            path="C"
            icon="👑"
            title="Go Deeper With Me"
            subtitle="Coaching Experience"
            price="Premium"
            priceNote="Apply to get started"
            description="Direct guidance, real-time breakthroughs, and full accountability — for when you're ready to fully shift the pattern, not just manage it."
            includes={[
              'Direct 1:1 guidance',
              'Real-time breakthroughs',
              'Full accountability',
              'Complete program access',
              'Daily clarity cards',
            ]}
            bestFor="Best if you're ready to fully shift this pattern"
            ctaLabel="Apply for Coaching →"
            ctaHref="/signup?path=C"
          />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Not ready yet?{' '}
            <a
              href="mailto:hello@clarity.com"
              aria-label="Join the waitlist"
              style={{ color: 'var(--text-soft)', textDecoration: 'underline' }}
            >
              Join the waitlist →
            </a>
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 40px' }}>
            🔒 Secure checkout via Stripe
          </p>

          <a
            href="/dashboard"
            aria-label="Enter admin portal"
            style={{
              display: 'inline-block',
              fontSize: '11px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              border: '1px solid var(--line-md)',
              borderRadius: '4px',
              padding: '8px 16px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--ink)'
              e.currentTarget.style.borderColor = 'rgba(12,12,10,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--line-md)'
            }}
          >
            Admin →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .paths-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
          }
          .paths-heading { font-size: 32px !important; }
          .path-tile { padding: 28px 24px !important; }
        }
        @media (max-width: 900px) {
          div[style*="padding: 64px 40px"] {
            padding: 48px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
