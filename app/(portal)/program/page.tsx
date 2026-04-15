'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'

const PHASE_COLOR: Record<string, string> = {
  Awareness:    'var(--green)',
  Interruption: 'var(--gold)',
  Reclamation:  'var(--red)',
  Identity:     'var(--ink)',
}

const ROUTE_ORDER = ['door', 'throne', 'engine', 'push'] as const

export default function ProgramOverviewPage() {
  const { user, dayNumber } = useApp()

  const userRouteId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const [adminRouteId, setAdminRouteId] = useState<string | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)

  const routeId     = adminRouteId ?? userRouteId
  const route       = programRoutes[routeId]
  const currentDay  = Math.min(dayNumber, 7)
  const completedDays = currentDay - 1
  const isFirstDay  = currentDay === 1
  const completedData = route.days.filter(d => d.day < currentDay)

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

      {/* Two-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* ── LEFT: identity + nav ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: '4px',
                background: route.badgeColor,
                color: route.textColor,
                fontFamily: 'var(--font-body)',
              }}>
                {route.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {isFirstDay ? 'Day 1 of 7 — starting today' : `Day ${currentDay} of 7`}
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 300,
              color: 'var(--ink)',
              margin: '0 0 8px',
            }}>
              The Work
            </h1>
            <p style={{
              fontSize: '13px',
              color: 'var(--text-soft)',
              fontFamily: 'var(--font-body)',
              margin: 0,
              lineHeight: 1.7,
            }}>
              {route.coreShift}
            </p>
          </div>

          {/* CTA to today */}
          <Link
            href="/program/today"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: route.color,
              color: 'white',
              borderRadius: '10px',
              padding: '18px 20px',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
          >
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>
                Continue now
              </p>
              <p style={{ fontSize: '15px', fontWeight: 500, fontFamily: 'var(--font-body)', margin: 0 }}>
                Day {currentDay} — {route.days[currentDay - 1]?.title}
              </p>
            </div>
            <span style={{ fontSize: '20px' }}>→</span>
          </Link>

          {/* Admin route switcher */}
          <div>
            <button
              onClick={() => setAdminOpen(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: adminOpen ? 'var(--ink)' : 'var(--text-muted)',
                background: adminOpen ? 'var(--paper2)' : 'transparent',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
                width: '100%',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
              </svg>
              Admin — Preview routes
              {adminRouteId && adminRouteId !== userRouteId && (
                <span style={{
                  marginLeft: '4px',
                  width: '8px', height: '8px',
                  borderRadius: '50%',
                  background: programRoutes[adminRouteId].color,
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
              )}
            </button>

            {adminOpen && (
              <div style={{
                marginTop: '8px',
                padding: '14px',
                background: 'var(--paper2)',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Viewing as archetype
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setAdminRouteId(null)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: adminRouteId === null ? '2px solid var(--ink)' : '1px solid var(--line-md)',
                      background: adminRouteId === null ? 'var(--ink)' : 'white',
                      color: adminRouteId === null ? 'white' : 'var(--text-soft)',
                      fontSize: '11px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                  >
                    Your route
                  </button>
                  {ROUTE_ORDER.map((id) => {
                    const r = programRoutes[id]
                    const isActive = adminRouteId === id
                    const isUser   = id === userRouteId
                    return (
                      <button
                        key={id}
                        onClick={() => setAdminRouteId(id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          border: isActive ? `2px solid ${r.color}` : '1px solid var(--line-md)',
                          background: isActive ? `${r.color}12` : 'white',
                          color: isActive ? r.color : 'var(--text-soft)',
                          fontSize: '11px',
                          fontWeight: isActive ? 600 : 500,
                          fontFamily: 'var(--font-body)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                        {r.name}
                        {isUser && <span style={{ fontSize: '9px', color: r.color, opacity: 0.7 }}>← yours</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Route identity card */}
          <div style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            <div style={{ height: '3px', background: route.color }} />
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', fontFamily: 'var(--font-body)' }}>
                Your core wound
              </p>
              <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>
                {route.coreWound}
              </p>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontFamily: 'var(--font-body)' }}>
                  The shift you&apos;re making
                </p>
                <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: 0 }}>
                  {route.coreShift}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Day journey ── */}
        <div>

          {/* Day 1 — preview all days */}
          {isFirstDay && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  margin: '0 0 4px',
                }}>
                  Your 7-day journey
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
                  Each day builds on the last. Here&apos;s where you&apos;re headed.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {route.days.map((day, i) => {
                  const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
                  const isToday = day.day === 1
                  return (
                    <div
                      key={day.day}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: isToday ? `${route.color}08` : 'transparent',
                        border: isToday ? `1px solid ${route.color}25` : '1px solid transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 28, height: 28,
                          borderRadius: '50%',
                          background: isToday ? route.color : 'var(--paper2)',
                          border: `1px solid ${isToday ? route.color : 'var(--line)'}`,
                          color: isToday ? 'white' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {day.day}
                        </div>
                        {i < route.days.length - 1 && (
                          <div style={{ width: '1px', height: '16px', background: 'var(--line)', marginTop: '2px' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, paddingTop: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                            {day.title}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: '10px', color: route.color, fontFamily: 'var(--font-body)', fontWeight: 500 }}>← today</span>
                          )}
                        </div>
                        <span style={{
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: phaseColor,
                          fontFamily: 'var(--font-body)',
                          opacity: 0.8,
                        }}>
                          {day.phase}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Day 2+: Where you've been */}
          {!isFirstDay && completedData.length > 0 && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 300,
                  color: 'var(--ink)',
                  margin: '0 0 4px',
                }}>
                  Where you&apos;ve been
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
                  {completedDays} {completedDays === 1 ? 'day' : 'days'} completed — tap any to review.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {completedData.map((day) => {
                  const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
                  return (
                    <Link
                      key={day.day}
                      href={`/program/today?day=${day.day}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '16px',
                          padding: '16px 20px',
                          borderRadius: '10px',
                          background: 'white',
                          border: '1px solid var(--line)',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.borderColor = `${route.color}50`
                          el.style.boxShadow = `0 2px 12px ${route.color}12`
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.borderColor = 'var(--line)'
                          el.style.boxShadow = 'none'
                        }}
                      >
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: '50%',
                          background: route.color,
                          color: 'white',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          ✓
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                              Day {day.day}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: phaseColor,
                              fontFamily: 'var(--font-body)',
                              opacity: 0.85,
                            }}>
                              · {day.phase}
                            </span>
                          </div>
                          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
                            {day.title}
                          </p>
                          <div style={{
                            background: `${route.color}06`,
                            border: `1px solid ${route.color}20`,
                            borderRadius: '6px',
                            padding: '8px 12px',
                          }}>
                            <p style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.6 }}>
                              &ldquo;{day.seal}&rdquo;
                            </p>
                          </div>
                        </div>

                        <span style={{ color: route.color, fontSize: '16px', alignSelf: 'center', flexShrink: 0, opacity: 0.6 }}>→</span>
                      </div>
                    </Link>
                  )
                })}
              </div>

              {/* Still ahead */}
              {currentDay <= 7 && (
                <div>
                  <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 10px' }}>
                    Still ahead
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {route.days.filter(d => d.day >= currentDay).map((day) => {
                      const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
                      const isToday = day.day === currentDay
                      return (
                        <div
                          key={day.day}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isToday ? `${route.color}08` : 'transparent',
                            opacity: isToday ? 1 : 0.5,
                          }}
                        >
                          <div style={{
                            width: 24, height: 24,
                            borderRadius: '50%',
                            border: `1px dashed ${isToday ? route.color : 'var(--line-md)'}`,
                            color: isToday ? route.color : 'var(--text-muted)',
                            fontSize: '11px',
                            fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {day.day}
                          </div>
                          <span style={{ fontSize: '13px', color: isToday ? 'var(--ink)' : 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: isToday ? 500 : 400 }}>
                            {day.title}
                          </span>
                          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: phaseColor, fontFamily: 'var(--font-body)', opacity: 0.7, marginLeft: 'auto' }}>
                            {day.phase}
                          </span>
                          {isToday && (
                            <span style={{ fontSize: '10px', color: route.color, fontFamily: 'var(--font-body)', fontWeight: 500 }}>← today</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
