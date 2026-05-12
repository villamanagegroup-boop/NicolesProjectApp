'use client'

// app/(auth)/forgot-password/page.tsx
// Step 1 of the recovery flow. User enters their email; Supabase sends them
// a magic link that opens /reset-password with a temporary session so they
// can set a new password.

import { useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    setError(null)
    // The redirectTo must be on a domain whitelisted in Supabase Auth → URL
    // Configuration. window.location.origin keeps it tied to the current host
    // (local dev, preview deploys, prod) without hardcoding.
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setSubmitted(true)
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
          Reset your password
        </h1>

        {submitted ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '0 0 18px' }}>
              If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset
              link. It expires in 1 hour.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
              Check your spam folder if you don&apos;t see it within a few minutes.
            </p>
            <Link href="/login" style={{
              display: 'inline-block', fontSize: 13, color: 'var(--gold)', textDecoration: 'none',
              fontWeight: 600,
            }}>
              ← Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '0 0 22px' }}>
              Enter the email on your account. We&apos;ll send you a link to set a new password.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    marginTop: 6, padding: '10px 12px',
                    border: '1px solid var(--line-md)', borderRadius: 8,
                    fontSize: 14, color: 'var(--ink)', background: '#fff',
                    fontFamily: 'inherit', outline: 'none',
                  }}
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
                {busy ? 'Sending…' : 'Send reset link →'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  ← Back to sign in
                </Link>
                <Link href="/signup" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Create account →
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
