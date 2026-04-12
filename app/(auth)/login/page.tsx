'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: connect Supabase auth
    router.push('/dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#ffffff' }}>

      {/* Left panel — hero image */}
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
        {/* Background image */}
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
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(12,12,10,0.55) 0%, rgba(12,12,10,0.75) 100%)',
        }} />

        {/* Wordmark */}
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', color: '#ffffff', position: 'relative', zIndex: 1 }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
        </div>

        {/* Center quote */}
        <div style={{ maxWidth: '360px', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            fontStyle: 'italic',
            fontWeight: 300,
            color: '#ffffff',
            lineHeight: 1.15,
            margin: 0,
          }}>
            Return to your center.
          </h2>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.6)',
            marginTop: '16px',
            marginBottom: 0,
          }}>
            Your daily practice is waiting.
          </p>
        </div>

        {/* Bottom keywords */}
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

      {/* Right light panel */}
      <div className="auth-form-panel" style={{
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 56px',
        position: 'relative',
      }}>
        {/* Back link */}
        <Link
          href="/"
          style={{
            position: 'absolute',
            top: '28px',
            left: '56px',
            fontSize: '13px',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
          onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
        >
          ← Back
        </Link>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 300,
          color: 'var(--ink)',
          marginBottom: '8px',
          marginTop: 0,
        }}>
          Welcome back
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginTop: 0,
          marginBottom: '40px',
        }}>
          Sign in to continue your journey.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-soft)',
              marginBottom: '6px',
              fontFamily: 'var(--font-body)',
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
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
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--gold)' }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--line-md)' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-soft)',
              marginBottom: '6px',
              fontFamily: 'var(--font-body)',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
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
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--gold)' }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'var(--line-md)' }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: '100%',
              backgroundColor: 'var(--ink)',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            Sign In →
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          padding: '16px 20px',
          border: '1px solid var(--line-md)',
          borderRadius: '8px',
          background: 'var(--paper)',
        }}>
          <p style={{
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-soft)',
            margin: '0 0 10px',
            lineHeight: 1.5,
          }}>
            New here? Accounts are created through our quiz — it helps us personalize your experience.
          </p>
          <Link
            href="/quiz"
            style={{
              display: 'inline-block',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              color: 'var(--green)',
              textDecoration: 'none',
              letterSpacing: '0.1px',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'underline' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = 'none' }}
          >
            Sign up by taking our quiz →
          </Link>
        </div>

        {/* TODO: Remove before launch */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--line)',
        }}>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: '1px dashed var(--line-md)',
              color: 'var(--text-muted)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.color = 'var(--gold)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--line-md)'
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            ⚙ Admin — Skip to Dashboard
          </button>
        </div>
      </div>

    </div>
  )
}
