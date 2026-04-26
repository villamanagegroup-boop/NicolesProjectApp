// app/(admin)/admin/comms/page.tsx
// Broadcast announcements + templates

'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchAdminCohorts, fetchMessageTemplates, sendBroadcast, createCoachPost,
  type MessageTemplate,
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

  useEffect(() => {
    fetchAdminCohorts().then(c => {
      const active = c.filter(x => x.status === 'active')
      setCohorts(active)
      if (active[0]) setCohortId(active[0].id)
    })
    fetchMessageTemplates().then(setTemplates)
  }, [])

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
    h1: { fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' },
    card: { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '14px', padding: '20px', marginBottom: '16px' },
    label: { fontSize: '10px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' as const },
    input: { width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', marginBottom: '12px' },
    textarea: { width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', resize: 'vertical' as const, minHeight: '120px', marginBottom: '12px' },
    select: { background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text-soft)', fontSize: '12px', padding: '8px 12px', cursor: 'pointer', marginBottom: '12px' },
    btn: { fontSize: '13px', fontWeight: 600, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: 'var(--green)', color: '#fff' },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={S.h1}>Broadcast announcement</h1>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={{ background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text-soft)', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}>
          {cohorts.length === 0 && <option value="">No active cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

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
              <option value="throne">Overthink Throne only</option>
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

      {/* Coach note in the community feed */}
      <h2 style={{ ...S.h1, marginTop: '8px' }}>Post to community feed</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 16px' }}>
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
