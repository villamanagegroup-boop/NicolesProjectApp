'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { getMyCircleMember, getLiveCalls, type CircleMember, type LiveCall } from '@/lib/circle'
import { MOCK_COHORT, MOCK_MEMBER, MOCK_CALLS, MOCK_MEMBER_COUNT } from '@/data/mockCircle'

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

type CohortRow = { name: string; starts_at: string; ends_at: string }

export default function CircleWelcomePage() {
  const router = useRouter()
  const { loading, isAuthed, user, effectiveIsAdmin, effectivePath } = useApp()
  const [member, setMember] = useState<CircleMember | null>(null)
  const [cohort, setCohort] = useState<CohortRow | null>(null)
  const [nextCall, setNextCall] = useState<LiveCall | null>(null)
  const [memberCount, setMemberCount] = useState<number>(0)
  const [hydrating, setHydrating] = useState(true)

  useEffect(() => {
    if (loading) return

    // Unauthed or admin preview — render from mock cohort.
    if (!isAuthed || effectiveIsAdmin) {
      setMember(MOCK_MEMBER)
      setCohort({ name: MOCK_COHORT.name, starts_at: MOCK_COHORT.starts_at, ends_at: MOCK_COHORT.ends_at })
      setNextCall(MOCK_CALLS.find(c => new Date(c.scheduled_at) > new Date()) ?? null)
      setMemberCount(MOCK_MEMBER_COUNT)
      setHydrating(false)
      return
    }

    if (effectivePath !== 'C') { router.replace('/dashboard'); return }

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
  }, [loading, isAuthed, effectiveIsAdmin, effectivePath, router])

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
  }

  const firstName = user.name?.split(' ')[0] ?? 'there'
  const startsAt = cohort ? new Date(cohort.starts_at) : null
  const endsAt   = cohort ? new Date(cohort.ends_at)   : null

  return (
    <div style={{
      background: ORANGE_PALE,
      margin: '-32px -40px',
      padding: '48px 32px',
      minHeight: 'calc(100vh - 60px)',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Hero */}
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: 16, padding: 32, textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: ORANGE, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px', fontSize: 22,
          }}>✦</div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 8px' }}>
            Welcome to The Circle
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 300, color: 'var(--ink)', margin: '0 0 10px' }}>
            You&apos;re in, {firstName}.
          </h1>
          {member && (
            <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
              You joined the cohort as <strong>{ARCHETYPE_LABELS[member.archetype]}</strong>.
              {' '}Over the next 90 days you&apos;ll go deeper on your archetype, meet your accountability partner,
              and build the practices that make this work stick.
            </p>
          )}
        </div>

        {/* Cohort details */}
        {cohort && startsAt && endsAt && (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
            <Eyebrow>Your cohort</Eyebrow>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, margin: '8px 0 4px' }}>
              {cohort.name}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0 }}>
              {formatRange(startsAt, endsAt)} · {memberCount} {memberCount === 1 ? 'member' : 'members'} enrolled
            </p>
          </div>
        )}

        {/* What to expect */}
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
          <Eyebrow>What to expect</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 14 }}>
            {[
              { t: 'Weekly teaching + archetype track',   d: 'Every Monday a new teaching drops, plus a journal prompt and weekly action tailored to your archetype.' },
              { t: 'Wednesday partner check-ins',         d: 'A prompted message exchange with your accountability partner — keeps things moving without scheduling.' },
              { t: 'Friday wins in the community feed',   d: 'Everyone posts one win. Small is fine. The practice is noticing.' },
              { t: 'Live group calls every other week',   d: 'Six calls across the 90 days. Replays are posted if you can&apos;t make it live.' },
              { t: 'Re-pair option at Day 30',            d: 'If the match isn&apos;t working, request a new pairing — no explanation needed.' },
            ].map(({ t, d }, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: ORANGE, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2,
                }}>{i + 1}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 2px' }}>{t}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next call */}
        {nextCall && (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
            <Eyebrow>Your first live call</Eyebrow>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '10px 0 4px' }}>{nextCall.title}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              {new Date(nextCall.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric',
                hour: 'numeric', minute: '2-digit',
              })}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6, margin: '10px 0 0' }}>
              Come ready to share your 90-day focus in one sentence.
            </p>
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Link href="/circle" style={{ textDecoration: 'none' }}>
            <button style={{
              background: ORANGE, color: '#fff',
              padding: '14px 32px', borderRadius: 12,
              fontSize: 14, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Enter The Circle →
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'var(--text-muted)',
    }}>
      {children}
    </span>
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
