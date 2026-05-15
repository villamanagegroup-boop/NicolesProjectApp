'use client'

// app/(portal)/circle/page.tsx
// Your Circle — home page for Path C members.
//
// Single-column layout, top to bottom:
//   1. Welcome header (name, archetype, affirmation)
//   2. 12-week progress tracker (past green, current gold, future gray)
//   3. Voice note from Nicole (hidden if not uploaded)
//   4. This week — 4-step card (teaching → journal → action → partner)
//   5. Partner card with this week's prompt
//   6. Live call card (only if a call is scheduled this week)
//   7. Community links (smallest, bottom)
//
// First-time visitors (no member.onboarded_at) are redirected to
// /circle/welcome — the 3-screen onboarding tour.

import { useEffect, useRef, useState } from 'react'
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
  getWeekContent,
  markWeekComplete,
  markPartnerCheckinSent,
  type CircleMember,
  type WeeklyContent,
  type LiveCall,
  type MemberProgress,
} from '@/lib/circle'
import CommunityPreviewCard from '@/components/circle/CommunityPreviewCard'

const ORANGE      = '#B8862E'
const ORANGE_DEEP = '#8c6520'
const ORANGE_PALE = '#fdf6f2'
const GREEN       = '#1F5C3A'
const GREEN_PALE  = '#eaf2ec'
const GRAY        = '#d9d6cf'
const GRAY_TEXT   = '#9a978f'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

// Small rotating affirmation library by archetype, indexed by day-of-year so
// the whole cohort sees the same affirmation on any given day.
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
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return list[dayOfYear % list.length]
}

function isWeekComplete(p: Partial<MemberProgress> | undefined): boolean {
  return !!(p?.teaching_completed && p?.journal_completed && p?.action_completed && p?.partner_checkin_sent_at)
}

function truncate(s: string | null | undefined, max = 90): string {
  if (!s) return ''
  const t = s.trim()
  return t.length <= max ? t : t.slice(0, max - 1).trim() + '…'
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'no-cohort' }
  | { kind: 'needs-intake' }
  | { kind: 'ready'; member: CircleMember }

export default function CirclePage() {
  const router = useRouter()
  const { authUser, loading, isAuthed, user } = useApp()

  // Snapshot "now" on mount so render-time time math stays pure across
  // re-renders. The countdown can be slightly stale until a refresh —
  // acceptable trade-off for a card that drives navigation, not timing.
  const [nowMs] = useState(() => Date.now())
  // Friday + Saturday surface the cohort wins higher on the page. Snapshot
  // the day-of-week the same way so hydration matches and lint stays happy.
  const [dayOfWeek] = useState(() => new Date().getDay())
  const isWinsDay = dayOfWeek === 5 || dayOfWeek === 6

  const [state, setState]                 = useState<LoadState>({ kind: 'loading' })
  const [partner, setPartner]             = useState<{ id: string; archetype: string; users: { name: string | null } | null } | null>(null)
  const [weeks, setWeeks]                 = useState<WeeklyContent[]>([])
  const [progress, setProgress]           = useState<MemberProgress[]>([])
  const [calls, setCalls]                 = useState<LiveCall[]>([])
  const [currentWeek, setCurrentWeek]     = useState<number | null>(null)
  const [universal, setUniversal]         = useState<WeeklyContent | null>(null)
  const [personal,  setPersonal]          = useState<WeeklyContent | null>(null)

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

      // First-time landing → run the 3-screen tour, set onboarded_at, return.
      // Admins skip so they can preview /circle directly.
      if (!member.onboarded_at && !user.isAdmin) {
        router.replace('/circle/welcome')
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
      setProgress(progressData as MemberProgress[])
      setCalls(callsData)

      let wn: number | null = null
      if (cohortRow.data) wn = getCurrentWeekNumber(cohortRow.data.starts_at as string)
      setCurrentWeek(wn)

      // Load the current week's universal + archetype content for the
      // 4-step card, partner prompt, and voice note source URL.
      if (wn) {
        const c = await getWeekContent(wn, member.archetype, member.cohort_id)
        setUniversal(c.universal)
        setPersonal(c.personal)
      }
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
        body="A few quick questions about your Enneagram, attachment style, and 12-week focus."
        cta={{ href: '/circle/intake', label: 'Start intake →' }}
      />
    )
  }

  const member = state.member
  const firstName = user.name?.split(' ')[0] ?? ''
  const affirmation = affirmationFor(member.archetype)

  const completedCount = progress.filter(isWeekComplete).length
  const weeksAhead = currentWeek != null ? Math.max(0, 12 - currentWeek) : 0

  const thisWeekProgress = currentWeek
    ? progress.find(p => p.week_number === currentWeek)
    : undefined
  const thisWeekTitle = currentWeek
    ? weeks.find(w => w.week_number === currentWeek)?.week_title
    : null

  const callThisWeek = calls.find(c => {
    if (!currentWeek) return false
    const ms = new Date(c.scheduled_at).getTime() - nowMs
    return ms > 0 && ms < 7 * 86400000
  })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* The top menu is mounted by app/(portal)/circle/layout.tsx so it
          stays consistent across every Circle page. */}

      {/* ────────────────────────────────────────────────────────────
          1. Welcome header — name, archetype, affirmation
          ──────────────────────────────────────────────────────────── */}
      <header>
        {firstName && (
          <p style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            margin: '0 0 8px',
          }}>
            Welcome back, {firstName}
          </p>
        )}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em',
          lineHeight: 1.1,
        }}>
          {ARCHETYPE_LABELS[member.archetype]}
        </h1>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontStyle: 'italic', fontWeight: 300,
          color: 'var(--text-soft)',
          margin: '14px 0 0', lineHeight: 1.45, maxWidth: 600,
        }}>
          &ldquo;{affirmation}&rdquo;
        </p>
      </header>

      {/* ────────────────────────────────────────────────────────────
          2. 12-week progress tracker
          ──────────────────────────────────────────────────────────── */}
      <WeekProgress
        currentWeek={currentWeek}
        completedCount={completedCount}
        weeksAhead={weeksAhead}
        progress={progress}
      />

      {/* ────────────────────────────────────────────────────────────
          3. Voice note from Nicole — hidden if no audio uploaded
          ──────────────────────────────────────────────────────────── */}
      {universal?.monday_voice_note_url && currentWeek && (
        <VoiceNoteCard
          src={universal.monday_voice_note_url}
          played={!!thisWeekProgress?.voice_note_played}
          memberId={member.id}
          weekNumber={currentWeek}
          onPlayed={() => {
            setProgress(prev => {
              const i = prev.findIndex(p => p.week_number === currentWeek)
              const next = i >= 0
                ? prev.map(p => p.week_number === currentWeek ? { ...p, voice_note_played: true } : p)
                : [...prev, {
                    member_id: member.id, week_number: currentWeek,
                    teaching_completed: false, journal_completed: false,
                    action_completed: false, voice_note_played: true,
                    partner_checkin_sent_at: null, journal_entry: null, completed_at: null,
                    monday_response: null, monday_completed_at: null,
                    friday_win: null, friday_completed_at: null,
                  }]
              return next
            })
          }}
        />
      )}

      {/* ────────────────────────────────────────────────────────────
          Friday/Saturday: cohort wins surface high — below voice note,
          above This Week — to remind members to share.
          ──────────────────────────────────────────────────────────── */}
      {isWinsDay && currentWeek && (
        <CommunityPreviewCard
          cohortId={member.cohort_id}
          weekNumber={currentWeek}
          friday
        />
      )}

      {/* ────────────────────────────────────────────────────────────
          4. This Week — 4-step card
          ──────────────────────────────────────────────────────────── */}
      {currentWeek && member && (
        <ThisWeekCard
          weekNumber={currentWeek}
          weekTitle={thisWeekTitle ?? 'This week'}
          teachingSummary={truncate(universal?.teaching, 80)}
          journalPrompt={truncate(personal?.journal_prompt, 90)}
          actionText={truncate(personal?.weekly_action, 90)}
          partnerName={partner?.users?.name ?? null}
          progress={thisWeekProgress}
          onPartnerComplete={async () => {
            const ok = await markPartnerCheckinSent(member.id, currentWeek)
            if (!ok) return
            const stamp = new Date().toISOString()
            setProgress(prev => {
              const i = prev.findIndex(p => p.week_number === currentWeek)
              return i >= 0
                ? prev.map(p => p.week_number === currentWeek ? { ...p, partner_checkin_sent_at: stamp } : p)
                : [...prev, {
                    member_id: member.id, week_number: currentWeek,
                    teaching_completed: false, journal_completed: false,
                    action_completed: false, voice_note_played: false,
                    partner_checkin_sent_at: stamp, journal_entry: null, completed_at: null,
                    monday_response: null, monday_completed_at: null,
                    friday_win: null, friday_completed_at: null,
                  }]
            })
          }}
        />
      )}

      {/* ────────────────────────────────────────────────────────────
          5. Partner card with this week's prompt
          ──────────────────────────────────────────────────────────── */}
      <PartnerCard
        partner={partner}
        prompt={personal?.partner_prompt ?? universal?.wednesday_prompt ?? null}
        checkInSentAt={thisWeekProgress?.partner_checkin_sent_at ?? null}
      />

      {/* ────────────────────────────────────────────────────────────
          6. Live call card — only when a call is scheduled this week
          ──────────────────────────────────────────────────────────── */}
      {callThisWeek && <LiveCallCard call={callThisWeek} nowMs={nowMs} />}

      {/* ────────────────────────────────────────────────────────────
          7. Cohort activity — Wins/Prompts/All preview.
          On Friday/Saturday this card moves up (see the conditional
          render above the voice-note slot); we suppress this slot then
          to avoid showing it twice.
          ──────────────────────────────────────────────────────────── */}
      {!isWinsDay && currentWeek && (
        <CommunityPreviewCard
          cohortId={member.cohort_id}
          weekNumber={currentWeek}
        />
      )}
    </div>
  )
}

// ── Week progress strip ──────────────────────────────────────────────────────

function WeekProgress({
  currentWeek, completedCount, weeksAhead, progress,
}: {
  currentWeek: number | null
  completedCount: number
  weeksAhead: number
  progress: MemberProgress[]
}) {
  return (
    <section>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10, flexWrap: 'wrap', gap: 6,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          Your 12 weeks
        </h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          <strong style={{ color: GREEN }}>{completedCount}</strong> {completedCount === 1 ? 'week' : 'weeks'} complete
          {currentWeek != null && <> · <strong style={{ color: ORANGE }}>Week {currentWeek}</strong> in progress</>}
          {weeksAhead > 0 && <> · {weeksAhead} {weeksAhead === 1 ? 'week' : 'weeks'} ahead</>}
        </p>
      </div>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 10, padding: 16,
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {Array.from({ length: 12 }, (_, i) => {
          const wn = i + 1
          const p = progress.find(x => x.week_number === wn)
          const done = isWeekComplete(p)
          const isCurrent = wn === currentWeek
          const isPast = currentWeek != null && wn < currentWeek
          const isFuture = currentWeek != null && wn > currentWeek

          // Past weeks: green check (even if not all 4 steps done — show as
          // "elapsed" with a softer green if incomplete).
          const past = isPast && !done

          return (
            <Link key={wn} href={`/circle/week/${wn}`} style={{ textDecoration: 'none' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                background: done ? GREEN
                           : isCurrent ? '#fff'
                           : past ? GREEN_PALE
                           : isFuture ? '#f6f4f0'
                           : 'var(--paper2)',
                color: done ? '#fff'
                      : isCurrent ? ORANGE
                      : past ? GREEN
                      : isFuture ? GRAY_TEXT
                      : 'var(--text-muted)',
                border: isCurrent && !done ? `2px solid ${ORANGE}` : `1px solid ${isFuture ? GRAY : 'var(--line)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: isCurrent && !done ? `0 0 0 4px ${ORANGE}1a` : 'none',
                fontFamily: 'var(--font-body)',
              }}>
                {done ? '✓' : isFuture ? <LockGlyph /> : wn}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function LockGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 016 0v2" />
    </svg>
  )
}

// ── Voice note card ──────────────────────────────────────────────────────────

function VoiceNoteCard({
  src, played, memberId, weekNumber, onPlayed,
}: {
  src: string
  played: boolean
  memberId: string
  weekNumber: number
  onPlayed: () => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [duration, setDuration]   = useState(0)
  const stampedRef = useRef(false)

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { void el.play() } else { el.pause() }
  }

  function handleTimeUpdate(e: React.SyntheticEvent<HTMLAudioElement>) {
    const el = e.currentTarget
    setProgress(el.currentTime)
    // Mark as played when the user hits 80% of the audio length.
    // Stamp once per session — the parent reload of progress isn't needed.
    if (!stampedRef.current && el.duration > 0 && el.currentTime / el.duration >= 0.8) {
      stampedRef.current = true
      void markWeekComplete(memberId, weekNumber, 'voice_note_played')
      onPlayed()
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Number(e.target.value)
    setProgress(el.currentTime)
  }

  function fmt(secs: number): string {
    if (!Number.isFinite(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <section style={{
      background: `linear-gradient(135deg, ${ORANGE_PALE} 0%, #fff 75%)`,
      border: '1px solid var(--line)',
      borderLeft: `3px solid ${ORANGE}`,
      borderRadius: 10,
      padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: ORANGE, margin: 0,
          fontFamily: 'var(--font-body)',
        }}>
          From Nicole this week
        </p>
        {!played && (
          <span style={{
            background: ORANGE, color: '#fff',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 999,
          }}>
            New
          </span>
        )}
      </div>

      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        preload="metadata"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: ORANGE, color: '#fff',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = ORANGE_DEEP)}
          onMouseLeave={e => (e.currentTarget.style.background = ORANGE)}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="4" y="3" width="3" height="10" rx="0.5" /><rect x="9" y="3" width="3" height="10" rx="0.5" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3.5v9l8-4.5-8-4.5z" /></svg>
          )}
        </button>

        <input
          type="range"
          min={0}
          max={Number.isFinite(duration) ? duration : 0}
          step={0.1}
          value={progress}
          onChange={handleSeek}
          style={{
            flex: 1, accentColor: ORANGE,
            height: 4, cursor: 'pointer',
          }}
        />

        <span style={{
          fontSize: 11, color: 'var(--text-muted)',
          fontVariantNumeric: 'tabular-nums', minWidth: 70, textAlign: 'right',
          fontFamily: 'var(--font-body)',
        }}>
          {fmt(progress)} / {fmt(duration)}
        </span>
      </div>
    </section>
  )
}

// ── This week — 4-step card ──────────────────────────────────────────────────

function ThisWeekCard({
  weekNumber, weekTitle, teachingSummary, journalPrompt, actionText, partnerName, progress, onPartnerComplete,
}: {
  weekNumber: number
  weekTitle: string
  teachingSummary: string
  journalPrompt: string
  actionText: string
  partnerName: string | null
  progress: Partial<MemberProgress> | undefined
  onPartnerComplete?: () => void | Promise<void>
}) {
  const teachingDone = !!progress?.teaching_completed
  const journalDone  = !!progress?.journal_completed
  const actionDone   = !!progress?.action_completed
  const partnerDone  = !!progress?.partner_checkin_sent_at

  // Primary CTA cycles through the funnel.
  const cta: { label: string; href: string; success?: boolean } =
    !teachingDone ? { label: 'Start teaching →', href: `/circle/week/${weekNumber}` }
    : !journalDone ? { label: 'Open journal →',   href: `/circle/week/${weekNumber}` }
    : !actionDone  ? { label: 'Log my action →',  href: `/circle/week/${weekNumber}` }
    : !partnerDone ? { label: 'Send partner check-in →', href: '/circle/partner' }
    : { label: "You're done this week ✓", href: `/circle/week/${weekNumber}`, success: true }

  return (
    <section>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          This week · Week {weekNumber}
        </h2>
        <span style={{
          fontSize: 11, color: 'var(--text-muted)',
        }}>
          {weekTitle}
        </span>
      </div>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderLeft: `3px solid ${ORANGE}`,
        borderRadius: 10, overflow: 'hidden',
      }}>
        <Step
          n={1}
          status={teachingDone ? 'done' : 'active'}
          title="Teaching"
          subtitle={teachingSummary || 'This week\'s teaching from Nicole.'}
        />
        <Step
          n={2}
          status={journalDone ? 'done' : teachingDone ? 'active' : 'locked'}
          title="Journal"
          subtitle={journalPrompt || 'Reflect on this week\'s prompt.'}
        />
        <Step
          n={3}
          status={actionDone ? 'done' : journalDone ? 'active' : 'locked'}
          title="Action"
          subtitle={actionText || 'This week\'s one action.'}
        />
        <Step
          n={4}
          status={partnerDone ? 'done' : 'active'}  // never gated
          title="Partner check-in"
          subtitle={partnerName ? `Send this week's check-in to ${partnerName}` : 'Send this week\'s check-in to your partner'}
          onMarkDone={partnerDone ? undefined : onPartnerComplete}
          last
        />

        <Link href={cta.href} style={{ textDecoration: 'none', display: 'block', padding: '12px 16px 16px' }}>
          <button style={{
            width: '100%', padding: '13px 18px',
            borderRadius: 10, border: 'none',
            background: cta.success ? GREEN : ORANGE,
            color: '#fff',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            {cta.label}
          </button>
        </Link>
      </div>
    </section>
  )
}

function Step({
  n, status, title, subtitle, last, onMarkDone,
}: {
  n: number
  status: 'done' | 'active' | 'locked'
  title: string
  subtitle: string
  last?: boolean
  onMarkDone?: () => void | Promise<void>
}) {
  const bg = status === 'done' ? GREEN
           : status === 'active' ? '#fff'
           : '#f6f4f0'
  const fg = status === 'done' ? '#fff'
           : status === 'active' ? ORANGE
           : GRAY_TEXT
  const border = status === 'active' ? `2px solid ${ORANGE}`
               : status === 'done'   ? `1px solid ${GREEN}`
               : `1px solid ${GRAY}`
  const titleColor = status === 'locked' ? GRAY_TEXT : 'var(--ink)'
  const subColor   = status === 'locked' ? GRAY_TEXT : 'var(--text-muted)'

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px 14px 18px',
      borderBottom: last ? 'none' : '1px solid var(--line)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        background: bg, color: fg, border,
        flexShrink: 0, marginTop: 2,
      }}>
        {status === 'done' ? '✓' : status === 'locked' ? <LockGlyph /> : n}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: titleColor, margin: '0 0 4px', lineHeight: 1.35 }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: subColor, margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
          {subtitle}
        </p>
      </div>
      {onMarkDone && status !== 'done' && status !== 'locked' && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); void onMarkDone() }}
          style={{
            background: 'none', border: '1px solid var(--line-md)',
            color: 'var(--text-soft)', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 600,
            padding: '4px 10px', borderRadius: 999,
            cursor: 'pointer', flexShrink: 0, alignSelf: 'center',
          }}
        >
          Mark done
        </button>
      )}
    </div>
  )
}

// ── Partner card ─────────────────────────────────────────────────────────────

function PartnerCard({
  partner, prompt, checkInSentAt,
}: {
  partner: { archetype: string; users: { name: string | null } | null } | null
  prompt: string | null
  checkInSentAt: string | null
}) {
  if (!partner) {
    return (
      <section>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
          color: 'var(--ink)', margin: '0 0 10px', letterSpacing: '-0.01em',
        }}>
          Your partner
        </h2>
        <div style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderLeft: `3px solid ${ORANGE}`,
          borderRadius: 10, padding: '16px 18px',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '0 0 4px', lineHeight: 1.5 }}>
            Pairing happens once the cohort fills.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            You&apos;ll be notified the moment your match is ready.
          </p>
        </div>
      </section>
    )
  }

  const partnerName = partner.users?.name ?? 'Your partner'
  const archLabel   = ARCHETYPE_LABELS[partner.archetype] ?? partner.archetype
  const done = !!checkInSentAt

  return (
    <section>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          Your partner
        </h2>
        {done ? (
          <span style={{
            background: GREEN_PALE, color: GREEN,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 999,
          }}>
            Check-in done ✓
          </span>
        ) : (
          <span style={{
            background: ORANGE, color: '#fff',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 8px', borderRadius: 999,
          }}>
            New
          </span>
        )}
      </div>

      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderLeft: `3px solid ${ORANGE}`,
        borderRadius: 10, padding: '16px 18px',
      }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 2px', lineHeight: 1.4 }}>
          {partnerName}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, letterSpacing: '0.04em' }}>
          {archLabel}
        </p>

        {prompt && (
          <blockquote style={{
            margin: '14px 0 0',
            padding: '12px 14px',
            background: ORANGE_PALE,
            borderLeft: `2px solid ${ORANGE}`,
            borderRadius: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 14, fontStyle: 'italic', fontWeight: 300,
            color: 'var(--ink)', lineHeight: 1.55,
          }}>
            &ldquo;{prompt}&rdquo;
          </blockquote>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Link href="/circle/partner" style={{ textDecoration: 'none', flex: '1 1 200px' }}>
            <button style={{
              width: '100%', padding: '11px 16px',
              borderRadius: 8, border: 'none',
              background: ORANGE, color: '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Reply to {partnerName.split(/\s+/)[0]}
            </button>
          </Link>
          <Link href="/circle/partner" style={{ textDecoration: 'none', flex: '1 1 140px' }}>
            <button style={{
              width: '100%', padding: '11px 16px',
              borderRadius: 8,
              background: 'transparent',
              border: '1px solid var(--line-md)',
              color: 'var(--text-soft)',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-soft)' }}
            >
              View full thread
            </button>
          </Link>
        </div>
      </div>
    </section>
  )
}

// ── Live call card ───────────────────────────────────────────────────────────

function LiveCallCard({ call, nowMs }: { call: LiveCall; nowMs: number }) {
  const when = new Date(call.scheduled_at)
  const dateLabel = when.toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
  const ms = when.getTime() - nowMs
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const countdown = days >= 1 ? `in ${days} ${days === 1 ? 'day' : 'days'}`
                  : hours >= 1 ? `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
                  : 'starting soon'

  return (
    <section>
      <h2 style={{
        fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
        color: 'var(--ink)', margin: '0 0 10px', letterSpacing: '-0.01em',
      }}>
        Live call this week
      </h2>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderLeft: `3px solid ${ORANGE}`,
        borderRadius: 10, padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: ORANGE,
            margin: '0 0 6px', fontFamily: 'var(--font-body)',
          }}>
            Call #{call.call_number} · {countdown}
          </p>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1.4 }}>
            {call.title}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {dateLabel}
          </p>
        </div>
        {call.zoom_url && (
          <a
            href={call.zoom_url} target="_blank" rel="noopener noreferrer"
            style={{
              padding: '11px 18px', borderRadius: 8,
              background: ORANGE, color: '#fff',
              fontSize: 13, fontWeight: 600,
              textDecoration: 'none', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Join call ↗
          </a>
        )}
      </div>
    </section>
  )
}


// ── Empty state ──────────────────────────────────────────────────────────────

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
