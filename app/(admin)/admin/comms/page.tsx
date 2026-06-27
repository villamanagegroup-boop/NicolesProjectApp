// app/(admin)/admin/comms/page.tsx
// Broadcast announcements + templates

'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchAdminCohorts, fetchMessageTemplates, sendBroadcast, createCoachPost,
  sendCoachMessage, fetchCoachThread, fetchAllUsersAdmin,
  createAdminMessage,
  type MessageTemplate, type AdminUserRow, type CoachMessage,
  type AdminMessageChannel,
} from '@/lib/admin/hooks'

export default function CommsPage() {
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [targetArchetype, setTargetArchetype] = useState('all')
  const [channel, setChannel] = useState('both')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])

  // Coach-note composer — posts directly into the cohort community feed
  const [postBody, setPostBody] = useState('')
  const [postWeek, setPostWeek] = useState<string>('')
  const [postingNote, setPostingNote] = useState(false)
  const [postedNote, setPostedNote] = useState(false)

  // Direct-message composer — pick any signed-up user (across all paths),
  // write, send via the coach chat thread (works for non-circle users too
  // since circle_coach_messages is keyed by auth user_id, not member id).
  const [allUsers, setAllUsers] = useState<AdminUserRow[]>([])
  const [dmFilter, setDmFilter] = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [dmUserId, setDmUserId] = useState<string>('')
  const [dmBody, setDmBody] = useState('')
  const [dmSending, setDmSending] = useState(false)
  const [dmSent, setDmSent] = useState(false)
  const [dmRecent, setDmRecent] = useState<CoachMessage[]>([])
  const [dmCoachId, setDmCoachId] = useState('')

  // Unified note composer (Inbox / Banner / Pinned)
  const [noteChannel,  setNoteChannel]  = useState<AdminMessageChannel>('inbox')
  const [noteTitle,    setNoteTitle]    = useState('')
  const [noteBody,     setNoteBody]     = useState('')
  const [notePaths,    setNotePaths]    = useState<('A' | 'B' | 'C')[]>([])
  const [notePinnedDay, setNotePinnedDay] = useState<number>(1)
  const [noteEmail,    setNoteEmail]    = useState(false)
  const [noteSending,  setNoteSending]  = useState(false)
  const [noteSent,     setNoteSent]     = useState(false)
  const [noteError,    setNoteError]    = useState<string | null>(null)

  function togglePath(p: 'A' | 'B' | 'C') {
    setNotePaths(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSendNote() {
    if (!noteBody.trim()) return
    setNoteSending(true)
    setNoteError(null)
    // Banner default expiry: 7 days from now. Inbox/pinned: null.
    const expiresAt = noteChannel === 'banner'
      ? new Date(Date.now() + 7 * 86400000).toISOString()
      : null
    const { error } = await createAdminMessage({
      channel:            noteChannel,
      title:              noteTitle.trim() || null,
      body:               noteBody.trim(),
      audience_paths:     notePaths,
      audience_user_ids:  [],
      pinned_program_day: noteChannel === 'pinned' ? notePinnedDay : null,
      expires_at:         expiresAt,
      email_paired:       noteEmail,
    })
    setNoteSending(false)
    if (error) {
      setNoteError(error.message)
      return
    }
    setNoteSent(true)
    setNoteTitle('')
    setNoteBody('')
    setTimeout(() => setNoteSent(false), 2500)
  }

  useEffect(() => {
    fetchAdminCohorts().then(c => {
      const active = c.filter(x => x.status === 'active')
      setCohorts(active)
      if (active[0]) setCohortId(active[0].id)
    })
    fetchMessageTemplates().then(setTemplates)
    supabaseClient.auth.getUser().then(({ data }) => setDmCoachId(data.user?.id ?? ''))
    // Pull every signed-up user so admins can DM 365 / Seal-the-Leak users
    // alongside Circle members. circle_coach_messages is keyed by auth user_id
    // so the same plumbing works regardless of path.
    // Deep-link scope: the sidebar's per-program "Messages" links pass
    // ?path=A|B|C so the DM picker + broadcast audience open scoped to that
    // program. Apply inside the async callback to avoid a synchronous setState.
    const p = new URLSearchParams(window.location.search).get('path')
    fetchAllUsersAdmin().then(u => {
      setAllUsers(u)
      if (p === 'A' || p === 'B' || p === 'C') {
        setDmFilter(p)
        setNotePaths([p])
      }
    })
  }, [])

  // Show last few messages for the picked user so the admin has context.
  useEffect(() => {
    const u = allUsers.find(x => x.id === dmUserId)
    if (!u) { setDmRecent([]); return }
    fetchCoachThread(u.id).then(t => setDmRecent(t.slice(-4)))
  }, [dmUserId, allUsers])

  async function handleSendDirect() {
    const u = allUsers.find(x => x.id === dmUserId)
    if (!u || !dmBody.trim() || !dmCoachId) return
    setDmSending(true)
    await sendCoachMessage({ user_id: u.id, sender_id: dmCoachId, body: dmBody.trim() })
    const fresh = await fetchCoachThread(u.id)
    setDmRecent(fresh.slice(-4))
    setDmBody('')
    setDmSending(false)
    setDmSent(true)
    setTimeout(() => setDmSent(false), 2000)
  }

  const dmCandidates = dmFilter === 'all' ? allUsers : allUsers.filter(u => u.selected_path === dmFilter)

  async function handleSend() {
    if (!cohortId || !title.trim() || !body.trim()) return
    setSending(true)
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) { setSending(false); return }
    await sendBroadcast(cohortId, user.id, title, body, {
      targetArchetype: targetArchetype === 'all' ? undefined : targetArchetype,
      channel,
    })
    setSending(false)
    setSent(true)
    setTitle(''); setBody('')
    setTimeout(() => setSent(false), 3000)
  }

  function applyTemplate(t: MessageTemplate) {
    setTitle(t.subject ?? t.name)
    setBody(t.body)
  }

  async function handlePostNote() {
    if (!cohortId || !postBody.trim()) return
    setPostingNote(true)
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) { setPostingNote(false); return }
    await createCoachPost({
      cohort_id: cohortId,
      author_id: user.id,
      body: postBody.trim(),
      week_number: postWeek ? Number(postWeek) : null,
    })
    setPostingNote(false)
    setPostedNote(true)
    setPostBody('')
    setPostWeek('')
    setTimeout(() => setPostedNote(false), 2500)
  }

  const S = {
    eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', margin: '0 0 8px' },
    h1: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 },
    h2: { fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', margin: '0 0 12px' },
    card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 },
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' as const },
    input: { width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', marginBottom: '12px' },
    textarea: { width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' as const, minHeight: '120px', marginBottom: '12px' },
    select: { background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text-soft)', fontSize: '12px', padding: '8px 12px', cursor: 'pointer', marginBottom: '12px' },
    btn: { fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: 'var(--gold)', color: '#fff' },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.eyebrow}>Comms</div>
          <h1 style={S.h1}>Broadcast announcement</h1>
        </div>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--text-soft)', fontSize: 13, padding: '7px 12px', cursor: 'pointer' }}>
          {cohorts.length === 0 && <option value="">No active cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* ── Send a note (Inbox / Banner / Pinned) ─────────────────── */}
      <div style={S.card}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
          Send a note
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
          Three channels. <strong>Inbox</strong> = persistent /inbox entry.
          <strong> Banner</strong> = sticky top strip (7-day default expiry).
          <strong> Pinned</strong> = attaches to a specific Seal-the-Leak day.
        </p>

        <label style={S.label}>Channel</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(['inbox', 'banner', 'pinned'] as AdminMessageChannel[]).map(c => {
            const on = noteChannel === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setNoteChannel(c)}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '6px 14px', borderRadius: 999,
                  border: `1.5px solid ${on ? 'var(--gold)' : 'var(--line-md)'}`,
                  background: on ? 'var(--gold)' : '#fff',
                  color: on ? '#fff' : 'var(--text-soft)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  textTransform: 'capitalize',
                }}
              >
                {c}
              </button>
            )
          })}
        </div>

        <label style={S.label}>
          Title {noteChannel === 'inbox' ? '(optional)' : '(optional)'}
        </label>
        <input
          value={noteTitle}
          onChange={e => setNoteTitle(e.target.value)}
          placeholder={
            noteChannel === 'banner'   ? 'e.g. Live call moved to Thursday' :
            noteChannel === 'pinned'   ? 'e.g. Take this one slow' :
                                         'e.g. A note on Week 3'
          }
          style={S.input}
        />

        <label style={S.label}>Message *</label>
        <textarea
          value={noteBody}
          onChange={e => setNoteBody(e.target.value)}
          placeholder="What do you want to tell them?"
          style={S.textarea}
        />

        <label style={S.label}>Audience — paths</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {([
            { id: 'A' as const, label: 'Seal the Leak' },
            { id: 'B' as const, label: 'Daily Cards' },
            { id: 'C' as const, label: 'The Circle' },
          ]).map(p => {
            const on = notePaths.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePath(p.id)}
                style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '5px 11px', borderRadius: 999,
                  border: `1px solid ${on ? 'var(--gold-line)' : 'var(--line)'}`,
                  background: on ? 'var(--gold-pale)' : '#fff',
                  color: on ? 'var(--gold)' : 'var(--text-soft)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {on ? '✓ ' : ''}{p.label}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '-6px 0 12px' }}>
          {notePaths.length === 0 ? 'No paths selected = all users.' : `Targeting ${notePaths.length} path${notePaths.length === 1 ? '' : 's'}.`}
        </p>

        {noteChannel === 'pinned' && (
          <>
            <label style={S.label}>Pin to Seal day</label>
            <select
              value={notePinnedDay}
              onChange={e => setNotePinnedDay(Number(e.target.value))}
              style={S.select}
            >
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <option key={d} value={d}>Day {d}</option>
              ))}
            </select>
          </>
        )}

        <label style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: 'var(--text-soft)', fontFamily: 'inherit',
          margin: '4px 0 14px', cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={noteEmail}
            onChange={e => setNoteEmail(e.target.checked)}
          />
          Also email the recipients
        </label>

        {noteError && (
          <p style={{ fontSize: 12, color: 'var(--red)', margin: '0 0 12px' }}>{noteError}</p>
        )}

        <button
          onClick={handleSendNote}
          disabled={!noteBody.trim() || noteSending}
          style={{ ...S.btn, opacity: noteBody.trim() && !noteSending ? 1 : 0.5 }}
        >
          {noteSending ? 'Sending…' : noteSent ? '✓ Sent' : 'Send note'}
        </button>
      </div>

      {/* ── Legacy cohort broadcast ────────────────────────────────── */}
      <div style={S.card}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '10px' }}>Quick templates</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {templates.length === 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No templates yet — run the migration to seed defaults.</span>
          )}
          {templates.map(t => (
            <button key={t.id} onClick={() => applyTemplate(t)} style={{ fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '8px', background: 'var(--line)', color: 'var(--text-soft)', border: 'none', cursor: 'pointer' }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <label style={S.label}>Announcement title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Call replay is live" style={S.input} />

        <label style={S.label}>Message</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your message..." style={S.textarea} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={S.label}>Send to</label>
            <select value={targetArchetype} onChange={e => setTargetArchetype(e.target.value)} style={S.select}>
              <option value="all">All members</option>
              <option value="door">Open Door only</option>
              <option value="throne">Overthinker&apos;s Throne only</option>
              <option value="engine">Interrupted Engine only</option>
              <option value="push">Pushthrough only</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Channel</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={S.select}>
              <option value="both">In-app + email</option>
              <option value="in_app">In-app only</option>
              <option value="email">Email only</option>
            </select>
          </div>
        </div>

        <button onClick={handleSend} disabled={!title.trim() || !body.trim() || sending || !cohortId} style={{ ...S.btn, opacity: title.trim() && body.trim() && cohortId ? 1 : 0.5 }}>
          {sending ? 'Sending...' : sent ? '✓ Sent to all members' : 'Send announcement'}
        </button>
      </div>

      {/* Direct one-on-one message — pick any signed-up user across paths */}
      <h2 style={S.h2}>Direct message</h2>
      <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 520 }}>
        Send a 1:1 message to any user — Path A (Seal the Leak), Path B (Daily Cards), or Path C (Circle).
        They&apos;ll see it in their Coach chat.
      </p>
      <div style={S.card}>
        <label style={S.label}>Path</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {([
            { id: 'all', label: `All (${allUsers.length})` },
            { id: 'A',   label: `Cohort (${allUsers.filter(u => u.selected_path === 'A').length})` },
            { id: 'B',   label: `Daily Cards (${allUsers.filter(u => u.selected_path === 'B').length})` },
            { id: 'C',   label: `Circle (${allUsers.filter(u => u.selected_path === 'C').length})` },
          ] as { id: 'all' | 'A' | 'B' | 'C'; label: string }[]).map(opt => {
            const on = dmFilter === opt.id
            return (
              <button key={opt.id} onClick={() => { setDmFilter(opt.id); setDmUserId('') }} style={{
                fontSize: 11, fontWeight: 600,
                padding: '5px 11px', borderRadius: 999,
                border: `1px solid ${on ? 'var(--gold-line)' : 'var(--line)'}`,
                background: on ? 'var(--gold-pale)' : '#fff',
                color: on ? 'var(--gold)' : 'var(--text-soft)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {opt.label}
              </button>
            )
          })}
        </div>

        <label style={S.label}>User</label>
        <select value={dmUserId} onChange={e => setDmUserId(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
          <option value="">{dmCandidates.length === 0 ? 'No users in this filter' : 'Select a user…'}</option>
          {dmCandidates.map(u => {
            const tag = u.selected_path === 'A' ? 'Cohort' : u.selected_path === 'B' ? 'Daily Cards' : u.selected_path === 'C' ? 'Circle' : '—'
            const display = u.name?.trim() || u.email?.split('@')[0] || u.id.slice(0, 8)
            return (
              <option key={u.id} value={u.id}>
                {display} · {tag}{u.email ? ` · ${u.email}` : ''}
              </option>
            )
          })}
        </select>

        {dmUserId && dmRecent.length > 0 && (
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8,
            padding: '8px 10px', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Recent
            </div>
            {dmRecent.map(msg => (
              <div key={msg.id} style={{ fontSize: 11, color: 'var(--text-soft)' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {msg.sender_id === dmCoachId ? 'You: ' : 'Member: '}
                </span>
                <span style={{ color: 'var(--ink)' }}>{msg.body.length > 80 ? msg.body.slice(0, 80) + '…' : msg.body}</span>
              </div>
            ))}
          </div>
        )}

        <label style={S.label}>Message</label>
        <textarea
          value={dmBody}
          onChange={e => setDmBody(e.target.value)}
          placeholder={dmUserId ? 'Write directly to this user…' : 'Pick a user first.'}
          disabled={!dmUserId}
          style={S.textarea}
        />
        <button
          onClick={handleSendDirect}
          disabled={!dmUserId || !dmBody.trim() || dmSending}
          style={{ ...S.btn, opacity: dmUserId && dmBody.trim() ? 1 : 0.5 }}
        >
          {dmSending ? 'Sending…' : dmSent ? '✓ Sent' : 'Send direct message'}
        </button>
      </div>

      {/* Coach note in the community feed */}
      <h2 style={S.h2}>Post to community feed</h2>
      <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '0 0 16px', maxWidth: 520 }}>
        Drop a note into the cohort feed. Members will see it tagged as a coach post.
      </p>
      <div style={S.card}>
        <label style={S.label}>Message</label>
        <textarea
          value={postBody}
          onChange={e => setPostBody(e.target.value)}
          placeholder="What do you want them to read this week?"
          style={S.textarea}
        />

        <label style={S.label}>Tag with week (optional)</label>
        <select value={postWeek} onChange={e => setPostWeek(e.target.value)} style={S.select}>
          <option value="">No week tag</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(w => (
            <option key={w} value={w}>Week {w}</option>
          ))}
        </select>

        <button
          onClick={handlePostNote}
          disabled={!postBody.trim() || postingNote || !cohortId}
          style={{ ...S.btn, opacity: postBody.trim() && cohortId ? 1 : 0.5 }}
        >
          {postingNote ? 'Posting…' : postedNote ? '✓ Posted to feed' : 'Post coach note'}
        </button>
      </div>
    </div>
  )
}
