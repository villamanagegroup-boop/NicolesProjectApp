'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const STRIPE_PATH_A = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? '#'
const STRIPE_PATH_B = process.env.NEXT_PUBLIC_STRIPE_PATH_B_LINK ?? '#'
const STRIPE_PATH_C = process.env.NEXT_PUBLIC_STRIPE_PATH_C_LINK ?? '#'

const PATH_LABELS: Record<string, string> = {
  A: 'Fix This Now — Seal the Leak Program ($27)',
  B: 'Stay Aligned Daily — Daily Clarity App ($12/mo)',
  C: 'Go Deeper With Me — Coaching Experience (Premium)',
}

function SignupForm() {
  const searchParams = useSearchParams()
  const path = (searchParams.get('path') ?? 'A') as 'A' | 'B' | 'C'
  const stripeLink = path === 'B' ? STRIPE_PATH_B : path === 'C' ? STRIPE_PATH_C : STRIPE_PATH_A

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  // Pre-fill from quiz lead capture
  useEffect(() => {
    const savedName = sessionStorage.getItem('clarity_lead_name') ?? ''
    const savedEmail = sessionStorage.getItem('clarity_lead_email') ?? ''
    if (savedName) setName(savedName)
    if (savedEmail) setEmail(savedEmail)
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    // TODO: connect Supabase auth — createUser(name, email, password)
    // On success, redirect to Stripe:
    window.location.href = stripeLink
  }

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    border: 'none',
    borderBottom: '1px solid var(--line-md)',
    background: 'none',
    padding: '0 0 8px',
    fontSize: '14px',
    fontFamily: 'var(--font-body)',
    color: 'var(--ink)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-soft)',
    marginBottom: '6px',
    fontFamily: 'var(--font-body)',
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderBottomColor = 'var(--green)'
  }
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderBottomColor = 'var(--line-md)'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>

      {/* Left panel */}
      <div className="auth-left-panel" style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 56px',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        <img
          src="/hero-energy.jpg"
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(12,12,10,0.55) 0%, rgba(12,12,10,0.75) 100%)',
        }} />

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#ffffff', position: 'relative', zIndex: 1 }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
        </div>

        <div style={{ maxWidth: '360px', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--gold)',
            margin: '0 0 16px',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
          }}>
            Path {path} selected
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '44px',
            fontStyle: 'italic',
            fontWeight: 300,
            color: '#ffffff',
            lineHeight: 1.15,
            margin: '0 0 16px',
          }}>
            One step from your journey.
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
            lineHeight: 1.7,
          }}>
            Create your account, then complete your purchase to unlock your portal.
          </p>
        </div>

        <div style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.35)',
          fontFamily: 'var(--font-body)',
          position: 'relative',
          zIndex: 1,
        }}>
          CLARITY · ALIGNMENT · PURPOSE · GROWTH
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-panel" style={{
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 56px',
      }}>
        {/* Selected path badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--green-pale)',
          border: '1px solid rgba(31,92,58,0.15)',
          borderRadius: '4px',
          padding: '6px 12px',
          marginBottom: '28px',
          alignSelf: 'flex-start',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-body)', fontWeight: 500, letterSpacing: '0.3px' }}>
            ✓ {PATH_LABELS[path]}
          </span>
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 300,
          color: 'var(--ink)',
          marginBottom: '8px',
          marginTop: 0,
        }}>
          Create your account
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginTop: 0,
          marginBottom: '32px',
        }}>
          Then you&apos;ll complete your purchase to unlock your portal.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'rgba(180,40,40,0.85)', margin: 0, fontFamily: 'var(--font-body)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: 'var(--green)',
              color: '#ffffff',
              padding: '13px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
              letterSpacing: '0.2px',
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.88' }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Create Account & Continue to Payment →
          </button>
        </form>

        <p style={{
          marginTop: '24px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-muted)',
        }}>
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              color: 'var(--green)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Sign in
          </Link>
        </p>

        <p style={{
          marginTop: '16px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}>
          🔒 Secure checkout via Stripe
        </p>

        <div style={{
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: '1px solid var(--line)',
          textAlign: 'center',
        }}>
          <Link
            href="/quiz/paths"
            style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
          >
            ← Pick a different journey
          </Link>
        </div>

        {/* Admin shortcut */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
        }}>
          <Link
            href="/onboarding"
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: '1px dashed var(--line-md)',
              borderRadius: '6px',
              letterSpacing: '0.05em',
              opacity: 0.6,
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.6' }}
          >
            ⚙ Admin: Preview Onboarding Assessment
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
          .auth-form-panel {
            width: 100% !important;
            padding: 48px 24px 64px !important;
            justify-content: flex-start !important;
            padding-top: 56px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}
