'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { supabaseClient } from '@/lib/supabase/client'
import { autoMatchCohort, setPartner, unsetPartner } from '@/lib/circle'

type Cohort = {
  id: string
  name: string
  starts_at: string
  ends_at: string
  is_active: boolean
  max_members: number
  member_count?: number
}

type Member = {
  id: string
  user_id: string
  cohort_id: string
  archetype: 'door' | 'throne' | 'engine' | 'push'
  enneagram_type: string | null
  attachment_style: string | null
  feedback_pref: string | null
  goal_90day: string | null
  partner_id: string | null
  users?: { name: string | null; email: string | null } | null
}

type Call = {
  id: string
  cohort_id: string
  call_number: number
  title: string
  scheduled_at: string
  zoom_url: string | null
  recording_url: string | null
}

type WeeklyRow = {
  week_number: number
  archetype: string
  month_name: string
  week_title: string
  teaching?: string
  journal_prompt?: string
  weekly_action?: string
  monday_prompt?: string
  wednesday_prompt?: string
  friday_prompt?: string
  video_url?: string
  live_call_week?: boolean
}

const ARCHETYPE_LABEL: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

export default function AdminCirclePage() {
  const { loading, isAuthed, user } = useApp()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohortId, setSelectedCohortId] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [calls, setCalls] = useState<Call[]>([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  // ── Load cohorts (with member counts) ───────────────────────────
  const loadCohorts = useCallback(async () => {
    const { data } = await supabaseClient
      .from('circle_cohorts')
      .select('*')
      .order('starts_at', { ascending: false })
    if (!data) return
    // Fetch member counts in parallel
    const counts = await Promise.all(
      data.map(c =>
        supabaseClient
          .from('circle_members')
          .select('id', { count: 'exact', head: true })
          .eq('cohort_id', c.id)
          .then(r => ({ id: c.id, count: r.count ?? 0 }))
      )
    )
    const countMap = new Map(counts.map(r => [r.id, r.count]))
    setCohorts(data.map(c => ({ ...c, member_count: countMap.get(c.id) ?? 0 })))
    if (!selectedCohortId && data.length > 0) setSelectedCohortId(data[0].id)
  }, [selectedCohortId])

  const loadMembers = useCallback(async () => {
    if (!selectedCohortId) return setMembers([])
    const { data } = await supabaseClient
      .from('circle_members')
      .select('*, users:user_id (name, email)')
      .eq('cohort_id', selectedCohortId)
      .order('joined_at', { ascending: true })
    setMembers((data ?? []) as Member[])
  }, [selectedCohortId])

  const loadCalls = useCallback(async () => {
    if (!selectedCohortId) return setCalls([])
    const { data } = await supabaseClient
      .from('circle_live_calls')
      .select('*')
      .eq('cohort_id', selectedCohortId)
      .order('call_number', { ascending: true })
    setCalls((data ?? []) as Call[])
  }, [selectedCohortId])

  useEffect(() => { loadCohorts() }, [loadCohorts])
  useEffect(() => { loadMembers() }, [loadMembers])
  useEffect(() => { loadCalls() }, [loadCalls])

  function flash(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Create cohort ───────────────────────────────────────────────
  const [newCohortName, setNewCohortName] = useState('')
  const [newStartsAt, setNewStartsAt] = useState('')
  const [newEndsAt, setNewEndsAt] = useState('')
  const [newMaxMembers, setNewMaxMembers] = useState(16)

  async function createCohort() {
    if (!newCohortName || !newStartsAt || !newEndsAt) return flash('All cohort fields required')
    setBusy(true)
    const { error } = await supabaseClient.from('circle_cohorts').insert({
      name: newCohortName,
      starts_at: newStartsAt,
      ends_at: newEndsAt,
      max_members: newMaxMembers,
      is_active: false,
    })
    setBusy(false)
    if (error) return flash(`Error: ${error.message}`)
    setNewCohortName(''); setNewStartsAt(''); setNewEndsAt(''); setNewMaxMembers(16)
    flash('Cohort created')
    loadCohorts()
  }

  async function setActive(cohortId: string, active: boolean) {
    // If activating, deactivate all others so only one is active
    if (active) {
      await supabaseClient.from('circle_cohorts').update({ is_active: false }).neq('id', cohortId)
    }
    await supabaseClient.from('circle_cohorts').update({ is_active: active }).eq('id', cohortId)
    flash(active ? 'Cohort activated' : 'Cohort deactivated')
    loadCohorts()
  }

  async function deleteCohort(cohortId: string) {
    if (!confirm('Delete this cohort? All members, posts, calls, and content will cascade.')) return
    await supabaseClient.from('circle_cohorts').delete().eq('id', cohortId)
    flash('Cohort deleted')
    if (selectedCohortId === cohortId) setSelectedCohortId('')
    loadCohorts()
  }

  // ── Pairing ─────────────────────────────────────────────────────
  async function handleAutoMatch() {
    if (!selectedCohortId) return
    setBusy(true)
    const n = await autoMatchCohort(selectedCohortId)
    setBusy(false)
    flash(`Auto-matched ${n} pairing${n === 1 ? '' : 's'}`)
    loadMembers()
  }

  async function handleManualPair(memberId: string, partnerId: string) {
    if (!partnerId) {
      await unsetPartner(memberId)
      flash('Pairing removed')
    } else {
      await setPartner(memberId, partnerId)
      flash('Pair set')
    }
    loadMembers()
  }

  // ── Live calls ──────────────────────────────────────────────────
  const [newCallNumber, setNewCallNumber] = useState(1)
  const [newCallTitle, setNewCallTitle] = useState('')
  const [newCallWhen, setNewCallWhen] = useState('')
  const [newCallZoom, setNewCallZoom] = useState('')

  async function addCall() {
    if (!selectedCohortId || !newCallTitle || !newCallWhen) return flash('Title + time required')
    const { error } = await supabaseClient.from('circle_live_calls').insert({
      cohort_id: selectedCohortId,
      call_number: newCallNumber,
      title: newCallTitle,
      scheduled_at: newCallWhen,
      zoom_url: newCallZoom || null,
    })
    if (error) return flash(`Error: ${error.message}`)
    setNewCallTitle(''); setNewCallWhen(''); setNewCallZoom('')
    flash('Call added')
    loadCalls()
  }

  async function deleteCall(id: string) {
    await supabaseClient.from('circle_live_calls').delete().eq('id', id)
    flash('Call removed')
    loadCalls()
  }

  // ── Weekly content ──────────────────────────────────────────────
  const [jsonBlob, setJsonBlob] = useState('')
  const [contentCount, setContentCount] = useState(0)

  async function loadContentCount() {
    if (!selectedCohortId) return setContentCount(0)
    const { count } = await supabaseClient
      .from('circle_weekly_content')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', selectedCohortId)
    setContentCount(count ?? 0)
  }
  useEffect(() => { loadContentCount() }, [selectedCohortId, busy])

  async function bulkUpsertContent() {
    if (!selectedCohortId) return flash('Pick a cohort')
    let rows: WeeklyRow[]
    try { rows = JSON.parse(jsonBlob) }
    catch { return flash('Invalid JSON') }
    if (!Array.isArray(rows)) return flash('JSON must be an array')
    setBusy(true)
    const payload = rows.map(r => ({ ...r, cohort_id: selectedCohortId }))
    const { error } = await supabaseClient
      .from('circle_weekly_content')
      .upsert(payload, { onConflict: 'cohort_id,week_number,archetype' })
    setBusy(false)
    if (error) return flash(`Error: ${error.message}`)
    flash(`Upserted ${rows.length} rows`)
    loadContentCount()
  }

  // ── Auth gate ───────────────────────────────────────────────────
  if (loading) return <PageShell><p style={{ color: 'var(--text-muted)' }}>Loading…</p></PageShell>
  if (!isAuthed || !user.isAdmin) {
    return (
      <PageShell>
        <p style={{ color: 'var(--text-muted)' }}>This page is admin-only.</p>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--green)' }}>← Back to portal</Link>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <div>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', margin: 0 }}>Admin</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--ink)', margin: '4px 0 0' }}>
            The Circle
          </h1>
        </div>
        <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--text-soft)', textDecoration: 'none' }}>← Portal</Link>
      </div>

      {message && (
        <div style={{ padding: '10px 14px', marginBottom: 16, background: 'var(--green-pale)', border: '1px solid rgba(26,82,48,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--ink)' }}>
          {message}
        </div>
      )}

      {/* ── COHORTS ─────────────────────────────────────────────── */}
      <Section title="Cohorts">
        {cohorts.length === 0 ? (
          <EmptyText>No cohorts yet. Create one below.</EmptyText>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Name</Th><Th>Starts</Th><Th>Ends</Th><Th>Members</Th><Th>Active</Th><Th></Th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                  <Td>{c.name}</Td>
                  <Td>{c.starts_at}</Td>
                  <Td>{c.ends_at}</Td>
                  <Td>{c.member_count} / {c.max_members}</Td>
                  <Td>
                    <button onClick={() => setActive(c.id, !c.is_active)} style={c.is_active ? activeBtn : inactiveBtn}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </Td>
                  <Td>
                    <button onClick={() => deleteCohort(c.id)} style={dangerLink}>Delete</button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16, padding: 14, background: 'var(--paper)', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, alignItems: 'end' }}>
          <Field label="Name">
            <input value={newCohortName} onChange={e => setNewCohortName(e.target.value)} placeholder="Cohort 1 — Spring 2025" style={inputStyle} />
          </Field>
          <Field label="Starts">
            <input type="date" value={newStartsAt} onChange={e => setNewStartsAt(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Ends">
            <input type="date" value={newEndsAt} onChange={e => setNewEndsAt(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Max members">
            <input type="number" min={1} value={newMaxMembers} onChange={e => setNewMaxMembers(parseInt(e.target.value || '0', 10))} style={inputStyle} />
          </Field>
          <button onClick={createCohort} disabled={busy} style={primaryBtn}>Create cohort</button>
        </div>
      </Section>

      {/* ── COHORT PICKER ───────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Working on:</label>
        <select value={selectedCohortId} onChange={e => setSelectedCohortId(e.target.value)} style={{ ...inputStyle, minWidth: 240 }}>
          {cohorts.length === 0 && <option value="">No cohorts yet</option>}
          {cohorts.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.is_active ? 'active' : 'inactive'})
            </option>
          ))}
        </select>
      </div>

      {selectedCohortId && (
        <>
          {/* ── MEMBERS & PAIRING ────────────────────────────── */}
          <Section title={`Members & Pairing (${members.length})`}>
            {members.length === 0 ? (
              <EmptyText>No members enrolled in this cohort yet.</EmptyText>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <button onClick={handleAutoMatch} disabled={busy} style={primaryBtn}>
                    Auto-match unpaired
                  </button>
                </div>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <Th>Member</Th><Th>Archetype</Th><Th>Enn</Th><Th>Attach</Th><Th>Partner</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => {
                      const partnerName = m.partner_id
                        ? members.find(x => x.id === m.partner_id)?.users?.name ?? '—'
                        : ''
                      return (
                        <tr key={m.id} style={{ borderTop: '1px solid var(--line)' }}>
                          <Td>
                            <div style={{ fontWeight: 500 }}>{m.users?.name ?? m.user_id.slice(0, 8)}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.users?.email}</div>
                          </Td>
                          <Td>{ARCHETYPE_LABEL[m.archetype] ?? m.archetype}</Td>
                          <Td>{m.enneagram_type ?? '—'}</Td>
                          <Td>{m.attachment_style ?? '—'}</Td>
                          <Td>
                            <select
                              value={m.partner_id ?? ''}
                              onChange={e => handleManualPair(m.id, e.target.value)}
                              style={{ ...inputStyle, fontSize: 11, padding: '4px 6px' }}
                            >
                              <option value="">— unpaired —</option>
                              {members
                                .filter(o => o.id !== m.id)
                                .map(o => (
                                  <option key={o.id} value={o.id}>
                                    {o.users?.name ?? o.user_id.slice(0, 6)}{o.partner_id && o.partner_id !== m.id ? ' (paired)' : ''}
                                  </option>
                                ))}
                            </select>
                            {partnerName && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>→ {partnerName}</div>}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
          </Section>

          {/* ── LIVE CALLS ───────────────────────────────────── */}
          <Section title={`Live Calls (${calls.length})`}>
            {calls.length > 0 && (
              <table style={tableStyle}>
                <thead><tr><Th>#</Th><Th>Title</Th><Th>When</Th><Th>Zoom</Th><Th></Th></tr></thead>
                <tbody>
                  {calls.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--line)' }}>
                      <Td>{c.call_number}</Td>
                      <Td>{c.title}</Td>
                      <Td>{new Date(c.scheduled_at).toLocaleString()}</Td>
                      <Td>{c.zoom_url ? <a href={c.zoom_url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', fontSize: 11 }}>link</a> : '—'}</Td>
                      <Td><button onClick={() => deleteCall(c.id)} style={dangerLink}>Delete</button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ marginTop: 14, padding: 14, background: 'var(--paper)', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, alignItems: 'end' }}>
              <Field label="Call #">
                <input type="number" min={1} max={6} value={newCallNumber} onChange={e => setNewCallNumber(parseInt(e.target.value || '1', 10))} style={inputStyle} />
              </Field>
              <Field label="Title">
                <input value={newCallTitle} onChange={e => setNewCallTitle(e.target.value)} placeholder="Welcome to The Circle" style={inputStyle} />
              </Field>
              <Field label="When (UTC)">
                <input type="datetime-local" value={newCallWhen} onChange={e => setNewCallWhen(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Zoom URL">
                <input value={newCallZoom} onChange={e => setNewCallZoom(e.target.value)} placeholder="https://zoom.us/j/..." style={inputStyle} />
              </Field>
              <button onClick={addCall} disabled={busy} style={primaryBtn}>Add call</button>
            </div>
          </Section>

          {/* ── WEEKLY CONTENT ──────────────────────────────── */}
          <Section title={`Weekly Content (${contentCount} rows)`}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 10px', lineHeight: 1.6 }}>
              Paste a JSON array of rows. Each row needs <code>week_number</code> (1–12), <code>archetype</code>{' '}
              (<code>universal</code> | <code>door</code> | <code>throne</code> | <code>engine</code> | <code>push</code>),{' '}
              <code>month_name</code> (<code>root</code> | <code>rebuild</code> | <code>rise</code>), and{' '}
              <code>week_title</code>. Optional: <code>teaching</code>, <code>journal_prompt</code>,{' '}
              <code>weekly_action</code>, <code>monday_prompt</code>, <code>wednesday_prompt</code>,{' '}
              <code>friday_prompt</code>, <code>video_url</code>, <code>live_call_week</code>.
              Upsert keyed on (cohort, week, archetype).
            </p>
            <textarea
              value={jsonBlob}
              onChange={e => setJsonBlob(e.target.value)}
              placeholder={`[\n  {\n    "week_number": 1,\n    "archetype": "universal",\n    "month_name": "root",\n    "week_title": "The full picture",\n    "teaching": "Your pattern is not your personality...",\n    "monday_prompt": "Name the pattern out loud.",\n    "friday_prompt": "Share one moment this week.",\n    "live_call_week": true\n  }\n]`}
              rows={10}
              style={{ ...inputStyle, width: '100%', fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button onClick={bulkUpsertContent} disabled={busy || !jsonBlob.trim()} style={primaryBtn}>
                {busy ? 'Upserting…' : 'Upsert rows'}
              </button>
              <button onClick={() => setJsonBlob('')} style={secondaryBtn}>Clear</button>
            </div>
          </Section>
        </>
      )}
    </PageShell>
  )
}

// ── UI primitives ────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fafaf7', fontFamily: 'var(--font-body)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: 'white', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 20, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th style={{ padding: '8px 10px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 500 }}>{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '10px', fontSize: 13, color: 'var(--ink)', verticalAlign: 'top' }}>{children}</td>
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>{children}</p>
}

// ── Inline styles ────────────────────────────────────────────────
const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 9px',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
  border: '1px solid var(--line-md)',
  borderRadius: 6,
  outline: 'none',
  boxSizing: 'border-box',
}
const primaryBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--ink)',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
}
const secondaryBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: 'white',
  color: 'var(--text-soft)',
  border: '1px solid var(--line-md)',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
}
const activeBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'var(--green)',
  color: 'white',
  border: 'none',
  borderRadius: 12,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}
const inactiveBtn: React.CSSProperties = {
  padding: '4px 10px',
  background: 'transparent',
  color: 'var(--text-muted)',
  border: '1px solid var(--line-md)',
  borderRadius: 12,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  cursor: 'pointer',
}
const dangerLink: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--red)',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}
