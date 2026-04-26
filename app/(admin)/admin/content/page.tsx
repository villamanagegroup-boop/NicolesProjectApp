// app/(admin)/admin/content/page.tsx
// Content schedule + live call manager

'use client'

import { useEffect, useState } from 'react'
import {
  fetchAdminCohorts, fetchContentSchedule, fetchLiveCalls, updateLiveCall, createLiveCall,
  type ContentRow, type AdminLiveCall,
} from '@/lib/admin/hooks'

const PHASE_COLORS: Record<string, string> = { root: 'var(--green)', rebuild: 'var(--gold)', rise: '#3D3080' }

export default function ContentPage() {
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([])
  const [content, setContent] = useState<ContentRow[]>([])
  const [calls, setCalls] = useState<AdminLiveCall[]>([])
  const [tab, setTab] = useState<'schedule' | 'calls'>('schedule')
  const [editingCall, setEditingCall] = useState<string | null>(null)
  const [callEdits, setCallEdits] = useState<Record<string, Partial<AdminLiveCall>>>({})
  const [saving, setSaving] = useState<string | null>(null)

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
    h1: { fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' },
    tabRow: { display: 'flex', gap: 0, borderBottom: '1px solid var(--line)', marginBottom: '20px' },
    tab: (on: boolean) => ({
      padding: '10px 20px', fontSize: '13px', fontWeight: on ? 600 : 500,
      color: on ? 'var(--gold)' : 'var(--text-muted)', background: 'none', border: 'none',
      borderBottom: on ? '2px solid var(--gold)' : '2px solid transparent',
      cursor: 'pointer',
    }),
    weekCard: { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', padding: '14px', marginBottom: '10px' },
    weekHead: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' as const },
    archTag: () => ({
      fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px',
      background: 'var(--line)', color: 'var(--text-soft)',
    }),
    callCard: { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden', marginBottom: '10px' },
    input: {
      width: '100%', background: 'var(--paper)', border: '1px solid var(--line)',
      borderRadius: '8px', color: 'var(--ink)', fontSize: '12px',
      padding: '8px 12px', outline: 'none', fontFamily: 'inherit', marginBottom: '8px',
    },
    btn: (v: 'primary' | 'ghost') => ({
      fontSize: '12px', fontWeight: 600, padding: '7px 14px', borderRadius: '8px',
      cursor: 'pointer', border: 'none',
      background: v === 'primary' ? 'var(--green)' : 'var(--line)',
      color: v === 'primary' ? '#fff' : 'var(--text-soft)',
    }),
    select: {
      background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px',
      color: 'var(--text-soft)', fontSize: '13px', padding: '7px 12px', cursor: 'pointer',
    },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={S.h1}>Content + calls</h1>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={S.select}>
          {cohorts.length === 0 && <option value="">No active cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={S.tabRow}>
        <button style={S.tab(tab === 'schedule')} onClick={() => setTab('schedule')}>Content schedule</button>
        <button style={S.tab(tab === 'calls')} onClick={() => setTab('calls')}>Live calls ({calls.length})</button>
      </div>

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
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {weekContent.map(c => (
                <span key={c.id} style={S.archTag()}>
                  {c.archetype} {c.journal_prompt ? '✓' : '⚠'}{c.weekly_action ? '✓' : '⚠'}
                </span>
              ))}
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
                    {!call.recording_url && isPast && <span style={{ fontSize: '11px', color: '#C97D3A' }}>⚠ Needs recording</span>}
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
