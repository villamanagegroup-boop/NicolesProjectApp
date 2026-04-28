'use client'

// app/(admin)/admin/users/page.tsx
// Cross-portal user roster — every signed-up account, not just circle members.
// Path A (Cohort) / Path B (Daily Cards) / Path C (Circle) all show up here so
// admins can see and reach 365-day and Seal-the-Leak users alongside Circle.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAllUsersAdmin, adminUpdateUser, type AdminUserRow } from '@/lib/admin/hooks'

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
  // Per-row "saving"/"saved" indicator; keyed by user.id.
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAllUsersAdmin().then(rows => {
      if (!cancelled) { setUsers(rows); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [])

  async function patchUser(userId: string, updates: Parameters<typeof adminUpdateUser>[1]) {
    setSavingId(userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } as AdminUserRow : u))
    const { error } = await adminUpdateUser(userId, updates)
    setSavingId(null)
    if (error) {
      alert(`Could not update user: ${error.message}`)
      // Revert by refetching the affected user — simplest correctness option.
      const fresh = await fetchAllUsersAdmin()
      setUsers(fresh)
      return
    }
    setSavedId(userId)
    setTimeout(() => setSavedId(curr => curr === userId ? null : curr), 1400)
  }

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
                {/* Path — editable */}
                <select
                  value={u.selected_path ?? ''}
                  disabled={savingId === u.id}
                  onChange={e => {
                    const v = e.target.value
                    patchUser(u.id, { selected_path: v === '' ? null : v as 'A' | 'B' | 'C' })
                  }}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '3px 8px', borderRadius: 999,
                    background: cfg.bg, color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                    outline: 'none',
                  }}
                  title="Change selected path"
                >
                  <option value="">No path</option>
                  <option value="A">Path A · Cohort</option>
                  <option value="B">Path B · Daily Cards</option>
                  <option value="C">Path C · Circle</option>
                </select>

                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, minWidth: 56, textAlign: 'right' }}>
                  {daysAgo(u.last_active)}
                </span>

                {/* Paid — editable */}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: u.has_paid ? 'var(--green)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={u.has_paid}
                    disabled={savingId === u.id}
                    onChange={e => patchUser(u.id, { has_paid: e.target.checked })}
                    style={{ margin: 0, cursor: 'pointer' }}
                  />
                  {u.has_paid ? 'Paid' : 'Unpaid'}
                </label>

                {/* Admin — editable */}
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: u.is_admin ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={u.is_admin}
                    disabled={savingId === u.id}
                    onChange={e => patchUser(u.id, { is_admin: e.target.checked })}
                    style={{ margin: 0, cursor: 'pointer' }}
                  />
                  Admin
                </label>

                {/* Save indicator */}
                <span style={{ fontSize: 10, fontWeight: 600, color: savedId === u.id ? 'var(--green)' : 'var(--text-muted)', minWidth: 36, textAlign: 'right', flexShrink: 0 }}>
                  {savingId === u.id ? '…' : savedId === u.id ? '✓ saved' : ''}
                </span>
                <Link href={`/admin/users/${u.id}`} style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '5px 11px', borderRadius: 7,
                  background: 'var(--gold)', color: '#fff',
                  textDecoration: 'none', flexShrink: 0,
                }}>
                  Profile →
                </Link>
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
