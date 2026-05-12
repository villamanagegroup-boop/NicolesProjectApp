'use client'

import Link from 'next/link'
import PathTile from '@/components/result/PathTile'
import ComparisonChart from '@/components/result/ComparisonChart'
import { PATHS, PATH_ORDER } from '@/data/paths'

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

      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <p style={{
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--green)',
            margin: '0 0 16px',
            fontWeight: 600,
          }}>
            ✦ Pick your path
          </p>
          <h1
            className="paths-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              fontWeight: 300,
              color: 'var(--ink)',
              margin: '0 0 18px',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            Three ways in.
            <br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>One that&apos;s yours.</em>
          </h1>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-soft)',
            margin: '0 auto',
            lineHeight: 1.7,
            maxWidth: 540,
          }}>
            Every path is built around your archetype. Pick the one that meets you where you are —
            you can always upgrade later.
          </p>
        </div>

        {/* Tiles */}
        <div
          className="paths-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.1fr 1fr',
            gap: '22px',
            alignItems: 'stretch',
            marginBottom: '64px',
          }}
        >
          {PATH_ORDER.map((id) => {
            const def = PATHS[id]
            return <PathTile key={id} def={def} featured={!!def.recommended} />
          })}
        </div>

        {/* Comparison chart */}
        <ComparisonChart />

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            🔒 Secure checkout · Stripe · Cancel anytime on monthly plans
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 40px' }}>
            Not ready yet?{' '}
            <a
              href="mailto:nicole@theenergyleader.com"
              aria-label="Join the waitlist"
              style={{ color: 'var(--text-soft)', textDecoration: 'underline' }}
            >
              Join the waitlist →
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 960px) {
          .paths-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px;
            margin-left: auto;
            margin-right: auto;
          }
          .paths-heading { font-size: 36px !important; }
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
