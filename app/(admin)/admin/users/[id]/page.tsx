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
  fetchUserJournalEntries, fetchUserWins, fetchUserCheckIns, fetchUserReflections,
  fetchPendingPurchaseByEmail, adminClaimPurchaseForUser, adminSetCardsDay,
  adminSetCardsAddOn, getUserPrograms,
  fetchAllTags, fetchUserTags, assignTag, removeTag, createTag,
  type AdminUserDetail, type UserCohortMembership, type CohortOption,
  type AdminJournalEntry, type AdminWin, type AdminCheckIn, type ReflectionRow,
  type PendingPurchase, type UserTag, type TagColor,
} from '@/lib/admin/hooks'

const TAG_COLOR_STYLE: Record<TagColor, { bg: string; fg: string; border: string }> = {
  gold:  { bg: 'rgba(200,148,31,0.12)', fg: 'var(--gold)',  border: 'var(--gold-line)' },
  green: { bg: 'rgba(31,92,58,0.12)',   fg: 'var(--green)', border: 'rgba(31,92,58,0.25)' },
  red:   { bg: 'rgba(184,40,40,0.12)',  fg: 'var(--red)',   border: 'rgba(184,40,40,0.3)' },
  blue:  { bg: 'rgba(122,31,31,0.12)',  fg: '#7A1F1F',      border: 'rgba(122,31,31,0.25)' },
  gray:  { bg: 'rgba(0,0,0,0.06)',      fg: 'var(--text-muted)', border: 'var(--line)' },
}

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
  const [addSkipOnboarding, setAddSkipOnboarding] = useState(true)
  const [adding, setAdding] = useState(false)

  // Activity panel
  const [tab, setTab] = useState<'journal' | 'wins' | 'reflections' | 'checkins'>('journal')
  const [journal, setJournal] = useState<AdminJournalEntry[]>([])
  const [wins, setWins] = useState<AdminWin[]>([])
  const [reflections, setReflections] = useState<ReflectionRow[]>([])
  const [checkins, setCheckins] = useState<AdminCheckIn[]>([])

  // Pending purchase claim
  const [pending, setPending] = useState<PendingPurchase | null>(null)
  const [claiming, setClaiming] = useState(false)

  // Manual day adjustment
  const [dayInput, setDayInput] = useState('')
  const [savingDay, setSavingDay] = useState(false)

  // Tags
  const [allTags, setAllTags] = useState<UserTag[]>([])
  const [userTags, setUserTags] = useState<UserTag[]>([])
  const [creatingTag, setCreatingTag] = useState(false)
  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState<TagColor>('gold')

  // Invoice the user (Stripe-sent hosted invoice)
  const [invoiceAmount, setInvoiceAmount]   = useState('')
  const [invoiceMemo, setInvoiceMemo]       = useState('')
  const [invoiceAssignPath, setInvoiceAssignPath] = useState<'' | 'A' | 'B' | 'C'>('')
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [invoiceUrl, setInvoiceUrl]         = useState<string | null>(null)

  async function reload() {
    if (!userId) return
    setLoading(true)
    const [u, cs, all, j, w, r, ci, tAll, tUser] = await Promise.all([
      fetchAdminUserById(userId),
      fetchUserCohorts(userId),
      fetchAllCohortsForAdmin(),
      fetchUserJournalEntries(userId),
      fetchUserWins(userId),
      fetchUserReflections(userId),
      fetchUserCheckIns(userId),
      fetchAllTags(),
      fetchUserTags(userId),
    ])
    setUser(u)
    setCohorts(cs)
    setAllCohorts(all)
    setJournal(j)
    setWins(w)
    setReflections(r)
    setCheckins(ci)
    setAllTags(tAll)
    setUserTags(tUser)
    if (u?.email) setPending(await fetchPendingPurchaseByEmail(u.email))
    else setPending(null)
    setLoading(false)
  }

  async function handleToggleTag(tag: UserTag) {
    if (!user) return
    const has = userTags.some(t => t.id === tag.id)
    if (has) {
      const { error } = await removeTag(user.id, tag.id)
      if (error) { alert(error.message); return }
    } else {
      const { error } = await assignTag(user.id, tag.id)
      if (error) { alert(error.message); return }
    }
    const fresh = await fetchUserTags(user.id)
    setUserTags(fresh)
  }

  async function handleSendInvoice() {
    if (!user) return
    const amount = Math.round(parseFloat(invoiceAmount) * 100)
    if (!Number.isFinite(amount) || amount < 50) {
      alert('Enter an amount of at least $0.50.')
      return
    }
    if (invoiceMemo.trim().length < 3) {
      alert('Describe what this invoice is for (at least 3 characters).')
      return
    }
    if (!confirm(`Send a Stripe invoice for $${(amount / 100).toFixed(2)} to ${user.email}?\n\nStripe will email them a hosted payment link.`)) return
    setSendingInvoice(true)
    setInvoiceUrl(null)
    try {
      const res = await fetch('/api/admin/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          amountCents: amount,
          description: invoiceMemo.trim(),
          assignPath: invoiceAssignPath || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        alert(json.error ?? 'Could not send invoice.')
        return
      }
      setInvoiceUrl(json.hosted_invoice_url ?? null)
      setInvoiceAmount('')
      setInvoiceMemo('')
      setInvoiceAssignPath('')
    } catch (err) {
      alert('Network error sending invoice.')
      console.error(err)
    } finally {
      setSendingInvoice(false)
    }
  }

  async function handleCreateTag() {
    if (!newTagLabel.trim()) return
    setCreatingTag(true)
    const { data, error } = await createTag(newTagLabel, newTagColor)
    setCreatingTag(false)
    if (error) {
      alert(error.message)
      return
    }
    setNewTagLabel('')
    const fresh = await fetchAllTags()
    setAllTags(fresh)
    if (data && user) {
      await assignTag(user.id, data.id)
      setUserTags(await fetchUserTags(user.id))
    }
  }

  async function handleClaim() {
    if (!user || !pending) return
    if (!confirm(`Force-claim Path ${pending.path} purchase from ${pending.email} onto this user?\n\nThis grants paid access and links the Stripe customer.`)) return
    setClaiming(true)
    const { error } = await adminClaimPurchaseForUser(pending.id, user.id)
    setClaiming(false)
    if (error) {
      alert(`Could not claim: ${error.message}`)
      return
    }
    await reload()
  }

  async function handleSetDay() {
    if (!user) return
    const n = parseInt(dayInput, 10)
    if (!Number.isFinite(n) || n < 1 || n > 365) {
      alert('Pick a day between 1 and 365.')
      return
    }
    if (!confirm(`Move this user to Day ${n}?\n\nThis back-dates their cards anchor so today reads as Day ${n}.`)) return
    setSavingDay(true)
    const hasCardsAddOn = !!user.cards_addon_started_at
    const { error } = await adminSetCardsDay(user.id, n, user.selected_path, hasCardsAddOn)
    setSavingDay(false)
    if (error) {
      alert(error.message ?? 'Could not adjust day.')
      return
    }
    setDayInput('')
    await reload()
  }

  function handleExport() {
    if (!user) return
    const bundle = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id, name: user.name, email: user.email,
        selected_path: user.selected_path, quiz_result: user.quiz_result,
        has_paid: user.has_paid, is_admin: user.is_admin,
        onboarding_complete: user.onboarding_complete,
        signup_date: user.signup_date,
      },
      cohort_memberships: cohorts,
      journal_entries: journal,
      wins,
      reflections,
      check_ins: checkins,
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    const safeName = (user.name || user.email || user.id).replace(/[^a-z0-9._-]+/gi, '_')
    a.download = `${safeName}_export_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
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
    const { error } = await adminAddUserToCohort(user.id, addCohortId, addArchetype, { skipOnboarding: addSkipOnboarding })
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

  // Effective cards Day based on the appropriate anchor column.
  const hasCardsAddOn = !!user.cards_addon_started_at
  const dayAnchor = user.selected_path === 'B'
    ? user.signup_date
    : (user.selected_path === 'A' && hasCardsAddOn ? user.cards_addon_started_at : null)
  const currentDay = dayAnchor
    ? Math.max(1, Math.floor((Date.now() - new Date(dayAnchor).getTime()) / 86400000) + 1)
    : null
  const dayAdjustable = user.selected_path === 'B' || (user.selected_path === 'A' && hasCardsAddOn)

  // Indicator helper
  function indicator(key: string) {
    if (savingId === key) return '…'
    if (savedId  === key) return '✓ saved'
    return ''
  }

  const S = {
    panel: { background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 18px', marginBottom: 16 },
    label: { fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', display: 'block' as const, marginBottom: 4 },
    input: {
      background: '#fff', border: '1px solid var(--line-md)', borderRadius: 8,
      color: 'var(--ink)', fontSize: 13, padding: '7px 10px', outline: 'none',
      fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
    },
    saved: { fontSize: 10, color: 'var(--green)', fontWeight: 600 },
    fieldRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' },
    sectionH: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', margin: '0 0 12px' },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>

      {/* ── Top breadcrumb ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, fontSize: 12 }}>
        <Link href="/admin/users" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← All users
        </Link>
        <button
          onClick={handleExport}
          style={{
            marginLeft: 'auto',
            fontSize: 11, fontWeight: 600,
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid var(--line-md)', background: '#fff',
            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
          }}
          title="Download all of this user's data as JSON"
        >
          Export JSON ↓
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {indicator('any')}
        </span>
      </div>

      {/* ── Pending purchase warning ─────────────────────────────────── */}
      {pending && (
        <div style={{
          background: 'rgba(200,148,31,0.1)',
          border: '1px solid var(--gold-line)',
          borderRadius: 12, padding: 14,
          marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ flex: '1 1 240px', minWidth: 0, fontSize: 12, color: 'var(--ink)' }}>
            <strong>Unclaimed Stripe purchase</strong> · Path {pending.path} · {pending.email} · paid {new Date(pending.created_at).toLocaleString()}.
            {' '}This user has no claim yet — usually the webhook fired after signup with a different email. Force-claim to grant access.
          </div>
          <button
            onClick={handleClaim}
            disabled={claiming}
            style={{
              fontSize: 12, fontWeight: 600,
              padding: '7px 14px', borderRadius: 7, border: 'none',
              background: 'var(--gold)', color: '#fff',
              cursor: claiming ? 'not-allowed' : 'pointer',
              opacity: claiming ? 0.7 : 1,
              fontFamily: 'inherit',
            }}
          >
            {claiming ? 'Claiming…' : 'Force-claim →'}
          </button>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div style={{ ...S.panel, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--gold-pale)', color: 'var(--gold)',
          border: '1px solid var(--gold-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, flexShrink: 0,
          overflow: 'hidden',
        }}>
          {user.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : initials}
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>
            User profile
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 }}>
            {display}
            {user.is_admin && (
              <span style={{ marginLeft: 10, fontSize: 9, color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Admin
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 520 }}>
            {user.email ?? '— no email —'} · Signed up {user.signup_date ? new Date(user.signup_date).toLocaleDateString() : '—'}
          </p>
          {(() => {
            const programs = getUserPrograms({
              selected_path: user.selected_path,
              cards_addon_started_at: user.cards_addon_started_at,
              has_circle_membership: cohorts.length > 0,
            })
            if (programs.length === 0) return null
            return (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                {programs.length > 1 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(0,0,0,0.7)', color: '#fff',
                    letterSpacing: '.06em', textTransform: 'uppercase',
                  }}>
                    In {programs.length} programs
                  </span>
                )}
                {programs.map(p => {
                  const c = (p.color === 'gold'
                    ? { bg: 'rgba(200,148,31,0.12)', fg: 'var(--gold)',  border: 'var(--gold-line)' }
                    : p.color === 'green'
                    ? { bg: 'rgba(31,92,58,0.12)',   fg: 'var(--green)', border: 'rgba(31,92,58,0.25)' }
                    : { bg: 'rgba(122,31,31,0.12)',  fg: '#7A1F1F',      border: 'rgba(122,31,31,0.25)' })
                  return (
                    <span key={p.key + p.label} style={{
                      fontSize: 10, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 999,
                      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
                      letterSpacing: '.04em',
                    }}>
                      {p.label}
                    </span>
                  )
                })}
              </div>
            )
          })()}
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
            <option value="A">Path A · Seal the Leak</option>
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
            <option value="seeker">Overthinker&apos;s Throne</option>
            <option value="healer">Open Door</option>
            <option value="builder">Interrupted Engine</option>
            <option value="visionary">Pushthrough</option>
          </select>
          <span style={{ ...S.saved, minWidth: 50, textAlign: 'right' }}>{indicator('quiz')}</span>
        </div>

        {/* Cards add-on — Path A users can buy 365 Cards as a $9/mo add-on */}
        {user.selected_path === 'A' && (
          <div style={S.fieldRow}>
            <div style={{ flex: '0 0 140px' }}>
              <label style={S.label}>365 Cards add-on</label>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Adds daily card access alongside Seal the Leak.
              </p>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={!!user.cards_addon_started_at}
                onChange={async e => {
                  setSavingId('addon')
                  setUser(prev => prev ? { ...prev, cards_addon_started_at: e.target.checked ? new Date().toISOString() : null } : prev)
                  const { error } = await adminSetCardsAddOn(user.id, e.target.checked)
                  setSavingId(null)
                  if (error) {
                    alert(`Could not update add-on: ${error.message}`)
                    await reload()
                    return
                  }
                  setSavedId('addon')
                  setTimeout(() => setSavedId(c => c === 'addon' ? null : c), 1400)
                }}
              />
              {user.cards_addon_started_at
                ? `Active since ${new Date(user.cards_addon_started_at).toLocaleDateString()}`
                : 'Not enabled'}
              <span style={S.saved}>{indicator('addon')}</span>
            </label>
          </div>
        )}

        {/* Cards Day adjustment — only meaningful when there's an anchor */}
        {dayAdjustable && (
          <div style={{ ...S.fieldRow, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 140px' }}>
              <label style={S.label}>Cards Day</label>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {user.selected_path === 'B' ? 'Anchored to signup_date' : 'Anchored to cards_addon_started_at'}
              </p>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
                Currently on Day {currentDay ?? '—'}
              </span>
              <input
                type="number"
                min={1}
                max={365}
                value={dayInput}
                onChange={e => setDayInput(e.target.value)}
                placeholder="Move to…"
                style={{ ...S.input, width: 110, flex: '0 0 110px' }}
              />
              <button
                onClick={handleSetDay}
                disabled={savingDay || !dayInput}
                style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '7px 12px', borderRadius: 7, border: 'none',
                  background: dayInput && !savingDay ? 'var(--gold)' : 'var(--line)',
                  color: '#fff',
                  cursor: dayInput && !savingDay ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  opacity: savingDay ? 0.7 : 1,
                }}
              >
                {savingDay ? 'Saving…' : 'Apply'}
              </button>
            </div>
          </div>
        )}

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

      {/* ── Tags ─────────────────────────────────────────────────────── */}
      <div style={S.panel}>
        <h2 style={S.sectionH}>Tags</h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Click any tag to add or remove it. Tags work across all paths — useful for VIPs, comp accounts, follow-ups.
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {allTags.length === 0 ? (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No tags yet. Create one below — or run migration 016 if this list looks empty.
            </span>
          ) : allTags.map(t => {
            const c = TAG_COLOR_STYLE[t.color]
            const on = userTags.some(x => x.id === t.id)
            return (
              <button
                key={t.id}
                onClick={() => handleToggleTag(t)}
                style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '5px 11px', borderRadius: 999,
                  background: on ? c.fg : c.bg,
                  color: on ? '#fff' : c.fg,
                  border: `1px solid ${c.border}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                }}
              >
                {on ? '✓ ' : '+ '}{t.label}
              </button>
            )
          })}
        </div>

        {/* Create new tag */}
        <div style={{
          background: 'var(--paper2)', border: '1px dashed var(--line-md)',
          borderRadius: 8, padding: 10,
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            placeholder="New tag name…"
            value={newTagLabel}
            onChange={e => setNewTagLabel(e.target.value)}
            style={{ ...S.input, flex: '1 1 180px', minWidth: 140 }}
          />
          <select
            value={newTagColor}
            onChange={e => setNewTagColor(e.target.value as TagColor)}
            style={{ ...S.input, flex: '0 0 100px' }}
          >
            <option value="gold">Gold</option>
            <option value="green">Green</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="gray">Gray</option>
          </select>
          <button
            onClick={handleCreateTag}
            disabled={!newTagLabel.trim() || creatingTag}
            style={{
              fontSize: 11, fontWeight: 600,
              padding: '7px 12px', borderRadius: 7, border: 'none',
              background: newTagLabel.trim() && !creatingTag ? 'var(--gold)' : 'var(--line)',
              color: '#fff', cursor: newTagLabel.trim() && !creatingTag ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            {creatingTag ? 'Adding…' : 'Add tag'}
          </button>
        </div>
      </div>

      {/* ── Charge / invoice ─────────────────────────────────────────── */}
      <div style={S.panel}>
        <h2 style={S.sectionH}>Charge or invoice</h2>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          Send this user a Stripe invoice. They&apos;ll receive an email with a hosted payment link — no card on file required.
        </p>
        <div style={{
          background: 'var(--paper2)', border: '1px dashed var(--line-md)',
          borderRadius: 8, padding: 12,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10,
          alignItems: 'end',
        }}>
          <div>
            <label style={S.label}>Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.50"
              placeholder="49.00"
              value={invoiceAmount}
              onChange={e => setInvoiceAmount(e.target.value)}
              style={S.input}
            />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={S.label}>What is it for?</label>
            <input
              type="text"
              placeholder="e.g. Make-up payment for August"
              value={invoiceMemo}
              onChange={e => setInvoiceMemo(e.target.value)}
              style={S.input}
            />
          </div>
          <div>
            <label style={S.label}>Assign to program</label>
            <select
              value={invoiceAssignPath}
              onChange={e => setInvoiceAssignPath(e.target.value as '' | 'A' | 'B' | 'C')}
              style={S.input}
              title="When the invoice is paid, assign this path automatically. Leave blank for one-off payments."
            >
              <option value="">— No path change —</option>
              <option value="A">Seal the Leak (A)</option>
              <option value="B">365 Cards (B)</option>
              <option value="C">The Circle (C)</option>
            </select>
          </div>
          <button
            onClick={handleSendInvoice}
            disabled={sendingInvoice || !invoiceAmount || !invoiceMemo.trim()}
            style={{
              fontSize: 12, fontWeight: 600,
              padding: '9px 14px', borderRadius: 8, border: 'none',
              background: invoiceAmount && invoiceMemo.trim() && !sendingInvoice ? 'var(--green)' : 'var(--line)',
              color: '#fff',
              cursor: invoiceAmount && invoiceMemo.trim() && !sendingInvoice ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
            }}
          >
            {sendingInvoice ? 'Sending…' : 'Send invoice →'}
          </button>
        </div>

        {invoiceUrl && (
          <div style={{
            background: 'var(--green-pale)', border: '1px solid rgba(31,92,58,0.3)',
            borderRadius: 8, padding: '10px 12px', marginTop: 12,
            fontSize: 12, color: 'var(--ink)',
          }}>
            ✓ Invoice sent. Stripe is emailing it now.{' '}
            <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--green)', fontWeight: 600 }}>
              Open hosted payment page →
            </a>
          </div>
        )}

        <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
          When the invoice is paid, the webhook auto-flips their <strong>Paid</strong> flag.
          If you pick a program above, their <strong>Path</strong> is also assigned automatically — useful when the invoice is for a brand-new program enrollment.
        </p>
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

            {/* Manual-onboard toggle — admin assigns the archetype above and the
                member skips the quiz/onboarding entirely. Uncheck to instead
                send them through the normal quiz flow on first login. */}
            <label style={{
              flexBasis: '100%', display: 'flex', alignItems: 'flex-start', gap: 8,
              fontSize: 12, color: 'var(--text-soft)', cursor: 'pointer', marginTop: 2,
            }}>
              <input
                type="checkbox"
                checked={addSkipOnboarding}
                onChange={e => setAddSkipOnboarding(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Skip quiz &amp; onboarding — member lands straight in The Circle
                <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                  Uses the archetype above and marks them onboarded. Uncheck to make them take the quiz on first login instead.
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* ── Activity (journal / wins / reflections / check-ins) ─────── */}
      <div style={S.panel}>
        <h2 style={S.sectionH}>Activity</h2>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {([
            ['journal',     `Journal (${journal.length})`],
            ['wins',        `Wins (${wins.length})`],
            ['reflections', `Reflections (${reflections.length})`],
            ['checkins',    `Check-ins (${checkins.length})`],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '5px 11px', borderRadius: 999,
                border: '1px solid ' + (tab === k ? 'var(--gold)' : 'var(--line)'),
                background: tab === k ? 'var(--gold-pale)' : '#fff',
                color: tab === k ? 'var(--gold)' : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tab === 'journal' && (journal.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No journal entries.</p>
          ) : journal.map(j => (
            <div key={j.id} style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '.04em' }}>
                {j.day_number != null && <span>DAY {j.day_number}</span>}
                <span style={{ marginLeft: 'auto' }}>{new Date(j.created_at).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{j.content}</div>
            </div>
          )))}

          {tab === 'wins' && (wins.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No wins logged.</p>
          ) : wins.map(w => (
            <div key={w.id} style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>{w.category}</span>
                <span style={{ marginLeft: 'auto' }}>{new Date(w.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600, marginBottom: 4 }}>{w.title}</div>
              {w.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{w.description}</div>}
            </div>
          )))}

          {tab === 'reflections' && (reflections.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No Seal-the-Leak reflections.</p>
          ) : reflections.map(r => (
            <div key={r.id} style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '.04em', textTransform: 'uppercase' }}>
                <span>{r.route_id}</span>
                <span>· Day {r.day_number} · Item {r.item_index + 1}</span>
                <span style={{ marginLeft: 'auto' }}>{new Date(r.updated_at).toLocaleDateString()}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r.content}</div>
            </div>
          )))}

          {tab === 'checkins' && (checkins.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No check-ins.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
              {checkins.map(ci => (
                <div key={ci.id} style={{ background: 'var(--paper2)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{new Date(ci.check_in_date).toLocaleDateString()}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600, marginTop: 2 }}>{ci.mood}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
