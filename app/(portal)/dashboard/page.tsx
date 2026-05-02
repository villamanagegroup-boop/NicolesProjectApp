'use client'

// app/(portal)/dashboard/page.tsx
// Universal home dashboard. Shows a sneak peek of today's work for every
// program the user has access to:
//   - Seal the Leak (Path A)  — current day + today's session
//   - 365 Cards    (Path B / Path A with cards add-on) — today's card
//   - The Circle   (Path C)   — current week
//   - Always: universal journal prompt

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'
import { supabaseClient } from '@/lib/supabase/client'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'

const SEAL   = { fg: '#3D3080', pale: 'rgba(61,48,128,0.08)' }
const CARDS  = { fg: '#1A5230', pale: 'rgba(26,82,48,0.07)'  }
const CIRCLE = { fg: '#C97D3A', pale: 'rgba(201,125,58,0.08)' }
const INK    = { fg: 'var(--ink)', pale: 'rgba(0,0,0,0.04)' }

const FALLBACK_PROMPT = 'What is calling for your attention today?'

function computeJournalDay(signupDate: Date | null | undefined): number {
  if (!signupDate) return 1
  const ms = Date.now() - signupDate.getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 0) return 1
  return ((days) % 365) + 1
}

export default function DashboardPage() {
  const {
    user, dayNumber, todayCard,
    hasWorkAccess, hasCardsAccess, hasCircleAccess,
  } = useApp()

  // Universal journal prompt for today
  const journalDay = computeJournalDay(user.signupDate)
  const [universalPrompt, setUniversalPrompt] = useState<string>(FALLBACK_PROMPT)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabaseClient
        .from('daily_cards')
        .select('journal_prompt')
        .eq('day_number', journalDay)
        .maybeSingle()
      if (cancelled) return
      const p = (data?.journal_prompt as string | null) ?? null
      if (p && p.trim()) setUniversalPrompt(p)
    })()
    return () => { cancelled = true }
  }, [journalDay])

  // Circle current week + announcements + next call + unread coach msg —
  // only fetched if the user has Circle access (Path C).
  const [circleWeek, setCircleWeek]       = useState<{ week: number; title: string | null; phase: string | null } | null>(null)
  const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; body: string; created_at: string }>>([])
  const [nextCall, setNextCall]           = useState<{ id: string; title: string; scheduled_at: string; zoom_url: string | null; call_number: number } | null>(null)
  const [unreadCoach, setUnreadCoach]     = useState(0)

  useEffect(() => {
    if (!hasCircleAccess) return
    let cancelled = false
    ;(async () => {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      if (!authUser) return
      const { data: member } = await supabaseClient
        .from('circle_members')
        .select('cohort_id, archetype, joined_at')
        .eq('user_id', authUser.id)
        .order('joined_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cancelled || !member?.cohort_id) return

      const cohortId = member.cohort_id as string
      const archetype = (member.archetype as string) ?? null

      // Cohort week
      const { data: cohort } = await supabaseClient
        .from('circle_cohorts')
        .select('starts_at')
        .eq('id', cohortId)
        .maybeSingle()
      if (cancelled) return
      let week = 1
      if (cohort?.starts_at) {
        const startMs = new Date(cohort.starts_at as string).getTime()
        week = Math.max(1, Math.min(12, Math.floor((Date.now() - startMs) / (86400000 * 7)) + 1))
        const phase = week <= 4 ? 'Root' : week <= 8 ? 'Rebuild' : 'Rise'
        const { data: content } = await supabaseClient
          .from('circle_weekly_content')
          .select('week_title')
          .eq('cohort_id', cohortId)
          .eq('week_number', week)
          .eq('archetype', 'universal')
          .maybeSingle()
        if (cancelled) return
        setCircleWeek({ week, title: (content?.week_title as string | null) ?? null, phase })
      }

      // Latest 3 announcements that target this user (any archetype OR theirs)
      const { data: anns } = await supabaseClient
        .from('admin_announcements')
        .select('id, title, body, created_at, target_archetype')
        .eq('cohort_id', cohortId)
        .not('sent_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!cancelled && anns) {
        const filtered = (anns as Array<{ id: string; title: string; body: string; created_at: string; target_archetype: string | null }>)
          .filter(a => !a.target_archetype || a.target_archetype === archetype)
          .slice(0, 3)
        setAnnouncements(filtered)
      }

      // Next upcoming live call (within the next 30 days)
      const { data: calls } = await supabaseClient
        .from('circle_live_calls')
        .select('id, title, scheduled_at, zoom_url, call_number')
        .eq('cohort_id', cohortId)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
      if (!cancelled && calls && calls[0]) {
        setNextCall(calls[0] as { id: string; title: string; scheduled_at: string; zoom_url: string | null; call_number: number })
      }

      // Unread coach messages (sender_id !== authUser.id, read_at null)
      const { data: msgs } = await supabaseClient
        .from('circle_coach_messages')
        .select('id, sender_id, read_at')
        .eq('user_id', authUser.id)
        .is('read_at', null)
      if (!cancelled && msgs) {
        const unread = (msgs as Array<{ id: string; sender_id: string; read_at: string | null }>)
          .filter(m => m.sender_id !== authUser.id)
        setUnreadCoach(unread.length)
      }
    })()
    return () => { cancelled = true }
  }, [hasCircleAccess])

  // Greeting
  const firstName = user.name?.split(/\s+/)[0] ?? 'there'
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 9
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  // Seal data — only relevant if hasWorkAccess
  const sealRouteId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const sealRoute = programRoutes[sealRouteId]
  const sealCurrentDay = Math.min(Math.max(1, dayNumber), 7)
  const sealToday = sealRoute?.days[sealCurrentDay - 1]

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)', margin: '0 0 6px',
        }}>
          Good {timeOfDay}, {firstName}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 300,
          color: 'var(--ink)', margin: 0, lineHeight: 1.2,
        }}>
          Here&apos;s what&apos;s waiting for you today.
        </h1>
      </div>

      {/* Program sneak-peek cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>

        {/* Seal the Leak — Path A */}
        {hasWorkAccess && sealToday && (
          <ProgramCard
            palette={SEAL}
            eyebrow={`Seal the Leak · ${sealRoute.name}`}
            day={`Day ${sealCurrentDay} of 7`}
            phase={sealToday.phase}
            title={sealToday.title}
            preview={sealRoute.coreShift}
            cta="Continue today's session"
            href="/program/today"
          />
        )}

        {/* 365 Cards — Path B (or A+addon) */}
        {hasCardsAccess && (
          <CardsTodayPeek
            todayCard={todayCard}
            dayNumber={dayNumber}
          />
        )}

        {/* The Circle — Path C */}
        {hasCircleAccess && (
          <ProgramCard
            palette={CIRCLE}
            eyebrow={`The Circle${circleWeek ? ` · ${circleWeek.phase}` : ''}`}
            day={circleWeek ? `Week ${circleWeek.week} of 12` : 'Your cohort'}
            phase={circleWeek?.title ?? null}
            title={circleWeek?.title ?? 'This week in the Circle'}
            preview="Teaching, journal prompts, and your accountability partner thread are all here."
            cta="Open this week"
            href="/circle"
            secondaryCta={{ label: 'Coach chat', href: '/circle/coach' }}
          />
        )}

        {/* Empty access state — they have a path but nothing visible */}
        {!hasWorkAccess && !hasCardsAccess && !hasCircleAccess && (
          <div style={{
            background: '#fff', border: '1px solid var(--line)',
            borderRadius: 14, padding: 24, textAlign: 'center',
          }}>
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic',
              fontWeight: 300, color: 'var(--text-muted)',
              margin: '0 0 8px',
            }}>
              No active program yet.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              Pick a program to get started.
            </p>
            <Link href="/upgrade" style={{
              display: 'inline-block', padding: '10px 18px', borderRadius: 999,
              background: 'var(--ink)', color: '#fff',
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              See what&apos;s available →
            </Link>
          </div>
        )}
      </div>

      {/* Latest — announcements, calls, messages.
          Only shown when there's something to surface. */}
      {(announcements.length > 0 || nextCall || unreadCoach > 0) && (
        <div style={{ marginBottom: 24 }}>
          <SectionHeader>Latest</SectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Next live call */}
            {nextCall && (
              <ActivityRow
                icon="📞"
                eyebrow={`Live call · #${nextCall.call_number}`}
                title={nextCall.title}
                meta={liveCallMeta(nextCall.scheduled_at)}
                cta={nextCall.zoom_url ? { label: 'Open Zoom', href: nextCall.zoom_url, external: true } : undefined}
                secondaryCta={{ label: 'Details', href: '/circle/calls' }}
              />
            )}

            {/* Announcements */}
            {announcements.map(a => (
              <ActivityRow
                key={a.id}
                icon="📢"
                eyebrow="Announcement"
                title={a.title}
                meta={
                  <>
                    {a.body.length > 140 ? a.body.slice(0, 140) + '…' : a.body}
                    {' · '}
                    <span style={{ color: 'var(--text-muted)' }}>{relativeTime(a.created_at)}</span>
                  </>
                }
              />
            ))}

            {/* Unread coach messages */}
            {unreadCoach > 0 && (
              <ActivityRow
                icon="✉️"
                eyebrow="Coach chat"
                title={`${unreadCoach} new ${unreadCoach === 1 ? 'message' : 'messages'} from Nicole`}
                meta="Open the thread to read and reply."
                cta={{ label: 'Open chat', href: '/circle/coach' }}
                accent="#C97D3A"
              />
            )}
          </div>
        </div>
      )}

      {/* Universal journal — always visible */}
      <ProgramCard
        palette={INK}
        eyebrow="Always with you"
        day={`Day ${journalDay}`}
        phase="Universal journal"
        title={universalPrompt.length > 90 ? universalPrompt.slice(0, 90) + '…' : universalPrompt}
        preview="A new prompt every day. Same first day for everyone — the rhythm is yours to keep."
        cta="Write today's entry"
        href="/journal"
        compact
      />
    </div>
  )
}

// ── Components ───────────────────────────────────────────────────────────────

function ProgramCard({
  palette, eyebrow, day, phase, title, preview,
  cta, href, secondaryCta, compact,
}: {
  palette: { fg: string; pale: string }
  eyebrow: string
  day: string
  phase: string | null
  title: string
  preview: string
  cta: string
  href: string
  secondaryCta?: { label: string; href: string }
  compact?: boolean
}) {
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${palette.fg}22`,
      borderLeft: `3px solid ${palette.fg}`,
      borderRadius: 14,
      padding: compact ? 18 : 22,
      display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: palette.fg,
          fontFamily: 'var(--font-body)', margin: '0 0 6px',
        }}>
          {eyebrow}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 999,
            background: palette.pale, color: palette.fg,
            fontFamily: 'var(--font-body)',
          }}>
            {day}
          </span>
          {phase && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {phase}
            </span>
          )}
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: compact ? 18 : 22,
          fontWeight: 300, color: 'var(--ink)',
          margin: '0 0 8px', lineHeight: 1.3,
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6,
          margin: 0, fontFamily: 'var(--font-body)',
        }}>
          {preview}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0, flexWrap: 'wrap' }}>
        {secondaryCta && (
          <Link
            href={secondaryCta.href}
            style={{
              display: 'inline-block',
              padding: '10px 16px', borderRadius: 8,
              border: `1px solid ${palette.fg}33`,
              color: palette.fg, background: '#fff',
              fontSize: 12, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
            }}
          >
            {secondaryCta.label} →
          </Link>
        )}
        <Link
          href={href}
          style={{
            display: 'inline-block',
            padding: '10px 18px', borderRadius: 8,
            background: palette.fg, color: '#fff',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          {cta} →
        </Link>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      marginBottom: 10, paddingBottom: 6,
      borderBottom: '1px solid var(--line)',
      fontFamily: 'var(--font-body)',
    }}>
      {children}
    </div>
  )
}

function ActivityRow({
  icon, eyebrow, title, meta, cta, secondaryCta, accent,
}: {
  icon: string
  eyebrow: string
  title: string
  meta: React.ReactNode
  cta?: { label: string; href: string; external?: boolean }
  secondaryCta?: { label: string; href: string }
  accent?: string
}) {
  const accentColor = accent ?? 'var(--ink)'
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line)',
      borderRadius: 12, padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--paper2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: accentColor,
          fontFamily: 'var(--font-body)', margin: '0 0 4px',
        }}>
          {eyebrow}
        </p>
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14, fontWeight: 600, color: 'var(--ink)',
          marginBottom: 4, lineHeight: 1.4,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.55,
          fontFamily: 'var(--font-body)',
        }}>
          {meta}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {secondaryCta && (
          <Link
            href={secondaryCta.href}
            style={{
              padding: '7px 12px', borderRadius: 7,
              border: '1px solid var(--line-md)',
              color: 'var(--text-soft)', background: '#fff',
              fontSize: 11, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >
            {secondaryCta.label}
          </Link>
        )}
        {cta && (cta.external ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '7px 14px', borderRadius: 7,
              background: accentColor, color: '#fff',
              fontSize: 11, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >
            {cta.label} ↗
          </a>
        ) : (
          <Link
            href={cta.href}
            style={{
              padding: '7px 14px', borderRadius: 7,
              background: accentColor, color: '#fff',
              fontSize: 11, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >
            {cta.label} →
          </Link>
        ))}
      </div>
    </div>
  )
}

function liveCallMeta(scheduledAt: string): React.ReactNode {
  const ms = new Date(scheduledAt).getTime() - Date.now()
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const formatted = new Date(scheduledAt).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
  let when: string
  if (days >= 1) when = `in ${days} ${days === 1 ? 'day' : 'days'}`
  else if (hours >= 1) when = `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  else when = 'starting soon'
  return <>{formatted} · <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{when}</span></>
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 1) {
    const hours = Math.floor(ms / 3600000)
    if (hours < 1) return 'just now'
    return `${hours}h ago`
  }
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function CardsTodayPeek({
  todayCard, dayNumber,
}: {
  todayCard: { id: string; title: string; theme: string; bodyText: string; imageUrl: string | null; cardColor: string; emoji: string } | null
  dayNumber: number
}) {
  if (!todayCard) {
    return (
      <ProgramCard
        palette={CARDS}
        eyebrow="365 Cards"
        day={`Day ${Math.max(1, dayNumber)}`}
        phase={null}
        title="Today's card is loading…"
        preview="Your daily alignment card will appear here every morning."
        cta="Open today's card"
        href="/card"
      />
    )
  }
  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${CARDS.fg}22`,
      borderLeft: `3px solid ${CARDS.fg}`,
      borderRadius: 14,
      padding: 22,
      display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
    }}>
      {/* Card image / color block (left) */}
      <div style={{
        width: 96, height: 96,
        borderRadius: 12, overflow: 'hidden',
        background: todayCard.cardColor || CARDS.pale,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, flexShrink: 0,
        position: 'relative',
      }}>
        {todayCard.imageUrl ? (
          <Image
            src={todayCard.imageUrl}
            alt=""
            fill
            sizes="96px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span>{todayCard.emoji || '✦'}</span>
        )}
      </div>

      {/* Content (middle, flex) */}
      <div style={{ flex: 1, minWidth: 240 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: CARDS.fg,
          fontFamily: 'var(--font-body)', margin: '0 0 6px',
        }}>
          365 Cards
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 999,
            background: CARDS.pale, color: CARDS.fg,
            fontFamily: 'var(--font-body)',
          }}>
            Day {dayNumber}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {todayCard.theme}
          </span>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22, fontWeight: 300, color: 'var(--ink)',
          margin: '0 0 8px', lineHeight: 1.3,
        }}>
          {todayCard.title}
        </h3>
        {todayCard.bodyText && (
          <p style={{
            fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6,
            margin: 0, fontFamily: 'var(--font-body)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {todayCard.bodyText}
          </p>
        )}
      </div>

      {/* CTA (right) — matches other ProgramCards */}
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'flex-start' }}>
        <Link
          href="/card"
          style={{
            display: 'inline-block',
            padding: '10px 18px', borderRadius: 8,
            background: CARDS.fg, color: '#fff',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
          }}
        >
          Open today&apos;s card →
        </Link>
      </div>
    </div>
  )
}
