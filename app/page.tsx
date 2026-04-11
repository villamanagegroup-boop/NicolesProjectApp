'use client'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="landing-shell" style={{ backgroundColor: 'var(--ink)', minHeight: '100vh', position: 'relative', fontFamily: 'var(--font-body)', display: 'flex' }}>

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
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: '#ffffff' }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> Clarity
        </span>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.05)' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
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
          A Personal Growth Portal
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: 'clamp(48px, 6vw, 64px)',
          color: '#ffffff',
          lineHeight: 1.1,
          margin: 0,
        }}>
          Your Most<br />
          <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Aligned</em><br />
          Life Awaits
        </h1>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.55)',
          maxWidth: '380px',
          marginTop: '24px',
          marginBottom: '40px',
          lineHeight: 1.8,
        }}>
          A 365-day journey of daily clarity cards, guided reflection, and self-discovery — built around your unique archetype.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/signup"
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
            Take the Quiz →
          </Link>
          <Link
            href="/login"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s ease',
            }}
            onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.05)' }}
            onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent' }}
          >
            Sign In
          </Link>
        </div>

        <div style={{ marginTop: '64px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <span style={{
            fontSize: '10px',
            fontVariant: 'small-caps',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.2em',
            whiteSpace: 'nowrap',
          }}>
            Scroll to explore
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
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
          alt="Clarity"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
          }}
        />
        {/* Left fade so image blends into the dark background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, var(--ink) 0%, transparent 30%)',
        }} />
      </div>

      {/* Bottom feature row */}
      <div className="landing-bottom-row" style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: '24px 64px',
        display: 'flex',
        alignItems: 'stretch',
      }}>
        {[
          { title: '365 Daily Cards', label: 'Wisdom. One day at a time.' },
          { title: '4 Archetypes', label: 'Know your pattern.' },
          { title: 'Path A & B', label: 'Choose your journey.' },
        ].map((item, i) => (
          <div key={item.title} style={{ display: 'flex', alignItems: 'stretch', flex: 1 }}>
            {i > 0 && (
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginRight: '40px' }} />
            )}
            <div style={{ paddingLeft: i > 0 ? 0 : 0 }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '4px',
              }}>
                {item.title}
              </div>
              <div style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.35)',
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
