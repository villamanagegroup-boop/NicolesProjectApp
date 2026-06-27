// app/(admin)/admin/content/page.tsx
// Content builder + live call manager.
//
// The content builder shows all 12 weeks as a fixed scaffold (even empty ones).
// Each week expands to reveal its Universal track (the shared body everyone
// sees) plus a collapsible "Archetype variations" subsection for the four
// archetype tracks. Add/Edit is always scoped to the exact week + track you
// click — no week/archetype pickers. A per-track scope toggle writes either to
// this cohort (cohort_id = selected) or globally (cohort_id = null, a reusable
// template applied to every cohort).

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
type Scope = 'this_cohort' | 'global'

const ARCHETYPES: Exclude<Archetype, 'universal'>[] = ['door', 'throne', 'engine', 'push']
const ARCHETYPE_LABEL: Record<string, string> = {
  universal: 'Universal', door: 'Door', throne: 'Throne', engine: 'Engine', push: 'Push',
}
// Accent color per track — matches ARCHETYPE_COLOR in lib/circle (universal = gold).
const TRACK_ACCENT: Record<string, string> = {
  universal: 'var(--gold)', door: '#1B4332', throne: '#1a1a2e', engine: '#7B1D1D', push: '#3d2c0e',
}
const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1)

function phaseFromWeek(week: number): MonthName {
  if (week <= 4) return 'root'
  if (week <= 8) return 'rebuild'
  return 'rise'
}
const PHASE_COLORS: Record<string, string> = { root: 'var(--green)', rebuild: 'var(--gold)', rise: '#7A1F1F' }

// Empty draft used when opening a track that has no content row yet.
interface TrackDraft {
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
  scope: Scope
}
const BLANK_DRAFT: TrackDraft = {
  week_title: '', teaching: '', journal_prompt: '', weekly_action: '',
  monday_prompt: '', wednesday_prompt: '', friday_prompt: '', wins_prompt: '',
  video_url: '', monday_voice_note_url: '',
  archetype_video_popup: false, live_call_week: false, scope: 'this_cohort',
}

export default function ContentPage() {
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState('')
  const [savingWelcome, setSavingWelcome] = useState(false)
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null)
  const [content, setContent] = useState<ContentRow[]>([])
  const [calls, setCalls] = useState<AdminLiveCall[]>([])
  const [tab, setTab] = useState<'schedule' | 'calls' | 'stl_media'>('schedule')
  const [editingCall, setEditingCall] = useState<string | null>(null)
  const [callEdits, setCallEdits] = useState<Record<string, Partial<AdminLiveCall>>>({})
  const [saving, setSaving] = useState<string | null>(null)

  // Accordion + editor state for the content builder
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set())
  const [openVariations, setOpenVariations] = useState<Set<number>>(new Set())
  const [editingTrack, setEditingTrack] = useState<{ week: number; archetype: Archetype } | null>(null)
  const [draft, setDraft] = useState<TrackDraft>(BLANK_DRAFT)
  const [savingTrack, setSavingTrack] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)

  // ─── Data loads ───────────────────────────────────────────────
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

  useEffect(() => {
    const c = cohorts.find(x => x.id === cohortId)
    setWelcomeVideoUrl(c?.welcome_video_url ?? '')
    setWelcomeMsg(null)
  }, [cohortId, cohorts])

  // ─── Lookups ──────────────────────────────────────────────────
  // Prefer a cohort-specific row; fall back to a global (cohort_id null) row.
  function rowFor(week: number, archetype: Archetype): ContentRow | undefined {
    const matches = content.filter(c => c.week_number === week && c.archetype === archetype)
    return matches.find(c => c.cohort_id === cohortId) ?? matches.find(c => !c.cohort_id) ?? matches[0]
  }
  function weekTitleFor(week: number): string {
    return rowFor(week, 'universal')?.week_title ?? ''
  }
  function builtWeekCount(): number {
    return WEEKS.filter(w => !!rowFor(w, 'universal')).length
  }

  // ─── Welcome video ────────────────────────────────────────────
  async function handleSaveWelcomeVideo() {
    if (!cohortId) return
    setSavingWelcome(true); setWelcomeMsg(null)
    const { error } = await updateCohort(cohortId, { welcome_video_url: welcomeVideoUrl.trim() || null })
    setSavingWelcome(false)
    if (error) { setWelcomeMsg(error.message); return }
    setWelcomeMsg('Saved')
    fetchAdminCohorts().then(c => setCohorts(c.filter(x => x.status === 'active')))
  }

  // ─── Accordion toggles ────────────────────────────────────────
  function toggleWeek(week: number) {
    setOpenWeeks(prev => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week); else next.add(week)
      return next
    })
  }
  function toggleVariations(week: number) {
    setOpenVariations(prev => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week); else next.add(week)
      return next
    })
  }

  // ─── Track editor ─────────────────────────────────────────────
  function openTrack(week: number, archetype: Archetype) {
    const row = rowFor(week, archetype)
    if (row) {
      setDraft({
        week_title: row.week_title ?? '',
        teaching: row.teaching ?? '',
        journal_prompt: row.journal_prompt ?? '',
        weekly_action: row.weekly_action ?? '',
        monday_prompt: row.monday_prompt ?? '',
        wednesday_prompt: row.wednesday_prompt ?? '',
        friday_prompt: row.friday_prompt ?? '',
        wins_prompt: row.wins_prompt ?? '',
        video_url: row.video_url ?? '',
        monday_voice_note_url: row.monday_voice_note_url ?? '',
        archetype_video_popup: row.archetype_video_popup ?? false,
        live_call_week: row.live_call_week ?? false,
        scope: row.cohort_id ? 'this_cohort' : 'global',
      })
    } else {
      // New track — seed the week title from the universal row if one exists.
      setDraft({ ...BLANK_DRAFT, week_title: archetype === 'universal' ? weekTitleFor(week) : '' })
    }
    setTrackError(null)
    setEditingTrack({ week, archetype })
    // Make sure the archetype subsection is open when editing an archetype track.
    if (archetype !== 'universal') {
      setOpenVariations(prev => new Set(prev).add(week))
    }
  }
  function patchDraft(patch: Partial<TrackDraft>) {
    setDraft(prev => ({ ...prev, ...patch }))
  }

  async function saveTrack() {
    if (!editingTrack) return
    const { week, archetype } = editingTrack
    const isUniversal = archetype === 'universal'

    // The Universal track owns the week title; archetypes inherit it.
    const title = isUniversal
      ? (draft.week_title.trim() || `Week ${week}`)
      : (weekTitleFor(week) || `Week ${week}`)

    setSavingTrack(true); setTrackError(null)
    const nz = (s: string) => (s.trim() ? s.trim() : null)

    const fields = {
      week_title: title,
      teaching: nz(draft.teaching),
      journal_prompt: nz(draft.journal_prompt),
      weekly_action: nz(draft.weekly_action),
      monday_prompt: nz(draft.monday_prompt),
      wednesday_prompt: nz(draft.wednesday_prompt),
      friday_prompt: nz(draft.friday_prompt),
      wins_prompt: nz(draft.wins_prompt),
      video_url: nz(draft.video_url),
      monday_voice_note_url: nz(draft.monday_voice_note_url),
      // These two flags only apply to one track kind; force the other off.
      archetype_video_popup: isUniversal ? false : draft.archetype_video_popup,
      live_call_week: isUniversal ? draft.live_call_week : false,
    }
    const cohort_id = draft.scope === 'global' ? null : (cohortId || null)

    const existing = rowFor(week, archetype)
    // Only treat it as an in-place update when the existing row lives in the
    // same scope we're saving to — otherwise a scope change should create a new
    // row in the target scope rather than move the old one.
    const sameScope = existing && (existing.cohort_id ?? null) === cohort_id

    const result = sameScope && existing
      ? await updateContent(existing.id, fields)
      : await insertContent({
          cohort_id, week_number: week, archetype,
          month_name: phaseFromWeek(week), ...fields,
        })

    setSavingTrack(false)
    if (result.error) { setTrackError(result.error.message); return }
    setEditingTrack(null)
    fetchContentSchedule(cohortId).then(setContent)
  }

  // ─── New-call composer ────────────────────────────────────────
  const [newCallOpen, setNewCallOpen] = useState(false)
  const [newCall, setNewCall] = useState<{ call_number: number; title: string; scheduled_at: string; zoom_url: string; notes: string }>({
    call_number: 1, title: '', scheduled_at: '', zoom_url: '', notes: '',
  })
  const [creatingCall, setCreatingCall] = useState(false)
  const [callError, setCallError] = useState<string | null>(null)

  async function handleCreateCall() {
    if (!cohortId || !newCall.title.trim() || !newCall.scheduled_at) return
    setCreatingCall(true); setCallError(null)
    const result = await createLiveCall({
      cohort_id: cohortId,
      call_number: newCall.call_number,
      title: newCall.title.trim(),
      scheduled_at: new Date(newCall.scheduled_at).toISOString(),
      zoom_url: newCall.zoom_url || null,
      notes: newCall.notes || null,
    })
    setCreatingCall(false)
    if (result.error) { setCallError(result.error.message); return }
    setNewCallOpen(false)
    setNewCall({ call_number: 1, title: '', scheduled_at: '', zoom_url: '', notes: '' })
    fetchLiveCalls(cohortId).then(setCalls)
  }

  async function saveCallEdits(callId: string) {
    setSaving(callId)
    await updateLiveCall(callId, callEdits[callId] ?? {})
    setSaving(null)
    setEditingCall(null)
    fetchLiveCalls(cohortId).then(setCalls)
  }

  // ─── Styles ───────────────────────────────────────────────────
  const S = {
    eyebrow: { fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--text-muted)', margin: '0 0 8px' },
    h1: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 },
    tabRow: { display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: '20px' },
    tab: (on: boolean) => ({
      padding: '10px 20px', fontSize: '13px', fontWeight: on ? 600 : 500,
      color: on ? 'var(--gold)' : 'var(--text-muted)', background: 'none', border: 'none',
      borderBottom: on ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer',
    }),
    card: { background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '14px 16px', marginBottom: 10 },
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
        <button style={S.tab(tab === 'schedule')} onClick={() => setTab('schedule')}>The 12 weeks</button>
        <button style={S.tab(tab === 'calls')} onClick={() => setTab('calls')}>Live calls ({calls.length})</button>
        <button style={S.tab(tab === 'stl_media')} onClick={() => setTab('stl_media')}>Seal the Leak media</button>
      </div>

      {tab === 'stl_media' && <StlMediaManager />}

      {/* ─── Content builder ─────────────────────────────────── */}
      {tab === 'schedule' && (
        <>
          {/* Welcome video header */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Welcome to the program video</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              One video for this whole cohort. Pops up the first time a member enters the program, then becomes a “Start here” button on their home page. Leave blank to hide it.
            </div>
            <MediaUrlField type="video" value={welcomeVideoUrl} onChange={setWelcomeVideoUrl} inputStyle={S.input} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <button onClick={handleSaveWelcomeVideo} disabled={savingWelcome || !cohortId}
                style={{ ...S.btn('primary'), opacity: (savingWelcome || !cohortId) ? 0.5 : 1 }}>
                {savingWelcome ? 'Saving…' : 'Save welcome video'}
              </button>
              {welcomeMsg && (
                <span style={{ fontSize: 12, color: welcomeMsg === 'Saved' ? 'var(--green)' : 'var(--red)' }}>{welcomeMsg}</span>
              )}
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '22px 0 10px' }}>
            The 12 weeks · {builtWeekCount()} of 12 built
          </div>

          {!cohortId ? (
            <div style={{ ...S.card, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 40 }}>
              Select an active cohort to build its content.
            </div>
          ) : WEEKS.map(week => {
            const phase = phaseFromWeek(week)
            const phaseColor = PHASE_COLORS[phase]
            const universal = rowFor(week, 'universal')
            const isOpen = openWeeks.has(week)
            const liveCall = !!universal?.live_call_week

            return (
              <div key={week} style={{ ...S.card, borderLeft: `3px solid ${phaseColor}`, cursor: 'pointer' }}
                   onClick={() => toggleWeek(week)}>
                {/* Week header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 10, display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }}>▸</span>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: phaseColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flex: '0 0 auto' }}>{week}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: universal ? 600 : 500, color: universal ? 'var(--ink)' : 'var(--text-muted)' }}>
                      {universal?.week_title || `Week ${week} — untitled`}
                    </div>
                  </div>
                  {liveCall && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: 'rgba(139,31,47,.12)', color: 'var(--red)' }}>📞 Live call week</span>
                  )}
                  <span style={{ fontSize: 10, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{phase}</span>
                </div>

                {/* Collapsed dot summary */}
                {!isOpen && (
                  <div style={{ margin: '9px 0 0 37px', fontSize: 11, color: 'var(--text-soft)', display: 'flex', gap: 13, flexWrap: 'wrap' }}>
                    {(['universal', ...ARCHETYPES] as Archetype[]).map(a => {
                      const on = !!rowFor(week, a)
                      return (
                        <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ color: on ? 'var(--green)' : 'var(--line-md)', fontWeight: 700 }}>{on ? (a === 'universal' ? '●' : '✓') : '○'}</span>
                          {ARCHETYPE_LABEL[a]}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Expanded body */}
                {isOpen && (
                  <div style={{ margin: '13px 0 2px', paddingTop: 13, borderTop: '1px solid var(--line)', cursor: 'default' }} onClick={e => e.stopPropagation()}>
                    {/* Universal primary */}
                    <TrackBlock
                      primary
                      label="Universal"
                      sublabel="everyone sees this"
                      row={universal}
                      editing={editingTrack?.week === week && editingTrack.archetype === 'universal'}
                      onEdit={() => openTrack(week, 'universal')}
                    >
                      {renderEditor(week, 'universal')}
                    </TrackBlock>

                    {/* Archetype variations subsection */}
                    <div style={{ marginTop: 12, border: '1px dashed var(--line-md)', borderRadius: 9, padding: '10px 12px', background: '#fff' }}>
                      <div onClick={() => toggleVariations(week)}
                           style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-soft)' }}>
                        <span style={{ fontSize: 11, transform: openVariations.has(week) ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }}>▸</span>
                        Archetype variations · {ARCHETYPES.filter(a => !!rowFor(week, a)).length} of 4 set
                      </div>

                      {openVariations.has(week) && (
                        <div style={{ marginTop: 10 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {ARCHETYPES.map(a => {
                              const has = !!rowFor(week, a)
                              const isEd = editingTrack?.week === week && editingTrack.archetype === a
                              return (
                                <div key={a} onClick={() => openTrack(week, a)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px',
                                    border: `1px solid ${isEd ? 'var(--gold-line)' : 'var(--line)'}`, borderRadius: 8,
                                    fontSize: 12, cursor: 'pointer', background: isEd ? 'var(--gold-pale)' : '#fcfbf7',
                                  }}>
                                  <span style={{ fontWeight: 700, color: has ? 'var(--green)' : 'var(--line-md)' }}>{has ? '●' : '○'}</span>
                                  {ARCHETYPE_LABEL[a]}
                                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: 'var(--gold)' }}>
                                    {isEd ? 'editing ↓' : has ? 'Edit' : '+ Add'}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          {/* Inline editor for the archetype being edited */}
                          {editingTrack?.week === week && editingTrack.archetype !== 'universal' && (
                            <div style={{ marginTop: 11 }}>{renderEditor(week, editingTrack.archetype)}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* ─── Live calls (unchanged) ──────────────────────────── */}
      {tab === 'calls' && (
        <div style={{ marginBottom: '12px' }}>
          {!newCallOpen ? (
            <button onClick={() => setNewCallOpen(true)} disabled={!cohortId} style={{ ...S.btn('primary'), opacity: cohortId ? 1 : 0.5 }}>
              + Schedule new live stream
            </button>
          ) : (
            <div style={S.callCard}>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>Schedule a new live stream</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'flex-end' }}>
                  <div>
                    <FieldLabel>Call #</FieldLabel>
                    <input type="number" min={1} max={6} value={newCall.call_number}
                      onChange={e => setNewCall({ ...newCall, call_number: Number(e.target.value) })} style={S.input} />
                  </div>
                  <div>
                    <FieldLabel>Title</FieldLabel>
                    <input placeholder="e.g. Week 1 — Welcome circle" value={newCall.title}
                      onChange={e => setNewCall({ ...newCall, title: e.target.value })} style={S.input} />
                  </div>
                </div>
                <FieldLabel>Date &amp; time</FieldLabel>
                <input type="datetime-local" value={newCall.scheduled_at}
                  onChange={e => setNewCall({ ...newCall, scheduled_at: e.target.value })} style={S.input} />
                <FieldLabel>Live stream URL</FieldLabel>
                <input placeholder="Live stream link (Zoom, Whereby, Daily, etc.)" value={newCall.zoom_url}
                  onChange={e => setNewCall({ ...newCall, zoom_url: e.target.value })} style={S.input} />
                <FieldLabel>Notes / hot seat focus</FieldLabel>
                <input placeholder="What's the focus this call?" value={newCall.notes}
                  onChange={e => setNewCall({ ...newCall, notes: e.target.value })} style={S.input} />
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
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: 'var(--line)', color: 'var(--text-muted)' }}>Call {call.call_number}</span>
                    {call.recording_url && <span style={{ fontSize: '11px', color: 'var(--green)' }}>✓ Recording uploaded</span>}
                    {!call.recording_url && isPast && <span style={{ fontSize: '11px', color: '#B8862E' }}>⚠ Needs recording</span>}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{call.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {new Date(call.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button onClick={() => setEditingCall(isEditing ? null : call.id)} style={S.btn('ghost')}>{isEditing ? 'Cancel' : 'Edit'}</button>
              </div>
            </div>
            {isEditing && (
              <div style={{ padding: '14px 16px' }}>
                {([
                  { key: 'zoom_url', placeholder: 'Live stream link', label: 'Live stream URL' },
                  { key: 'recording_url', placeholder: 'Recording link (add after call)', label: 'Recording URL' },
                  { key: 'notes', placeholder: 'Notes / hot seat focus', label: 'Notes' },
                ] as const).map(({ key, placeholder, label }) => (
                  <div key={key}>
                    <FieldLabel>{label}</FieldLabel>
                    <input defaultValue={(call[key] as string) ?? ''} placeholder={placeholder}
                      onChange={e => setCallEdits(prev => ({ ...prev, [call.id]: { ...(prev[call.id] ?? {}), [key]: e.target.value } }))} style={S.input} />
                  </div>
                ))}
                <button onClick={() => saveCallEdits(call.id)} disabled={saving === call.id} style={S.btn('primary')}>
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

  // ─── Inline track editor (closure over draft state) ───────────
  function renderEditor(week: number, archetype: Archetype) {
    if (!(editingTrack?.week === week && editingTrack.archetype === archetype)) return null
    const isUniversal = archetype === 'universal'
    const accent = TRACK_ACCENT[archetype]
    return (
      <div style={{
        marginTop: 11, paddingTop: 11, borderTop: '1px solid var(--line)',
        borderLeft: `4px solid ${accent}`, paddingLeft: 13, marginLeft: -2, background: 'rgba(0,0,0,0.012)', borderRadius: 8,
      }}>
        {/* Clear confirmation of which track is being edited */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: accent, flex: '0 0 auto' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>
            Editing {ARCHETYPE_LABEL[archetype]} track
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· Week {week}</span>
        </div>
        {isUniversal && (
          <>
            <FieldLabel>Week title</FieldLabel>
            <input value={draft.week_title} placeholder="e.g. The first repair"
              onChange={e => patchDraft({ week_title: e.target.value })} style={S.input} />
          </>
        )}
        <FieldLabel>Teaching</FieldLabel>
        <textarea rows={3} value={draft.teaching} placeholder="Core teaching or framing for the week."
          onChange={e => patchDraft({ teaching: e.target.value })} style={{ ...S.input, resize: 'vertical' }} />
        <FieldLabel>Journal prompt (weekly)</FieldLabel>
        <textarea rows={2} value={draft.journal_prompt} placeholder="What do you want them to write to?"
          onChange={e => patchDraft({ journal_prompt: e.target.value })} style={{ ...S.input, resize: 'vertical' }} />
        <FieldLabel>Weekly action</FieldLabel>
        <input value={draft.weekly_action} placeholder="One concrete action."
          onChange={e => patchDraft({ weekly_action: e.target.value })} style={S.input} />
        <FieldLabel>Monday journal prompt</FieldLabel>
        <textarea rows={2} value={draft.monday_prompt} placeholder="Daily journal prompt for Monday."
          onChange={e => patchDraft({ monday_prompt: e.target.value })} style={{ ...S.input, resize: 'vertical' }} />
        <FieldLabel>Wednesday partner prompt</FieldLabel>
        <textarea rows={2} value={draft.wednesday_prompt} placeholder="What to share with their partner on Wednesday."
          onChange={e => patchDraft({ wednesday_prompt: e.target.value })} style={{ ...S.input, resize: 'vertical' }} />
        <FieldLabel>Friday wins prompt</FieldLabel>
        <textarea rows={2} value={draft.friday_prompt} placeholder="Prompt for the Friday win they capture privately."
          onChange={e => patchDraft({ friday_prompt: e.target.value })} style={{ ...S.input, resize: 'vertical' }} />
        <FieldLabel>Wins composer seed (optional)</FieldLabel>
        <textarea rows={2} value={draft.wins_prompt} placeholder="Copy that prefills the cohort wins composer."
          onChange={e => patchDraft({ wins_prompt: e.target.value })} style={{ ...S.input, resize: 'vertical' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <FieldLabel>Teaching video</FieldLabel>
            <MediaUrlField type="video" value={draft.video_url} onChange={url => patchDraft({ video_url: url })} inputStyle={S.input} />
          </div>
          <div>
            <FieldLabel>Wednesday voice note</FieldLabel>
            <MediaUrlField type="audio" value={draft.monday_voice_note_url} onChange={url => patchDraft({ monday_voice_note_url: url })} inputStyle={S.input} />
          </div>
        </div>

        {!isUniversal && (
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-soft)', cursor: 'pointer', marginBottom: 4 }}>
            <input type="checkbox" checked={draft.archetype_video_popup}
              onChange={e => patchDraft({ archetype_video_popup: e.target.checked })} style={{ marginTop: 2 }} />
            <span>Auto-popup this archetype video at the start of the week
              <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)' }}>Pops once on the current week, then stays in the on-page player.</span>
            </span>
          </label>
        )}
        {isUniversal && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-soft)', cursor: 'pointer', marginBottom: 4 }}>
            <input type="checkbox" checked={draft.live_call_week}
              onChange={e => patchDraft({ live_call_week: e.target.checked })} />
            Live call week
          </label>
        )}

        {/* Scope toggle */}
        <div style={{ margin: '12px 0 4px', padding: '10px 12px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 7 }}>Applies to</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-soft)', marginBottom: 5, cursor: 'pointer' }}>
            <input type="radio" name={`scope-${week}-${archetype}`} checked={draft.scope === 'this_cohort'} onChange={() => patchDraft({ scope: 'this_cohort' })} />
            This cohort only <span style={{ color: 'var(--text-muted)' }}>({cohorts.find(c => c.id === cohortId)?.name ?? 'selected cohort'})</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-soft)', cursor: 'pointer' }}>
            <input type="radio" name={`scope-${week}-${archetype}`} checked={draft.scope === 'global'} onChange={() => patchDraft({ scope: 'global' })} />
            All cohorts <span style={{ color: 'var(--text-muted)' }}>(reusable template / global)</span>
          </label>
        </div>

        {trackError && <p style={{ fontSize: 12, color: 'var(--red)', margin: '6px 0' }}>{trackError}</p>}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={saveTrack} disabled={savingTrack} style={{ ...S.btn('primary'), opacity: savingTrack ? 0.6 : 1 }}>
            {savingTrack ? 'Saving…' : `Save ${ARCHETYPE_LABEL[archetype]} · Week ${week}`}
          </button>
          <button onClick={() => setEditingTrack(null)} style={S.btn('ghost')}>Cancel</button>
        </div>
      </div>
    )
  }
}

// A track row (Universal primary, or used inline). Shows status pills + Edit;
// renders its editor (passed as children) when in edit mode.
function TrackBlock({
  primary, label, sublabel, row, editing, onEdit, children,
}: {
  primary?: boolean
  label: string
  sublabel?: string
  row: ContentRow | undefined
  editing: boolean
  onEdit: () => void
  children?: React.ReactNode
}) {
  return (
    <div style={{
      padding: '11px 13px', borderRadius: 9, marginTop: primary ? 0 : 10,
      border: `1px solid ${primary ? 'var(--gold-line)' : 'var(--line)'}`,
      background: primary ? 'var(--gold-pale)' : '#fcfbf7',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          ● {label}{sublabel && <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> · {sublabel}</span>}
        </span>
        <button onClick={onEdit} style={{
          marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '4px 11px', borderRadius: 8,
          cursor: 'pointer', border: '1px solid var(--line-md)', background: '#fff', color: 'var(--text-soft)',
        }}>
          {editing ? 'Cancel' : row ? 'Edit ▾' : '+ Add'}
        </button>
      </div>
      <div style={{ margin: '8px 0 0 2px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Pill label="Teaching" on={!!row?.teaching} />
        <Pill label="Journal" on={!!row?.journal_prompt} />
        <Pill label="Action" on={!!row?.weekly_action} />
        <Pill label="Mon" on={!!row?.monday_prompt} />
        <Pill label="Wed" on={!!row?.wednesday_prompt} />
        <Pill label="Fri" on={!!row?.friday_prompt} />
        <Pill label="Video" on={!!row?.video_url} />
        <Pill label="Voice" on={!!row?.monday_voice_note_url} />
      </div>
      {children}
    </div>
  )
}

function Pill({ label, on }: { label: string; on: boolean }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap',
      background: on ? 'rgba(60,111,71,0.13)' : 'var(--line)',
      color: on ? '#3c6f47' : 'var(--text-muted)',
    }}>
      {on ? '✓' : '○'} {label}
    </span>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4 }}>
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
    <FileDropZone onFiles={files => { if (files[0]) handleFile(files[0]) }} acceptPrefixes={[type === 'video' ? 'video/' : 'audio/']} disabled={busy}>
      <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: -2, marginBottom: 8, flexWrap: 'wrap' }}>
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7,
          cursor: busy ? 'wait' : 'pointer',
          background: busy ? 'var(--line)' : 'var(--gold-pale)',
          color: busy ? 'var(--text-muted)' : 'var(--gold)',
          border: '1px solid ' + (busy ? 'var(--line-md)' : 'var(--gold-line)'),
          fontSize: 11, fontWeight: 600, fontFamily: 'inherit', opacity: busy ? 0.7 : 1,
        }}>
          {busy ? 'Uploading…' : (type === 'video' ? '🎬 Drop or choose video' : '🎙 Drop or choose voice note')}
          <input type="file" accept={type === 'video' ? 'video/*' : 'audio/*'} style={{ display: 'none' }} disabled={busy}
            onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleFile(f) }} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} disabled={busy}
            style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            Clear
          </button>
        )}
        {isUploaded && <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600 }}>✓ Uploaded</span>}
      </div>
      {error && <p style={{ fontSize: 11, color: 'var(--red)', margin: '0 0 6px' }}>{error}</p>}
    </FileDropZone>
  )
}
