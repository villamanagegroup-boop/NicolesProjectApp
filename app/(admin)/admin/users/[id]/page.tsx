'use client'

// app/(admin)/admin/users/[id]/page.tsx
// Editable profile for ANY user (Path A / B / C / no path).
// Includes a cohort-membership panel where the admin can add or remove
// the user from cohorts. For circle-specific deep-dive (coaching notes,
// reflections, alerts, journal), there's a link out to the existing
// /admin/members/[member_id] page when the user has a member row.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  fetchAdminUserById, fetchUserCohorts, fetchAllCohortsForAdmin,
  adminUpdateUser, adminAddUserToCohort, adminRemoveMember,
  type AdminUserDetail, type UserCohortMembership, type CohortOption,
} from '@/lib/admin/hooks'

export default function AdminUserProfilePage() {
  const params = useParams<{ id: string }>()
  const userId = params?.id

  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [cohorts, setCohorts] = useState<UserCohortMembership[]>([])
  const [allCohorts, setAllCohorts] = useState<CohortOption[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  // Add-to-cohort form state
  const [addCohortId, setAddCohortId] = useState('')
  const [addArchetype, setAddArchetype] = useState<'door' | 'throne' | 'engine' | 'push'>('door')
  const [adding, setAdding] = useState(false)

  async function reload() {
    if (!userId) return
    setLoading(true)
    const [u, cs, all] = await Promise.all([
      fetchAdminUserById(userId),
      fetchUserCohorts(userId),
      fetchAllCohortsForAdmin(),
    ])
    setUser(u)
    setCohorts(cs)
    setAllCohorts(all)
    setLoading(false)
  }

  useEffect(() => { reload() }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(updates: Parameters<typeof adminUpdateUser>[1], key: string) {
    if (!user) return
    setSavingId(key)
    setUser(prev => prev ? { ...prev, ...updates } as AdminUserDetail : prev)
    const { error } = await adminUpdateUser(user.id, updates)
    setSavingId(null)
    if (error) {
      alert(`Could not save: ${error.message}`)
      await reload()
      return
    }
    setSavedId(key)
    setTimeout(() => setSavedId(curr => curr === key ? null : curr), 1400)
  }

  async function handleAdd() {
    if (!user || !addCohortId) return
    setAdding(true)
    const { error } = await adminAddUserToCohort(user.id, addCohortId, addArchetype)
    setAdding(false)
    if (error) {
      alert(`Could not add to cohort: ${error.message}`)
      return
    }
    setAddCohortId('')
    await reload()
  }

  async function handleRemove(memberId: string, cohortName: string) {
    const memberLabel = user?.name?.trim() || user?.email || 'this user'
    if (!confirm(`Remove ${memberLabel} from ${cohortName}?\n\nThis only deletes their membership row. Their account, journal, and reflections stay intact.`)) return
    const { error } = await adminRemoveMember(memberId)
    if (error) {
      alert(`Could not remove: ${error.message}`)
      return
    }
    await reload()
  }

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading user…</p>
  }
  if (!user) {
    return (
      <div style={{ color: 'var(--ink)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          User not found.
        </p>
        <Link href="/admin/users" style={{ fontSize: 12, color: 'var(--gold)' }}>← All users</Link>
      </div>
    )
  }

  const display = user.name?.trim() || user.email?.split('@')[0] || user.id.slice(0, 8) + '…'
  const initials = display.slice(0, 2).toUpperCase()
  const enrolledCohortIds = new Set(cohorts.map(c => c.cohort_id))
  const availableCohorts = allCohorts.filter(c => !enrolledCohortIds.has(c.id))

  // Indicator helper
  function indicator(key: string) {
    if (savingId === key) return '…'
    if (savedId  === key) return '✓ saved'
    return ''
  }

  const S = {
    panel: { background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 16, marginBottom: 16 },
    label: { fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block' as const, marginBottom: 4 },
    input: {
      background: '#fff', border: '1px solid var(--line-md)', borderRadius: 8,
      color: 'var(--ink)', fontSize: 13, padding: '7px 10px', outline: 'none',
      fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
    },
    saved: { fontSize: 10, color: 'var(--green)', fontWeight: 600 },
    fieldRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' },
    sectionH: { fontSize: 13, fontWeight: 700, color: 'var(--ink)', margin: '0 0 12px' },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>

      {/* ── Top breadcrumb ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 12 }}>
        <Link href="/admin/users" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← All users
        </Link>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {indicator('any')}
        </span>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--gold-pale)', color: 'var(--gold)',
          border: '1px solid var(--gold-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
            {display}
            {user.is_admin && (
              <span style={{ marginLeft: 10, fontSize: 9, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Admin
              </span>
            )}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {user.email ?? '— no email —'} · Signed up {user.signup_date ? new Date(user.signup_date).toLocaleDateString() : '—'}
          </p>
        </div>
        {cohorts.length > 0 && (
          <Link
            href={`/admin/members/${cohorts[0].member_id}`}
            style={{
              fontSize: 12, fontWeight: 600,
              padding: '7px 14px', borderRadius: 7,
              background: 'var(--gold-pale)', color: 'var(--gold)',
              border: '1px solid var(--gold-line)', textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            Coaching view →
          </Link>
        )}
      </div>

      {/* ── Editable profile fields ──────────────────────────────────── */}
      <div style={S.panel}>
        <h2 style={S.sectionH}>Profile</h2>

        <div style={S.fieldRow}>
          <div style={{ flex: '0 0 140px' }}>
            <label style={S.label}>Name</label>
          </div>
          <input
            value={user.name ?? ''}
            onChange={e => setUser(prev => prev ? { ...prev, name: e.target.value } : prev)}
            onBlur={e => patch({ name: e.target.value || null }, 'name')}
            placeholder="—"
            style={{ ...S.input, flex: 1 }}
          />
          <span style={{ ...S.saved, minWidth: 50, textAlign: 'right' }}>{indicator('name')}</span>
        </div>

        <div style={S.fieldRow}>
          <div style={{ flex: '0 0 140px' }}>
            <label style={S.label}>Email</label>
          </div>
          <input
            value={user.email ?? ''}
            onChange={e => setUser(prev => prev ? { ...prev, email: e.target.value } : prev)}
            onBlur={e => patch({ email: e.target.value || null }, 'email')}
            placeholder="—"
            style={{ ...S.input, flex: 1 }}
          />
          <span style={{ ...S.saved, minWidth: 50, textAlign: 'right' }}>{indicator('email')}</span>
        </div>

        <div style={S.fieldRow}>
          <div style={{ flex: '0 0 140px' }}>
            <label style={S.label}>Path</label>
          </div>
          <select
            value={user.selected_path ?? ''}
            onChange={e => {
              const v = e.target.value
              patch({ selected_path: v === '' ? null : v as 'A' | 'B' | 'C' }, 'path')
            }}
            style={{ ...S.input, flex: 1 }}
          >
            <option value="">No path</option>
            <option value="A">Path A · Cohort (Seal the Leak)</option>
            <option value="B">Path B · Daily Cards</option>
            <option value="C">Path C · Circle</option>
          </select>
          <span style={{ ...S.saved, minWidth: 50, textAlign: 'right' }}>{indicator('path')}</span>
        </div>

        <div style={S.fieldRow}>
          <div style={{ flex: '0 0 140px' }}>
            <label style={S.label}>Quiz result</label>
          </div>
          <select
            value={user.quiz_result ?? ''}
            onChange={e => {
              const v = e.target.value
              patch({ quiz_result: v === '' ? null : v as 'seeker' | 'builder' | 'healer' | 'visionary' }, 'quiz')
            }}
            style={{ ...S.input, flex: 1 }}
          >
            <option value="">Not taken</option>
            <option value="seeker">Seeker (door)</option>
            <option value="builder">Builder (engine)</option>
            <option value="healer">Healer (push)</option>
            <option value="visionary">Visionary (throne)</option>
          </select>
          <span style={{ ...S.saved, minWidth: 50, textAlign: 'right' }}>{indicator('quiz')}</span>
        </div>

        <div style={{ ...S.fieldRow, justifyContent: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={user.is_admin}
              onChange={e => patch({ is_admin: e.target.checked }, 'admin')}
            />
            Admin
            <span style={S.saved}>{indicator('admin')}</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={user.has_paid}
              onChange={e => patch({ has_paid: e.target.checked }, 'paid')}
            />
            Paid
            <span style={S.saved}>{indicator('paid')}</span>
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={user.onboarding_complete}
              onChange={e => patch({ onboarding_complete: e.target.checked }, 'onb')}
            />
            Onboarding complete
            <span style={S.saved}>{indicator('onb')}</span>
          </label>
        </div>
      </div>

      {/* ── Cohort memberships ──────────────────────────────────────── */}
      <div style={S.panel}>
        <h2 style={S.sectionH}>Cohort memberships ({cohorts.length})</h2>

        {cohorts.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px' }}>
            Not enrolled in any cohort yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {cohorts.map(cm => (
              <div key={cm.member_id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 8,
                background: 'var(--paper2)', border: '1px solid var(--line)',
                flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: '1 1 200px', minWidth: 0 }}>
                  {cm.cohort_name}
                  {!cm.cohort_active && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, fontStyle: 'italic' }}>
                      (inactive)
                    </span>
                  )}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: 999,
                  background: 'var(--gold-pale)', color: 'var(--gold)',
                  border: '1px solid var(--gold-line)',
                }}>
                  {cm.archetype}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  joined {cm.joined_at ? new Date(cm.joined_at).toLocaleDateString() : '—'}
                </span>
                <Link
                  href={`/admin/members/${cm.member_id}`}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 6,
                    background: '#fff', color: 'var(--gold)',
                    border: '1px solid var(--gold-line)', textDecoration: 'none',
                  }}
                >
                  View →
                </Link>
                <button
                  onClick={() => handleRemove(cm.member_id, cm.cohort_name)}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '4px 10px', borderRadius: 6,
                    border: '1px solid rgba(187,52,52,0.35)',
                    background: 'rgba(187,52,52,0.08)', color: 'var(--red)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add to cohort */}
        {availableCohorts.length === 0 ? (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            {allCohorts.length === 0
              ? 'No cohorts exist yet. Create one in /admin/cohorts/new.'
              : 'Already enrolled in every cohort.'}
          </p>
        ) : (
          <div style={{
            background: 'var(--paper2)', border: '1px dashed var(--line-md)',
            borderRadius: 8, padding: 12,
            display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 200px', minWidth: 160 }}>
              <label style={S.label}>Add to cohort</label>
              <select
                value={addCohortId}
                onChange={e => setAddCohortId(e.target.value)}
                style={S.input}
              >
                <option value="">Pick a cohort…</option>
                {availableCohorts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{!c.is_active ? ' (inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: '0 0 130px' }}>
              <label style={S.label}>Archetype</label>
              <select
                value={addArchetype}
                onChange={e => setAddArchetype(e.target.value as 'door' | 'throne' | 'engine' | 'push')}
                style={S.input}
              >
                <option value="door">Door</option>
                <option value="throne">Throne</option>
                <option value="engine">Engine</option>
                <option value="push">Push</option>
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={!addCohortId || adding}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '7px 14px', borderRadius: 7,
                border: 'none',
                background: addCohortId && !adding ? 'var(--gold)' : 'var(--line)',
                color: '#fff', cursor: addCohortId && !adding ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                opacity: adding ? 0.7 : 1,
              }}
            >
              {adding ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
