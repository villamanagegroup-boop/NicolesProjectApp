'use client'

// app/unsubscribe/page.tsx
// User-facing confirmation page after clicking an unsubscribe link in an
// email. Calls /api/unsubscribe to flip the flag, then shows the result.
// Public route — no auth needed; the token in the URL is its own proof.

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const KIND_LABELS: Record<string, string> = {
  daily_reminder:   'daily card reminders',
  weekly_digest:    'weekly reflection digests',
  milestone_alerts: 'milestone alerts',
}

function UnsubscribeInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'ok'; what: string }
    | { kind: 'err'; message: string }
  >({ kind: 'loading' })

  useEffect(() => {
    if (!token) {
      setState({ kind: 'err', message: 'Missing unsubscribe token.' })
      return
    }
    fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          setState({ kind: 'err', message: body?.error ?? 'Could not process your request.' })
          return
        }
        const what = KIND_LABELS[body.unsubscribed] ?? body.unsubscribed
        setState({ kind: 'ok', what })
      })
      .catch(err => setState({ kind: 'err', message: String(err) }))
  }, [token])

  return (
    <div style={{
      minHeight: '100vh', background: '#fdfcfa',
      fontFamily: 'var(--font-body)', color: 'var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 16, padding: '40px 32px',
        boxShadow: '0 4px 14px rgba(12,12,10,0.04)',
        textAlign: 'center',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 22 }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> The Energy Leader
        </div>

        {state.kind === 'loading' && (
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Updating your preferences…
          </p>
        )}

        {state.kind === 'ok' && (
          <>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
              margin: '0 0 14px', lineHeight: 1.1, letterSpacing: '-0.015em',
            }}>
              You&apos;re unsubscribed.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.65, margin: '0 0 24px' }}>
              We won&apos;t send you {state.what} anymore. You can change this anytime in
              your settings.
            </p>
            <Link href="/settings" style={{
              display: 'inline-block', padding: '11px 18px', borderRadius: 8,
              background: 'var(--ink)', color: '#fff',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Manage all preferences →
            </Link>
          </>
        )}

        {state.kind === 'err' && (
          <>
            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
              margin: '0 0 14px', lineHeight: 1.1, letterSpacing: '-0.015em',
            }}>
              Something went wrong.
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.65, margin: '0 0 18px' }}>
              {state.message}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 24px' }}>
              You can also update your notification preferences from your settings page.
            </p>
            <Link href="/settings" style={{
              display: 'inline-block', padding: '11px 18px', borderRadius: 8,
              background: 'var(--ink)', color: '#fff',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Go to settings →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeInner />
    </Suspense>
  )
}
