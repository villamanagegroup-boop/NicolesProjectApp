// app/(admin)/admin/content/page.tsx
// Content schedule + live call manager

'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import {
  fetchAdminCohorts, fetchContentSchedule, fetchLiveCalls, updateLiveCall, createLiveCall,
  insertContent, updateContent, updateCohort,
  type ContentRow, type AdminLiveCall, type AdminCohortSummary,
} from '@/lib/admin/hooks'
import StlMediaManager from '@/components/admin/StlMediaManager'
import FileDropZone from '@/components/ui/FileDropZone'
import { uploadCircleAttachmentResult } from '@/lib/circle'

type Archetype = ContentRow['archetype']
type MonthName = ContentRow['month_name']

const ARCHETYPE_OPTS: Archetype[] = ['universal', 'door', 'throne', 'engine', 'push']
function phaseFromWeek(week: number): MonthName {
  if (week <= 4) return 'root'
  if (week <= 8) return 'rebuild'
  return 'rise'
}

const PHASE_COLORS: Record<string, string> = { root: 'var(--green)', rebuild: 'var(--gold)', rise: '#7A1F1F' }

export default function ContentPage() {
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  // Program-level "Welcome to the program" video for the selected cohort.
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState('')
  const [savingWelcome, setSavingWelcome] = useState(false)
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null)
  const [content, setContent] = useState<ContentRow[]>([])
  const [calls, setCalls] = useState<AdminLiveCall[]>([])
  const [tab, setTab] = useState<'schedule' | 'calls' | 'stl_media'>('schedule')
  const [editingCall, setEditingCall] = useState<string | null>(null)
  const [callEdits, setCallEdits] = useState<Record<string, Partial<AdminLiveCall>>>({})
  const [saving, setSaving] = useState<string | null>(null)

  // New-content composer (schedule tab) state
  const [newContentOpen, setNewContentOpen] = useState(false)
  const [creatingContent, setCreatingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [newContent, setNewContent] = useState<{
    week_number: number
    archetype: Archetype
    week_title: string
    teaching: string
    journal_prompt: string
    weekly_action: string
    monday_prompt: string
    wednesday_prompt: string
    friday_prompt: string
    wins_prompt: string
    video_url: string
    monday_voice_note_url: string
    archetype_video_popup: boolean
    live_call_week: boolean
    cohort_scope: 'this_cohort' | 'global'
  }>({
    week_number: 1,
    archetype: 'universal',
    week_title: '',
    teaching: '',
    journal_prompt: '',
    weekly_action: '',
    monday_prompt: '',
    wednesday_prompt: '',
    friday_prompt: '',
    wins_prompt: '',
    video_url: '',
    monday_voice_note_url: '',
    archetype_video_popup: false,
    live_call_week: false,
    cohort_scope: 'this_cohort',
  })

  // Per-row inline edit state for existing content rows
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [rowEdits, setRowEdits] = useState<Record<string, Partial<ContentRow>>>({})
  const [savingRow, setSavingRow] = useState<string | null>(null)
  const [rowError, setRowError] = useState<string | null>(null)

  function startEditRow(row: ContentRow) {
    setEditingRowId(row.id)
    setRowEdits(prev => ({ ...prev, [row.id]: { ...row } }))
    setRowError(null)
  }
  function patchRowEdit(id: string, patch: Partial<ContentRow>) {
    setRowEdits(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }))
  }
  async function saveRow(id: string) {
    const edits = rowEdits[id]
    if (!edits) return
    setSavingRow(id); setRowError(null)
    const { id: _id, ...payload } = edits as any
    // Normalize blank strings to null so the DB doesn't store empty text.
    for (const k of ['teaching', 'journal_prompt', 'weekly_action', 'monday_prompt',
                     'wednesday_prompt', 'friday_prompt', 'wins_prompt',
                     'video_url', 'monday_voice_note_url'] as const) {
      if (typeof payload[k] === 'string' && !payload[k].trim()) payload[k] = null
    }
    const result = await updateContent(id, payload)
    setSavingRow(null)
    if (result.error) { setRowError(result.error.message); return }
    setEditingRowId(null)
    fetchContentSchedule(cohortId).then(setContent)
  }

  async function handleCreateContent() {
    if (!newContent.week_title.trim()) return
    setCreatingContent(true)
    setContentError(null)
    const result = await insertContent({
      cohort_id: newContent.cohort_scope === 'global' ? null : (cohortId || null),
      week_number: newContent.week_number,
      archetype: newContent.archetype,
      month_name: phaseFromWeek(newContent.week_number),
      week_title: newContent.week_title.trim(),
      teaching: newContent.teaching || null,
      journal_prompt: newContent.journal_prompt || null,
      weekly_action: newContent.weekly_action || null,
      monday_prompt: newContent.monday_prompt || null,
      wednesday_prompt: newContent.wednesday_prompt || null,
      friday_prompt: newContent.friday_prompt || null,
      wins_prompt: newContent.wins_prompt || null,
      video_url: newContent.video_url || null,
      monday_voice_note_url: newContent.monday_voice_note_url || null,
      archetype_video_popup: newContent.archetype_video_popup,
      live_call_week: newContent.live_call_week,
    })
    setCreatingContent(false)
    if (result.error) {
      setContentError(result.error.message)
      return
    }
    setNewContentOpen(false)
    setNewContent({
      week_number: 1, archetype: 'universal', week_title: '',
      teaching: '', journal_prompt: '', weekly_action: '',
      monday_prompt: '', wednesday_prompt: '', friday_prompt: '', wins_prompt: '',
      video_url: '', monday_voice_note_url: '',
      archetype_video_popup: false,
      live_call_week: false, cohort_scope: 'this_cohort',
    })
    fetchContentSchedule(cohortId).then(setContent)
  }

  // New-call composer state
  const [newCallOpen, setNewCallOpen] = useState(false)
  const [newCall, setNewCall] = useState<{ call_number: number; title: string; scheduled_at: string; zoom_url: string; notes: string }>({
    call_number: 1, title: '', scheduled_at: '', zoom_url: '', notes: '',
  })
  const [creatingCall, setCreatingCall] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)

  async function handleCreateCall() {
    if (!cohortId || !newCall.title.trim() || !newCall.scheduled_at) return
    setCreatingCall(true)
    setCallError(null)
    const result = await createLiveCall({
      cohort_id: cohortId,
      call_number: newCall.call_number,
      title: newCall.title.trim(),
      scheduled_at: new Date(newCall.scheduled_at).toISOString(),
      zoom_url: newCall.zoom_url || null,
      notes: newCall.notes || null,
    })
    setCreatingCall(false)
    if (result.error) {
      setCallError(result.error.message)
      return
    }
    setNewCallOpen(false)
    setNewCall({ call_number: 1, title: '', scheduled_at: '', zoom_url: '', notes: '' })
    fetchLiveCalls(cohortId).then(setCalls)
  }

  useEffect(() => {
    fetchAdminCohorts().then(c => {
      const active = c.filter(x => x.status === 'active')
      setCohorts(active)
      if (active[0]) setCohortId(active[0].id)
    })
  }, [])

  useEffect(() => {
    if (!cohortId) return
    Promise.all([fetchContentSchedule(cohortId), fetchLiveCalls(cohortId)])
      .then(([c, l]) => { setContent(c); setCalls(l) })
  }, [cohortId])

  // Keep the welcome-video field in sync with whichever cohort is selected.
  useEffect(() => {
    const c = cohorts.find(x => x.id === cohortId)
    setWelcomeVideoUrl(c?.welcome_video_url ?? '')
    setWelcomeMsg(null)
  }, [cohortId, cohorts])

  async function handleSaveWelcomeVideo() {
    if (!cohortId) return
    setSavingWelcome(true); setWelcomeMsg(null)
    const { error } = await updateCohort(cohortId, { welcome_video_url: welcomeVideoUrl.trim() || null })
    setSavingWelcome(false)
    if (error) { setWelcomeMsg(error.message); return }
    setWelcomeMsg('Saved')
    // Refresh cohorts so the synced value reflects the save.
    fetchAdminCohorts().then(c => setCohorts(c.filter(x => x.status === 'active')))
  }

  async function saveCallEdits(callId: string) {
    setSaving(callId)
    await updateLiveCall(callId, callEdits[callId] ?? {})
    setSaving(null)
    setEditingCall(null)
    // Re-fetch
    fetchLiveCalls(cohortId).then(setCalls)
  }

  const weeks = Array.from(new Set(content.map(c => c.week_number))).sort((a, b) => a - b)

  const S = {
    eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', margin: '0 0 8px' },
    h1: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 },
    tabRow: { display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: '20px' },
    tab: (on: boolean) => ({
      padding: '10px 20px', fontSize: '13px', fontWeight: on ? 600 : 500,
      color: on ? 'var(--gold)' : 'var(--text-muted)', background: 'none', border: 'none',
      borderBottom: on ? '2px solid var(--gold)' : '2px solid transparent',
      cursor: 'pointer',
    }),
    weekCard: { background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 },
    weekHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' as const },
    archTag: () => ({
      fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px',
      background: 'var(--line)', color: 'var(--text-soft)',
    }),
    callCard: { background: '#fff', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 },
    input: {
      width: '100%', background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: '8px', color: 'var(--ink)', fontSize: '12px',
      padding: '8px 12px', outline: 'none', fontFamily: 'inherit', marginBottom: '8px',
    },
    btn: (v: 'primary' | 'ghost') => ({
      fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
      cursor: 'pointer', border: v === 'primary' ? 'none' : '1px solid var(--line-md)',
      background: v === 'primary' ? 'var(--gold)' : '#fff',
      color: v === 'primary' ? '#fff' : 'var(--text-soft)',
    }),
    select: {
      background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px',
      color: 'var(--text-soft)', fontSize: '13px', padding: '7px 12px', cursor: 'pointer',
    },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={S.eyebrow}>Production</div>
          <h1 style={S.h1}>Content + calls</h1>
        </div>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={S.select}>
          {cohorts.length === 0 && <option value="">No active cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={S.tabRow}>
        <button style={S.tab(tab === 'schedule')} onClick={() => setTab('schedule')}>Content schedule</button>
        <button style={S.tab(tab === 'calls')} onClick={() => setTab('calls')}>Live calls ({calls.length})</button>
        <button style={S.tab(tab === 'stl_media')} onClick={() => setTab('stl_media')}>Seal the Leak media</button>
      </div>

      {tab === 'stl_media' && <StlMediaManager />}

      {tab === 'schedule' && (
        <div style={{ ...S.weekCard, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
            Welcome to the program video
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
            One video for this whole cohort. Pops up the first time a member enters the program, then becomes a “Start here” button on their home page. Leave blank to hide it.
          </div>
          <MediaUrlField
            type="video"
            value={welcomeVideoUrl}
            onChange={setWelcomeVideoUrl}
            inputStyle={S.input}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button
              onClick={handleSaveWelcomeVideo}
              disabled={savingWelcome || !cohortId}
              style={{ ...S.btn('primary'), opacity: (savingWelcome || !cohortId) ? 0.5 : 1 }}
            >
              {savingWelcome ? 'Saving…' : 'Save welcome video'}
            </button>
            {welcomeMsg && (
              <span style={{ fontSize: 12, color: welcomeMsg === 'Saved' ? 'var(--green)' : 'var(--red)' }}>
                {welcomeMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div style={{ marginBottom: 12 }}>
          {!newContentOpen ? (
            <button onClick={() => setNewContentOpen(true)} style={S.btn('primary')}>
              + Add content
            </button>
          ) : (
            <div style={S.weekCard}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                Add a content row
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Week</div>
                  <input
                    type="number" min={1} max={12}
                    value={newContent.week_number}
                    onChange={e => setNewContent({ ...newContent, week_number: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })}
                    style={S.input}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Archetype track</div>
                  <select
                    value={newContent.archetype}
                    onChange={e => setNewContent({ ...newContent, archetype: e.target.value as Archetype })}
                    style={{ ...S.select, width: '100%', marginBottom: 8 }}
                  >
                    {ARCHETYPE_OPTS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Scope</div>
                  <select
                    value={newContent.cohort_scope}
                    onChange={e => setNewContent({ ...newContent, cohort_scope: e.target.value as 'this_cohort' | 'global' })}
                    style={{ ...S.select, width: '100%', marginBottom: 8 }}
                  >
                    <option value="this_cohort">This cohort only</option>
                    <option value="global">Global (all cohorts)</option>
                  </select>
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Week title</div>
              <input
                placeholder="e.g. The first leak"
                value={newContent.week_title}
                onChange={e => setNewContent({ ...newContent, week_title: e.target.value })}
                style={S.input}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Teaching</div>
              <textarea
                rows={3}
                placeholder="Core teaching or framing for the week."
                value={newContent.teaching}
                onChange={e => setNewContent({ ...newContent, teaching: e.target.value })}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Journal prompt</div>
              <textarea
                rows={2}
                placeholder="What do you want them to write to?"
                value={newContent.journal_prompt}
                onChange={e => setNewContent({ ...newContent, journal_prompt: e.target.value })}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Weekly action</div>
              <input
                placeholder="One concrete action."
                value={newContent.weekly_action}
                onChange={e => setNewContent({ ...newContent, weekly_action: e.target.value })}
                style={S.input}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Monday journal prompt</div>
              <textarea
                rows={2}
                placeholder="Daily journal prompt for Monday — different from the weekly journal prompt."
                value={newContent.monday_prompt}
                onChange={e => setNewContent({ ...newContent, monday_prompt: e.target.value })}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Wednesday partner prompt</div>
              <textarea
                rows={2}
                placeholder="What to share with their partner on Wednesday."
                value={newContent.wednesday_prompt}
                onChange={e => setNewContent({ ...newContent, wednesday_prompt: e.target.value })}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Friday wins prompt</div>
              <textarea
                rows={2}
                placeholder="Prompt for the Friday win they capture privately."
                value={newContent.friday_prompt}
                onChange={e => setNewContent({ ...newContent, friday_prompt: e.target.value })}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Wins composer seed (optional)</div>
              <textarea
                rows={2}
                placeholder="Copy that prefills the cohort wins composer on the week page."
                value={newContent.wins_prompt}
                onChange={e => setNewContent({ ...newContent, wins_prompt: e.target.value })}
                style={{ ...S.input, resize: 'vertical' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Teaching video</div>
                  <MediaUrlField
                    type="video"
                    value={newContent.video_url}
                    onChange={url => setNewContent({ ...newContent, video_url: url })}
                    inputStyle={S.input}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>Monday voice note</div>
                  <MediaUrlField
                    type="audio"
                    value={newContent.monday_voice_note_url}
                    onChange={url => setNewContent({ ...newContent, monday_voice_note_url: url })}
                    inputStyle={S.input}
                  />
                </div>
              </div>
              {newContent.archetype !== 'universal' && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-soft)', marginBottom: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newContent.archetype_video_popup}
                    onChange={e => setNewContent({ ...newContent, archetype_video_popup: e.target.checked })}
                    style={{ marginTop: 2 }}
                  />
                  <span>
                    Auto-popup archetype video at start of week
                    <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                      The video above welcomes this archetype to the week — it pops once, then stays in the on-page player.
                    </span>
                  </span>
                </label>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-soft)', marginBottom: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newContent.live_call_week}
                  onChange={e => setNewContent({ ...newContent, live_call_week: e.target.checked })}
                />
                Live call week
              </label>
              {contentError && <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0' }}>{contentError}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={handleCreateContent}
                  disabled={creatingContent || !newContent.week_title.trim()}
                  style={{ ...S.btn('primary'), opacity: !newContent.week_title.trim() ? 0.5 : 1 }}
                >
                  {creatingContent ? 'Saving…' : 'Save content'}
                </button>
                <button onClick={() => setNewContentOpen(false)} style={S.btn('ghost')}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'schedule' && weeks.map(week => {
        const weekContent = content.filter(c => c.week_number === week)
        const universal = weekContent.find(c => c.archetype === 'universal')
        const phase = universal?.month_name ?? 'root'
        return (
          <div key={week} style={S.weekCard}>
            <div style={S.weekHead}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: PHASE_COLORS[phase], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                {week}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{universal?.week_title ?? `Week ${week}`}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{phase}</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {universal?.live_call_week && (
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '8px', background: 'rgba(139,31,47,.2)', color: 'var(--red)', fontWeight: 600 }}>
                    📞 Live call week
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weekContent.map(c => {
                const isEditing = editingRowId === c.id
                const e = rowEdits[c.id] ?? {}
                return (
                  <div key={c.id} style={{ border: '1px solid var(--line)', borderRadius: 8, background: '#fafaf7' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', flexWrap: 'wrap' }}>
                      <span style={S.archTag()}>{c.archetype}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Indicator label="Teaching"  on={!!c.teaching}        />
                        <Indicator label="Journal"   on={!!c.journal_prompt}  />
                        <Indicator label="Action"    on={!!c.weekly_action}   />
                        <Indicator label="Mon"       on={!!c.monday_prompt}   />
                        <Indicator label="Wed"       on={!!c.wednesday_prompt}/>
                        <Indicator label="Fri"       on={!!c.friday_prompt}   />
                        <Indicator label="Video"     on={!!c.video_url}       />
                        <Indicator label="Voice"     on={!!c.monday_voice_note_url} />
                      </span>
                      <button
                        onClick={() => isEditing ? setEditingRowId(null) : startEditRow(c)}
                        style={{ ...S.btn('ghost'), marginLeft: 'auto', padding: '4px 12px', fontSize: 11 }}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </button>
                    </div>
                    {isEditing && (
                      <div style={{ padding: '6px 12px 12px', borderTop: '1px solid var(--line)' }}>
                        <FieldLabel>Week title</FieldLabel>
                        <input
                          value={(e.week_title ?? c.week_title) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { week_title: ev.target.value })}
                          style={S.input}
                        />
                        <FieldLabel>Teaching</FieldLabel>
                        <textarea
                          rows={3}
                          value={(e.teaching ?? c.teaching) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { teaching: ev.target.value })}
                          style={{ ...S.input, resize: 'vertical' }}
                        />
                        <FieldLabel>Journal prompt (weekly)</FieldLabel>
                        <textarea
                          rows={2}
                          value={(e.journal_prompt ?? c.journal_prompt) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { journal_prompt: ev.target.value })}
                          style={{ ...S.input, resize: 'vertical' }}
                        />
                        <FieldLabel>Weekly action</FieldLabel>
                        <input
                          value={(e.weekly_action ?? c.weekly_action) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { weekly_action: ev.target.value })}
                          style={S.input}
                        />
                        <FieldLabel>Monday journal prompt</FieldLabel>
                        <textarea
                          rows={2}
                          value={(e.monday_prompt ?? c.monday_prompt) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { monday_prompt: ev.target.value })}
                          style={{ ...S.input, resize: 'vertical' }}
                        />
                        <FieldLabel>Wednesday partner prompt</FieldLabel>
                        <textarea
                          rows={2}
                          value={(e.wednesday_prompt ?? c.wednesday_prompt) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { wednesday_prompt: ev.target.value })}
                          style={{ ...S.input, resize: 'vertical' }}
                        />
                        <FieldLabel>Friday wins prompt</FieldLabel>
                        <textarea
                          rows={2}
                          value={(e.friday_prompt ?? c.friday_prompt) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { friday_prompt: ev.target.value })}
                          style={{ ...S.input, resize: 'vertical' }}
                        />
                        <FieldLabel>Wins composer seed</FieldLabel>
                        <textarea
                          rows={2}
                          value={(e.wins_prompt ?? c.wins_prompt) ?? ''}
                          onChange={ev => patchRowEdit(c.id, { wins_prompt: ev.target.value })}
                          style={{ ...S.input, resize: 'vertical' }}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <FieldLabel>Teaching video</FieldLabel>
                            <MediaUrlField
                              type="video"
                              value={(e.video_url ?? c.video_url) ?? ''}
                              onChange={url => patchRowEdit(c.id, { video_url: url })}
                              inputStyle={S.input}
                            />
                          </div>
                          <div>
                            <FieldLabel>Monday voice note</FieldLabel>
                            <MediaUrlField
                              type="audio"
                              value={(e.monday_voice_note_url ?? c.monday_voice_note_url) ?? ''}
                              onChange={url => patchRowEdit(c.id, { monday_voice_note_url: url })}
                              inputStyle={S.input}
                            />
                          </div>
                        </div>
                        {c.archetype !== 'universal' && (
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-soft)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={(e.archetype_video_popup ?? c.archetype_video_popup) ?? false}
                              onChange={ev => patchRowEdit(c.id, { archetype_video_popup: ev.target.checked })}
                              style={{ marginTop: 2 }}
                            />
                            <span>
                              Auto-popup archetype video at start of week
                              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>
                                Pops the archetype video once on the current week, then stays in the on-page player.
                              </span>
                            </span>
                          </label>
                        )}
                        {rowError && editingRowId === c.id && (
                          <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0' }}>{rowError}</p>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => saveRow(c.id)}
                            disabled={savingRow === c.id}
                            style={{ ...S.btn('primary'), opacity: savingRow === c.id ? 0.6 : 1 }}
                          >
                            {savingRow === c.id ? 'Saving…' : 'Save changes'}
                          </button>
                          <button onClick={() => setEditingRowId(null)} style={S.btn('ghost')}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {tab === 'schedule' && weeks.length === 0 && (
        <div style={{ ...S.weekCard, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px' }}>
          No content scheduled for this cohort yet.
        </div>
      )}

      {tab === 'calls' && (
        <div style={{ marginBottom: '12px' }}>
          {!newCallOpen ? (
            <button
              onClick={() => setNewCallOpen(true)}
              disabled={!cohortId}
              style={{ ...S.btn('primary'), opacity: cohortId ? 1 : 0.5 }}
            >
              + Schedule new live stream
            </button>
          ) : (
            <div style={S.callCard}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                  Schedule a new live stream
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Call #</div>
                    <input
                      type="number" min={1} max={6}
                      value={newCall.call_number}
                      onChange={e => setNewCall({ ...newCall, call_number: Number(e.target.value) })}
                      style={S.input}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Title</div>
                    <input
                      placeholder="e.g. Week 1 — Welcome circle"
                      value={newCall.title}
                      onChange={e => setNewCall({ ...newCall, title: e.target.value })}
                      style={S.input}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Date & time</div>
                <input
                  type="datetime-local"
                  value={newCall.scheduled_at}
                  onChange={e => setNewCall({ ...newCall, scheduled_at: e.target.value })}
                  style={S.input}
                />
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Live stream URL</div>
                <input
                  placeholder="Live stream link (Zoom, Whereby, Daily, etc.)"
                  value={newCall.zoom_url}
                  onChange={e => setNewCall({ ...newCall, zoom_url: e.target.value })}
                  style={S.input}
                />
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Notes / hot seat focus</div>
                <input
                  placeholder="What's the focus this call?"
                  value={newCall.notes}
                  onChange={e => setNewCall({ ...newCall, notes: e.target.value })}
                  style={S.input}
                />
                {callError && <p style={{ fontSize: '12px', color: 'var(--red)', margin: '6px 0' }}>{callError}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleCreateCall} disabled={creatingCall || !newCall.title || !newCall.scheduled_at} style={S.btn('primary')}>
                    {creatingCall ? 'Saving…' : 'Schedule'}
                  </button>
                  <button onClick={() => setNewCallOpen(false)} style={S.btn('ghost')}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'calls' && calls.map(call => {
        const isEditing = editingCall === call.id
        const isPast = new Date(call.scheduled_at) < new Date()

        return (
          <div key={call.id} style={S.callCard}>
            <div style={{ padding: '14px 16px', borderBottom: isEditing ? '1px solid var(--line)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'var(--line)', color: 'var(--text-muted)' }}>
                      Call {call.call_number}
                    </span>
                    {call.recording_url && <span style={{ fontSize: '11px', color: 'var(--green)' }}>✓ Recording uploaded</span>}
                    {!call.recording_url && isPast && <span style={{ fontSize: '11px', color: '#B8862E' }}>⚠ Needs recording</span>}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{call.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(call.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button onClick={() => setEditingCall(isEditing ? null : call.id)} style={S.btn('ghost')}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {isEditing && (
              <div style={{ padding: '14px 16px' }}>
                {([
                  { key: 'zoom_url',      placeholder: 'Live stream link',                label: 'Live stream URL' },
                  { key: 'recording_url', placeholder: 'Recording link (add after call)', label: 'Recording URL' },
                  { key: 'notes',         placeholder: 'Notes / hot seat focus',           label: 'Notes' },
                ] as const).map(({ key, placeholder, label }) => (
                  <div key={key}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                    <input
                      defaultValue={(call[key] as string) ?? ''}
                      placeholder={placeholder}
                      onChange={e => setCallEdits(prev => ({ ...prev, [call.id]: { ...(prev[call.id] ?? {}), [key]: e.target.value } }))}
                      style={S.input}
                    />
                  </div>
                ))}
                <button
                  onClick={() => saveCallEdits(call.id)}
                  disabled={saving === call.id}
                  style={S.btn('primary')}
                >
                  {saving === call.id ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {tab === 'calls' && calls.length === 0 && (
        <div style={{ ...S.callCard, textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px' }}>
          No live calls scheduled for this cohort yet.
        </div>
      )}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700,
      color: 'var(--text-muted)', letterSpacing: '.08em',
      textTransform: 'uppercase', marginBottom: 4,
    }}>
      {children}
    </div>
  )
}

function MediaUrlField({
  type, value, onChange, inputStyle,
}: {
  type: 'video' | 'audio'
  value: string
  onChange: (next: string) => void
  inputStyle: CSSProperties
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setBusy(true); setError(null)
    const result = await uploadCircleAttachmentResult(file)
    setBusy(false)
    if (!result.url) { setError(result.error ?? 'Upload failed.'); return }
    onChange(result.url)
  }

  const isUploaded = value.includes('/storage/v1/object/public/circle-uploads/')
  const placeholder = type === 'video'
    ? 'Paste embed URL (Vimeo/YouTube) or drop a video file'
    : 'Paste audio URL or drop a voice note file'

  return (
    <FileDropZone
      onFiles={files => { if (files[0]) handleFile(files[0]) }}
      acceptPrefixes={[type === 'video' ? 'video/' : 'audio/']}
      disabled={busy}
    >
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -2, marginBottom: 8, flexWrap: 'wrap' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 7,
          cursor: busy ? 'wait' : 'pointer',
          background: busy ? 'var(--line)' : 'var(--gold-pale)',
          color: busy ? 'var(--text-muted)' : 'var(--gold)',
          border: '1px solid ' + (busy ? 'var(--line-md)' : 'var(--gold-line)'),
          fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
          opacity: busy ? 0.7 : 1,
        }}>
          {busy ? 'Uploading…' : (type === 'video' ? '🎬 Drop or choose video' : '🎙 Drop or choose voice note')}
          <input
            type="file"
            accept={type === 'video' ? 'video/*' : 'audio/*'}
            style={{ display: 'none' }}
            disabled={busy}
            onChange={e => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) handleFile(f)
            }}
          />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={busy}
            style={{
              fontSize: 11, color: 'var(--text-muted)', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
            }}
          >
            Clear
          </button>
        )}
        {isUploaded && (
          <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>✓ Uploaded</span>
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: 'var(--red)', margin: '0 0 6px' }}>{error}</p>}
    </FileDropZone>
  )
}

function Indicator({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600,
      padding: '2px 7px', borderRadius: 999,
      background: on ? 'rgba(60,140,80,0.14)' : 'var(--line)',
      color: on ? '#3c6f47' : 'var(--text-muted)',
      whiteSpace: 'nowrap',
    }}>
      {on ? '✓' : '○'} {label}
    </span>
  )
}
