'use client'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

const GREEN  = '#1A5230'
const PURPLE = '#3D3080'

export default function ChoosePathPage() {
  const router = useRouter()
  const { setSidebarMode } = useApp()

  function choose(mode: 'cards' | 'work') {
    setSidebarMode(mode)
    router.push(mode === 'work' ? '/program' : '/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--paper)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 500,
        color: 'var(--ink)',
        marginBottom: '48px',
        letterSpacing: '-0.01em',
      }}>
        <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '38px',
        fontWeight: 300,
        fontStyle: 'italic',
        color: 'var(--ink)',
        textAlign: 'center',
        margin: '0 0 12px',
        lineHeight: 1.2,
      }}>
        Where would you like to start?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '14px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        margin: '0 0 48px',
      }}>
        You can switch between your programs anytime from the sidebar.
      </p>

      {/* Path cards */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '760px',
        width: '100%',
      }}>

        {/* 365 Days */}
        <button
          onClick={() => choose('cards')}
          style={{
            flex: '1 1 300px',
            maxWidth: '360px',
            background: '#ffffff',
            border: `1.5px solid rgba(26,82,48,0.2)`,
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.boxShadow = '0 8px 32px rgba(26,82,48,0.12)'
            el.style.borderColor = 'rgba(26,82,48,0.5)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.boxShadow = 'none'
            el.style.borderColor = 'rgba(26,82,48,0.2)'
            el.style.transform = 'translateY(0)'
          }}
        >
          {/* Icon badge */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(26,82,48,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: GREEN,
          }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="12" height="9" rx="1.5" />
              <path d="M4 5V4a2 2 0 012-2h4a2 2 0 012 2v1" />
            </svg>
          </div>

          <div>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: GREEN,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              marginBottom: '6px',
            }}>
              Daily Practice
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1.15,
              marginBottom: '10px',
            }}>
              365 Days of Alignment
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-soft)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              Show up for yourself every day. One card, one prompt, one small shift — day by day.
            </p>
          </div>

          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: GREEN, fontWeight: 500 }}>
              Go to Daily Alignment
            </span>
            <span style={{ color: GREEN, fontSize: '18px' }}>→</span>
          </div>
        </button>

        {/* Seal the Leak */}
        <button
          onClick={() => choose('work')}
          style={{
            flex: '1 1 300px',
            maxWidth: '360px',
            background: '#ffffff',
            border: `1.5px solid rgba(61,48,128,0.2)`,
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'left',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.boxShadow = '0 8px 32px rgba(61,48,128,0.12)'
            el.style.borderColor = 'rgba(61,48,128,0.5)'
            el.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.boxShadow = 'none'
            el.style.borderColor = 'rgba(61,48,128,0.2)'
            el.style.transform = 'translateY(0)'
          }}
        >
          {/* Icon badge */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(61,48,128,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PURPLE,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>

          <div>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: PURPLE,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              marginBottom: '6px',
            }}>
              7-Day Reset
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1.15,
              marginBottom: '10px',
            }}>
              Seal the Leak
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-soft)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              A focused 7-day program built around your archetype. Do the work. Seal the pattern.
            </p>
          </div>

          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', fontFamily: 'var(--font-body)', color: PURPLE, fontWeight: 500 }}>
              Go to The Work
            </span>
            <span style={{ color: PURPLE, fontSize: '18px' }}>→</span>
          </div>
        </button>

      </div>
    </div>
  )
}
