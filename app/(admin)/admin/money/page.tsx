'use client'

// app/(admin)/admin/money/page.tsx
// Money & payments — combines what used to live in /admin/revenue and
// /admin/purchases. Three sections:
//   1. Quick stats — paid users by path, unclaimed count, totals
//   2. Unclaimed purchases — Stripe payments waiting on a user account
//   3. Cohort conversion — stories + testimonials per cohort (Path C)

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  fetchUnclaimedPurchases, fetchAllUsersAdmin, fetchAdminCohorts,
  fetchConversionData, adminClaimPurchaseForUser,
  type PendingPurchase, type AdminUserRow,
} from '@/lib/admin/hooks'

const PATH_LABELS: Record<'A' | 'B' | 'C', string> = {
  A: 'Seal the Leak',
  B: '365 Cards',
  C: 'The Circle',
}
const PATH_TINT: Record<'A' | 'B' | 'C', { bg: string; fg: string }> = {
  A: { bg: 'rgba(184,146,42,0.12)', fg: 'var(--gold)' },
  B: { bg: 'rgba(31,92,58,0.12)',   fg: 'var(--green)' },
  C: { bg: 'rgba(61,48,128,0.12)',  fg: '#3D3080' },
}

export default function MoneyPage() {
  const [purchases, setPurchases] = useState<PendingPurchase[]>([])
  const [users, setUsers]         = useState<AdminUserRow[]>([])
  const [cohorts, setCohorts]     = useState<{ id: string; name: string }[]>([])
  const [cohortId, setCohortId]   = useState('')
  const [conversion, setConversion] = useState({ total_members: 0, submitted_stories: 0, public_testimonials: 0 })
  const [loading, setLoading]     = useState(true)

  const [pickFor, setPickFor]   = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [claiming, setClaiming] = useState(false)

  async function reload() {
    setLoading(true)
    const [p, u, c] = await Promise.all([
      fetchUnclaimedPurchases(),
      fetchAllUsersAdmin(),
      fetchAdminCohorts(),
    ])
    setPurchases(p)
    setUsers(u)
    setCohorts(c.map(x => ({ id: x.id, name: x.name })))
    if (c[0] && !cohortId) setCohortId(c[0].id)
    setLoading(false)
  }
  useEffect(() => { reload() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cohortId) return
    fetchConversionData(cohortId).then(setConversion)
  }, [cohortId])

  // Stats
  const stats = useMemo(() => {
    const paid    = users.filter(u => u.has_paid)
    const byPath  = (p: 'A' | 'B' | 'C') => paid.filter(u => u.selected_path === p).length
    return {
      paidTotal: paid.length,
      A: byPath('A'),
      B: byPath('B'),
      C: byPath('C'),
      unclaimed: purchases.length,
    }
  }, [users, purchases])

  async function handleClaim(purchase: PendingPurchase, userId: string) {
    const u = users.find(x => x.id === userId)
    if (!u) return
    if (!confirm(`Claim ${purchase.email}'s ${PATH_LABELS[purchase.path]} purchase onto ${u.name || u.email}?`)) return
    setClaiming(true)
    const { error } = await adminClaimPurchaseForUser(purchase.id, userId)
    setClaiming(false)
    if (error) {
      alert(`Could not claim: ${error.message}`)
      return
    }
    setPickFor(null)
    await reload()
  }

  const filteredUsers = search.trim()
    ? users.filter(u => {
        const q = search.toLowerCase()
        return (u.email ?? '').toLowerCase().includes(q) || (u.name ?? '').toLowerCase().includes(q)
      })
    : users

  const card: React.CSSProperties = { background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 18, marginBottom: 16 }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Money & payments</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Paid access, unclaimed Stripe purchases, and Circle conversion in one place.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Paid users" value={loading ? '…' : stats.paidTotal} sub="Across all paths" />
        <StatCard label="Seal the Leak" value={loading ? '…' : stats.A} sub="Path A · one-time" tint={PATH_TINT.A} />
        <StatCard label="365 Cards"      value={loading ? '…' : stats.B} sub="Path B · subscription" tint={PATH_TINT.B} />
        <StatCard label="The Circle"     value={loading ? '…' : stats.C} sub="Path C · cohort" tint={PATH_TINT.C} />
        <StatCard
          label="Unclaimed purchases"
          value={loading ? '…' : stats.unclaimed}
          sub={stats.unclaimed > 0 ? 'Action needed below ↓' : 'All caught up'}
          alert={stats.unclaimed > 0}
        />
      </div>

      {/* Unclaimed purchases */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Unclaimed Stripe purchases</h2>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {purchases.length} waiting</span>
        </div>

        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Loading…</p>
        ) : purchases.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            ✓ Every Stripe payment has been linked to an account.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {purchases.map(p => {
              const matched = users.find(u => u.email && u.email.toLowerCase() === p.email.toLowerCase())
              const isPicking = pickFor === p.id
              return (
                <div key={p.id} style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.email}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                        {PATH_LABELS[p.path]} · {new Date(p.created_at).toLocaleString()}
                        {p.stripe_customer_id && <> · {p.stripe_customer_id}</>}
                      </div>
                    </div>
                    {matched ? (
                      <button
                        onClick={() => handleClaim(p, matched.id)}
                        disabled={claiming}
                        style={btnPrimary(claiming)}
                      >
                        Claim onto {matched.name || matched.email}
                      </button>
                    ) : (
                      <button
                        onClick={() => { setPickFor(isPicking ? null : p.id); setSearch('') }}
                        style={btnSecondary()}
                      >
                        {isPicking ? 'Cancel' : 'Match to user…'}
                      </button>
                    )}
                  </div>
                  {isPicking && (
                    <div style={{ marginTop: 10, background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 10 }}>
                      <input
                        autoFocus
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                          width: '100%', fontSize: 13, padding: '8px 10px',
                          border: '1px solid var(--line-md)', borderRadius: 6,
                          outline: 'none', fontFamily: 'inherit', marginBottom: 8,
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredUsers.slice(0, 30).map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleClaim(p, u.id)}
                            disabled={claiming}
                            style={{
                              textAlign: 'left',
                              background: '#fff', border: '1px solid var(--line)',
                              borderRadius: 6, padding: '7px 10px', cursor: 'pointer',
                              fontFamily: 'inherit', fontSize: 12, color: 'var(--ink)',
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{u.name || '(no name)'}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                          </button>
                        ))}
                        {filteredUsers.length === 0 && (
                          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>No users match.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cohort conversion */}
      {cohorts.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Cohort conversion</h2>
            <select
              value={cohortId}
              onChange={e => setCohortId(e.target.value)}
              style={{
                fontSize: 12, padding: '6px 10px', borderRadius: 6,
                border: '1px solid var(--line-md)', background: '#fff',
                fontFamily: 'inherit',
              }}
            >
              {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <MiniStat label="Members" value={conversion.total_members} />
            <MiniStat label="Stories submitted" value={conversion.submitted_stories} />
            <MiniStat label="Public testimonials" value={conversion.public_testimonials} />
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
        Need a fuller breakdown? <Link href="/admin/reports" style={{ color: 'var(--gold)' }}>Reports</Link> has CSV exports of paid users, journals, and signup velocity.
      </p>
    </div>
  )
}

function StatCard({ label, value, sub, tint, alert }: {
  label: string; value: number | string; sub?: string;
  tint?: { bg: string; fg: string }; alert?: boolean;
}) {
  return (
    <div style={{
      background: alert ? 'rgba(184,40,40,0.08)' : (tint?.bg ?? '#fff'),
      border: `1px solid ${alert ? 'rgba(184,40,40,0.3)' : 'var(--line)'}`,
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.1, marginTop: 4, color: tint?.fg ?? (alert ? 'var(--red)' : 'var(--ink)') }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 600,
    padding: '7px 14px', borderRadius: 7, border: 'none',
    background: 'var(--green)', color: '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
  }
}
function btnSecondary(): React.CSSProperties {
  return {
    fontSize: 12, fontWeight: 600,
    padding: '7px 14px', borderRadius: 7,
    border: '1px solid var(--gold-line)',
    background: 'var(--gold-pale)', color: 'var(--gold)',
    cursor: 'pointer', fontFamily: 'inherit',
  }
}
