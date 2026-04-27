'use client'

// app/(admin)/admin/users/page.tsx
// Cross-portal user roster — every signed-up account, not just circle members.
// Path A (Cohort) / Path B (Daily Cards) / Path C (Circle) all show up here so
// admins can see and reach 365-day and Seal-the-Leak users alongside Circle.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAllUsersAdmin, type AdminUserRow } from '@/lib/admin/hooks'

const PATH_LABELS: Record<NonNullable<AdminUserRow['selected_path']> | 'none', { label: string; color: string; bg: string; border: string }> = {
  A:    { label: 'Path A · Cohort',       color: '#3D3080',     bg: 'rgba(61,48,128,0.12)',  border: 'rgba(61,48,128,0.25)' },
  B:    { label: 'Path B · Daily Cards',  color: 'var(--green)',bg: 'rgba(31,92,58,0.12)',   border: 'rgba(31,92,58,0.25)' },
  C:    { label: 'Path C · Circle',       color: '#C97D3A',     bg: 'rgba(201,125,58,0.12)', border: 'rgba(201,125,58,0.25)' },
  none: { label: 'No path yet',           color: 'var(--text-muted)', bg: 'var(--paper2)', border: 'var(--line)' },
}
type PathFilter = 'all' | 'A' | 'B' | 'C' | 'none'

function daysAgo(iso: string | null): string {
  if (!iso) return '—'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PathFilter>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchAllUsersAdmin().then(rows => {
      if (!cancelled) { setUsers(rows); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  const counts = {
    all: users.length,
    A: users.filter(u => u.selected_path === 'A').length,
    B: users.filter(u => u.selected_path === 'B').length,
    C: users.filter(u => u.selected_path === 'C').length,
    none: users.filter(u => !u.selected_path).length,
  }

  let filtered = filter === 'all' ? users : users.filter(u => (u.selected_path ?? 'none') === filter)
  if (search.trim()) {
    const q = search.toLowerCase()
    filtered = filtered.filter(u =>
      (u.name ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q),
    )
  }

  const S = {
    h1: { fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
    tab: (on: boolean) => ({
      padding: '8px 14px', fontSize: 12, fontWeight: on ? 600 : 500,
      color: on ? 'var(--gold)' : 'var(--text-muted)',
      background: on ? 'var(--gold-pale)' : '#fff',
      border: `1px solid ${on ? 'var(--gold-line)' : 'var(--line)'}`,
      borderRadius: 999,
      cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6,
    }),
    countPill: { fontSize: 10, padding: '1px 6px', borderRadius: 999, background: 'rgba(0,0,0,0.06)', color: 'var(--text-muted)' },
    pathPill: (cfg: typeof PATH_LABELS['A']) => ({
      fontSize: 10, fontWeight: 600, letterSpacing: '0.04em',
      padding: '2px 8px', borderRadius: 999,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap' as const,
    }),
    search: {
      background: '#fff', border: '1px solid var(--line-md)', borderRadius: 8,
      padding: '7px 10px', fontSize: 13, color: 'var(--ink)', outline: 'none',
      fontFamily: 'inherit', width: 240,
    },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={S.h1}>All users</h1>
          <p style={S.sub}>
            Every signed-up account across the three programs.
            {' '}{counts.A} on Path A · {counts.B} on Path B · {counts.C} on Path C
            {counts.none > 0 && ` · ${counts.none} no path yet`}.
          </p>
        </div>
        <input placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} style={S.search} />
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {([
          { id: 'all',  label: `All (${counts.all})` },
          { id: 'A',    label: `Path A · Cohort (${counts.A})` },
          { id: 'B',    label: `Path B · Daily Cards (${counts.B})` },
          { id: 'C',    label: `Path C · Circle (${counts.C})` },
          { id: 'none', label: `No path (${counts.none})` },
        ] as { id: PathFilter; label: string }[]).map(opt => (
          <button key={opt.id} onClick={() => setFilter(opt.id)} style={S.tab(filter === opt.id)}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading users…</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((u, i) => {
            const cfg = PATH_LABELS[u.selected_path ?? 'none']
            const display = u.name?.trim() || u.email?.split('@')[0] || u.id.slice(0, 8) + '…'
            const initials = display.slice(0, 2).toUpperCase()
            const profileHref = u.member_id ? `/admin/members/${u.member_id}` : null
            return (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                fontSize: 13,
                flexWrap: 'wrap',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, color: cfg.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  border: `1px solid ${cfg.border}`,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                  <div style={{
                    fontWeight: 600, color: 'var(--ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {display}
                    {u.is_admin && <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Admin</span>}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {u.email ?? '—'}
                  </div>
                </div>
                <span style={S.pathPill(cfg)}>{cfg.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, minWidth: 56, textAlign: 'right' }}>
                  {daysAgo(u.last_active)}
                </span>
                <span style={{ fontSize: 11, color: u.has_paid ? 'var(--green)' : 'var(--text-muted)', flexShrink: 0, fontWeight: 600 }}>
                  {u.has_paid ? 'Paid' : 'Unpaid'}
                </span>
                {profileHref ? (
                  <Link href={profileHref} style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '5px 11px', borderRadius: 7,
                    background: 'var(--gold)', color: '#fff',
                    textDecoration: 'none', flexShrink: 0,
                  }}>
                    Profile →
                  </Link>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontStyle: 'italic' }}>
                    no profile
                  </span>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              {users.length === 0 ? 'No users yet.' : 'No users match this filter.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
