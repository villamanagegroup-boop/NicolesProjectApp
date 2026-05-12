'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

const PATH_LABELS: Record<string, string> = {
  A: 'Seal the Leak — 7-day archetype reset ($37)',
  B: '365 Days of Alignment — Daily cards ($9/mo)',
  C: 'The Circle — 12-week coaching ($497)',
}

function SignupForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const rawPath = searchParams.get('path')
  const path = (rawPath === 'A' || rawPath === 'B' || rawPath === 'C' ? rawPath : null) as 'A' | 'B' | 'C' | null

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ready, setReady] = useState(false)

  const [isAdminPreview, setIsAdminPreview] = useState(false)

  // Guard: this page is the post-Stripe landing for new accounts. The only
  // hard requirement is `?path=A|B|C` so we know which welcome to send them
  // to next. Quiz-result is *prefilled* from sessionStorage when present, but
  // not required — users coming back from Stripe in a fresh tab still get in.
  //
  // Authed visitors are bounced to the dashboard, EXCEPT admins — admins can
  // preview the form (linked from /admin/sitemap) without losing their
  // session. The form submit is disabled in that mode.
  useEffect(() => {
    (async () => {
      const { supabaseClient } = await import('@/lib/supabase/client')
      const { data: { user: authed } } = await supabaseClient.auth.getUser()
      if (authed) {
        const { data: row } = await supabaseClient
          .from('users')
          .select('is_admin')
          .eq('id', authed.id)
          .maybeSingle()
        if (row?.is_admin) {
          setIsAdminPreview(true)
        } else {
          router.replace('/dashboard')
          return
        }
      }
      if (!path) {
        router.replace('/quiz/paths')
        return
      }
      const savedName  = sessionStorage.getItem('clarity_lead_name')  ?? ''
      const savedEmail = sessionStorage.getItem('clarity_lead_email') ?? ''
      if (savedName)  setName(savedName)
      if (savedEmail) setEmail(savedEmail)
      setReady(true)
    })()
  }, [router, path])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isAdminPreview) {
      setError('Admin preview mode — submit is disabled to protect your session. Sign out to test the real flow.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setError('')
    setSubmitting(true)

    const { supabaseClient } = await import('@/lib/supabase/client')
    const quizResult = typeof window !== 'undefined'
      ? sessionStorage.getItem('clarity_quiz_result')
      : null

    const { data, error: authError } = await supabaseClient.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    })

    if (authError) {
      setError(authError.message)
      setSubmitting(false)
      return
    }

    if (!data.session || !data.user) {
      setSubmitting(false)
      setError('Check your email to confirm your account, then sign in.')
      return
    }

    // Persist path + archetype on the user row
    await supabaseClient.from('users').update({
      selected_path: path,
      quiz_result: quizResult,
      onboarding_complete: path !== 'C',
    }).eq('id', data.user.id)

    // Claim any pending purchase made before signup (Stripe payment link flow).
    // Non-fatal if it fails — the webhook will retry on its next event, and
    // selected_path is already saved so the user can still reach their program.
    try {
      const res = await fetch('/api/claim-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, email: email.trim() }),
      })
      if (!res.ok) {
        console.warn('claim-purchase non-OK', res.status, await res.text().catch(() => ''))
      }
    } catch (err) {
      console.warn('claim-purchase failed', err)
    }

    // Fire welcome + admin emails (Emailit). Fire-and-forget — never block
    // the redirect on email delivery. Idempotency keys on the route prevent
    // doubles if the user re-enters this flow.
    fetch('/api/signup-complete', { method: 'POST' })
      .catch(err => console.warn('signup-complete email call failed', err))

    // Post-signup flow:  signup → welcome page → portal.
    // The welcome page is the user's first experience after creating their
    // account — it explains what they just unlocked, then forwards them
    // into the portal via its CTA.
    const dest = path === 'A'
      ? '/welcome/seal-the-leak'
      : path === 'C'
        ? '/welcome/the-circle'
        : '/welcome/cards'
    window.location.href = dest
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

  if (!ready || !path) return null

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
          <span style={{ color: 'var(--gold)' }}>✦</span> The Energy Leader
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
            Create your account to access your program.
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
        {isAdminPreview && (
          <div style={{
            background: '#fffaeb',
            border: '1px solid rgba(200,148,31,0.4)',
            borderLeft: '3px solid #C8941F',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 24,
            fontSize: 12,
            color: '#C8941F',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
          }}>
            <strong style={{ display: 'block', marginBottom: 2 }}>👁 Admin preview</strong>
            You&apos;re signed in. Submit is disabled — sign out to test the real flow.
          </div>
        )}

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
          Your payment is confirmed. Create your account to enter your program.
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
            disabled={submitting}
            style={{
              width: '100%',
              backgroundColor: submitting ? 'rgba(31,92,58,0.5)' : 'var(--green)',
              color: '#ffffff',
              padding: '13px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s ease',
              letterSpacing: '0.2px',
            }}
            onMouseOver={(e) => { if (!submitting) e.currentTarget.style.opacity = '0.88' }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            {submitting ? 'Creating account…' : 'Create Account & Enter Your Program →'}
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
