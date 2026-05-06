'use client'

// app/(portal)/circle/page.tsx
// Your Circle — home page for Path C members.
//
// Design direction: matches the universal /dashboard. Row-based sections
// with hairline dividers and a thin orange accent strip on each row, not
// stacked panels with hard borders. Adds:
//   - A daily affirmation pulled from a small rotating set, anchored to
//     the cohort's current week + the day-of-year so it feels consistent
//     across the cohort but varies day-to-day
//   - "Everything in The Circle" overview — a directory of every Circle
//     surface, even if there's nothing happening on it today

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import {
  getMyCircleMember,
  getMyPartner,
  getAllWeeksOverview,
  getMyProgress,
  getLiveCalls,
  getCurrentWeekNumber,
  type CircleMember,
  type WeeklyContent,
  type LiveCall,
} from '@/lib/circle'

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

// The 1:1 private coach thread (Chat with Nicole) is being moved into a
// separate, paid-on-top program. We keep the underlying /circle/coach page
// + DB tables in place but hide every entry point from the user UI behind
// this flag. Flip to true to bring it back without re-adding the JSX.
const COACH_DM_VISIBLE = false

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

// A small rotating affirmation library indexed by archetype + day-of-year.
// Same affirmation for the whole cohort on a given day; rotates daily.
const AFFIRMATIONS: Record<string, string[]> = {
  door: [
    'I let in what is meant for me without abandoning myself.',
    'My presence is not a permission slip for invasion.',
    'I am whole before I am chosen.',
    'My yes is sacred. My no is sovereign.',
  ],
  throne: [
    'I trust the answer I already have.',
    'Thinking is not the same as moving. Today I move.',
    'Clarity arrives in motion, not analysis.',
    'I do not have to figure it all out to begin.',
  ],
  engine: [
    'I am allowed to finish before I start something new.',
    'My energy is not a resource to extract — it is a rhythm to honor.',
    'Completion is its own reward.',
    'I get to choose where my fire goes.',
  ],
  push: [
    'I do not have to outrun stillness to be valuable.',
    'Slowing down is not falling behind.',
    'My worth is not on the other side of exhaustion.',
    'Today I do less, on purpose.',
  ],
  universal: [
    'I am exactly where I need to be.',
    'I belong in this work.',
    'The truth has time today.',
  ],
}

function affirmationFor(archetype: string | null | undefined): string {
  const list = AFFIRMATIONS[archetype ?? 'universal'] ?? AFFIRMATIONS.universal
  // Day-of-year so it rotates ~daily; stable for everyone on the same day.
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return list[dayOfYear % list.length]
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'no-cohort' }
  | { kind: 'needs-intake' }
  | { kind: 'ready'; member: CircleMember }

export default function CirclePage() {
  const router = useRouter()
  const { authUser, loading, isAuthed, user } = useApp()

  const [state, setState]                 = useState<LoadState>({ kind: 'loading' })
  const [partner, setPartner]             = useState<{ archetype: string; users: { name: string | null } | null } | null>(null)
  const [weeks, setWeeks]                 = useState<WeeklyContent[]>([])
  const [progress, setProgress]           = useState<Array<{ week_number: number; journal_completed: boolean; action_completed: boolean }>>([])
  const [calls, setCalls]                 = useState<LiveCall[]>([])
  const [currentWeek, setCurrentWeek]     = useState<number | null>(null)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }
    if (user.selectedPath !== 'C' && !user.isAdmin) return

    (async () => {
      let member = await getMyCircleMember()

      if (!member && authUser) {
        const { data: cohort } = await supabaseClient
          .from('circle_cohorts')
          .select('id')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle()
        if (!cohort) { setState({ kind: 'no-cohort' }); return }

        const { data: assessment } = await supabaseClient
          .from('onboarding_assessments')
          .select('archetype, ennea, attach, feedback, goal')
          .eq('user_id', authUser.id)
          .maybeSingle()
        if (assessment?.archetype) {
          await supabaseClient.from('circle_members').upsert({
            user_id:          authUser.id,
            cohort_id:        cohort.id,
            archetype:        assessment.archetype,
            enneagram_type:   assessment.ennea ?? null,
            attachment_style: assessment.attach ?? null,
            feedback_pref:    assessment.feedback ?? null,
            goal_90day:       assessment.goal ?? null,
          }, { onConflict: 'user_id,cohort_id' })
          member = await getMyCircleMember()
        }
      }

      if (!member) { setState({ kind: 'needs-intake' }); return }

      const missing = !member.enneagram_type || !member.attachment_style
                   || !member.feedback_pref  || !member.goal_90day
      if (missing && !user.isAdmin) {
        router.replace('/circle/intake')
        return
      }

      setState({ kind: 'ready', member })

      const [partnerData, weeksData, progressData, callsData, cohortRow] = await Promise.all([
        member.partner_id ? getMyPartner(member.partner_id) : Promise.resolve(null),
        getAllWeeksOverview(member.cohort_id),
        getMyProgress(member.id),
        getLiveCalls(member.cohort_id),
        supabaseClient.from('circle_cohorts').select('starts_at').eq('id', member.cohort_id).maybeSingle(),
      ])
      setPartner(partnerData as typeof partner)
      setWeeks(weeksData)
      setProgress(progressData as typeof progress)
      setCalls(callsData)
      if (cohortRow.data) setCurrentWeek(getCurrentWeekNumber(cohortRow.data.starts_at as string))
    })()
  }, [loading, isAuthed, authUser, user.selectedPath, user.isAdmin, router])

  if (state.kind === 'loading') {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your Circle…</p>
  }
  if (state.kind === 'no-cohort') {
    return <EmptyState title="The next cohort hasn't opened yet" body="You're on the list — we'll enroll you the moment the next cohort activates." />
  }
  if (state.kind === 'needs-intake') {
    return (
      <EmptyState
        title="Finish your Circle profile"
        body="A few quick questions about your Enneagram, attachment style, and 90-day focus."
        cta={{ href: '/circle/intake', label: 'Start intake →' }}
      />
    )
  }

  const member = state.member
  const completedWeeks = progress.filter(p => p.journal_completed && p.action_completed).length
  const nextCall = calls.find(c => new Date(c.scheduled_at) > new Date())
  const firstName = user.name?.split(' ')[0] ?? ''
  const affirmation = affirmationFor(member.archetype)
  const thisWeekTitle = currentWeek ? weeks.find(w => w.week_number === currentWeek)?.week_title : null
  const phase = currentWeek == null ? null : currentWeek <= 4 ? 'Root' : currentWeek <= 8 ? 'Rebuild' : 'Rise'

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        {firstName && (
          <p style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: ORANGE,
            margin: '0 0 6px',
          }}>
            Welcome back, {firstName}
          </p>
        )}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
          lineHeight: 1.15,
        }}>
          {ARCHETYPE_LABELS[member.archetype]}
        </h1>
        {member.goal_90day && (
          <p style={{
            fontSize: 14, color: 'var(--text-soft)', fontStyle: 'italic',
            lineHeight: 1.6, margin: '8px 0 0',
            maxWidth: 600,
          }}>
            {member.goal_90day}
          </p>
        )}
      </div>

      {/* Today's affirmation — a wide block, not a card. The affirmation is
          the visual centerpiece of the page; everything else supports it. */}
      <div style={{
        background: `linear-gradient(135deg, ${ORANGE_PALE} 0%, #fff 70%)`,
        borderTop: `2px solid ${ORANGE}`,
        borderBottom: '1px solid var(--line)',
        padding: '32px 4px 32px 24px',
        marginBottom: 36,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: ORANGE,
          margin: '0 0 12px', fontFamily: 'var(--font-body)',
        }}>
          Today&apos;s affirmation
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontStyle: 'italic',
          fontWeight: 300, color: 'var(--ink)',
          margin: 0, lineHeight: 1.35, maxWidth: 720,
        }}>
          &ldquo;{affirmation}&rdquo;
        </p>
      </div>

      {/* PROGRESS — 12-week dot strip */}
      <Section
        title="Your 90 days"
        right={<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{completedWeeks} of 12 weeks complete</span>}
      >
        <div style={{ padding: '14px 4px 18px 16px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: 12 }, (_, i) => {
            const wn = i + 1
            const done = progress.find(p => p.week_number === wn && p.journal_completed && p.action_completed)
            const current = wn === currentWeek
            const past = currentWeek != null && wn < currentWeek
            return (
              <Link key={wn} href={`/circle/week/${wn}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  background: done ? ORANGE : current ? '#fff' : 'var(--paper2)',
                  color: done ? '#fff' : current ? ORANGE : past ? 'var(--text-soft)' : 'var(--text-muted)',
                  border: current && !done ? `2px solid ${ORANGE}` : '1px solid var(--line)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  {wn}
                </div>
              </Link>
            )
          })}
        </div>
      </Section>

      {/* Below the wide blocks, split TODAY (left) from "Everything in
          The Circle" (right) on desktop. Stacks back to single column
          under 900px (see <style> at the bottom of the file). */}
      <div className="circle-cols" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 28,
        alignItems: 'start',
      }}>
      <div>
      {/* TODAY — current week + partner + next call as rows */}
      <Section title="Today">
        {currentWeek && (
          <CircleRow
            eyebrow={`This week · ${phase}`}
            badge={`Week ${currentWeek} of 12`}
            title={thisWeekTitle ?? 'Loading…'}
            caption="Teaching, journal prompts, and your weekly action."
            href={`/circle/week/${currentWeek}`}
          />
        )}

        {partner ? (
          <CircleRow
            eyebrow="Accountability partner"
            badge={ARCHETYPE_LABELS[partner.archetype] ?? partner.archetype}
            title={partner.users?.name ?? 'Your partner'}
            caption="Open the thread to check in or reply."
            href="/circle/partner"
          />
        ) : (
          <CircleRow
            eyebrow="Accountability partner"
            badge="Pending"
            title="Pairing happens once the cohort fills"
            caption="You'll be notified when your match is ready."
          />
        )}

        {nextCall ? (
          <CircleRow
            eyebrow={`Next live call · #${nextCall.call_number ?? ''}`}
            badge={liveCallBadge(nextCall.scheduled_at)}
            title={nextCall.title}
            caption={new Date(nextCall.scheduled_at).toLocaleString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
            href="/circle/calls"
            externalCta={nextCall.zoom_url ? { label: 'Join call', href: nextCall.zoom_url } : undefined}
          />
        ) : (
          <CircleRow
            eyebrow="Live calls"
            badge="No upcoming call"
            title="Replays available for past calls"
            caption="Catch up on anything you missed."
            href="/circle/calls"
          />
        )}
      </Section>

      </div>

      <div style={{ position: 'sticky', top: 24 }}>
      {/* EVERYTHING IN THE CIRCLE — directory of every surface */}
      <Section title="Everything in The Circle">
        {/* Chat with Nicole — feature-gated. Lives in a separate program now. */}
        {COACH_DM_VISIBLE && (
          <CircleRow
            eyebrow="Coach"
            badge="Direct line"
            title="Chat with Nicole"
            caption="Private thread with your coach. Voice notes welcome."
            href="/circle/coach"
          />
        )}
        <CircleRow
          eyebrow="Community"
          badge="Cohort feed"
          title="Wins, prompts, and conversations"
          caption="See what the rest of the cohort is sharing this week."
          href="/circle/community"
        />
        <CircleRow
          eyebrow="All weeks"
          badge="Curriculum"
          title="Every week of the program"
          caption="Browse upcoming, current, and past weeks."
          href={`/circle/week/${currentWeek ?? 1}`}
        />
      </Section>
      </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .circle-cols {
            grid-template-columns: 1fr !important;
          }
          .circle-cols > div { position: static !important; }
        }
      `}</style>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
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
        {right}
      </header>
      <div>{children}</div>
    </section>
  )
}

function CircleRow({
  eyebrow, badge, title, caption, href, externalCta,
}: {
  eyebrow: string
  badge: string
  title: string
  caption?: string
  href?: string
  externalCta?: { label: string; href: string }
}) {
  const Inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '18px 4px 18px 16px',
      borderBottom: '1px solid var(--line)',
      position: 'relative', flexWrap: 'wrap',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--paper2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
    >
      <span style={{
        position: 'absolute', left: 0, top: 18, bottom: 18,
        width: 2, background: ORANGE, borderRadius: 2,
      }} />

      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
          textTransform: 'uppercase', color: ORANGE,
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
          fontSize: 16, fontWeight: 600, color: 'var(--ink)',
          fontFamily: 'var(--font-body)', lineHeight: 1.4,
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

      {externalCta && (
        <a
          href={externalCta.href} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            padding: '8px 14px', borderRadius: 7,
            background: ORANGE, color: '#fff',
            fontSize: 12, fontWeight: 600,
            textDecoration: 'none', fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {externalCta.label} ↗
        </a>
      )}

      {href && (
        <span style={{
          color: 'var(--text-muted)', fontSize: 16,
          flexShrink: 0, paddingRight: 4,
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

function liveCallBadge(scheduledAt: string): string {
  const ms = new Date(scheduledAt).getTime() - Date.now()
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  if (days >= 1) return `in ${days} ${days === 1 ? 'day' : 'days'}`
  if (hours >= 1) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  return 'starting soon'
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div style={{
      maxWidth: 540, margin: '0 auto', padding: '48px 24px', textAlign: 'center',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: 24, fontStyle: 'italic',
        fontWeight: 300, color: 'var(--ink)', margin: '0 0 12px',
      }}>
        {title}
      </p>
      <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6, margin: '0 0 20px' }}>
        {body}
      </p>
      {cta && (
        <Link href={cta.href} style={{
          display: 'inline-block', padding: '10px 20px', borderRadius: 999,
          background: ORANGE, color: '#fff', fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
        }}>
          {cta.label}
        </Link>
      )}
    </div>
  )
}
