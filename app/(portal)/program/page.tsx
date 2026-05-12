'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'
import { usePreviewMode } from '@/hooks/usePreviewMode'

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
  const { preview } = usePreviewMode()

  // Each user is anchored to their own archetype track. Admins in preview
  // mode can override the archetype to walk other variants of the program.
  const userRouteId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const routeId     = (preview?.path === 'A' && preview.archetypeOverride) ? preview.archetypeOverride : userRouteId
  const route       = programRoutes[routeId]
  const canViewFuture = user.isAdmin || (preview?.path === 'A')
  const currentDay      = Math.min(dayNumber, 7)
  const completedDays   = currentDay - 1
  const today           = route.days[currentDay - 1]
  const todayPhaseColor = PHASE_COLOR[today.phase] ?? 'var(--ink)'
  const firstName       = user.name?.split(/\s+/)[0] ?? ''

  const [snippets, setSnippets] = useState<Record<number, string>>({})
  useEffect(() => {
    const result: Record<number, string> = {}
    for (const d of route.days) {
      const s = getFirstReflectionSnippet(routeId, d.day, d.prompt.items.length)
      if (s) result[d.day] = s
    }
    setSnippets(result)
  }, [routeId, route.days])

  const reflectionsStarted = Object.keys(snippets).length

  const dayHref = (d: number) => `/program/today?day=${d}`

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          margin: '0 0 12px', fontFamily: 'var(--font-body)',
        }}>
          Seal the Leak · {route.name}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em',
          lineHeight: 1.1,
        }}>
          {firstName ? `Welcome back, ${firstName}.` : 'Welcome back.'}
        </h1>
        <p style={{
          fontSize: 15, color: 'var(--text-soft)', margin: '12px 0 0',
          lineHeight: 1.55, maxWidth: 520, fontFamily: 'var(--font-body)',
        }}>
          Day {currentDay} of 7 · <em>{route.coreShift}</em>
        </p>
      </div>

      {/* Today's seal — wide gradient centerpiece */}
      <div style={{
        background: `linear-gradient(135deg, ${route.color}10 0%, #fff 70%)`,
        borderTop: `2px solid ${route.color}`,
        borderBottom: '1px solid var(--line)',
        padding: '32px 4px 32px 24px',
        marginBottom: 36,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: route.color,
          margin: '0 0 12px', fontFamily: 'var(--font-body)',
        }}>
          Today&apos;s seal · Day {currentDay} · {today.phase}
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontStyle: 'italic',
          fontWeight: 300, color: 'var(--ink)',
          margin: 0, lineHeight: 1.35, maxWidth: 720,
        }}>
          &ldquo;{today.seal}&rdquo;
        </p>
      </div>

      {/* 2-col body */}
      <div className="program-cols" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 28, alignItems: 'start',
      }}>

        {/* LEFT — continue today + 7-day journey */}
        <div>
          <Section title="Continue today">
            <ProgramRow
              accent={route.color}
              eyebrow="Today's work"
              badge={today.phase}
              badgeColor={todayPhaseColor}
              title={`Day ${currentDay} — ${today.title}`}
              caption="Opening frame, prompts, action, and seal."
              href="/program/today"
            />
            <ProgramRow
              accent={route.color}
              eyebrow="Reflections"
              badge={reflectionsStarted > 0 ? `${reflectionsStarted} started` : 'Open'}
              title="Complete today's reflection"
              caption="Pick up where you left off — every prompt is saved automatically."
              href="/program/reflections"
            />
          </Section>

          <Section
            title="Your 7-day journey"
            right={
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                {completedDays} of 7 complete
              </span>
            }
          >
            {route.days.map((day) => {
              const phaseColor = PHASE_COLOR[day.phase] ?? 'var(--ink)'
              const isComplete = day.day < currentDay
              const isToday    = day.day === currentDay
              const isFuture   = day.day > currentDay
              const isLocked   = isFuture && !canViewFuture
              const snippet    = snippets[day.day]
              // Locked future days render as a flat <div> (no <Link>) so a
              // misclick doesn't navigate. canViewFuture admins/preview still
              // get the link and the content preview.
              const Wrapper = isLocked ? 'div' : Link
              const wrapperProps = isLocked
                ? { style: { textDecoration: 'none', display: 'block', cursor: 'default' as const } }
                : { href: dayHref(day.day), style: { textDecoration: 'none', display: 'block' } }
              return (
                <Wrapper key={day.day} {...(wrapperProps as { href: string; style: React.CSSProperties })}>
                  <div
                    className="program-day-row"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '20px 20px 20px 22px',
                      borderBottom: '1px solid var(--line)',
                      background: isToday ? `${route.color}08` : 'transparent',
                      position: 'relative',
                      transition: 'background 0.15s',
                      opacity: isFuture ? 0.7 : 1,
                    }}
                    onMouseEnter={e => {
                      if (!isLocked) (e.currentTarget as HTMLDivElement).style.background = isToday ? `${route.color}10` : 'rgba(200,148,31,0.04)'
                    }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isToday ? `${route.color}08` : 'transparent' }}
                  >
                    <span style={{
                      position: 'absolute', left: 0, top: 18, bottom: 18,
                      width: 3,
                      background: isFuture ? 'var(--line-md)' : route.color,
                      borderRadius: 2,
                    }} />

                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: isComplete ? route.color : isToday ? '#fff' : 'transparent',
                      border: isComplete
                        ? `1px solid ${route.color}`
                        : isToday
                          ? `2px solid ${route.color}`
                          : '1px dashed var(--line-md)',
                      color: isComplete ? '#fff' : isToday ? route.color : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, marginTop: 2,
                    }}>
                      {isComplete ? '✓' : day.day}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                        textTransform: 'uppercase', color: phaseColor,
                        marginBottom: 6, fontFamily: 'var(--font-body)',
                      }}>
                        Day {day.day} · {day.phase}
                        {isToday && (
                          <span style={{ marginLeft: 8, color: route.color, fontWeight: 600 }}>← today</span>
                        )}
                      </div>
                      {isLocked ? (
                        <p style={{
                          fontSize: 13, color: 'var(--text-muted)',
                          margin: 0, fontFamily: 'var(--font-body)', lineHeight: 1.5,
                          fontStyle: 'italic',
                        }}>
                          Unlocks at 4:00 AM on Day {day.day}.
                        </p>
                      ) : (
                        <>
                          <p style={{
                            fontSize: 15, fontWeight: 600, color: 'var(--ink)',
                            margin: '0 0 6px', lineHeight: 1.4,
                            fontFamily: 'var(--font-body)',
                          }}>
                            {day.title}
                          </p>
                          <p style={{
                            fontSize: 13, fontStyle: 'italic', color: 'var(--text-soft)',
                            margin: 0, fontFamily: 'var(--font-display)', lineHeight: 1.5,
                            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>
                            &ldquo;{day.seal}&rdquo;
                          </p>
                          {snippet && (
                            <p style={{
                              fontSize: 12, color: 'var(--text-muted)',
                              lineHeight: 1.55, margin: '8px 0 0',
                              fontStyle: 'italic', fontFamily: 'var(--font-body)',
                            }}>
                              You wrote: &ldquo;{snippet}{snippet.length >= 110 ? '…' : ''}&rdquo;
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {!isLocked && (
                      <span style={{
                        color: 'var(--text-muted)', fontSize: 16,
                        alignSelf: 'center', flexShrink: 0, paddingRight: 4,
                      }}>
                        ›
                      </span>
                    )}
                  </div>
                </Wrapper>
              )
            })}
          </Section>
        </div>

        {/* RIGHT — sticky stats + archetype */}
        <div style={{ position: 'sticky', top: 24 }}>
          <Section title="Your numbers">
            <Stat accent={route.color} label="Day"           value={`${currentDay} of 7`} />
            <Stat accent={route.color} label="Current phase" value={today.phase} />
            <Stat accent={route.color} label="Days complete" value={`${completedDays} of 7`} />
            <Stat accent={route.color} label="Reflections"   value={reflectionsStarted > 0 ? `${reflectionsStarted} started` : 'Not yet'} />
          </Section>

          <Section title="Your archetype">
            <div style={{ padding: '20px 22px 22px 22px', position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 0, top: 20, bottom: 20,
                width: 3, background: route.color, borderRadius: 2,
              }} />
              {route.imageUrl && (
                <div style={{
                  position: 'relative', width: '100%', aspectRatio: '16/9',
                  borderRadius: 8, overflow: 'hidden',
                  marginTop: 4, marginBottom: 14,
                }}>
                  <img
                    src={route.imageUrl}
                    alt={route.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '12px 14px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)',
                    color: '#fff',
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                  }}>
                    {route.name}
                  </div>
                </div>
              )}
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                margin: '0 0 4px', fontFamily: 'var(--font-body)',
              }}>
                Your core wound
              </p>
              <p style={{
                fontSize: 13, fontStyle: 'italic', color: 'var(--ink)',
                lineHeight: 1.55, margin: '0 0 14px',
                fontFamily: 'var(--font-display)',
              }}>
                {route.coreWound}
              </p>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                margin: '0 0 4px', fontFamily: 'var(--font-body)',
              }}>
                The shift you&apos;re making
              </p>
              <p style={{
                fontSize: 13, color: 'var(--ink)', lineHeight: 1.55, margin: 0,
                fontFamily: 'var(--font-body)',
              }}>
                {route.coreShift}
              </p>
            </div>
          </Section>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .program-cols {
            grid-template-columns: 1fr !important;
          }
          .program-cols > div { position: static !important; }
        }
        .program-row:last-child, .program-stat:last-child, .program-day-row:last-child {
          border-bottom: none !important;
        }
        .program-row:hover { background: rgba(200,148,31,0.04) !important; }
        .program-row:hover .program-row-chev { color: var(--gold) !important; transform: translateX(3px); }
      `}</style>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title, right, children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 36 }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {right}
      </header>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 12, overflow: 'hidden',
      }}>{children}</div>
    </section>
  )
}

function ProgramRow({
  accent, eyebrow, badge, badgeColor, title, caption, href,
}: {
  accent: string
  eyebrow: string
  badge?: string
  badgeColor?: string
  title: string
  caption?: string
  href?: string
}) {
  const Inner = (
    <div
      className="program-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px 20px 20px 22px',
        borderBottom: '1px solid var(--line)',
        position: 'relative', flexWrap: 'wrap',
        transition: 'background 0.15s',
      }}
    >
      <span style={{
        position: 'absolute', left: 0, top: 18, bottom: 18,
        width: 3, background: accent, borderRadius: 2,
      }} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: accent,
          fontFamily: 'var(--font-body)', marginBottom: 8,
        }}>
          {eyebrow}
          {badge && (
            <span style={{
              marginLeft: 10, fontWeight: 600, fontSize: 9,
              padding: '3px 8px', borderRadius: 6,
              background: `${badgeColor ?? accent}14`,
              color: badgeColor ?? accent,
              letterSpacing: '0.08em',
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{
          fontSize: 16, fontWeight: 600, color: 'var(--ink)',
          fontFamily: 'var(--font-body)', lineHeight: 1.4,
        }}>
          {title}
        </div>
        {caption && (
          <div style={{
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)', marginTop: 6, lineHeight: 1.5,
          }}>
            {caption}
          </div>
        )}
      </div>
      {href && (
        <span className="program-row-chev" style={{
          color: 'var(--text-muted)', fontSize: 18,
          flexShrink: 0, paddingRight: 4,
          transition: 'color 0.15s, transform 0.15s',
        }}>
          ›
        </span>
      )}
    </div>
  )
  return href
    ? <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>{Inner}</Link>
    : Inner
}

function Stat({ accent, label, value }: { accent: string; label: string; value: string }) {
  return (
    <div className="program-stat" style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '18px 20px 18px 22px',
      borderBottom: '1px solid var(--line)',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 18, bottom: 18,
        width: 3, background: accent, borderRadius: 2,
      }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 16, fontWeight: 600, color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
      }}>
        {value}
      </span>
    </div>
  )
}
