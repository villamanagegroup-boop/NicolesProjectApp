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
      <div style={{
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
          <span style={{ color: 'var(--gold)' }}>✦</span> Clarity
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
      <div style={{
        width: '480px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '64px 56px',
      }}>
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

        <p style={{
          marginTop: '24px',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          color: 'var(--text-muted)',
        }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            style={{
              color: 'var(--gold)',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Create one
          </Link>
        </p>

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
