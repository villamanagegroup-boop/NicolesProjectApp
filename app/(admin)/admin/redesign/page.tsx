'use client'

// app/(admin)/admin/redesign/page.tsx
// Modern preview of the admin home dashboard. Same data as /admin —
// just a different visual language so we can compare and decide.
//
// Design direction:
//   - Soft surfaces with subtle elevation instead of hard borders
//   - Larger, lighter typography (no all-caps tags everywhere)
//   - Bento-style asymmetric grid
//   - Color-tinted program cards (gold / green / purple)
//   - Status dots + sentence-case pills (not screaming uppercase)
//   - Generous whitespace, fewer dividers

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchAdminCohorts, fetchAllUsersAdmin, fetchUnclaimedPurchases, fetchEngagementAlerts,
  type AdminCohortSummary, type AdminUserRow, type PendingPurchase, type AdminEngagementAlert,
} from '@/lib/admin/hooks'

export default function AdminRedesignPreview() {
  const [name, setName] = useState('there')
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [unclaimed, setUnclaimed] = useState<PendingPurchase[]>([])
  const [alerts, setAlerts] = useState<AdminEngagementAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        const { data: profile } = await supabaseClient
          .from('users')
          .select('name')
          .eq('id', user.id)
          .maybeSingle()
        if (!cancelled) {
          const full = (profile?.name as string | null)?.trim() || user.email?.split('@')[0] || 'there'
          setName(full.split(/\s+/)[0])
        }
      }
      const [c, u, p, a] = await Promise.all([
        fetchAdminCohorts(),
        fetchAllUsersAdmin(),
        fetchUnclaimedPurchases(),
        fetchEngagementAlerts(),
      ])
      if (cancelled) return
      setCohorts(c); setUsers(u); setUnclaimed(p); setAlerts(a)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  // Stats
  const paid       = users.filter(u => u.has_paid).length
  const totalUsers = users.length
  const byPath = (k: 'A' | 'B' | 'C') => ({
    total: users.filter(u => u.selected_path === k).length,
    paid:  users.filter(u => u.selected_path === k && u.has_paid).length,
  })
  const a = byPath('A'), b = byPath('B'), c = byPath('C')
  const activeCohorts = cohorts.filter(co => co.status === 'active')
  const recentSignups = [...users]
    .filter(u => !!u.signup_date)
    .sort((x, y) => (y.signup_date! < x.signup_date! ? -1 : 1))
    .slice(0, 6)

  // Greeting
  const hour = new Date().getHours()
  const timeOfDay = hour < 5 ? 'late night' : hour < 12 ? 'this morning' : hour < 17 ? 'this afternoon' : 'tonight'

  return (
    <div style={{ color: '#1a1a1a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}>
      {/* Preview banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        background: 'linear-gradient(135deg, rgba(31,92,58,0.08), rgba(200,148,31,0.08))',
        border: '1px solid rgba(31,92,58,0.15)',
        borderRadius: 12, padding: '10px 14px', marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, color: '#1a1a1a' }}>
          ✦ This is a redesign preview — same data as the regular dashboard, different look.
        </span>
        <Link href="/admin" style={{
          fontSize: 12, fontWeight: 600, color: 'var(--green)',
          textDecoration: 'none',
        }}>
          ← Back to classic
        </Link>
      </div>

      {/* Hero */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontSize: 34, fontWeight: 600, lineHeight: 1.1, margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Welcome back, {name}.
        </h1>
        <p style={{ fontSize: 15, color: '#6b6b6b', margin: '6px 0 0', lineHeight: 1.5 }}>
          {loading ? 'Loading the picture…' : (
            <>
              {totalUsers} {totalUsers === 1 ? 'person is' : 'people are'} in the portal {timeOfDay}.
              {paid > 0 && <> {paid} {paid === 1 ? 'is' : 'are'} on a paid plan.</>}
              {alerts.length > 0 && <> {alerts.length} {alerts.length === 1 ? 'alert needs' : 'alerts need'} your eyes.</>}
            </>
          )}
        </p>
      </div>

      {/* Bento grid — main row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14, marginBottom: 14,
      }}>
        <ProgramCard
          tint={{ from: 'rgba(200,148,31,0.18)', to: 'rgba(200,148,31,0.04)', accent: '#C8941F' }}
          icon="✦"
          title="Seal the Leak"
          stat={a.total}
          sub={`${a.paid} paid · one-time`}
          href="/admin/users?path=A"
        />
        <ProgramCard
          tint={{ from: 'rgba(31,92,58,0.16)', to: 'rgba(31,92,58,0.04)', accent: '#1f5c3a' }}
          icon="◇"
          title="365 Cards"
          stat={b.total}
          sub={`${b.paid} paid · subscription`}
          href="/admin/users?path=B"
        />
        <ProgramCard
          tint={{ from: 'rgba(122,31,31,0.18)', to: 'rgba(122,31,31,0.04)', accent: '#7A1F1F' }}
          icon="○"
          title="The Circle"
          stat={c.total}
          sub={`${c.paid} paid · ${activeCohorts.length} active cohort${activeCohorts.length === 1 ? '' : 's'}`}
          href="/admin/users?path=C"
        />
      </div>

      {/* Bento grid — secondary row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
        gap: 14, marginBottom: 14,
      }}>
        {/* Recent signups */}
        <Surface>
          <SectionTitle right={<Link href="/admin/users" style={subtleLink}>See all →</Link>}>
            Recent signups
          </SectionTitle>
          {loading ? (
            <Skeleton lines={4} />
          ) : recentSignups.length === 0 ? (
            <p style={{ fontSize: 13, color: '#6b6b6b', margin: 0 }}>No signups yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentSignups.map(u => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 8px', margin: '0 -8px',
                    borderRadius: 10, textDecoration: 'none', color: '#1a1a1a',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar text={(u.name || u.email || 'U')} path={u.selected_path} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.name || u.email || u.id.slice(0, 8)}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b6b6b', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <StatusDot color={u.has_paid ? '#1f5c3a' : '#a0a0a0'} />
                      {u.has_paid ? 'Paid' : 'Free'}
                      <span style={{ color: '#c0c0c0' }}>·</span>
                      {u.selected_path ? `Path ${u.selected_path}` : 'No path'}
                      <span style={{ color: '#c0c0c0' }}>·</span>
                      {u.signup_date ? relativeTime(u.signup_date) : '—'}
                    </div>
                  </div>
                  <span style={{ color: '#c0c0c0', fontSize: 14 }}>›</span>
                </Link>
              ))}
            </div>
          )}
        </Surface>

        {/* Right column — alerts + unclaimed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Unclaimed purchases */}
          <Surface tint={unclaimed.length > 0 ? 'amber' : null}>
            <SectionTitle>Unclaimed payments</SectionTitle>
            {loading ? (
              <Skeleton lines={1} />
            ) : (
              <>
                <div style={{
                  fontSize: 36, fontWeight: 600, lineHeight: 1, marginTop: 4,
                  color: unclaimed.length > 0 ? '#b85a00' : '#1a1a1a',
                  letterSpacing: '-0.02em',
                }}>
                  {unclaimed.length}
                </div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 6 }}>
                  {unclaimed.length === 0 ? 'All caught up. Nothing to chase.' : 'Stripe payments waiting on a user account.'}
                </div>
                {unclaimed.length > 0 && (
                  <Link href="/admin/money" style={{
                    display: 'inline-block', marginTop: 12,
                    padding: '8px 14px', borderRadius: 999,
                    background: '#1a1a1a', color: '#fff',
                    fontSize: 12, fontWeight: 500, textDecoration: 'none',
                  }}>
                    Reconcile →
                  </Link>
                )}
              </>
            )}
          </Surface>

          {/* Engagement alerts */}
          <Surface tint={alerts.filter(a => a.alert_level === 'red').length > 0 ? 'red' : null}>
            <SectionTitle>Member alerts</SectionTitle>
            {loading ? (
              <Skeleton lines={1} />
            ) : (
              <>
                <div style={{
                  fontSize: 36, fontWeight: 600, lineHeight: 1, marginTop: 4,
                  color: alerts.length > 0 ? '#b85a00' : '#1a1a1a',
                  letterSpacing: '-0.02em',
                }}>
                  {alerts.length}
                </div>
                <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 6 }}>
                  {alerts.length === 0 ? 'Everyone\'s engaged.' : `${alerts.filter(a => a.alert_level === 'red').length} at risk · ${alerts.filter(a => a.alert_level !== 'red').length} to monitor.`}
                </div>
                {alerts.length > 0 && (
                  <Link href="/admin/users?path=C" style={{
                    display: 'inline-block', marginTop: 12,
                    padding: '8px 14px', borderRadius: 999,
                    background: '#1a1a1a', color: '#fff',
                    fontSize: 12, fontWeight: 500, textDecoration: 'none',
                  }}>
                    Review →
                  </Link>
                )}
              </>
            )}
          </Surface>
        </div>
      </div>

      {/* Active cohorts */}
      {activeCohorts.length > 0 && (
        <Surface>
          <SectionTitle right={<Link href="/admin/cohorts" style={subtleLink}>All cohorts →</Link>}>
            Active cohorts
          </SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {activeCohorts.map(co => {
              const phaseColor = co.phase === 'root' ? '#1f5c3a' : co.phase === 'rebuild' ? '#C8941F' : '#7A1F1F'
              return (
                <Link
                  key={co.id}
                  href={`/admin/cohorts/${co.id}`}
                  style={{
                    display: 'block', padding: 16, borderRadius: 12,
                    background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    textDecoration: 'none', color: '#1a1a1a',
                    transition: 'transform 0.1s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <StatusDot color={phaseColor} />
                    <span style={{ fontSize: 11, color: '#6b6b6b', fontWeight: 500 }}>
                      Week {co.current_week} · {co.phase_label}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a0a0a0' }}>
                      {co.days_remaining}d left
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{co.name}</div>

                  {/* Engagement bar */}
                  <div style={{
                    height: 6, borderRadius: 3,
                    background: 'rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${co.engagement_rate}%`,
                      background: phaseColor,
                      transition: 'width 0.6s',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b6b6b' }}>
                    <span>{co.engagement_rate}% engaged</span>
                    <span>{co.member_count}/{co.max_members} members</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </Surface>
      )}

      {/* Quick actions */}
      <Surface>
        <SectionTitle>Quick actions</SectionTitle>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { href: '/admin/users',   label: 'Find a user', icon: '◌' },
            { href: '/admin/money',   label: 'Money & payments', icon: '◇' },
            { href: '/admin/reports', label: 'Pull a report', icon: '↓' },
            { href: '/admin/comms',   label: 'Send a message', icon: '→' },
            { href: '/admin/cards',   label: 'Edit today\'s card', icon: '✦' },
            { href: '/admin/cohorts/new', label: 'New cohort', icon: '+' },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 999,
                background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
                fontSize: 13, fontWeight: 500, color: '#1a1a1a',
                textDecoration: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#1a1a1a'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = '#1a1a1a'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.color = '#1a1a1a'
                e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
              }}
            >
              <span style={{ opacity: 0.6 }}>{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </Surface>

      <p style={{ fontSize: 11, color: '#a0a0a0', textAlign: 'center', marginTop: 32, marginBottom: 0 }}>
        Like this? Tell me &mdash; I&apos;ll roll it out to <Link href="/admin" style={{ color: '#1f5c3a' }}>/admin</Link>.
      </p>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const subtleLink: React.CSSProperties = {
  fontSize: 12, color: '#6b6b6b', textDecoration: 'none', fontWeight: 500,
}

function Surface({ children, tint }: { children: React.ReactNode; tint?: 'amber' | 'red' | null }) {
  const tintStyle = tint === 'amber'
    ? { background: 'linear-gradient(135deg, rgba(200,148,31,0.10), #ffffff 60%)', borderColor: 'rgba(200,148,31,0.20)' }
    : tint === 'red'
    ? { background: 'linear-gradient(135deg, rgba(184,40,40,0.08), #ffffff 60%)', borderColor: 'rgba(184,40,40,0.18)' }
    : { background: '#ffffff', borderColor: 'rgba(0,0,0,0.06)' }
  return (
    <div style={{
      ...tintStyle,
      borderWidth: 1, borderStyle: 'solid',
      borderRadius: 16, padding: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      marginBottom: 14,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 14,
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{children}</span>
      {right}
    </div>
  )
}

function StatusDot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7,
      borderRadius: '50%', background: color,
      flexShrink: 0,
    }} />
  )
}

function Avatar({ text, path }: { text: string; path: 'A' | 'B' | 'C' | null }) {
  const initials = text.slice(0, 2).toUpperCase()
  const tint = path === 'A' ? '#C8941F' : path === 'B' ? '#1f5c3a' : path === 'C' ? '#7A1F1F' : '#a0a0a0'
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: `${tint}1a`, color: tint,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 600,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function ProgramCard({ tint, icon, title, stat, sub, href }: {
  tint: { from: string; to: string; accent: string }
  icon: string; title: string; stat: number; sub: string; href: string
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'block', padding: 18, borderRadius: 16,
        background: `linear-gradient(135deg, ${tint.from}, ${tint.to})`,
        border: `1px solid ${tint.accent}26`,
        textDecoration: 'none', color: '#1a1a1a',
        transition: 'transform 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ fontSize: 18, color: tint.accent, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 600, color: '#1a1a1a', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {stat}
      </div>
      <div style={{ fontSize: 11, color: '#6b6b6b', marginTop: 8 }}>{sub}</div>
    </Link>
  )
}

function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{
          height: 14, borderRadius: 4,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.04), rgba(0,0,0,0.08), rgba(0,0,0,0.04))',
          backgroundSize: '200% 100%',
          animation: 'skeleton 1.4s ease-in-out infinite',
          width: `${80 - i * 12}%`,
        }} />
      ))}
      <style>{`
        @keyframes skeleton {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
    </div>
  )
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const days = Math.floor(ms / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
