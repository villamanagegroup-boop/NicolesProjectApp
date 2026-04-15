'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'

export default function TodaysSessionPage() {
  const { user, dayNumber } = useApp()
  const [sealed, setSealed] = useState(false)

  const routeId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const route   = programRoutes[routeId]
  const currentDay = Math.min(dayNumber, 7)
  const day = route.days[currentDay - 1]

  if (!day) return null

  const isDay7 = day.day === 7

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Link
            href="/program"
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
          >
            ← The Work
          </Link>
          <span style={{ color: 'var(--line-md)', fontSize: '12px' }}>/</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Today&apos;s Session
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: 0,
          }}>
            Day {currentDay} — {day.title}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
          {/* Phase badge */}
          <span style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: route.color,
            border: `1px solid ${route.color}40`,
            padding: '2px 8px',
            borderRadius: '999px',
            fontFamily: 'var(--font-body)',
          }}>
            {day.phase}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {route.name}
          </span>
        </div>
      </div>

      {/* Opening frame */}
      <div style={{
        background: `${route.color}08`,
        borderLeft: `4px solid ${route.color}`,
        borderRadius: '0 12px 12px 0',
        padding: '20px 24px',
        marginBottom: '28px',
      }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          margin: '0 0 10px',
        }}>
          Opening frame
        </p>
        <p style={{
          fontSize: '15px',
          fontStyle: 'italic',
          color: 'var(--ink)',
          lineHeight: 1.85,
          margin: 0,
          fontFamily: 'var(--font-body)',
        }}>
          {day.openingFrame}
        </p>
      </div>

      {/* Prompt */}
      <div style={{
        background: 'white',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <p style={{
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          margin: '0 0 8px',
        }}>
          Today&apos;s prompt
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 12px',
        }}>
          {day.prompt.title}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-soft)',
          lineHeight: 1.8,
          margin: 0,
          fontFamily: 'var(--font-body)',
        }}>
          {day.prompt.body}
        </p>
      </div>

      {/* Action */}
      <div style={{
        background: 'white',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '28px',
      }}>
        <p style={{
          fontSize: '9px',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          margin: '0 0 8px',
        }}>
          Today&apos;s action
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 400,
          color: 'var(--ink)',
          margin: '0 0 12px',
        }}>
          {day.action.title}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-soft)',
          lineHeight: 1.8,
          margin: 0,
          fontFamily: 'var(--font-body)',
        }}>
          {day.action.body}
        </p>
      </div>

      {/* Seal — interactive reveal */}
      {!sealed ? (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 16px' }}>
            When you&apos;re done with today&apos;s work, claim your seal.
          </p>
          <button
            onClick={() => setSealed(true)}
            style={{
              background: route.color,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '13px 32px',
              fontSize: '14px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              letterSpacing: '0.2px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            I did the work — seal it
          </button>
        </div>
      ) : (
        <div style={{ animation: 'fadeUp 0.3s ease forwards', marginBottom: '40px' }}>
          {/* Seal */}
          <div style={{
            background: route.color,
            borderRadius: '12px',
            padding: '28px 32px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <p style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
              fontFamily: 'var(--font-body)',
              margin: '0 0 12px',
            }}>
              {isDay7 ? 'Your sealed identity' : "Today's seal"}
            </p>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontStyle: 'italic',
              color: 'white',
              lineHeight: 1.7,
              margin: 0,
            }}>
              &ldquo;{isDay7 && day.sealedIdentity ? day.sealedIdentity : day.seal}&rdquo;
            </p>
          </div>

          {/* Day 7 proof grid */}
          {isDay7 && day.proofs && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 10px' }}>
                What you&apos;ve proven this week
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {day.proofs.map((proof) => (
                  <div key={proof.label} style={{
                    background: 'white',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 500, color: route.color, margin: '0 0 4px', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {proof.label}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-soft)', fontStyle: 'italic', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)' }}>
                      &ldquo;{proof.quote}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next actions */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/journal/new"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--ink)',
                fontFamily: 'var(--font-body)',
                textDecoration: 'none',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '10px 20px',
              }}
            >
              Write a reflection →
            </Link>
            {!isDay7 && (
              <Link
                href="/program"
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'none',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '10px 20px',
                }}
              >
                See the full journey
              </Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
