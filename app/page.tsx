'use client'
import Link from 'next/link'

const IRIDESCENT_BG = `
  radial-gradient(ellipse at 8% 18%, rgba(60, 160, 90, 0.15) 0%, transparent 54%),
  radial-gradient(ellipse at 92% 12%, rgba(210, 72, 60, 0.13) 0%, transparent 50%),
  radial-gradient(ellipse at 50% 92%, rgba(230, 185, 40, 0.13) 0%, transparent 54%),
  radial-gradient(ellipse at 78% 62%, rgba(210, 72, 60, 0.08) 0%, transparent 44%),
  radial-gradient(ellipse at 15% 80%, rgba(60, 160, 90, 0.08) 0%, transparent 46%)
`.trim()

export default function LandingPage() {
  return (
    <div
      className="landing-shell"
      style={{
        background: '#fdfcfa',
        backgroundImage: IRIDESCENT_BG,
        minHeight: '100vh',
        position: 'relative',
        fontFamily: 'var(--font-body)',
        display: 'flex',
      }}
    >

      {/* Fixed nav */}
      <nav className="landing-nav" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        background: 'rgba(253,252,250,0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(12,12,10,0.06)',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--ink)' }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
        </span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{
              border: '1px solid rgba(12,12,10,0.18)',
              color: 'var(--ink)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(12,12,10,0.04)' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
          <Link
            href="/quiz"
            style={{
              backgroundColor: 'var(--gold)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#a07822' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--gold)' }}
          >
            Begin Journey →
          </Link>
        </div>
      </nav>

      {/* Left — hero text */}
      <div className="landing-left-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 64px 120px', position: 'relative', zIndex: 1 }}>

        {/* Hero content */}
        <p style={{
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--gold)',
          marginBottom: '24px',
          marginTop: 0,
        }}>
          Daily Clarity App &amp; Program
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(48px, 6vw, 64px)',
          color: 'var(--ink)',
          lineHeight: 1.1,
          margin: 0,
        }}>
          Stop the<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Leak.</em><br />
          Reclaim Your Energy
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'rgba(12,12,10,0.55)',
          maxWidth: '380px',
          marginTop: '24px',
          marginBottom: '40px',
          lineHeight: 1.8,
        }}>
          A daily clarity app and step-by-step reset program — personalized to your energy archetype. Stop leaking and start living aligned.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/quiz"
            style={{
              backgroundColor: 'var(--gold)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#a07822' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'var(--gold)' }}
          >
            Find My Leak →
          </Link>
          <Link
            href="/login"
            style={{
              border: '1px solid rgba(12,12,10,0.18)',
              color: 'rgba(12,12,10,0.6)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(12,12,10,0.04)' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
        </div>

      </div>

      {/* Right — image panel */}
      <div className="landing-right-panel" style={{
        width: '42%',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <img
          src="/hero-alignment.jpg"
          alt="Seal Your Leak"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
      </div>

      {/* Bottom feature row */}
      <div className="landing-bottom-row" style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid rgba(12,12,10,0.07)',
        backgroundColor: 'rgba(12,12,10,0.02)',
        padding: '24px 64px',
        display: 'flex',
        alignItems: 'stretch',
      }}>
        {[
          { title: '365 Daily Cards', label: 'Wisdom. One day at a time.' },
          { title: '4 Archetypes', label: 'Know your pattern.' },
          { title: '3 Paths', label: 'Choose your journey.' },
        ].map((item, i) => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
            {i > 0 && (
              <div style={{ width: '1px', backgroundColor: 'rgba(12,12,10,0.08)', marginRight: '40px' }} />
            )}
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'var(--ink)',
                marginBottom: '4px',
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(12,12,10,0.4)',
              }}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
