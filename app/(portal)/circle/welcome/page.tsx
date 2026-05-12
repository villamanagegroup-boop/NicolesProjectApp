'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { getMyCircleMember, getLiveCalls, type CircleMember, type LiveCall } from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

type CohortRow = { name: string; starts_at: string; ends_at: string }

export default function CircleWelcomePage() {
  const router = useRouter()
  const { loading, isAuthed, user } = useApp()
  const [member, setMember] = useState<CircleMember | null>(null)
  const [cohort, setCohort] = useState<CohortRow | null>(null)
  const [nextCall, setNextCall] = useState<LiveCall | null>(null)
  const [memberCount, setMemberCount] = useState<number>(0)
  const [hydrating, setHydrating] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }

    // Non-Path-C non-admin → bounce to dashboard.
    // Admins always proceed; if they have no member row, getMyCircleMember
    // returns null and we redirect them to /circle for the intake flow.
    if (user.selectedPath !== 'C' && !user.isAdmin) { router.replace('/dashboard'); return }

    (async () => {
      const m = await getMyCircleMember()
      if (!m) { router.replace('/circle'); return }
      setMember(m)

      const [cohortRes, callsData, countRes] = await Promise.all([
        supabaseClient.from('circle_cohorts').select('name, starts_at, ends_at').eq('id', m.cohort_id).maybeSingle(),
        getLiveCalls(m.cohort_id),
        supabaseClient.from('circle_members').select('id', { count: 'exact', head: true }).eq('cohort_id', m.cohort_id),
      ])
      if (cohortRes.data) setCohort(cohortRes.data as CohortRow)
      setNextCall(callsData.find(c => new Date(c.scheduled_at) > new Date()) ?? null)
      setMemberCount(countRes.count ?? 0)
      setHydrating(false)
    })()
  }, [loading, isAuthed, user.selectedPath, user.isAdmin, router])

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
  }

  const firstName = user.name?.split(' ')[0] ?? 'there'
  const startsAt = cohort ? new Date(cohort.starts_at) : null
  const endsAt   = cohort ? new Date(cohort.ends_at)   : null

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Hero — full-width gradient block, same treatment as the affirmation
          on /circle home. */}
      <div style={{
        background: `linear-gradient(135deg, ${ORANGE_PALE} 0%, #fff 70%)`,
        borderTop: `2px solid ${ORANGE}`,
        borderBottom: '1px solid var(--line)',
        padding: '40px 4px 40px 24px',
        marginBottom: 22,
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 14px', fontFamily: 'var(--font-body)' }}>
          Welcome to The Circle
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontStyle: 'italic', fontWeight: 300, color: 'var(--ink)', margin: 0, lineHeight: 1.2, maxWidth: 720, letterSpacing: '-0.01em' }}>
          You&apos;re in, {firstName}.
        </h1>
        {member && (
          <p style={{ fontSize: 15, color: 'var(--text-soft)', lineHeight: 1.65, margin: '14px 0 0', maxWidth: 720 }}>
            You joined the cohort as <strong>{ARCHETYPE_LABELS[member.archetype]}</strong>.
            {' '}Over the next 12 weeks you&apos;ll go deeper on your archetype, meet your accountability partner,
            and build the practices that make this work stick.
          </p>
        )}
      </div>

      <div className="welcome-cols" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 28, alignItems: 'start',
      }}>

      {/* What to expect — list of rows */}
      <div>
        <Section title="What to expect">
          {[
            { t: 'Weekly teaching + archetype track',   d: 'Every Monday a new teaching drops, plus a journal prompt and weekly action tailored to your archetype.' },
            { t: 'Wednesday partner check-ins',         d: 'A prompted message exchange with your accountability partner — keeps things moving without scheduling.' },
            { t: 'Friday wins in the community feed',   d: 'Everyone posts one win. Small is fine. The practice is noticing.' },
            { t: 'Live group calls every other week',   d: 'Six calls across the 12 weeks. Replays are posted if you can’t make it live.' },
            { t: 'Re-pair option at Day 30',            d: 'If the match isn’t working, request a new pairing — no explanation needed.' },
          ].map(({ t, d }, i) => (
            <ExpectRow key={i} num={i + 1} title={t} body={d} />
          ))}
        </Section>
      </div>

      {/* Right column — cohort details + first call + CTA, sticky */}
      <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {cohort && startsAt && endsAt && (
          <Section title="Your cohort">
            <div style={{ padding: '14px 16px 14px 18px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: ORANGE, borderRadius: 2 }} />
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, margin: '0 0 6px', color: 'var(--ink)' }}>
                {cohort.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                {formatRange(startsAt, endsAt)} · {memberCount} {memberCount === 1 ? 'member' : 'members'} enrolled
              </p>
            </div>
          </Section>
        )}

        {nextCall && (
          <Section title="Your first live call">
            <div style={{ padding: '14px 16px 14px 18px', position: 'relative' }}>
              <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: ORANGE, borderRadius: 2 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px', lineHeight: 1.4 }}>{nextCall.title}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                {new Date(nextCall.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, margin: '8px 0 0' }}>
                Come ready to share your 12-week focus in one sentence.
              </p>
            </div>
          </Section>
        )}

        <Link href="/circle" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%',
            background: ORANGE, color: '#fff',
            padding: '14px 24px', borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            Enter The Circle →
          </button>
        </Link>
      </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .welcome-cols {
            grid-template-columns: 1fr !important;
          }
          .welcome-cols > div { position: static !important; }
        }
        .expect-row:last-child { border-bottom: none !important; }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <header style={{ marginBottom: 10 }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
      </header>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 10, overflow: 'hidden',
      }}>{children}</div>
    </section>
  )
}

function ExpectRow({ num, title, body }: { num: number; title: string; body: string }) {
  return (
    <div className="expect-row" style={{
      display: 'flex', alignItems: 'flex-start', gap: 14,
      padding: '14px 16px 14px 18px',
      borderBottom: '1px solid var(--line)',
      position: 'relative',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: ORANGE, borderRadius: 2 }} />
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: ORANGE_PALE, color: ORANGE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
        fontFamily: 'var(--font-body)',
      }}>{num}</div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>{title}</p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0, fontFamily: 'var(--font-body)' }}>{body}</p>
      </div>
    </div>
  )
}

function formatRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const sameYear = start.getFullYear() === end.getFullYear()
  const s = start.toLocaleDateString('en-US', opts)
  const e = end.toLocaleDateString('en-US',   sameYear ? opts : { ...opts, year: 'numeric' })
  const year = sameYear ? `, ${end.getFullYear()}` : ''
  return `${s} – ${e}${year}`
}
