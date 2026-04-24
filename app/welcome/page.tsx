'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { PATHS, PATH_ORDER, type PathId } from '@/data/paths'

const PORTAL_DEST: Record<PathId, string> = {
  A: '/program',     // Seal the Leak — work mode
  B: '/dashboard',   // 365 Days — cards mode
  C: '/circle',      // Private Coaching — circle mode
}

function markWelcomed() {
  try { sessionStorage.setItem('welcomed_this_session', '1') } catch {}
}

export default function WelcomePage() {
  const router = useRouter()
  const { user, isAuthed, setSkipPathChooser } = useApp()
  const [skipNext, setSkipNext] = useState(user.skipPathChooser)
  const [busy, setBusy] = useState(false)

  const currentPath = user.selectedPath
  const displayName = user.name?.split(' ')[0] || 'there'

  async function enterPortal() {
    if (!currentPath) {
      router.push('/dashboard')
      return
    }
    setBusy(true)
    // Persist the "skip next time" preference if user checked it
    if (skipNext !== user.skipPathChooser && isAuthed) {
      await setSkipPathChooser(skipNext)
    }
    markWelcomed()
    router.push(PORTAL_DEST[currentPath])
  }

  function startUpgrade(target: PathId) {
    markWelcomed()
    // Stripe not configured yet — route to a checkout placeholder for now.
    // Once configured, swap for window.location.href = PATHS[target].ctaHref with real Stripe.
    alert(`Stripe checkout for ${PATHS[target].title} — coming soon.`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fdfcfa',
      fontFamily: 'var(--font-body)',
      padding: '56px 24px',
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--green)',
            margin: '0 0 12px',
            fontWeight: 500,
          }}>
            Welcome back, {displayName}
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            fontWeight: 300,
            color: 'var(--ink)',
            margin: '0 0 14px',
            lineHeight: 1.1,
          }}>
            Choose your path.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: 0, lineHeight: 1.7 }}>
            You&apos;ve got access to the path you picked. Preview the others if you&apos;re thinking about going deeper.
          </p>
        </div>

        {/* Path cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          {PATH_ORDER.map((pathId) => {
            const p = PATHS[pathId]
            const isCurrent = currentPath === pathId
            return (
              <div
                key={pathId}
                style={{
                  background: 'white',
                  border: isCurrent ? `2px solid ${p.accent}` : '1px solid var(--line-md)',
                  borderRadius: 14,
                  padding: '24px 22px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: isCurrent ? `0 6px 24px ${p.accent}18` : 'none',
                }}
              >
                {/* Top accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.accent, borderRadius: '14px 14px 0 0' }} />

                {/* Current pill or tier label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 9,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: p.accent,
                    fontWeight: 600,
                  }}>
                    {p.tierLabel}
                  </span>
                  {isCurrent && (
                    <span style={{
                      fontSize: 9,
                      padding: '3px 9px',
                      borderRadius: 999,
                      background: p.accent,
                      color: 'white',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      Your plan
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 400,
                  color: 'var(--ink)',
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {p.icon} {p.title}
                </h3>

                {/* Price */}
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--ink)' }}>
                    {p.price}
                  </span>
                  {p.priceNote && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                      {p.priceNote}
                    </p>
                  )}
                </div>

                {/* Description */}
                <p style={{ fontSize: 12, color: 'var(--text-soft)', margin: 0, lineHeight: 1.65, flex: 1 }}>
                  {p.description}
                </p>

                {/* CTA */}
                {isCurrent ? (
                  <button
                    onClick={enterPortal}
                    disabled={busy}
                    style={{
                      marginTop: 8,
                      padding: '11px 16px',
                      background: p.accent,
                      color: 'white',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.7 : 1,
                    }}
                  >
                    {busy ? 'Entering…' : 'Continue to my portal →'}
                  </button>
                ) : (
                  <button
                    onClick={() => startUpgrade(pathId)}
                    style={{
                      marginTop: 8,
                      padding: '11px 16px',
                      background: 'white',
                      color: p.accent,
                      border: `1px solid ${p.accent}40`,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${p.accent}08` }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
                  >
                    {p.billing === 'call' ? 'Book a discovery call →' : `Upgrade — ${p.price} →`}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Don't show next time + entry */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          paddingTop: 8,
        }}>
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            fontSize: 12,
            color: 'var(--text-soft)',
          }}>
            <input
              type="checkbox"
              checked={skipNext}
              onChange={(e) => setSkipNext(e.target.checked)}
              style={{ accentColor: 'var(--green)' }}
            />
            Don&apos;t show this on future sign-ins
          </label>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
            You can re-enable it anytime in Settings → Preferences.
          </p>
        </div>
      </div>
    </div>
  )
}
