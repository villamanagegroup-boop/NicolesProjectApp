'use client'

import { useState } from 'react'
import type { PathDefinition } from '@/data/paths'

interface PathTileProps {
  def: PathDefinition
  featured?: boolean
}

export default function PathTile({ def, featured = false }: PathTileProps) {
  const accent = def.accent
  const isSubToggle  = def.billing === 'subscription' && !!def.ctaHrefAlt
  const isPayToggle  = def.billing === 'one-time'     && !!def.ctaHrefAlt
  const [interval, setIntervalSel] = useState<'monthly' | 'yearly'>('monthly')
  const [payPlan, setPayPlan]      = useState<'full' | 'split'>('full')
  const [hovered, setHovered] = useState(false)

  const ctaHref = isSubToggle
    ? (interval === 'monthly' ? def.ctaHref : (def.ctaHrefAlt ?? def.ctaHref))
    : isPayToggle
      ? (payPlan === 'full' ? def.ctaHref : (def.ctaHrefAlt ?? def.ctaHref))
      : def.ctaHref

  const displayPrice = isSubToggle
    ? (interval === 'monthly' ? '$9/mo' : '$67/yr')
    : isPayToggle
      ? (payPlan === 'full' ? def.price : '$197/mo')
      : def.price

  const displayPriceNote = isSubToggle
    ? (interval === 'monthly' ? 'Billed monthly · Cancel anytime' : 'Billed yearly · Save 38% vs monthly')
    : isPayToggle
      ? (payPlan === 'full' ? 'Pay once · keep it forever' : '3 monthly payments · $591 total')
      : def.priceNote

  return (
    <div
      className="path-tile"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: featured ? '#fffdf7' : 'white',
        border: featured ? `2px solid ${accent}` : '1px solid rgba(12,12,10,0.09)',
        borderRadius: '16px',
        padding: featured ? '40px 30px 30px' : '32px 26px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 16px 40px ${accent}26`
          : featured
            ? `0 10px 30px ${accent}1f`
            : '0 1px 2px rgba(12,12,10,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        boxSizing: 'border-box',
      }}
    >
      {/* Top accent strip */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: featured ? '4px' : '3px',
        background: accent,
      }} />

      {/* Featured badge — pill, centered above the title */}
      {featured && (
        <div style={{
          position: 'absolute',
          top: '-1px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: accent,
          color: 'white',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          padding: '6px 14px',
          borderRadius: '0 0 8px 8px',
          fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap',
        }}>
          ✦ Most popular
        </div>
      )}

      {/* Tier eyebrow */}
      <div>
        <p style={{
          fontSize: '10px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: accent,
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontWeight: 700,
          opacity: 0.9,
        }}>
          <span style={{ marginRight: 6 }}>{def.icon}</span>
          {def.tierLabel}
        </p>

        {def.tagline && (
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--text-soft)',
            margin: '10px 0 4px',
            lineHeight: 1.4,
          }}>
            {def.tagline}
          </p>
        )}

        {/* Title */}
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: featured ? '30px' : '26px',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '4px 0 0',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          {def.title}
        </h3>
      </div>

      {/* Price block — fixed position so all 3 tiles align */}
      <div style={{
        borderTop: '1px solid rgba(12,12,10,0.07)',
        borderBottom: '1px solid rgba(12,12,10,0.07)',
        padding: '16px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: featured ? '44px' : '38px',
            fontWeight: 400,
            color: 'var(--ink)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {displayPrice}
          </span>
        </div>
        <p style={{
          fontSize: '12px',
          color: 'var(--text-muted)',
          margin: '8px 0 0',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.5,
        }}>
          {displayPriceNote}
        </p>

        {/* Subscription toggle — 365 Days monthly / yearly */}
        {isSubToggle && (
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: `${accent}10`,
            borderRadius: '8px',
            padding: '4px',
            marginTop: '12px',
          }}>
            {(['monthly', 'yearly'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setIntervalSel(opt)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: interval === opt ? '#ffffff' : 'transparent',
                  color: interval === opt ? accent : `${accent}99`,
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: interval === opt ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: interval === opt ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  letterSpacing: '0.02em',
                  position: 'relative',
                }}
              >
                {opt === 'monthly' ? '$9/mo' : '$67/yr · Save 38%'}
              </button>
            ))}
          </div>
        )}

        {/* Payment toggle — Circle full / 3-pay */}
        {isPayToggle && (
          <div style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: `${accent}10`,
            borderRadius: '8px',
            padding: '4px',
            marginTop: '12px',
          }}>
            {(['full', 'split'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setPayPlan(opt)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: payPlan === opt ? '#ffffff' : 'transparent',
                  color: payPlan === opt ? accent : `${accent}99`,
                  fontSize: '11px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: payPlan === opt ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: payPlan === opt ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  letterSpacing: '0.02em',
                }}
              >
                {opt === 'full' ? 'Pay $497' : '3 × $197'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{
        fontSize: '13.5px',
        color: 'var(--text-soft)',
        lineHeight: 1.6,
        margin: 0,
        fontFamily: 'var(--font-body)',
      }}>
        {def.description}
      </p>

      {/* Includes — feature list */}
      <div>
        <p style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          margin: '0 0 10px',
          fontFamily: 'var(--font-body)',
        }}>
          What you get
        </p>
        <ul style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '9px',
        }}>
          {def.includes.map((item) => (
            <li key={item} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '13px',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.5,
            }}>
              <span style={{
                flexShrink: 0,
                marginTop: '2px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: accent,
                color: 'white',
                fontSize: '9px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* First move — concrete promise */}
      {def.firstMove && (
        <div style={{
          background: featured ? `${accent}10` : 'rgba(12,12,10,0.025)',
          borderLeft: `2px solid ${accent}`,
          borderRadius: '4px',
          padding: '10px 12px',
        }}>
          <p style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accent,
            margin: '0 0 3px',
            fontFamily: 'var(--font-body)',
          }}>
            Your first move
          </p>
          <p style={{
            fontSize: '12.5px',
            color: 'var(--ink)',
            margin: 0,
            fontFamily: 'var(--font-body)',
            lineHeight: 1.5,
          }}>
            {def.firstMove}
          </p>
        </div>
      )}

      {/* Best-for tag */}
      <p style={{
        fontSize: '11.5px',
        color: 'var(--text-soft)',
        margin: '4px 0 0',
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        lineHeight: 1.5,
      }}>
        {def.bestFor}
      </p>

      {/* Spacer + CTA always at bottom */}
      <div style={{ flex: 1, minHeight: 4 }} />

      <a
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={def.ctaLabel}
        style={{
          display: 'block',
          width: '100%',
          background: accent,
          color: 'white',
          borderRadius: '8px',
          padding: featured ? '15px' : '13px',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.02em',
          textAlign: 'center',
          textDecoration: 'none',
          boxSizing: 'border-box',
          boxShadow: hovered ? `0 6px 20px ${accent}40` : 'none',
          transition: 'box-shadow 0.18s ease',
        }}
      >
        {def.ctaLabel} →
      </a>

      <p style={{
        fontSize: '10.5px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        margin: 0,
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
      }}>
        Secure checkout · Stripe
      </p>
    </div>
  )
}
