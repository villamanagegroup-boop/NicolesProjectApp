// app/(admin)/admin/page.tsx
// Main admin dashboard — weekly summary + alerts + cohort health

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchAdminCohorts, fetchEngagementAlerts, resolveAlert, snoozeAlert,
  type AdminCohortSummary, type AdminEngagementAlert,
} from '@/lib/admin/hooks'

const ARCHETYPE_COLORS: Record<string, string> = {
  door: 'var(--green)', throne: '#1a1a2e', engine: 'var(--red)', push: '#3d2c0e',
}
const ARCHETYPE_LABELS: Record<string, string> = {
  door: 'Open Door', throne: 'Overthink Throne', engine: 'Interrupted Engine', push: 'Pushthrough',
}
const PHASE_COLORS: Record<string, string> = {
  root: 'var(--green)', rebuild: 'var(--gold)', rise: '#3D3080',
}

function AlertBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    amber:  { bg: 'rgba(184,146,42,.15)', text: 'var(--gold)', label: 'Monitor' },
    orange: { bg: 'rgba(201,125,58,.15)',  text: '#C97D3A', label: 'Check in' },
    red:    { bg: 'rgba(139,31,47,.25)',  text: 'var(--red)', label: 'At risk' },
  }
  const c = colors[level] ?? colors.amber
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '2px 8px',
      borderRadius: '10px', background: c.bg, color: c.text,
      letterSpacing: '.05em', textTransform: 'uppercase',
    }}>
      {c.label}
    </span>
  )
}

function EngagementBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'var(--green)' : rate >= 60 ? 'var(--gold)' : 'var(--red)'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
          Engagement
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color }}>{rate}%</span>
      </div>
      <div style={{ height: '4px', background: 'var(--line)', borderRadius: '2px' }}>
        <div style={{ height: '4px', width: `${rate}%`, background: color, borderRadius: '2px', transition: 'width .6s ease' }} />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  const [alerts, setAlerts] = useState<AdminEngagementAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAdminCohorts(), fetchEngagementAlerts()])
      .then(([c, a]) => { setCohorts(c); setAlerts(a) })
      .finally(() => setLoading(false))
  }, [])

  async function handleResolve(alertId: string) {
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return
    await resolveAlert(alertId, user.id)
    setAlerts(a => a.filter(x => x.id !== alertId))
  }

  async function handleSnooze(alertId: string) {
    await snoozeAlert(alertId, 48)
    setAlerts(a => a.filter(x => x.id !== alertId))
  }

  const activeCohorts = cohorts.filter(c => c.status === 'active')
  const totalAlerts = alerts.length
  const redAlerts = alerts.filter(a => a.alert_level === 'red').length

  // Compute on mount only — locale/timezone can differ between server and
  // client and trigger a hydration mismatch if rendered at SSR time.
  const [today, setToday] = useState('')
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
  }, [])

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
          {today}
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
          Good morning
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
          {activeCohorts.length} active cohort{activeCohorts.length !== 1 ? 's' : ''}
          {totalAlerts > 0 && ` · ${totalAlerts} member${totalAlerts !== 1 ? 's' : ''} need${totalAlerts === 1 ? 's' : ''} attention`}
          {redAlerts > 0 && ` (${redAlerts} at risk)`}
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading dashboard...</div>
      ) : (
        <>
          {/* Top stat row — auto-wraps to 2x2 on narrow screens */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Active cohorts', value: activeCohorts.length, color: 'var(--green)' },
              { label: 'Total members', value: activeCohorts.reduce((s, c) => s + c.member_count, 0), color: 'var(--gold)' },
              { label: 'Engagement alerts', value: totalAlerts, color: totalAlerts > 0 ? '#C97D3A' : 'var(--text-muted)' },
              { label: 'At-risk members', value: redAlerts, color: redAlerts > 0 ? 'var(--red)' : 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#ffffff', border: '1px solid var(--line)',
                borderRadius: '12px', padding: '16px',
              }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Active cohorts */}
          {activeCohorts.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: '12px', paddingBottom: '8px',
                borderBottom: '1px solid var(--line)',
              }}>
                Active cohorts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                {activeCohorts.map(c => (
                  <Link
                    key={c.id}
                    href={`/admin/cohorts/${c.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: '#ffffff', border: '1px solid var(--line)',
                      borderRadius: '14px', padding: '18px',
                      borderLeft: `3px solid ${PHASE_COLORS[c.phase]}`,
                      cursor: 'pointer', transition: 'border-color .15s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '3px' }}>
                            Week {c.current_week} · {c.phase_label}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>{c.name}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.days_remaining}d left</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.member_count}/{c.max_members} members</div>
                        </div>
                      </div>

                      <EngagementBar rate={c.engagement_rate} />

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                        {c.alert_counts.red > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--red)', background: 'rgba(139,31,47,.2)', padding: '2px 8px', borderRadius: '8px' }}>
                            {c.alert_counts.red} at risk
                          </span>
                        )}
                        {c.alert_counts.orange > 0 && (
                          <span style={{ fontSize: '11px', color: '#C97D3A', background: 'rgba(201,125,58,.15)', padding: '2px 8px', borderRadius: '8px' }}>
                            {c.alert_counts.orange} check in
                          </span>
                        )}
                        {c.next_call && (
                          <span style={{ fontSize: '11px', color: 'var(--gold)', background: 'rgba(184,146,42,.12)', padding: '2px 8px', borderRadius: '8px' }}>
                            Call {c.next_call.call_number} → {new Date(c.next_call.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Engagement alerts */}
          {alerts.length > 0 && (
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: '12px', paddingBottom: '8px',
                borderBottom: '1px solid var(--line)',
              }}>
                Engagement alerts — action needed
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {alerts.slice(0, 10).map(alert => (
                  <div
                    key={alert.id}
                    style={{
                      background: '#ffffff', border: '1px solid var(--line)',
                      borderRadius: '12px', padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: ARCHETYPE_COLORS[alert.member_archetype] ?? 'var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, color: '#fff',
                    }}>
                      {(alert.member_name ?? 'M').slice(0, 2).toUpperCase()}
                    </div>

                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)' }}>
                          {alert.member_name ?? 'Member'}
                        </span>
                        <AlertBadge level={alert.alert_level} />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ARCHETYPE_LABELS[alert.member_archetype] ?? alert.member_archetype}
                        {' · '}{alert.reason}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <Link
                        href={`/admin/members?member=${alert.member_id}`}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '5px 10px',
                          borderRadius: '7px', background: 'rgba(31,92,58,.4)',
                          color: 'var(--green)', textDecoration: 'none', border: '1px solid rgba(31,92,58,.6)',
                        }}
                      >
                        View profile
                      </Link>
                      <button
                        onClick={() => handleSnooze(alert.id)}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '5px 10px',
                          borderRadius: '7px', background: 'var(--line)',
                          color: 'var(--text-muted)', border: '1px solid var(--line-md)', cursor: 'pointer',
                        }}
                      >
                        Snooze 48h
                      </button>
                      <button
                        onClick={() => handleResolve(alert.id)}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '5px 10px',
                          borderRadius: '7px', background: 'var(--line)',
                          color: 'var(--text-muted)', border: '1px solid var(--line-md)', cursor: 'pointer',
                        }}
                      >
                        Resolve ✓
                      </button>
                    </div>
                  </div>
                ))}
                {alerts.length > 10 && (
                  <Link href="/admin/members" style={{
                    textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)',
                    textDecoration: 'none', padding: '10px',
                  }}>
                    + {alerts.length - 10} more alerts → View all members
                  </Link>
                )}
              </div>
            </div>
          )}

          {cohorts.length === 0 && (
            <div style={{
              background: '#ffffff', border: '1px solid var(--line)',
              borderRadius: '14px', padding: '48px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>◎</div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                No cohorts yet
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Create your first Circle cohort to get started
              </div>
              <Link href="/admin/cohorts" style={{
                display: 'inline-block', padding: '10px 20px',
                background: 'var(--green)', color: '#fff',
                borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
              }}>
                Manage cohorts
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
