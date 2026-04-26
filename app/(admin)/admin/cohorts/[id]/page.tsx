// app/(admin)/admin/cohorts/[id]/page.tsx
// Per-cohort admin detail — overview + quick links into members / pairs /
// content / comms scoped (or filterable) to this cohort.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  fetchCohortById, updateCohort,
  fetchAdminMembers, fetchPairMap, fetchLiveCalls,
  type AdminCohortSummary, type AdminMemberRow, type AdminPairRow, type AdminLiveCall,
} from '@/lib/admin/hooks'

const PHASE_COLORS: Record<string, string> = {
  root: 'var(--green)', rebuild: 'var(--gold)', rise: '#3D3080',
}

export default function CohortDetailPage() {
  const params = useParams<{ id: string }>()
  const cohortId = params?.id

  const [cohort, setCohort]   = useState<AdminCohortSummary | null>(null)
  const [members, setMembers] = useState<AdminMemberRow[]>([])
  const [pairs, setPairs]     = useState<AdminPairRow[]>([])
  const [calls, setCalls]     = useState<AdminLiveCall[]>([])
  const [loading, setLoading] = useState(true)

  // Status toggle (activate/archive) state
  const [savingStatus, setSavingStatus] = useState(false)

  useEffect(() => {
    if (!cohortId) return
    setLoading(true)
    ;(async () => {
      const c = await fetchCohortById(cohortId)
      setCohort(c)
      if (c) {
        const [m, p, l] = await Promise.all([
          fetchAdminMembers(c.id, c.current_week),
          fetchPairMap(c.id),
          fetchLiveCalls(c.id),
        ])
        setMembers(m); setPairs(p); setCalls(l)
      }
      setLoading(false)
    })()
  }, [cohortId])

  async function toggleActive() {
    if (!cohort) return
    setSavingStatus(true)
    const next = cohort.status !== 'active'
    await updateCohort(cohort.id, { is_active: next })
    const refreshed = await fetchCohortById(cohort.id)
    setCohort(refreshed)
    setSavingStatus(false)
  }

  if (!cohortId) return null

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading cohort…</div>
  }

  if (!cohort) {
    return (
      <div style={{ color: 'var(--ink)' }}>
        <Link href="/admin/cohorts" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← All cohorts</Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px' }}>Cohort not found</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          It may have been deleted, or your account doesn&apos;t have access.
        </p>
      </div>
    )
  }

  const upcomingCall = calls.find(c => new Date(c.scheduled_at) > new Date())

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 6 }}>
        <Link href="/admin/cohorts" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← All cohorts</Link>
      </div>

      {/* Header */}
      <div style={{
        background: '#fff', border: '1px solid var(--line)', borderRadius: 14,
        padding: 24, marginBottom: 20,
        borderLeft: `4px solid ${PHASE_COLORS[cohort.phase]}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
              {cohort.status} · Week {cohort.current_week} of 12 · {cohort.phase_label}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{cohort.name}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
              <DateOnly iso={cohort.start_date} /> – <DateOnly iso={cohort.end_date} /> · {cohort.member_count}/{cohort.max_members} members
            </p>
          </div>
          <button
            onClick={toggleActive}
            disabled={savingStatus}
            style={{
              fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
              border: '1px solid var(--line-md)',
              background: cohort.status === 'active' ? '#fff' : 'var(--green)',
              color: cohort.status === 'active' ? 'var(--text-soft)' : '#fff',
              cursor: savingStatus ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {savingStatus ? 'Saving…' : cohort.status === 'active' ? 'Mark inactive' : 'Activate cohort'}
          </button>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 18 }}>
          <Stat label="Members"        value={cohort.member_count} />
          <Stat label="Pairs"          value={cohort.pair_count} />
          <Stat label="Engagement"     value={`${cohort.engagement_rate}%`} />
          <Stat label="Days remaining" value={cohort.days_remaining} />
        </div>
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <QuickLink href="/admin/members" title="Members"  sub={`${cohort.member_count} enrolled`} />
        <QuickLink href="/admin/pairs"   title="Pairs"    sub={`${cohort.pair_count} accountability pairs`} />
        <QuickLink href="/admin/content" title="Content + live streams" sub={`${calls.length} calls scheduled`} />
        <QuickLink href="/admin/comms"   title="Comms"    sub="Broadcast + post to feed" />
      </div>

      {/* Alerts strip */}
      {(cohort.alert_counts.red > 0 || cohort.alert_counts.orange > 0 || cohort.alert_counts.amber > 0) && (
        <div style={{
          background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
          padding: 14, marginBottom: 20,
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Engagement alerts
          </span>
          {cohort.alert_counts.red > 0 && (
            <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>{cohort.alert_counts.red} at risk</span>
          )}
          {cohort.alert_counts.orange > 0 && (
            <span style={{ fontSize: 12, color: '#C97D3A', fontWeight: 600 }}>{cohort.alert_counts.orange} check in</span>
          )}
          {cohort.alert_counts.amber > 0 && (
            <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{cohort.alert_counts.amber} monitor</span>
          )}
          <Link href="/admin/members?status=alerts" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--green)', fontWeight: 600, textDecoration: 'none' }}>
            View affected members →
          </Link>
        </div>
      )}

      {/* Next live call */}
      {upcomingCall && (
        <div style={{
          background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
          padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Next live stream
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{upcomingCall.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            <DateTime iso={upcomingCall.scheduled_at} />
          </div>
          <div style={{ marginTop: 10 }}>
            <Link href="/admin/content" style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }}>
              Manage call →
            </Link>
          </div>
        </div>
      )}

      {/* Recent members */}
      <div style={{
        background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
        padding: 16, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Members ({members.length})
          </div>
          <Link href="/admin/members" style={{ fontSize: 12, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
            Open full roster →
          </Link>
        </div>
        {members.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            No members enrolled yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {members.slice(0, 8).map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--paper2)', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {(m.full_name ?? 'M').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, fontSize: 13 }}>{m.full_name ?? 'Unknown'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {m.last_active ? `${m.days_inactive}d ago` : 'never active'}
                </div>
              </div>
            ))}
            {members.length > 8 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
                + {members.length - 8} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ background: 'var(--paper)', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}

function QuickLink({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
        padding: 14, cursor: 'pointer',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '0 0 2px' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </Link>
  )
}

// Date helpers — render '' on first paint, real value after mount, to avoid
// SSR/CSR locale + timezone mismatch.
function DateOnly({ iso }: { iso: string }) {
  const [s, setS] = useState('')
  useEffect(() => {
    setS(new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  }, [iso])
  return <span suppressHydrationWarning>{s}</span>
}

function DateTime({ iso }: { iso: string }) {
  const [s, setS] = useState('')
  useEffect(() => {
    setS(new Date(iso).toLocaleString('en-US', { weekday: 'short', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }))
  }, [iso])
  return <span suppressHydrationWarning>{s}</span>
}
