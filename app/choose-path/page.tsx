'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

// Pan-African palette: Cards green / Seal red / Circle gold.
const GREEN  = '#0F4D2E'
const PURPLE = '#7A1F1F'   // Path A "Seal the Leak" — historically named PURPLE
const ORANGE = '#B8862E'   // Path C "The Circle"  — historically named ORANGE

export default function ChoosePathPage() {
  const router = useRouter()
  const { setSidebarMode } = useApp()
  const [cardsInterval, setCardsInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [circlePay, setCirclePay] = useState<'full' | 'plan'>('full')

  function choose(mode: 'cards' | 'work' | 'circle') {
    setSidebarMode(mode)
    if (mode === 'work')   { router.push('/program'); return }
    if (mode === 'circle') { router.push('/circle');  return }
    router.push('/dashboard')
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
        <span style={{ color: 'var(--gold)' }}>✦</span> The Energy Leader
      </div>

      {/* Heading */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '36px',
        fontWeight: 300,
        fontStyle: 'italic',
        color: 'var(--ink)',
        textAlign: 'center',
        margin: '0 0 16px',
        lineHeight: 1.1,
        letterSpacing: '-0.015em',
      }}>
        Where would you like to start?
      </h1>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: '15px',
        color: 'var(--text-soft)',
        textAlign: 'center',
        margin: '0 auto 48px',
        lineHeight: 1.65,
        maxWidth: 540,
      }}>
        You can switch between your programs anytime from the sidebar.
      </p>

      {/* Path cards */}
      <div style={{
        display: 'flex',
        gap: '20px',
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: '1140px',
        width: '100%',
      }}>

        {/* 365 Days */}
        <div
          style={{
            flex: '1 1 300px',
            maxWidth: '360px',
            background: '#ffffff',
            border: `1.5px solid rgba(26,82,48,0.2)`,
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
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

          {/* Pricing toggle */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            gap: '8px',
            backgroundColor: 'rgba(26,82,48,0.06)',
            borderRadius: '8px',
            padding: '4px',
          }}>
            <button
              onClick={() => setCardsInterval('monthly')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: cardsInterval === 'monthly' ? '#ffffff' : 'transparent',
                color: cardsInterval === 'monthly' ? GREEN : 'rgba(26,82,48,0.7)',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: cardsInterval === 'monthly' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Monthly <span style={{ fontWeight: 400, fontSize: '12px' }}>$9</span>
            </button>
            <button
              onClick={() => setCardsInterval('yearly')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: cardsInterval === 'yearly' ? '#ffffff' : 'transparent',
                color: cardsInterval === 'yearly' ? GREEN : 'rgba(26,82,48,0.7)',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: cardsInterval === 'yearly' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Yearly <span style={{ fontWeight: 400, fontSize: '12px' }}>$67</span>
            </button>
          </div>

          {/* CTA buttons */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
          }}>
            <a
              href={cardsInterval === 'monthly'
                ? process.env.NEXT_PUBLIC_STRIPE_CARDS_MONTHLY
                : process.env.NEXT_PUBLIC_STRIPE_CARDS_YEARLY
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 12px',
                backgroundColor: GREEN,
                color: '#ffffff',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Subscribe Now
            </a>
            <button
              onClick={() => choose('cards')}
              style={{
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: GREEN,
                border: `1px solid ${GREEN}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(26,82,48,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Preview First
            </button>
          </div>
        </div>

        {/* Seal the Leak */}
        <div
          style={{
            flex: '1 1 300px',
            maxWidth: '360px',
            background: '#ffffff',
            border: `1.5px solid rgba(61,48,128,0.2)`,
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
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

          {/* Pricing */}
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: 'rgba(61,48,128,0.05)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: '13px',
              fontFamily: 'var(--font-body)',
              color: PURPLE,
              fontWeight: 600,
            }}>
              One-time purchase
            </span>
            <span style={{
              fontSize: '16px',
              fontFamily: 'var(--font-display)',
              color: PURPLE,
              fontWeight: 600,
            }}>
              $37
            </span>
          </div>

          {/* CTA buttons */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
          }}>
            <a
              href={process.env.NEXT_PUBLIC_STRIPE_LEAK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 12px',
                backgroundColor: PURPLE,
                color: '#ffffff',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Buy Now
            </a>
            <button
              onClick={() => choose('work')}
              style={{
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: PURPLE,
                border: `1px solid ${PURPLE}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(61,48,128,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Preview First
            </button>
          </div>
        </div>

        {/* The Circle */}
        <div
          style={{
            flex: '1 1 300px',
            maxWidth: '360px',
            background: '#ffffff',
            border: `1.5px solid rgba(201,125,58,0.22)`,
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Icon badge */}
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: 'rgba(201,125,58,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: ORANGE,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.2" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M3 19c0-3.31 2.69-6 6-6s6 2.69 6 6" />
              <path d="M14.5 18.5c0-2.49 1.79-4.5 4-4.5 1.39 0 2.5.78 3 2" />
            </svg>
          </div>

          <div>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: ORANGE,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              marginBottom: '6px',
            }}>
              12-Week Intensive
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              fontWeight: 500,
              color: 'var(--ink)',
              lineHeight: 1.15,
              marginBottom: '10px',
            }}>
              The Circle
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              color: 'var(--text-soft)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              12 weeks of guided work with Nicole — live calls, a matched accountability partner, and a tight cohort community.
            </p>
          </div>

          {/* Pay-in-full vs installments toggle */}
          <div style={{
            marginTop: '16px',
            display: 'flex',
            gap: '8px',
            backgroundColor: 'rgba(201,125,58,0.06)',
            borderRadius: '8px',
            padding: '4px',
          }}>
            <button
              onClick={() => setCirclePay('full')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: circlePay === 'full' ? '#ffffff' : 'transparent',
                color: circlePay === 'full' ? ORANGE : 'rgba(201,125,58,0.7)',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: circlePay === 'full' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Pay in full <span style={{ fontWeight: 400, fontSize: '12px' }}>$497</span>
            </button>
            <button
              onClick={() => setCirclePay('plan')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: circlePay === 'plan' ? '#ffffff' : 'transparent',
                color: circlePay === 'plan' ? ORANGE : 'rgba(201,125,58,0.7)',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: circlePay === 'plan' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              3 × <span style={{ fontWeight: 400, fontSize: '12px' }}>$197</span>
            </button>
          </div>
          <p style={{
            fontSize: '11px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            margin: '-4px 0 0',
            lineHeight: 1.5,
          }}>
            {circlePay === 'full'
              ? 'Save $94 vs. the 3-payment plan.'
              : 'Total: $591. Pay in full to save $94.'}
          </p>

          {/* CTA buttons */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '16px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            gap: '8px',
            flexDirection: 'column',
          }}>
            <a
              href={circlePay === 'full'
                ? process.env.NEXT_PUBLIC_STRIPE_CIRCLE_ONETIME
                : process.env.NEXT_PUBLIC_STRIPE_CIRCLE_MONTHLY
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                padding: '10px 12px',
                backgroundColor: ORANGE,
                color: '#ffffff',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Join The Circle
            </a>
            <button
              onClick={() => choose('circle')}
              style={{
                padding: '10px 12px',
                backgroundColor: 'transparent',
                color: ORANGE,
                border: `1px solid ${ORANGE}`,
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(201,125,58,0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              Preview First
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
