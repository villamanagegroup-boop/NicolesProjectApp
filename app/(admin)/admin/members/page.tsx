// app/(admin)/admin/members/page.tsx
// Member roster with filters, engagement status, and inline profile drawer

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchAdminMembers, fetchCoachingNotes, addCoachingNote,
  fetchMessageTemplates, fetchAdminCohorts,
  fetchCoachThread, sendCoachMessage,
  type AdminMemberRow, type CoachingNote, type MessageTemplate, type CoachMessage,
} from '@/lib/admin/hooks'
import { uploadCircleAttachment } from '@/lib/circle'
import AttachmentPicker, { type AttachmentSlots, type AttachmentSlot } from '@/components/circle/AttachmentPicker'

const ARCHETYPE_COLORS: Record<string, string> = {
  door: 'var(--green)', throne: '#1a1a2e', engine: 'var(--red)', push: '#3d2c0e',
}
const ARCHETYPE_LABELS: Record<string, string> = {
  door: 'Open Door', throne: 'Overthink Throne', engine: 'Interrupted Engine', push: 'Pushthrough',
}
const ALERT_COLORS = {
  amber:  { bg: 'rgba(184,146,42,.15)', text: 'var(--gold)' },
  orange: { bg: 'rgba(201,125,58,.15)', text: '#C97D3A' },
  red:    { bg: 'rgba(139,31,47,.25)', text: 'var(--red)' },
}

function ProgressDots({ journal, action }: { journal: boolean; action: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[journal, action].map((done, i) => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: done ? 'var(--green)' : 'var(--line)',
        }} />
      ))}
    </div>
  )
}

function MembersInner() {
  const searchParams = useSearchParams()
  const focusMemberId = searchParams?.get('member')

  const [cohortId, setCohortId] = useState<string>('')
  const [cohorts, setCohorts] = useState<{ id: string; name: string; current_week: number }[]>([])
  const [members, setMembers] = useState<AdminMemberRow[]>([])
  const [filtered, setFiltered] = useState<AdminMemberRow[]>([])
  const [loading, setLoading] = useState(false)

  const [filterArchetype, setFilterArchetype] = useState('all')
  const [filterAlert, setFilterAlert] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedMember, setSelectedMember] = useState<AdminMemberRow | null>(null)
  const [drawerTab, setDrawerTab] = useState<'profile' | 'notes' | 'message'>('profile')
  const [notes, setNotes] = useState<CoachingNote[]>([])
  const [newNote, setNewNote] = useState('')
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [msgBody, setMsgBody] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const [thread, setThread] = useState<CoachMessage[]>([])
  const [coachUserId, setCoachUserId] = useState<string>('')
  const [attachments, setAttachments] = useState<AttachmentSlots>({ audio: null, video: null, image: null, doc: null })
  const [showPicker, setShowPicker]   = useState(false)

  function setSlot(slot: AttachmentSlot, file: File | null) {
    setAttachments(prev => ({ ...prev, [slot]: file }))
  }
  function clearAttachments() {
    setAttachments({ audio: null, video: null, image: null, doc: null })
  }
  const hasAttachment = !!(attachments.audio || attachments.video || attachments.image || attachments.doc)

  useEffect(() => {
    fetchAdminCohorts().then(c => {
      const active = c.filter(x => x.status === 'active')
      setCohorts(active.map(x => ({ id: x.id, name: x.name, current_week: x.current_week })))
      if (active[0]) setCohortId(active[0].id)
    })
    fetchMessageTemplates().then(setTemplates)
  }, [])

  useEffect(() => {
    if (!cohortId) return
    setLoading(true)
    const cw = cohorts.find(c => c.id === cohortId)?.current_week ?? 1
    fetchAdminMembers(cohortId, cw)
      .then(m => { setMembers(m); setFiltered(m) })
      .finally(() => setLoading(false))
  }, [cohortId, cohorts])

  useEffect(() => {
    let f = members
    if (filterArchetype !== 'all') f = f.filter(m => m.archetype === filterArchetype)
    if (filterAlert === 'at_risk') f = f.filter(m => m.alert_level === 'red')
    else if (filterAlert === 'quiet') f = f.filter(m => m.alert_level === 'orange' || m.alert_level === 'amber')
    else if (filterAlert === 'active') f = f.filter(m => !m.alert_level)
    if (searchQuery) f = f.filter(m => m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    setFiltered(f)
  }, [members, filterArchetype, filterAlert, searchQuery])

  useEffect(() => {
    if (focusMemberId && members.length > 0) {
      const m = members.find(x => x.id === focusMemberId)
      if (m) openMember(m)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusMemberId, members])

  async function openMember(m: AdminMemberRow) {
    setSelectedMember(m)
    setDrawerTab('profile')
    const [n, t, { data: { user } }] = await Promise.all([
      fetchCoachingNotes(m.id),
      fetchCoachThread(m.user_id),
      supabaseClient.auth.getUser(),
    ])
    setNotes(n)
    setThread(t)
    setCoachUserId(user?.id ?? '')
  }

  async function handleAddNote() {
    if (!selectedMember || !newNote.trim()) return
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return
    await addCoachingNote(selectedMember.id, user.id, newNote.trim())
    const updated = await fetchCoachingNotes(selectedMember.id)
    setNotes(updated)
    setNewNote('')
  }

  async function handleSendMessage() {
    if (!selectedMember || (!msgBody.trim() && !hasAttachment) || !coachUserId) return
    setMsgSending(true)

    const urls: { audio_url?: string | null; video_url?: string | null; image_url?: string | null; file_url?: string | null; file_name?: string | null } = {}
    if (attachments.audio) urls.audio_url = await uploadCircleAttachment(attachments.audio)
    if (attachments.video) urls.video_url = await uploadCircleAttachment(attachments.video)
    if (attachments.image) urls.image_url = await uploadCircleAttachment(attachments.image)
    if (attachments.doc)  { urls.file_url = await uploadCircleAttachment(attachments.doc); urls.file_name = attachments.doc.name }

    await sendCoachMessage({
      user_id: selectedMember.user_id,
      sender_id: coachUserId,
      body: msgBody.trim(),
      ...urls,
    })
    const fresh = await fetchCoachThread(selectedMember.user_id)
    setThread(fresh)
    setMsgBody('')
    clearAttachments()
    setShowPicker(false)
    setMsgSending(false)
  }

  function applyTemplate(t: MessageTemplate) {
    setMsgBody(t.body.replace('{{member_name}}', selectedMember?.full_name ?? 'there'))
  }

  const S = {
    page: { color: 'var(--ink)' as const },
    header: { marginBottom: '24px', display: 'flex', alignItems: 'flex-start' as const, justifyContent: 'space-between' as const, gap: '16px', flexWrap: 'wrap' as const },
    h1: { fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: 0 },
    filterBar: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const, alignItems: 'center' as const },
    select: {
      background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px',
      color: 'var(--text-soft)', fontSize: '12px', padding: '6px 10px', cursor: 'pointer',
    },
    searchInput: {
      background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px',
      color: 'var(--ink)', fontSize: '12px', padding: '6px 12px', outline: 'none',
      minWidth: '200px',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: {
      fontSize: '10px', fontWeight: 700, letterSpacing: '.09em',
      textTransform: 'uppercase' as const, color: 'var(--text-muted)',
      padding: '8px 12px', textAlign: 'left' as const,
      borderBottom: '1px solid var(--line)',
    },
    tr: { borderBottom: '1px solid var(--line)', cursor: 'pointer', transition: 'background .1s' },
    td: { padding: '12px', fontSize: '13px', color: 'var(--ink)', verticalAlign: 'middle' as const },
    drawer: {
      position: 'fixed' as const, top: 0, right: 0, bottom: 0,
      width: 'min(400px, 100vw)',
      background: '#ffffff', borderLeft: '1px solid var(--line)',
      display: 'flex', flexDirection: 'column' as const, zIndex: 100,
      overflowY: 'auto' as const,
    },
    drawerHeader: { padding: '20px 20px 16px', borderBottom: '1px solid var(--line)' },
    drawerTabs: { display: 'flex', gap: 0, borderBottom: '1px solid var(--line)' },
    drawerTab: (active: boolean) => ({
      flex: 1, padding: '10px', fontSize: '12px', fontWeight: active ? 600 : 500,
      color: active ? 'var(--gold)' : 'var(--text-muted)', background: 'none', border: 'none',
      borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
      cursor: 'pointer', transition: 'all .15s',
    }),
    drawerBody: { padding: '16px 20px', flex: 1 },
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '4px' },
    value: { fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6 },
    noteCard: {
      background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px',
      padding: '10px 12px', marginBottom: '8px',
    },
    btn: (variant: 'primary' | 'secondary') => ({
      fontSize: '12px', fontWeight: 600, padding: '8px 14px', borderRadius: '8px',
      cursor: 'pointer', border: 'none',
      background: variant === 'primary' ? 'var(--green)' : 'var(--line)',
      color: variant === 'primary' ? '#fff' : 'var(--text-soft)',
    }),
    textarea: {
      width: '100%', background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: '8px', color: 'var(--ink)', fontSize: '12px',
      padding: '10px 12px', resize: 'vertical' as const, minHeight: '80px',
      outline: 'none', fontFamily: 'inherit',
    },
    input: {
      width: '100%', background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: '8px', color: 'var(--ink)', fontSize: '12px',
      padding: '8px 12px', outline: 'none', fontFamily: 'inherit',
      marginBottom: '8px',
    },
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Members</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {filtered.length} of {members.length} members
          </p>
        </div>

        <select
          value={cohortId}
          onChange={e => setCohortId(e.target.value)}
          style={{ ...S.select, padding: '8px 12px', fontSize: '13px' }}
        >
          {cohorts.length === 0 && <option value="">No active cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Filter bar */}
      <div style={S.filterBar}>
        <input
          placeholder="Search members..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={S.searchInput}
        />
        <select value={filterArchetype} onChange={e => setFilterArchetype(e.target.value)} style={S.select}>
          <option value="all">All archetypes</option>
          <option value="door">Open Door</option>
          <option value="throne">Overthink Throne</option>
          <option value="engine">Interrupted Engine</option>
          <option value="push">Pushthrough</option>
        </select>
        <select value={filterAlert} onChange={e => setFilterAlert(e.target.value)} style={S.select}>
          <option value="all">All statuses</option>
          <option value="at_risk">At risk 🔴</option>
          <option value="quiet">Quiet 🟠</option>
          <option value="active">Active ✅</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>Loading members...</div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid var(--line)', borderRadius: '14px', overflowX: 'auto' }}>
          <table style={{ ...S.table, minWidth: 760 }}>
            <thead>
              <tr>
                {['Member', 'Archetype', 'Partner', 'This week', 'Progress', 'Last active', 'Status'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const alertColor = m.alert_level ? ALERT_COLORS[m.alert_level] : null
                return (
                  <tr
                    key={m.id}
                    style={S.tr}
                    onClick={() => openMember(m)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--paper2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: ARCHETYPE_COLORS[m.archetype] ?? 'var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: '#fff',
                        }}>
                          {(m.full_name ?? 'M').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{m.full_name ?? 'Unknown'}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '2px 8px',
                        borderRadius: '8px', background: `${ARCHETYPE_COLORS[m.archetype]}30`,
                        color: 'var(--gold)',
                      }}>
                        {ARCHETYPE_LABELS[m.archetype] ?? m.archetype}
                      </span>
                    </td>
                    <td style={{ ...S.td, color: m.partner_name ? 'var(--text-soft)' : 'var(--text-muted)' }}>
                      {m.partner_name ?? '—'}
                    </td>
                    <td style={S.td}>
                      <ProgressDots
                        journal={m.current_week_journal}
                        action={m.current_week_action}
                      />
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '50px', height: '4px', background: 'var(--line)', borderRadius: '2px' }}>
                          <div style={{ width: `${m.week_completion_pct}%`, height: '4px', background: 'var(--green)', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.week_completion_pct}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontSize: '11px', color: 'var(--text-muted)' }}>
                      {m.last_active ? `${m.days_inactive}d ago` : 'Never'}
                    </td>
                    <td style={S.td}>
                      {alertColor ? (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px',
                          borderRadius: '8px', background: alertColor.bg, color: alertColor.text,
                          textTransform: 'uppercase', letterSpacing: '.05em',
                        }}>
                          {m.alert_level === 'red' ? 'At risk' : m.alert_level === 'orange' ? 'Check in' : 'Monitor'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--green)' }}>Active ✓</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              {members.length === 0 ? 'No members in this cohort yet' : 'No members match this filter'}
            </div>
          )}
        </div>
      )}

      {/* Member drawer */}
      {selectedMember && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 99 }}
            onClick={() => setSelectedMember(null)}
          />
          <div style={S.drawer}>
            <div style={S.drawerHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: ARCHETYPE_COLORS[selectedMember.archetype] ?? 'var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700, color: '#fff',
                }}>
                  {(selectedMember.full_name ?? 'M').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                    {selectedMember.full_name ?? 'Unknown member'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedMember.email}</div>
                </div>
                <button
                  onClick={() => setSelectedMember(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
                >
                  ×
                </button>
              </div>

              {selectedMember.alert_level && (
                <div style={{
                  padding: '8px 12px', borderRadius: '8px',
                  background: ALERT_COLORS[selectedMember.alert_level].bg,
                  color: ALERT_COLORS[selectedMember.alert_level].text,
                  fontSize: '12px', fontWeight: 600,
                }}>
                  {selectedMember.days_inactive} days inactive — needs attention
                </div>
              )}
            </div>

            <div style={S.drawerTabs}>
              {(['profile', 'notes', 'message'] as const).map(tab => (
                <button key={tab} style={S.drawerTab(drawerTab === tab)} onClick={() => setDrawerTab(tab)}>
                  {tab === 'profile' ? 'Profile' : tab === 'notes' ? `Notes (${notes.length})` : 'Message'}
                </button>
              ))}
            </div>

            <div style={S.drawerBody}>

              {drawerTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { label: 'Archetype', value: ARCHETYPE_LABELS[selectedMember.archetype] },
                    { label: 'Enneagram type', value: selectedMember.enneagram_type ? `Type ${selectedMember.enneagram_type}` : '—' },
                    { label: 'Attachment style', value: selectedMember.attachment_style ?? '—' },
                    { label: 'Feedback preference', value: selectedMember.feedback_preference ?? '—' },
                    { label: '90-day focus', value: selectedMember.goal_90_day ?? '—' },
                    { label: 'Accountability partner', value: selectedMember.partner_name ?? 'Not yet paired' },
                    { label: 'Overall completion', value: `${selectedMember.week_completion_pct}%` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={S.label}>{label}</div>
                      <div style={S.value}>{value}</div>
                    </div>
                  ))}

                  <div>
                    <div style={S.label}>This week&apos;s progress</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {[
                        { label: 'Journal', done: selectedMember.current_week_journal },
                        { label: 'Action', done: selectedMember.current_week_action },
                      ].map(({ label, done }) => (
                        <div key={label} style={{
                          flex: 1, padding: '8px', borderRadius: '8px', textAlign: 'center',
                          background: done ? 'rgba(31,92,58,.3)' : 'var(--line)',
                          border: `1px solid ${done ? 'var(--green)' : 'var(--line-md)'}`,
                        }}>
                          <div style={{ fontSize: '16px' }}>{done ? '✓' : '○'}</div>
                          <div style={{ fontSize: '10px', color: done ? 'var(--green)' : 'var(--text-muted)', marginTop: '2px' }}>
                            {label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedMember.has_transformation_story && (
                    <div style={{
                      padding: '10px 12px', borderRadius: '8px',
                      background: 'rgba(184,146,42,.1)', border: '1px solid rgba(184,146,42,.3)',
                      fontSize: '12px', color: 'var(--gold)',
                    }}>
                      ✨ Transformation story submitted
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'notes' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <textarea
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Add a private coaching note..."
                      style={S.textarea}
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                      style={{ ...S.btn('primary'), marginTop: '8px', opacity: newNote.trim() ? 1 : 0.5 }}
                    >
                      Add note
                    </button>
                  </div>

                  {notes.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                      No coaching notes yet
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note.id} style={S.noteCard}>
                        <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.7 }}>{note.note}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                          {new Date(note.created_at).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {drawerTab === 'message' && (
                <div>
                  {/* Two-way coach chat thread */}
                  <div style={{
                    background: 'var(--paper)', border: '1px solid var(--line)',
                    borderRadius: '10px', padding: '10px', minHeight: '200px',
                    maxHeight: '320px', overflowY: 'auto', marginBottom: '12px',
                    display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    {thread.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '40px 10px' }}>
                        No messages yet. Send the first one below.
                      </div>
                    ) : thread.map(m => {
                      const fromCoach = m.sender_id === coachUserId
                      return (
                        <div key={m.id} style={{
                          display: 'flex',
                          justifyContent: fromCoach ? 'flex-end' : 'flex-start',
                        }}>
                          <div style={{
                            maxWidth: '80%',
                            background: fromCoach ? 'var(--green)' : '#fff',
                            color: fromCoach ? '#fff' : 'var(--ink)',
                            border: fromCoach ? 'none' : '1px solid var(--line)',
                            borderRadius: '10px', padding: '8px 12px',
                            fontSize: '12px', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                          }}>
                            {!fromCoach && (
                              <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px' }}>
                                {selectedMember.full_name ?? 'Member'}
                              </div>
                            )}
                            {m.body && <div>{m.body}</div>}
                            {(m.video_url || m.image_url || m.audio_url || m.file_url) && (
                              <div style={{ marginTop: m.body ? 6 : 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {m.video_url && <video controls src={m.video_url} style={{ width: '100%', maxWidth: 220, borderRadius: 6, background: '#000' }} />}
                                {m.image_url && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={m.image_url} alt="" style={{ width: '100%', maxWidth: 220, borderRadius: 6, objectFit: 'cover' }} />
                                )}
                                {m.audio_url && <audio controls src={m.audio_url} style={{ width: 200, height: 28 }} />}
                                {m.file_url && (
                                  <a href={m.file_url} target="_blank" rel="noreferrer" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '4px 8px', borderRadius: 6,
                                    background: fromCoach ? 'rgba(255,255,255,0.15)' : 'var(--paper)',
                                    color: fromCoach ? '#fff' : 'var(--ink)',
                                    border: fromCoach ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--line-md)',
                                    textDecoration: 'none', fontSize: 11,
                                  }}>
                                    📎 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                      {m.file_name ?? 'attachment'}
                                    </span>
                                  </a>
                                )}
                              </div>
                            )}
                            <div style={{ fontSize: '9px', opacity: 0.65, marginTop: '4px', textAlign: 'right' }}>
                              {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Quick templates */}
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ ...S.label, marginBottom: '4px' }}>Quick templates</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {templates.filter(t => t.trigger_type === 'manual' || t.trigger_type === 'at_risk').map(t => (
                        <button
                          key={t.id}
                          onClick={() => applyTemplate(t)}
                          style={{
                            background: 'var(--line)', border: 'none',
                            borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                            fontSize: '11px', color: 'var(--text-soft)',
                          }}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={msgBody}
                    onChange={e => setMsgBody(e.target.value)}
                    placeholder={`Write to ${selectedMember.full_name ?? 'this member'}...`}
                    style={{ ...S.textarea, minHeight: '90px' }}
                  />

                  {(showPicker || hasAttachment) && (
                    <div style={{ marginTop: '8px' }}>
                      <AttachmentPicker compact slots={attachments} onChange={setSlot} accent="var(--green)" />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPicker(s => !s)}
                      style={{
                        fontSize: '11px', fontWeight: 600, padding: '6px 10px',
                        borderRadius: '7px', cursor: 'pointer',
                        background: showPicker ? 'var(--green-pale)' : 'var(--line)',
                        color: showPicker ? 'var(--green)' : 'var(--text-soft)',
                        border: 'none', fontFamily: 'inherit',
                      }}
                    >
                      + Attach
                    </button>
                    <button
                      onClick={handleSendMessage}
                      disabled={(!msgBody.trim() && !hasAttachment) || msgSending}
                      style={{ ...S.btn('primary'), flex: 1, opacity: (msgBody.trim() || hasAttachment) ? 1 : 0.5 }}
                    >
                      {msgSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Direct one-on-one. Member sees this in their Coach chat.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>}>
      <MembersInner />
    </Suspense>
  )
}
