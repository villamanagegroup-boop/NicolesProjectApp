'use client'

// app/(portal)/dashboard/page.tsx
// Universal home dashboard. Sneak-peek of every program the user is in,
// plus the universal journal prompt and a "Latest" activity feed.
//
// Visual direction: clean row-based sections separated by hairline
// dividers, with thin accent strips on the left of each program row
// instead of full card borders. Reads more like a polished product app
// than a stack of greeting cards.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'
import { supabaseClient } from '@/lib/supabase/client'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'

const SEAL   = '#3D3080'
const CARDS  = '#1A5230'
const CIRCLE = '#C97D3A'
const FALLBACK_PROMPT = 'What is calling for your attention today?'

function computeJournalDay(signupDate: Date | null | undefined): number {
  if (!signupDate) return 1
  const ms = Date.now() - signupDate.getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 0) return 1
  return ((days) % 365) + 1
}

interface Announcement { id: string; title: string; body: string; created_at: string }
interface NextCall { id: string; title: string; scheduled_at: string; zoom_url: string | null; call_number: number }

export default function DashboardPage() {
  const {
    user, dayNumber, todayCard,
    hasWorkAccess, hasCardsAccess, hasCircleAccess,
  } = useApp()

  // Journal prompt
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

  // Circle data
  const [circleWeek, setCircleWeek]       = useState<{ week: number; title: string | null; phase: string | null } | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [nextCall, setNextCall]           = useState<NextCall | null>(null)
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

      const cohortId  = member.cohort_id as string
      const archetype = (member.archetype as string) ?? null

      const { data: cohort } = await supabaseClient
        .from('circle_cohorts')
        .select('starts_at')
        .eq('id', cohortId)
        .maybeSingle()
      if (cancelled) return
      if (cohort?.starts_at) {
        const startMs = new Date(cohort.starts_at as string).getTime()
        const week = Math.max(1, Math.min(12, Math.floor((Date.now() - startMs) / (86400000 * 7)) + 1))
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

      const { data: anns } = await supabaseClient
        .from('admin_announcements')
        .select('id, title, body, created_at, target_archetype')
        .eq('cohort_id', cohortId)
        .not('sent_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8)
      if (!cancelled && anns) {
        setAnnouncements(
          (anns as Array<Announcement & { target_archetype: string | null }>)
            .filter(a => !a.target_archetype || a.target_archetype === archetype)
            .slice(0, 3)
        )
      }

      const { data: calls } = await supabaseClient
        .from('circle_live_calls')
        .select('id, title, scheduled_at, zoom_url, call_number')
        .eq('cohort_id', cohortId)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
      if (!cancelled && calls && calls[0]) {
        setNextCall(calls[0] as NextCall)
      }

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

  // Today date
  const [todayLabel, setTodayLabel] = useState('')
  useEffect(() => {
    setTodayLabel(new Date().toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    }))
  }, [])

  // Seal data
  const sealRouteId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const sealRoute = programRoutes[sealRouteId]
  const sealCurrentDay = Math.min(Math.max(1, dayNumber), 7)
  const sealToday = sealRoute?.days[sealCurrentDay - 1]

  const programRowCount =
    (hasWorkAccess && sealToday ? 1 : 0) +
    (hasCardsAccess ? 1 : 0) +
    (hasCircleAccess ? 1 : 0) +
    1 // journal always counted

  const hasActivity = announcements.length > 0 || !!nextCall || unreadCoach > 0

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.06em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)', margin: '0 0 10px',
        }}>
          {todayLabel}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
          color: 'var(--ink)', margin: 0, lineHeight: 1.15,
          letterSpacing: '-0.01em',
        }}>
          Good {timeOfDay}, {firstName}.
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)', margin: '8px 0 0',
          lineHeight: 1.5,
        }}>
          {hasWorkAccess || hasCardsAccess || hasCircleAccess
            ? "Here's what's waiting for you today."
            : 'Pick a program below to get started.'}
        </p>
      </div>

      {/* Empty access */}
      {!hasWorkAccess && !hasCardsAccess && !hasCircleAccess && (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)',
          marginBottom: 32,
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 20, fontStyle: 'italic',
            fontWeight: 300, color: 'var(--text-muted)',
            margin: '0 0 12px',
          }}>
            No active program yet.
          </p>
          <Link href="/upgrade" style={{
            display: 'inline-block', padding: '10px 20px', borderRadius: 999,
            background: 'var(--ink)', color: '#fff',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            See what&apos;s available →
          </Link>
        </div>
      )}

      {/* TODAY section */}
      {programRowCount > 0 && (
        <Section title="Today" count={programRowCount}>
          {hasWorkAccess && sealToday && (
            <Row
              accent={SEAL}
              eyebrow={`Seal the Leak · ${sealRoute.name}`}
              badge={`Day ${sealCurrentDay} of 7`}
              title={sealToday.title}
              caption={sealToday.phase}
              href="/program/today"
            />
          )}

          {hasCardsAccess && (
            <CardsRow todayCard={todayCard} dayNumber={dayNumber} />
          )}

          {hasCircleAccess && (
            <Row
              accent={CIRCLE}
              eyebrow={`The Circle${circleWeek?.phase ? ` · ${circleWeek.phase}` : ''}`}
              badge={circleWeek ? `Week ${circleWeek.week} of 12` : 'Cohort'}
              title={circleWeek?.title ?? 'This week in the Circle'}
              caption="Teaching, prompts, partner thread"
              href="/circle"
            />
          )}

          <Row
            accent="var(--ink)"
            eyebrow="Universal journal"
            badge={`Day ${journalDay}`}
            title={universalPrompt.length > 100 ? universalPrompt.slice(0, 100) + '…' : universalPrompt}
            caption="A new prompt every day, looped at 365"
            href="/journal"
            italic
          />
        </Section>
      )}

      {/* LATEST section */}
      {hasActivity && (
        <Section title="Latest" count={announcements.length + (nextCall ? 1 : 0) + (unreadCoach > 0 ? 1 : 0)}>
          {nextCall && (
            <ActivityRow
              kind="Call"
              title={nextCall.title}
              meta={liveCallMeta(nextCall.scheduled_at)}
              cta={nextCall.zoom_url ? { label: 'Zoom', href: nextCall.zoom_url, external: true } : undefined}
              link={{ label: 'Details', href: '/circle/calls' }}
            />
          )}
          {announcements.map(a => (
            <ActivityRow
              key={a.id}
              kind="Announcement"
              title={a.title}
              meta={
                <>
                  {a.body.length > 160 ? a.body.slice(0, 160) + '…' : a.body}
                  {' · '}
                  <span style={{ color: 'var(--text-muted)' }}>{relativeTime(a.created_at)}</span>
                </>
              }
            />
          ))}
          {unreadCoach > 0 && (
            <ActivityRow
              kind="Coach"
              title={`${unreadCoach} new ${unreadCoach === 1 ? 'message' : 'messages'} from Nicole`}
              meta="Open the thread to read and reply."
              cta={{ label: 'Open chat', href: '/circle/coach' }}
            />
          )}
        </Section>
      )}
    </div>
  )
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        paddingBottom: 8, borderBottom: '1px solid var(--line)',
        marginBottom: 4,
      }}>
        <h2 style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--text-soft)',
          margin: 0, fontFamily: 'var(--font-body)',
        }}>
          {title}
        </h2>
        {count !== undefined && (
          <span style={{
            fontSize: 11, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            {count} {count === 1 ? 'item' : 'items'}
          </span>
        )}
      </header>
      <div>{children}</div>
    </section>
  )
}

// ── Program row (Seal / Circle / Journal) ────────────────────────────────────
function Row({
  accent, eyebrow, badge, title, caption, href, italic,
}: {
  accent: string
  eyebrow: string
  badge: string
  title: string
  caption?: string
  href: string
  italic?: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '18px 4px 18px 16px',
          borderBottom: '1px solid var(--line)',
          position: 'relative',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        {/* Accent strip */}
        <span style={{
          position: 'absolute', left: 0, top: 18, bottom: 18,
          width: 2, background: accent, borderRadius: 2,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
            textTransform: 'uppercase', color: accent,
            fontFamily: 'var(--font-body)', marginBottom: 6,
          }}>
            {eyebrow}
            <span style={{
              marginLeft: 10, fontWeight: 500,
              padding: '2px 8px', borderRadius: 999,
              background: 'var(--paper2)', color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}>
              {badge}
            </span>
          </div>
          <div style={{
            fontFamily: italic ? 'var(--font-display)' : 'var(--font-body)',
            fontStyle: italic ? 'italic' : 'normal',
            fontSize: 16, fontWeight: italic ? 300 : 600,
            color: 'var(--ink)', lineHeight: 1.4,
          }}>
            {title}
          </div>
          {caption && (
            <div style={{
              fontSize: 12, color: 'var(--text-soft)',
              fontFamily: 'var(--font-body)', marginTop: 4, lineHeight: 1.5,
            }}>
              {caption}
            </div>
          )}
        </div>

        <span style={{
          color: 'var(--text-muted)', fontSize: 16,
          flexShrink: 0, paddingRight: 4,
        }}>
          ›
        </span>
      </div>
    </Link>
  )
}

// ── Cards row (special: includes thumbnail) ──────────────────────────────────
function CardsRow({
  todayCard, dayNumber,
}: {
  todayCard: { id: string; title: string; theme: string; bodyText: string; imageUrl: string | null; cardColor: string; emoji: string } | null
  dayNumber: number
}) {
  if (!todayCard) {
    return (
      <Row
        accent={CARDS}
        eyebrow="365 Cards"
        badge={`Day ${Math.max(1, dayNumber)}`}
        title="Today's card is loading…"
        caption="Your daily alignment card will appear here every morning."
        href="/card"
      />
    )
  }
  return (
    <Link href="/card" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '18px 4px 18px 16px',
          borderBottom: '1px solid var(--line)',
          position: 'relative',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <span style={{
          position: 'absolute', left: 0, top: 18, bottom: 18,
          width: 2, background: CARDS, borderRadius: 2,
        }} />

        {/* Card thumbnail */}
        <div style={{
          width: 56, height: 56, borderRadius: 8,
          background: todayCard.cardColor || 'rgba(26,82,48,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
          position: 'relative', overflow: 'hidden',
        }}>
          {todayCard.imageUrl ? (
            <Image src={todayCard.imageUrl} alt="" fill sizes="56px" style={{ objectFit: 'cover' }} />
          ) : (
            <span>{todayCard.emoji || '✦'}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
            textTransform: 'uppercase', color: CARDS,
            fontFamily: 'var(--font-body)', marginBottom: 6,
          }}>
            365 Cards · {todayCard.theme}
            <span style={{
              marginLeft: 10, fontWeight: 500,
              padding: '2px 8px', borderRadius: 999,
              background: 'var(--paper2)', color: 'var(--text-muted)',
              letterSpacing: '0.04em',
            }}>
              Day {dayNumber}
            </span>
          </div>
          <div style={{
            fontSize: 16, fontWeight: 600,
            color: 'var(--ink)', lineHeight: 1.4,
            fontFamily: 'var(--font-body)',
          }}>
            {todayCard.title}
          </div>
          {todayCard.bodyText && (
            <div style={{
              fontSize: 12, color: 'var(--text-soft)',
              fontFamily: 'var(--font-body)', marginTop: 4, lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {todayCard.bodyText}
            </div>
          )}
        </div>

        <span style={{
          color: 'var(--text-muted)', fontSize: 16,
          flexShrink: 0, paddingRight: 4,
        }}>
          ›
        </span>
      </div>
    </Link>
  )
}

// ── Activity row (Latest section) ────────────────────────────────────────────
function ActivityRow({
  kind, title, meta, cta, link,
}: {
  kind: 'Call' | 'Announcement' | 'Coach'
  title: string
  meta: React.ReactNode
  cta?: { label: string; href: string; external?: boolean }
  link?: { label: string; href: string }
}) {
  const accent = kind === 'Call' ? CIRCLE : kind === 'Coach' ? CIRCLE : 'var(--ink)'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 4px 14px 16px',
      borderBottom: '1px solid var(--line)',
      position: 'relative', flexWrap: 'wrap',
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 14, bottom: 14,
        width: 2, background: accent, borderRadius: 2,
      }} />

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: accent,
          fontFamily: 'var(--font-body)', marginBottom: 4,
        }}>
          {kind}
        </div>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--ink)',
          fontFamily: 'var(--font-body)', lineHeight: 1.4, marginBottom: 4,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)', lineHeight: 1.5,
        }}>
          {meta}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {link && (
          <Link
            href={link.href}
            style={{
              padding: '6px 11px', borderRadius: 6,
              border: '1px solid var(--line-md)',
              color: 'var(--text-soft)', background: '#fff',
              fontSize: 11, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
            }}
          >
            {link.label}
          </Link>
        )}
        {cta && (cta.external ? (
          <a
            href={cta.href} target="_blank" rel="noopener noreferrer"
            style={{
              padding: '6px 12px', borderRadius: 6,
              background: accent, color: '#fff',
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
              padding: '6px 12px', borderRadius: 6,
              background: accent, color: '#fff',
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

// ── Helpers ──────────────────────────────────────────────────────────────────
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
