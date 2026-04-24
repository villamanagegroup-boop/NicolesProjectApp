'use client'
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
import {
  MOCK_COHORT,
  MOCK_MEMBER,
  MOCK_PARTNER,
  MOCK_WEEKS_OVERVIEW,
  MOCK_PROGRESS,
  MOCK_CALLS,
} from '@/data/mockCircle'

const ORANGE      = '#C97D3A'
const ORANGE_DEEP = '#a66128'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'no-cohort' }                  // path C but no active cohort exists
  | { kind: 'needs-intake' }               // member row missing required fields, or no member row
  | { kind: 'ready'; member: CircleMember } // fully enrolled

export default function CirclePage() {
  const router = useRouter()
  const { authUser, loading, isAuthed, effectiveIsAdmin, effectivePath, user } = useApp()

  const [state, setState]         = useState<LoadState>({ kind: 'loading' })
  const [partner, setPartner]     = useState<any>(null)
  const [weeks, setWeeks]         = useState<WeeklyContent[]>([])
  const [progress, setProgress]   = useState<any[]>([])
  const [calls, setCalls]         = useState<LiveCall[]>([])
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)

  useEffect(() => {
    if (loading) return

    // Unauthed preview — render the full Circle experience from mock data.
    if (!isAuthed) {
      setState({ kind: 'ready', member: MOCK_MEMBER })
      setPartner(MOCK_PARTNER)
      setWeeks(MOCK_WEEKS_OVERVIEW)
      setProgress(MOCK_PROGRESS)
      setCalls(MOCK_CALLS)
      setCurrentWeek(getCurrentWeekNumber(MOCK_COHORT.starts_at))
      return
    }

    if (!effectiveIsAdmin && effectivePath !== 'C') return // layout will redirect

    (async () => {
      let member = await getMyCircleMember()

      // No member row — try to auto-enroll using onboarding data.
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
          // Upsert — may create a row with partial data; intake page can fill gaps later.
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

      // Still no member? Admin previewing with no enrollment, or a data edge case.
      if (!member) {
        if (effectiveIsAdmin) { setState({ kind: 'no-cohort' }); return }
        setState({ kind: 'needs-intake' }); return
      }

      // Gate: any required field missing → route to intake.
      const missing = !member.enneagram_type || !member.attachment_style
                   || !member.feedback_pref  || !member.goal_90day
      if (missing && !effectiveIsAdmin) {
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
      setPartner(partnerData)
      setWeeks(weeksData)
      setProgress(progressData)
      setCalls(callsData)
      if (cohortRow.data) setCurrentWeek(getCurrentWeekNumber(cohortRow.data.starts_at))
    })()
  }, [loading, isAuthed, authUser, effectivePath, effectiveIsAdmin, router])

  if (state.kind === 'loading') {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your Circle…</p>
  }

  if (state.kind === 'no-cohort') {
    return (
      <EmptyState
        title="The next cohort hasn't opened yet"
        body="You're on the list — we'll enroll you the moment the next cohort activates."
      />
    )
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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        {firstName && (
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 6px' }}>
            Welcome back, {firstName}
          </p>
        )}
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--ink)', margin: '0 0 4px' }}>
          {ARCHETYPE_LABELS[member.archetype]}
        </h1>
        {member.goal_90day && (
          <p style={{ fontSize: 13, color: 'var(--text-soft)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
            90-day focus: {member.goal_90day}
          </p>
        )}
      </div>

      {/* Progress strip */}
      <Panel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Eyebrow>Your progress</Eyebrow>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{completedWeeks} / 12 weeks complete</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: 12 }, (_, i) => {
            const wn = i + 1
            const done = progress.find(p => p.week_number === wn && p.journal_completed && p.action_completed)
            const current = wn === currentWeek
            const bg = done ? ORANGE : current ? '#fff' : 'var(--paper2)'
            const color = done ? '#fff' : current ? ORANGE : 'var(--text-muted)'
            const border = current && !done ? `2px solid ${ORANGE}` : '2px solid transparent'
            return (
              <Link key={wn} href={`/circle/week/${wn}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  background: bg, color, border,
                  transition: 'all .15s',
                  cursor: 'pointer',
                }}>
                  {wn}
                </div>
              </Link>
            )
          })}
        </div>
      </Panel>

      {/* This week */}
      {currentWeek && (
        <Link href={`/circle/week/${currentWeek}`} style={{ textDecoration: 'none' }}>
          <div style={{
            background: ORANGE, color: '#fff',
            borderRadius: 14, padding: 22,
            cursor: 'pointer', transition: 'background .15s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = ORANGE_DEEP }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ORANGE }}
          >
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', margin: '0 0 4px' }}>
              This week · Week {currentWeek}
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: '0 0 8px' }}>
              {weeks.find(w => w.week_number === currentWeek)?.week_title ?? 'Loading…'}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: 0 }}>Tap to open this week&apos;s content →</p>
          </div>
        </Link>
      )}

      {/* Accountability partner */}
      <Panel>
        <Eyebrow>Accountability partner</Eyebrow>
        {partner ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700,
              background: ORANGE, color: '#fff',
              flexShrink: 0,
            }}>
              {(partner.users?.name ?? 'P').charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{partner.users?.name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{ARCHETYPE_LABELS[partner.archetype]}</p>
            </div>
            <Link href="/circle/partner" style={{ textDecoration: 'none' }}>
              <button style={ghostBtn}>Message</button>
            </Link>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
            Partner pairing happens after the cohort fills up — you&apos;ll be notified.
          </p>
        )}
      </Panel>

      {/* Next live call */}
      {nextCall && (
        <Panel>
          <Eyebrow>Next live call</Eyebrow>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '8px 0 2px' }}>{nextCall.title}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {new Date(nextCall.scheduled_at).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {nextCall.zoom_url && (
              <a href={nextCall.zoom_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button style={primaryBtn}>Join call →</button>
              </a>
            )}
            {nextCall.recording_url && (
              <a href={nextCall.recording_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button style={ghostBtn}>Watch replay</button>
              </a>
            )}
          </div>
        </Panel>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <QuickLink href="/circle/community" title="Community" sub="Wins, prompts, posts" />
        <QuickLink href="/circle/calls"     title="All calls"  sub="Schedule + replays"  />
      </div>

    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
      {children}
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
      {children}
    </span>
  )
}

function QuickLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
        padding: 16, cursor: 'pointer', transition: 'border-color .15s',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = ORANGE }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--line)' }}
      >
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 2px' }}>{title}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>{sub}</p>
      </div>
    </Link>
  )
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div style={{
      maxWidth: 520, margin: '40px auto', textAlign: 'center',
      background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 40,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: ORANGE_PALE, color: ORANGE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px', fontSize: 22,
      }}>✦</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--ink)', margin: '0 0 8px' }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: '0 0 20px' }}>{body}</p>
      {cta && (
        <Link href={cta.href} style={{ textDecoration: 'none' }}>
          <button style={primaryBtn}>{cta.label}</button>
        </Link>
      )}
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  background: ORANGE, color: '#fff',
  padding: '10px 20px', borderRadius: 10,
  fontSize: 13, fontWeight: 600,
  border: 'none', cursor: 'pointer',
  fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  background: '#fff', border: `1px solid ${ORANGE}`,
  color: ORANGE,
  padding: '8px 16px', borderRadius: 10,
  fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}
