'use client'

// app/(auth)/reset-password/page.tsx
// Step 2 of the recovery flow. Supabase redirects users here from the email
// link with a temporary session (event = PASSWORD_RECOVERY). While that
// session is active they can set a new password.
//
// If a user lands here without a recovery session — say they bookmarked the
// page — we render a "request a new link" prompt rather than a dead form.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Two ways the recovery session lands:
    //   1. Supabase fires PASSWORD_RECOVERY on the auth state change event
    //   2. There's already a session by the time we arrive (e.g. SSR hydration)
    let mounted = true

    const { data: sub } = supabaseClient.auth.onAuthStateChange((event) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true)
        setReady(true)
      }
    })

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) setHasSession(true)
      setReady(true)
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords don\'t match.')
      return
    }
    setBusy(true)
    const { error: upErr } = await supabaseClient.auth.updateUser({ password })
    setBusy(false)
    if (upErr) {
      setError(upErr.message)
      return
    }
    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#fdfcfa',
      fontFamily: 'var(--font-body)', color: 'var(--ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff', border: '1px solid var(--line)',
        borderRadius: 16, padding: '40px 32px',
        boxShadow: '0 4px 14px rgba(12,12,10,0.04)',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 18 }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> The Energy Leader
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300,
          margin: '0 0 8px', lineHeight: 1.2,
        }}>
          Set a new password
        </h1>

        {!ready ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '12px 0 0' }}>Loading…</p>
        ) : success ? (
          <p style={{ fontSize: 14, color: 'var(--green)', lineHeight: 1.7, margin: '12px 0 0' }}>
            Password updated. Redirecting you to your dashboard…
          </p>
        ) : !hasSession ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '0 0 18px' }}>
              This reset link has expired or already been used. Request a new one to continue.
            </p>
            <Link href="/forgot-password" style={{
              display: 'inline-block', padding: '11px 16px', borderRadius: 8,
              background: 'var(--ink)', color: '#fff',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>
              Request a new link →
            </Link>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '0 0 22px' }}>
              Choose a new password. At least 8 characters.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoFocus
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Confirm
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                />
              </label>

              {error && (
                <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                style={{
                  padding: '11px 16px', borderRadius: 8,
                  background: 'var(--ink)', color: '#fff',
                  border: 'none', cursor: busy ? 'wait' : 'pointer',
                  fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? 'Updating…' : 'Update password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  marginTop: 6, padding: '10px 12px',
  border: '1px solid var(--line-md)', borderRadius: 8,
  fontSize: 14, color: 'var(--ink)', background: '#fff',
  fontFamily: 'inherit', outline: 'none',
}
