// app/(admin)/admin/page.tsx
// Main admin dashboard — weekly summary + alerts + cohort health

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchAdminCohorts, fetchEngagementAlerts, resolveAlert, snoozeAlert,
  fetchAllUsersAdmin, fetchUnclaimedPurchases,
  type AdminCohortSummary, type AdminEngagementAlert,
  type AdminUserRow, type PendingPurchase,
} from '@/lib/admin/hooks'

function useAdminFirstName(): string {
  const [firstName, setFirstName] = useState('there')
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user || cancelled) return
      const { data: profile } = await supabaseClient
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()
      if (cancelled) return
      const full = (profile?.name as string | null)?.trim() || user.email?.split('@')[0] || 'there'
      setFirstName(full.split(/\s+/)[0])
    })()
    return () => { cancelled = true }
  }, [])
  return firstName
}

const ARCHETYPE_COLORS: Record<string, string> = {
  door: 'var(--green)', throne: '#1a1a2e', engine: 'var(--red)', push: '#3d2c0e',
}
const ARCHETYPE_LABELS: Record<string, string> = {
  door: 'Open Door', throne: "Overthinker's Throne", engine: 'Interrupted Engine', push: 'Pushthrough',
}
const PHASE_COLORS: Record<string, string> = {
  root: 'var(--green)', rebuild: 'var(--gold)', rise: '#7A1F1F',
}

function AlertBadge({ level }: { level: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    amber:  { bg: 'rgba(200,148,31,.15)', text: 'var(--gold)', label: 'Monitor' },
    orange: { bg: 'rgba(184,134,46,.15)',  text: '#B8862E', label: 'Check in' },
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
  const firstName = useAdminFirstName()
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  const [alerts, setAlerts] = useState<AdminEngagementAlert[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [unclaimed, setUnclaimed] = useState<PendingPurchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchAdminCohorts(),
      fetchEngagementAlerts(),
      fetchAllUsersAdmin(),
      fetchUnclaimedPurchases(),
    ])
      .then(([c, a, u, p]) => { setCohorts(c); setAlerts(a); setUsers(u); setUnclaimed(p) })
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              {today}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
              Welcome back, {firstName}
            </h1>
          </div>
          <Link
            href="/admin/redesign"
            style={{
              fontSize: 11, fontWeight: 600,
              padding: '6px 12px', borderRadius: 999,
              background: 'linear-gradient(135deg, var(--green-pale), var(--gold-pale))',
              color: 'var(--ink)',
              border: '1px solid var(--line)',
              textDecoration: 'none', flexShrink: 0,
            }}
          >
            ✦ Preview modern look
          </Link>
        </div>
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
          {/* All-program snapshot */}
          {(() => {
            const totalUsers = users.length
            const paid       = users.filter(u => u.has_paid).length
            const byPath = (p: 'A' | 'B' | 'C') => ({
              total: users.filter(u => u.selected_path === p).length,
              paid:  users.filter(u => u.selected_path === p && u.has_paid).length,
            })
            const a = byPath('A'), b = byPath('B'), c = byPath('C')
            const recent = [...users]
              .filter(u => !!u.signup_date)
              .sort((x, y) => (y.signup_date! < x.signup_date! ? -1 : 1))
              .slice(0, 5)

            return (
              <div style={{ marginBottom: 28 }}>
                <SectionHeader>All programs at a glance</SectionHeader>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12, marginBottom: 14,
                }}>
                  <BigStat label="Total users" value={totalUsers} sub={`${paid} paid`} />
                  <BigStat label="Seal the Leak" value={a.total} sub={`${a.paid} paid`} accent="var(--gold)" />
                  <BigStat label="365 Cards"     value={b.total} sub={`${b.paid} paid`} accent="var(--green)" />
                  <BigStat label="The Circle"    value={c.total} sub={`${c.paid} paid`} accent="#7A1F1F" />
                  <BigStat
                    label="Unclaimed payments"
                    value={unclaimed.length}
                    sub={unclaimed.length > 0 ? 'Action needed →' : 'All caught up'}
                    accent={unclaimed.length > 0 ? 'var(--red)' : 'var(--text-muted)'}
                    href="/admin/money"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {/* Recent signups */}
                  <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                      Recent signups
                    </div>
                    {recent.length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No signups yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {recent.map(u => (
                          <Link
                            key={u.id}
                            href={`/admin/users/${u.id}`}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '6px 8px', borderRadius: 6,
                              textDecoration: 'none', color: 'var(--ink)',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.name || u.email || u.id.slice(0, 8)}
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {u.selected_path ? `Path ${u.selected_path}` : 'No path'}
                                {' · '}{u.signup_date ? new Date(u.signup_date).toLocaleDateString() : '—'}
                              </div>
                            </div>
                            {u.has_paid && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--green)', background: 'var(--green-pale)', padding: '2px 6px', borderRadius: 4, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                                Paid
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick links */}
                  <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>
                      Quick actions
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <QuickLink href="/admin/users"    title="Browse people"    desc="All users, all paths" />
                      <QuickLink href="/admin/money"    title="Money & payments" desc="Stripe, paid access, unclaimed" />
                      <QuickLink href="/admin/reports"  title="Pull a report"    desc="CSV exports" />
                      <QuickLink href="/admin/comms"    title="Send a message"   desc="Broadcast or DM" />
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Top stat row — auto-wraps to 2x2 on narrow screens */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Active cohorts', value: activeCohorts.length, color: 'var(--green)' },
              { label: 'Total members', value: activeCohorts.reduce((s, c) => s + c.member_count, 0), color: 'var(--gold)' },
              { label: 'Engagement alerts', value: totalAlerts, color: totalAlerts > 0 ? '#B8862E' : 'var(--text-muted)' },
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
                          <span style={{ fontSize: '11px', color: '#B8862E', background: 'rgba(184,134,46,.15)', padding: '2px 8px', borderRadius: '8px' }}>
                            {c.alert_counts.orange} check in
                          </span>
                        )}
                        {c.next_call && (
                          <span style={{ fontSize: '11px', color: 'var(--gold)', background: 'rgba(200,148,31,.12)', padding: '2px 8px', borderRadius: '8px' }}>
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

          {/* Circle-only section header */}
          {(activeCohorts.length > 0 || alerts.length > 0) && (
            <SectionHeader>The Circle — operations</SectionHeader>
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      marginBottom: 12, paddingBottom: 8,
      borderBottom: '1px solid var(--line)',
    }}>
      {children}
    </div>
  )
}

function BigStat({
  label, value, sub, accent, href,
}: {
  label: string; value: number | string; sub?: string;
  accent?: string; href?: string;
}) {
  const inner = (
    <div style={{
      background: '#fff', border: '1px solid var(--line)',
      borderRadius: 12, padding: 16,
      cursor: href ? 'pointer' : 'default',
      transition: 'transform .1s',
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, color: accent ?? 'var(--ink)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.07em' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block', padding: '8px 10px', borderRadius: 6,
        textDecoration: 'none', color: 'var(--ink)',
        background: 'var(--paper2)', border: '1px solid var(--line)',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
    </Link>
  )
}
