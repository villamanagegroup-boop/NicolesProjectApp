'use client'

// app/(portal)/profile/page.tsx
// Path-aware profile. The sections that render — KPIs, milestones, theme
// compass, reassessment — are gated by which programs the user actually
// has access to. A Path-A-only user doesn't see cards milestones; a
// Path-C-only user doesn't see the 365-day theme compass.

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp, getArchetypePlaceholder } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'
import { quizResults } from '@/data/quizData'
import { getPath, PATHS, PATH_ORDER } from '@/data/paths'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'
import { supabaseClient } from '@/lib/supabase/client'

// Path colors come from CSS vars + data/paths so they always match the
// rest of the app's palette.

const archetypeColors: Record<string, string> = {
  seeker:    'var(--red)',
  builder:   'var(--gold)',
  healer:    'var(--green)',
  visionary: '#2a1a5e',
}

const themeColors: Record<string, string> = {
  Alignment: '#0F4D2E',
  Clarity:   '#2c4b8a',
  Strength:  '#7A1F1F',
  Purpose:   '#5a3a8a',
  Healing:   '#3a7a6e',
}

// ─── Milestone definitions per program ─────────────────────────────────────
interface Milestone {
  day: number             // 1-indexed
  title: string
  subtitle: string
  href?: string
}

const SEAL_MILESTONES: Milestone[] = [
  { day: 1, title: 'First Day Sealed',  subtitle: 'You showed up. The work begins.' },
  { day: 3, title: 'Interruption Phase', subtitle: 'You broke the loop on Day 3.' },
  { day: 5, title: 'Reclamation Phase',  subtitle: 'You returned to yourself.' },
  { day: 7, title: 'Pattern Sealed',     subtitle: 'You finished the 7-day reset.', href: '/program' },
]

const CARDS_MILESTONES: Milestone[] = [
  { day: 7,   title: 'First Week',          subtitle: 'You showed up seven days.' },
  { day: 30,  title: 'Vault Unlocked',      subtitle: 'Older cards become retrievable.', href: '/vault' },
  { day: 90,  title: '90-Day Reassessment', subtitle: 'Retake the quiz — see who you\'ve become.' },
  { day: 180, title: 'Halfway',             subtitle: 'Six months of alignment.' },
  { day: 365, title: 'Full Journey',        subtitle: 'You completed all 365.' },
]

const CIRCLE_MILESTONES: { week: number; title: string; subtitle: string; href?: string }[] = [
  { week: 1,  title: 'Cohort Begins',     subtitle: 'You joined and committed.' },
  { week: 4,  title: 'Root Phase Complete', subtitle: 'You named the cost honestly.' },
  { week: 8,  title: 'Rebuild Complete',  subtitle: 'You proved a new pattern is possible.' },
  { week: 12, title: 'Graduation',        subtitle: 'You completed the 12-week intensive.', href: '/circle' },
]

interface CircleSummary {
  cohort_name: string | null
  week: number | null
  phase: 'Root' | 'Rebuild' | 'Rise' | null
}

export default function ProfilePage() {
  const {
    user, dayNumber, cards, journalEntries,
    avatarUrl, setAvatarUrl, streakCount,
    hasWorkAccess, hasCardsAccess, hasCircleAccess,
  } = useApp()

  const photoSrc = avatarUrl ?? getArchetypePlaceholder(user.quizResult)
  const frameBorder = user.quizResult
    ? `3px solid ${archetypeColors[user.quizResult] ?? 'var(--gold)'}`
    : '3px solid var(--gold)'

  const matchedResult = quizResults.find(r => r.id === user.quizResult)
  const path = getPath(user.selectedPath)

  // Seal-the-Leak progress (Path A) — derived from dayNumber, clamped to 7.
  const sealRouteId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const sealRoute   = programRoutes[sealRouteId]
  const sealDay     = Math.min(Math.max(dayNumber, 1), 7)

  // Circle progress (Path C) — pulled on mount when the user has access.
  const [circle, setCircle] = useState<CircleSummary | null>(null)
  useEffect(() => {
    if (!hasCircleAccess) return
    let cancelled = false
    ;(async () => {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      if (!authUser) return
      const { data: member } = await supabaseClient
        .from('circle_members')
        .select('cohort_id')
        .eq('user_id', authUser.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled || !member?.cohort_id) return
      const { data: cohort } = await supabaseClient
        .from('circle_cohorts')
        .select('name, starts_at')
        .eq('id', member.cohort_id as string)
        .maybeSingle()
      if (cancelled) return
      const week = cohort?.starts_at
        ? Math.max(1, Math.min(12, Math.floor((Date.now() - new Date(cohort.starts_at as string).getTime()) / (86400000 * 7)) + 1))
        : null
      const phase: CircleSummary['phase'] =
        week == null ? null : week <= 4 ? 'Root' : week <= 8 ? 'Rebuild' : 'Rise'
      setCircle({
        cohort_name: (cohort?.name as string | null) ?? null,
        week,
        phase,
      })
    })()
    return () => { cancelled = true }
  }, [hasCircleAccess])

  const reflectionsCount = journalEntries.length
  const cardsUnlocked    = Math.min(dayNumber, cards.length)
  const daysToReassessment = Math.max(0, 90 - dayNumber)
  const reassessmentAvailable = dayNumber >= 90

  // Header subtitle adapts to the program the user is anchored in. Path-A
  // and -C members get program-native counts; Path-B + add-on members get
  // the 365 framing they expect.
  const headerSub =
    hasCardsAccess          ? `Day ${dayNumber} of 365` :
    hasCircleAccess         ? (circle?.week ? `Week ${circle.week} of 12` : 'The Circle') :
    hasWorkAccess           ? `Day ${sealDay} of 7 · ${sealRoute?.name ?? 'Seal the Leak'}` :
                              'Welcome'

  // ── Reflections (newest first) ──────────────────────────────────────────
  const recentReflections = [...journalEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(entry => {
      const card = cards.find(c => c.id === entry.cardId)
      return { entry, card }
    })

  // Theme compass — cards-only. Skipped entirely for Seal-only / Circle-only.
  const themeOrder = ['Alignment', 'Clarity', 'Strength', 'Purpose', 'Healing']
  const themes = themeOrder.map(theme => {
    const totalInTheme = cards.filter(c => c.theme === theme).length
    const unlockedInTheme = cards.filter(c => c.theme === theme && c.dayNumber <= dayNumber).length
    const reflectedInTheme = journalEntries.filter(e => {
      const card = cards.find(c => c.id === e.cardId)
      return card?.theme === theme
    }).length
    return { theme, totalInTheme, unlockedInTheme, reflectedInTheme }
  }).filter(t => t.totalInTheme > 0)

  // Path-aware KPI strip — only show counts that mean something here.
  const kpis: { label: string; value: number; accent: string }[] = []
  kpis.push({ label: 'Days active', value: dayNumber, accent: 'var(--green)' })
  if (hasCardsAccess) {
    kpis.push({ label: 'Cards unlocked', value: cardsUnlocked, accent: 'var(--gold)' })
  }
  if (hasCircleAccess && circle?.week) {
    kpis.push({ label: 'Cohort week', value: circle.week, accent: '#B8862E' })
  }
  if (hasWorkAccess && !hasCardsAccess) {
    kpis.push({ label: 'Seal day', value: sealDay, accent: 'var(--red)' })
  }
  kpis.push({ label: 'Reflections', value: reflectionsCount, accent: '#5a3a8a' })
  kpis.push({ label: 'Current streak', value: streakCount, accent: 'var(--red)' })

  // Which path tiles to show in "Your programs" — owned first, locked after.
  const ownedPaths   = PATH_ORDER.filter(id =>
    (id === 'A' && hasWorkAccess) ||
    (id === 'B' && hasCardsAccess) ||
    (id === 'C' && hasCircleAccess),
  )
  const lockedPaths  = PATH_ORDER.filter(id => !ownedPaths.includes(id))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── 1. Identity header ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gold-pale) 0%, rgba(243,240,234,0.6) 100%)',
          border: '1px solid var(--gold-line)',
          borderRadius: 14,
          padding: '28px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          flexWrap: 'wrap',
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 82, height: 82,
            borderRadius: '50%',
            overflow: 'hidden',
            border: frameBorder,
            position: 'relative',
            backgroundColor: 'var(--paper2)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <label
            htmlFor="avatar-upload"
            style={{
              position: 'absolute',
              bottom: 0, right: 0,
              width: 26, height: 26,
              borderRadius: '50%',
              backgroundColor: 'var(--gold)',
              border: '2px solid white',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="Upload photo"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onloadend = () => setAvatarUrl(reader.result as string)
              reader.readAsDataURL(file)
            }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 30, fontWeight: 300,
            color: 'var(--ink)', margin: 0,
            letterSpacing: '-0.01em',
          }}>
            {user.name || 'Welcome'}
          </h1>
          <div style={{
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)', marginTop: 6,
            letterSpacing: '0.04em',
          }}>
            {headerSub}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {matchedResult && (
              <span style={{
                border: '1px solid rgba(200,148,31,0.4)',
                color: 'var(--gold)',
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-body)',
              }}>
                {matchedResult.emoji} {matchedResult.title}
              </span>
            )}
            {user.selectedPath && (
              <span style={{
                border: `1px solid ${path.accent}40`,
                color: path.accent,
                fontSize: 11,
                padding: '4px 12px',
                borderRadius: 999,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-body)',
              }}>
                {path.icon} {path.shortTitle}
              </span>
            )}
          </div>
        </div>

        <Link
          href="/settings"
          style={{
            fontSize: 12,
            color: 'var(--text-soft)',
            fontFamily: 'var(--font-body)',
            textDecoration: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid var(--line-md)',
            background: '#fff',
            alignSelf: 'flex-start',
            flexShrink: 0,
            fontWeight: 600,
          }}
        >
          Edit profile →
        </Link>
      </div>

      {/* ── 2. Your programs ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 44 }}>
        <header style={{ marginBottom: 14 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
            color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
          }}>
            Your programs
          </h2>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}>
          {ownedPaths.map(id => {
            const p = PATHS[id]
            const status =
              id === 'A' ? `Day ${sealDay} of 7${sealRoute ? ` · ${sealRoute.name}` : ''}` :
              id === 'B' ? `Day ${dayNumber} of 365` :
              id === 'C' ? (circle ? `Week ${circle.week ?? 1} of 12${circle.phase ? ` · ${circle.phase}` : ''}` : 'Active') :
                           'Active'
            const home = id === 'A' ? '/program' : id === 'B' ? '/card' : '/circle'
            return (
              <Link key={id} href={home} style={{ textDecoration: 'none' }}>
                <div style={{
                  position: 'relative',
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${p.accent}`,
                  borderRadius: 12,
                  padding: '18px 20px',
                  transition: 'background 120ms ease',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,148,31,0.04)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#fff' }}
                >
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: p.accent,
                    fontFamily: 'var(--font-body)', marginBottom: 8,
                  }}>
                    {p.icon} {p.shortTitle}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400,
                    color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.3,
                  }}>
                    {status}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                  }}>
                    Open program →
                  </div>
                </div>
              </Link>
            )
          })}

          {lockedPaths.map(id => {
            const p = PATHS[id]
            return (
              <Link key={id} href="/upgrade" style={{ textDecoration: 'none' }}>
                <div style={{
                  position: 'relative',
                  background: '#fff',
                  border: '1px dashed var(--line-md)',
                  borderRadius: 12,
                  padding: '18px 20px',
                  opacity: 0.85,
                  transition: 'opacity 120ms ease',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '1' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.85' }}
                >
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)', marginBottom: 8,
                  }}>
                    Add a program
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400,
                    color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.3,
                  }}>
                    {p.icon} {p.shortTitle}
                  </div>
                  <div style={{
                    fontSize: 12, color: 'var(--text-soft)',
                    fontFamily: 'var(--font-body)',
                  }}>
                    {p.price} · See what&apos;s inside →
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── 3. KPI strip ───────────────────────────────────────────────────── */}
      <section style={{ marginBottom: 44 }}>
        <header style={{ marginBottom: 14 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
            color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
          }}>
            At a glance
          </h2>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {kpis.map(({ label, value, accent }) => (
            <div
              key={label}
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: 10,
                padding: '18px 18px 16px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0, left: 0,
                width: 3, height: '100%',
                background: accent,
              }} />
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30, fontWeight: 300,
                color: 'var(--ink)', lineHeight: 1,
              }}>
                {value}
              </div>
              <div style={{
                fontSize: 10, textTransform: 'uppercase',
                letterSpacing: '0.12em', color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)', marginTop: 8,
                fontWeight: 600,
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Reflections thread (universal) ───────────────────────────────── */}
      <section style={{ marginBottom: 44 }}>
        <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
            color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
          }}>
            Your reflections
          </h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {reflectionsCount === 0 ? 'None yet' : `${reflectionsCount} ${reflectionsCount === 1 ? 'entry' : 'entries'}`}
          </span>
        </header>

        <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {recentReflections.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <p style={{
                fontSize: 14, color: 'var(--text-muted)',
                fontFamily: 'var(--font-display)', fontStyle: 'italic',
                margin: '0 0 14px',
              }}>
                Your written reflections will gather here.
              </p>
              <Link
                href={hasCardsAccess ? '/card' : hasWorkAccess ? '/program' : '/journal'}
                style={{
                  fontSize: 13,
                  color: 'var(--green)',
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                }}
              >
                Start today&apos;s reflection →
              </Link>
            </div>
          ) : (
            <div style={{ maxHeight: 720, overflowY: 'auto' }}>
              {recentReflections.map(({ entry, card }, i) => {
                const isLast = i === recentReflections.length - 1
                const themeColor = card ? themeColors[card.theme] ?? 'var(--text-soft)' : 'var(--text-soft)'
                const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric',
                })
                return (
                  <Link
                    key={entry.id}
                    href={`/card?day=${entry.dayNumber}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    <div
                      style={{
                        padding: '16px 22px',
                        borderBottom: isLast ? 'none' : '1px solid var(--line)',
                        transition: 'background 120ms ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,148,31,0.04)' }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      <div style={{ display: 'flex', gap: 12, marginBottom: 6, alignItems: 'baseline' }}>
                        <span style={{
                          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: themeColor, fontFamily: 'var(--font-body)', fontWeight: 700,
                        }}>
                          Day {entry.dayNumber}{card ? ` · ${card.theme}` : ''}
                        </span>
                        <span style={{
                          fontSize: 11, color: 'var(--text-muted)',
                          fontFamily: 'var(--font-body)', marginLeft: 'auto',
                        }}>
                          {date}
                        </span>
                      </div>
                      {card && (
                        <p style={{
                          fontFamily: 'var(--font-display)', fontStyle: 'italic',
                          fontSize: 13, color: 'var(--text-soft)',
                          margin: '0 0 6px',
                        }}>
                          {card.title}
                        </p>
                      )}
                      <p style={{
                        fontSize: 13, color: 'var(--ink)',
                        fontFamily: 'var(--font-body)', margin: 0,
                        lineHeight: 1.55,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {entry.content || <em style={{ color: 'var(--text-muted)' }}>Empty entry</em>}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Theme compass — Cards users only ─────────────────────────────── */}
      {hasCardsAccess && themes.length > 0 && (
        <section style={{ marginBottom: 44 }}>
          <header style={{ marginBottom: 14 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
              color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
            }}>
              Your theme compass
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
              Where your energy has gone across the five themes.
            </p>
          </header>

          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
            padding: '22px 22px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {themes.map(({ theme, totalInTheme, unlockedInTheme, reflectedInTheme }) => {
              const color = themeColors[theme] ?? 'var(--text-soft)'
              const unlockedPct = totalInTheme ? (unlockedInTheme / totalInTheme) * 100 : 0
              const reflectedPct = totalInTheme ? (reflectedInTheme / totalInTheme) * 100 : 0
              return (
                <div key={theme}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 12, fontFamily: 'var(--font-body)',
                      color: 'var(--ink)', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      {theme}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                      {unlockedInTheme} / {totalInTheme} unlocked · {reflectedInTheme} reflected
                    </span>
                  </div>
                  <div style={{
                    position: 'relative', height: 6, background: 'var(--line)',
                    borderRadius: 3, overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      height: '100%', width: `${unlockedPct}%`,
                      background: `${color}40`,
                      transition: 'width 0.3s ease',
                    }} />
                    <div style={{
                      position: 'absolute', top: 0, left: 0,
                      height: '100%', width: `${reflectedPct}%`,
                      background: color,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── 6. Milestones — path-specific ───────────────────────────────────── */}
      {(hasWorkAccess || hasCardsAccess || hasCircleAccess) && (
        <section style={{ marginBottom: 44 }}>
          <header style={{ marginBottom: 14 }}>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
              color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
            }}>
              Milestones
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
              Markers along the path you&apos;re on.
            </p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {hasWorkAccess && (
              <MilestoneGrid
                eyebrow="Seal the Leak"
                accent="var(--red)"
                milestones={SEAL_MILESTONES}
                currentValue={sealDay}
                unitLabel="day"
              />
            )}
            {hasCardsAccess && (
              <MilestoneGrid
                eyebrow="Daily Cards"
                accent="var(--gold)"
                milestones={CARDS_MILESTONES}
                currentValue={dayNumber}
                unitLabel="day"
              />
            )}
            {hasCircleAccess && circle?.week != null && (
              <MilestoneGrid
                eyebrow="The Circle"
                accent="#B8862E"
                milestones={CIRCLE_MILESTONES.map(m => ({ day: m.week, title: m.title, subtitle: m.subtitle, href: m.href }))}
                currentValue={circle.week}
                unitLabel="week"
              />
            )}
          </div>
        </section>
      )}

      {/* ── 7. 90-Day Reassessment — Cards users only ──────────────────────── */}
      {hasCardsAccess && (
        <div
          style={{
            background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--green-pale) 100%)',
            border: '1px solid var(--gold-line)',
            borderLeft: '3px solid var(--red)',
            borderRadius: 12,
            padding: 28,
            marginBottom: 24,
          }}
        >
          <EyebrowLabel color="red">Milestone Review</EyebrowLabel>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300,
            color: 'var(--ink)', marginTop: 8, marginBottom: 8,
          }}>
            90-Day Reassessment
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6,
            marginBottom: 20, fontFamily: 'var(--font-body)',
          }}>
            At Day 90, you unlock the ability to retake the quiz and see how your archetype has
            evolved. This journey changes you — let the portal reflect that.
          </p>
          {!reassessmentAvailable && (
            <p style={{
              fontSize: 12, color: 'var(--text-muted)',
              fontStyle: 'italic', fontFamily: 'var(--font-body)',
              marginBottom: 16,
            }}>
              Available on Day 90 — {daysToReassessment} {daysToReassessment === 1 ? 'day' : 'days'} to go.
            </p>
          )}
          <Button variant="outline" size="sm" disabled={!reassessmentAvailable}>
            Learn More
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: one row of milestones for a given path ─────────────────
function MilestoneGrid({
  eyebrow, accent, milestones, currentValue, unitLabel,
}: {
  eyebrow: string
  accent: string
  milestones: Milestone[]
  currentValue: number
  unitLabel: 'day' | 'week'
}) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
      padding: '18px 22px',
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: accent,
        fontFamily: 'var(--font-body)', marginBottom: 14,
      }}>
        {eyebrow}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 10,
      }}>
        {milestones.map(m => {
          const earned = currentValue >= m.day
          const toGo = m.day - currentValue
          const content = (
            <div
              style={{
                padding: '14px',
                border: earned ? `1px solid ${accent}40` : '1px dashed var(--line-md)',
                borderRadius: 10,
                background: earned ? `${accent}08` : 'transparent',
                opacity: earned ? 1 : 0.55,
                display: 'flex', flexDirection: 'column', gap: 4,
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 14, color: earned ? accent : 'var(--text-muted)',
                }}>
                  {earned ? '✓' : '○'}
                </span>
                <span style={{
                  fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.1em', color: earned ? accent : 'var(--text-muted)',
                  fontFamily: 'var(--font-body)', fontWeight: 700,
                }}>
                  {unitLabel === 'week' ? `Week ${m.day}` : `Day ${m.day}`}
                </span>
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15, fontWeight: 400,
                color: 'var(--ink)', lineHeight: 1.2,
              }}>
                {m.title}
              </div>
              <div style={{
                fontSize: 11, color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)', lineHeight: 1.45,
              }}>
                {earned ? m.subtitle : `${toGo} ${toGo === 1 ? unitLabel : unitLabel + 's'} to go`}
              </div>
            </div>
          )
          return earned && m.href ? (
            <Link key={m.day} href={m.href} style={{ textDecoration: 'none' }}>
              {content}
            </Link>
          ) : (
            <div key={m.day}>{content}</div>
          )
        })}
      </div>
    </div>
  )
}
