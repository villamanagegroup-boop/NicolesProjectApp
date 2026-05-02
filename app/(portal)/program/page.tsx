'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute, PHASE_DAYS, PHASE_ORDER } from '@/data/sealTheLeakProgram'

const PHASE_COLOR: Record<string, string> = {
  Awareness:    'var(--green)',
  Interruption: 'var(--gold)',
  Reclamation:  'var(--red)',
  Identity:     'var(--ink)',
}

function getFirstReflectionSnippet(routeId: string, dayNum: number, itemCount: number): string {
  if (typeof window === 'undefined') return ''
  for (let i = 0; i < itemCount; i++) {
    const val = localStorage.getItem(`stl_${routeId}_day${dayNum}_item${i}`)
    if (val?.trim()) return val.trim().slice(0, 110)
  }
  return ''
}

export default function ProgramOverviewPage() {
  return (
    <Suspense fallback={null}>
      <ProgramOverviewInner />
    </Suspense>
  )
}

function ProgramOverviewInner() {
  const { user, dayNumber } = useApp()

  // Each user is anchored to their own archetype track. We used to support a
  // ?path= URL override so users could browse the other 3 archetypes — that
  // turned out to be more confusing than useful, so it's been removed. Admins
  // who need to preview other archetypes still can via /admin/preview.
  const routeId    = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const route      = programRoutes[routeId]
  const currentDay    = Math.min(dayNumber, 7)
  const completedDays = currentDay - 1
  const isFirstDay    = currentDay === 1
  const completedData = route.days.filter(d => d.day < currentDay)

  const [snippets, setSnippets] = useState<Record<number, string>>({})
  useEffect(() => {
    const result: Record<number, string> = {}
    for (const d of route.days) {
      const s = getFirstReflectionSnippet(routeId, d.day, d.prompt.items.length)
      if (s) result[d.day] = s
    }
    setSnippets(result)
  }, [routeId, route.days])

  const dayHref = (d: number) => `/program/today?day=${d}`

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Two-column grid */}
      <div className="two-col-grid" style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ── LEFT: identity + nav ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header */}
          <div>
            {user.name && (
              <p style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: route.color,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                margin: '0 0 6px',
              }}>
                Welcome back, {user.name.split(' ')[0]}
              </p>
            )}
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

          {/* Complete Reflection CTA — links to the Seal-only reflections page */}
          <Link
            href="/program/reflections"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
              color: route.color,
              borderRadius: '10px',
              padding: '14px 18px',
              textDecoration: 'none',
              border: `1px solid ${route.color}30`,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = `${route.color}06`
              el.style.borderColor = `${route.color}60`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'white'
              el.style.borderColor = `${route.color}30`
            }}
          >
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 2px' }}>
                Reflections
              </p>
              <p style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', margin: 0, color: 'var(--ink)' }}>
                Complete Reflection
              </p>
            </div>
            <span style={{ fontSize: '16px', opacity: 0.6 }}>✏</span>
          </Link>

          {/* Route identity card */}
          <div style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: '10px',
            overflow: 'hidden',
          }}>
            {route.imageUrl && (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden' }}>
                <img
                  src={route.imageUrl}
                  alt={route.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '10px 14px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 100%)',
                  color: 'white',
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 500,
                  textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                }}>
                  {route.name}
                </div>
              </div>
            )}
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

          {/* Day 1 view: clickable list of all 7 days */}
          {isFirstDay && (
            <div>
              <header style={{
                paddingBottom: 8, borderBottom: '1px solid var(--line)',
                marginBottom: 4,
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              }}>
                <h2 style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--text-soft)',
                  margin: 0, fontFamily: 'var(--font-body)',
                }}>
                  Your 7-day journey
                </h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  7 days
                </span>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                {route.days.map((day, i) => {
                  const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
                  const isToday = day.day === 1
                  return (
                    <Link
                      key={day.day}
                      href={dayHref(day.day)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '16px',
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: isToday ? `${route.color}08` : 'transparent',
                        border: isToday ? `1px solid ${route.color}25` : '1px solid transparent',
                        textDecoration: 'none',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${route.color}06` }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = isToday ? `${route.color}08` : 'transparent' }}
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
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Day 2+: Where you've been */}
          {!isFirstDay && completedData.length > 0 && (
            <div>
              <header style={{
                paddingBottom: 8, borderBottom: '1px solid var(--line)',
                marginBottom: 4,
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              }}>
                <h2 style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'var(--text-soft)',
                  margin: 0, fontFamily: 'var(--font-body)',
                }}>
                  Where you&apos;ve been
                </h2>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  {completedDays} of 7 complete
                </span>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 24 }}>
                {completedData.map((day) => {
                  const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
                  const phaseDays = PHASE_DAYS[day.phase] ?? []
                  const isPhaseLastDay = day.day === Math.max(...phaseDays)
                  const phaseComplete = isPhaseLastDay && phaseDays.every(d => completedData.some(cd => cd.day === d))
                  const snippet = snippets[day.day]

                  return (
                    <React.Fragment key={day.day}>
                      <Link href={dayHref(day.day)} style={{ textDecoration: 'none', display: 'block' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 14,
                            padding: '16px 4px 16px 16px',
                            borderBottom: '1px solid var(--line)',
                            position: 'relative',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                        >
                          {/* Accent strip */}
                          <span style={{
                            position: 'absolute', left: 0, top: 16, bottom: 16,
                            width: 2, background: route.color, borderRadius: 2,
                          }} />

                          <div style={{
                            width: 26, height: 26,
                            borderRadius: '50%',
                            background: route.color,
                            color: 'white',
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            ✓
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                              textTransform: 'uppercase', color: phaseColor,
                              fontFamily: 'var(--font-body)', marginBottom: 6,
                            }}>
                              Day {day.day} · {day.phase}
                            </div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)', margin: '0 0 6px', lineHeight: 1.4 }}>
                              {day.title}
                            </p>
                            <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-soft)', margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.55 }}>
                              &ldquo;{day.seal}&rdquo;
                            </p>
                            {snippet && (
                              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.55, margin: '8px 0 0', fontStyle: 'italic' }}>
                                You wrote: &ldquo;{snippet}{snippet.length >= 110 ? '…' : ''}&rdquo;
                              </p>
                            )}
                          </div>

                          <span style={{ color: 'var(--text-muted)', fontSize: 16, alignSelf: 'center', flexShrink: 0, paddingRight: 4 }}>›</span>
                        </div>
                      </Link>

                      {/* Phase completion banner — hairline-style, no card border */}
                      {phaseComplete && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 16px',
                          background: `${phaseColor}06`,
                          borderBottom: '1px solid var(--line)',
                          position: 'relative',
                        }}>
                          <span style={{
                            position: 'absolute', left: 0, top: 8, bottom: 8,
                            width: 2, background: phaseColor, borderRadius: 2,
                          }} />
                          <span style={{ fontSize: 13, color: phaseColor }}>✦</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: phaseColor, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {day.phase} — phase complete
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                            {phaseDays.length} {phaseDays.length === 1 ? 'day' : 'days'} done
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Still ahead */}
              {currentDay <= 7 && (
                <div>
                  <header style={{
                    paddingBottom: 8, borderBottom: '1px solid var(--line)',
                    marginBottom: 4,
                  }}>
                    <h2 style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: 'var(--text-soft)',
                      margin: 0, fontFamily: 'var(--font-body)',
                    }}>
                      Still ahead
                    </h2>
                  </header>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {route.days.filter(d => d.day >= currentDay).map((day) => {
                      const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
                      const isToday = day.day === currentDay
                      return (
                        <Link
                          key={day.day}
                          href={dayHref(day.day)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: isToday ? `${route.color}08` : 'transparent',
                            opacity: isToday ? 1 : 0.7,
                            textDecoration: 'none',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.background = `${route.color}06` }}
                          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = isToday ? '1' : '0.7'; (e.currentTarget as HTMLAnchorElement).style.background = isToday ? `${route.color}08` : 'transparent' }}
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
                        </Link>
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
