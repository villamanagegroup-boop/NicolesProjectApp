'use client'

// components/legal/LegalPage.tsx
// Shared layout for /privacy and /terms. Matches the landing wordmark and
// uses the same design tokens so the legal pages don't feel grafted on.

import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  title: string
  lastUpdated: string
  children: ReactNode
}

export default function LegalPage({ title, lastUpdated, children }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#fdfcfa',
      fontFamily: 'var(--font-body)',
      color: 'var(--ink)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Top nav — matches landing */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--card)',
      }}>
        <Link href="/" style={{
          fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400,
          color: 'var(--ink)', textDecoration: 'none',
        }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> The Energy Leader
        </Link>
        <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 13 }}>
          <Link href="/login" style={{ color: 'var(--text-soft)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/quiz" style={{
            background: 'var(--ink)', color: '#fff',
            padding: '8px 14px', borderRadius: 8,
            textDecoration: 'none', fontWeight: 600,
          }}>Begin Journey →</Link>
        </div>
      </nav>

      {/* Article */}
      <article style={{
        maxWidth: 720, margin: '0 auto', padding: '56px 28px 80px',
        flex: 1,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--gold)',
          margin: 0,
        }}>
          Legal
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 300,
          color: 'var(--ink)', margin: '10px 0 6px',
          lineHeight: 1.15, letterSpacing: '-0.01em',
        }}>
          {title}
        </h1>
        <p style={{
          fontSize: 12, color: 'var(--text-muted)', margin: '0 0 40px',
        }}>
          Last updated {lastUpdated}
        </p>

        <div style={{
          fontSize: 15, lineHeight: 1.75, color: 'var(--text-soft)',
        }}>
          {children}
        </div>
      </article>

      {/* Footer */}
      <footer style={{
        padding: '24px 28px',
        borderTop: '1px solid var(--line)',
        background: 'var(--card)',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 12, fontSize: 12, color: 'var(--text-muted)',
      }}>
        <span>© {new Date().getFullYear()} The Energy Leader · Built by Hicks Virtual Solutions LLC</span>
        <span style={{ display: 'flex', gap: 18 }}>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms</Link>
          <a href="mailto:nicole@theenergyleader.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</a>
        </span>
      </footer>
    </div>
  )
}

// Convenience subcomponents that callers use to compose the article body.
export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
      color: 'var(--ink)', margin: '36px 0 14px',
      lineHeight: 1.3,
    }}>
      {children}
    </h2>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p style={{ margin: '0 0 16px' }}>{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul style={{
      margin: '0 0 16px', paddingLeft: 22,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {children}
    </ul>
  )
}
