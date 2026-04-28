'use client'

// components/admin/StlMediaManager.tsx
// Admin-side uploader for the Seal the Leak "opening frame" media slots.
// 4 archetype tracks × 7 days = 28 slots. Tabs at the top switch between
// archetypes (door / throne / engine / push). Each tab renders 7 day rows;
// each row lets the admin pick video or voice and upload a file. Empty slots
// fall through to the legacy `stl_dayN_opening` key, then to a logo
// placeholder client-side.

import { useEffect, useState } from 'react'
import {
  fetchMediaSlots, upsertMediaSlot, deleteMediaSlot,
  type MediaSlot, type MediaSlotType,
} from '@/lib/admin/hooks'
import { uploadCircleAttachment } from '@/lib/circle'

// Day 1 defaults to video; the rest default to voice. Admins can flip either.
function defaultTypeFor(day: number): MediaSlotType {
  return day === 1 ? 'video' : 'audio'
}

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const
const ARCHETYPES = [
  { id: 'door',   name: 'The Open Door',         color: '#3D3080' },
  { id: 'throne', name: 'The Overthink Throne',  color: '#9B2C2C' },
  { id: 'engine', name: 'The Interrupted Engine',color: '#1F5C3A' },
  { id: 'push',   name: 'The Pushthrough',       color: '#B8922A' },
] as const

type ArchetypeId = typeof ARCHETYPES[number]['id']

export default function StlMediaManager() {
  const [archetype, setArchetype] = useState<ArchetypeId>('door')
  const [slots, setSlots] = useState<Record<string, MediaSlot | null>>({})
  const [legacy, setLegacy] = useState<Record<string, MediaSlot | null>>({})
  const [loading, setLoading] = useState(true)
  // Per-day local UI state (chosen type before upload, current upload status)
  const [chosenType, setChosenType] = useState<Record<number, MediaSlotType>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [errorByDay, setErrorByDay] = useState<Record<number, string | null>>({})

  // New per-archetype key. The user-side reader falls back to the legacy
  // day-only key (`stl_dayN_opening`) so previously-uploaded media stays
  // visible under whichever archetype hasn't been overridden yet.
  const slotKeyFor = (day: number) => `stl_${archetype}_day${day}_opening`
  const legacyKeyFor = (day: number) => `stl_day${day}_opening`

  async function refresh() {
    setLoading(true)
    const archetypeKeys = DAYS.map(slotKeyFor)
    const legacyKeys    = DAYS.map(legacyKeyFor)
    const [archRows, legacyRows] = await Promise.all([
      fetchMediaSlots(archetypeKeys),
      fetchMediaSlots(legacyKeys),
    ])
    const archMap: Record<string, MediaSlot | null> = {}
    for (const k of archetypeKeys) archMap[k] = archRows.find(r => r.slot_key === k) ?? null
    const legMap: Record<string, MediaSlot | null> = {}
    for (const k of legacyKeys) legMap[k] = legacyRows.find(r => r.slot_key === k) ?? null
    setSlots(archMap)
    setLegacy(legMap)
    setChosenType({})
    setLoading(false)
  }

  useEffect(() => { refresh() }, [archetype]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(day: number, file: File, type: MediaSlotType) {
    setBusy(day)
    setErrorByDay(prev => ({ ...prev, [day]: null }))
    const url = await uploadCircleAttachment(file)
    if (!url) {
      setErrorByDay(prev => ({ ...prev, [day]: 'Upload failed — check storage permissions.' }))
      setBusy(null)
      return
    }
    const { error } = await upsertMediaSlot({
      slot_key: slotKeyFor(day),
      program: 'work',
      media_type: type,
      media_url: url,
    })
    if (error) {
      setErrorByDay(prev => ({ ...prev, [day]: error.message }))
    } else {
      await refresh()
    }
    setBusy(null)
  }

  async function handleRemove(day: number) {
    if (!confirm(`Remove the day ${day} media slot? Members will see the logo placeholder again.`)) return
    setBusy(day)
    await deleteMediaSlot(slotKeyFor(day))
    await refresh()
    setBusy(null)
  }

  const activeColor = ARCHETYPES.find(a => a.id === archetype)!.color

  return (
    <div>
      {/* Archetype tabs */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14,
      }}>
        {ARCHETYPES.map(a => {
          const on = a.id === archetype
          return (
            <button
              key={a.id}
              onClick={() => setArchetype(a.id)}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '7px 14px', borderRadius: 999,
                border: `1.5px solid ${on ? a.color : 'var(--line)'}`,
                background: on ? a.color : '#fff',
                color: on ? '#fff' : 'var(--text-soft)',
                cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {a.name}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
        Each archetype has its own 7-day media set. Drop a video or voice message above
        the &ldquo;opening frame&rdquo; for each day. Day 1 defaults to video, days 2–7 default
        to voice — but you can pick either. If you haven&apos;t uploaded for this archetype
        yet, members will see whatever lives in the shared legacy slot until you do.
      </p>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Loading media…</div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DAYS.map(day => {
          const archSlot = slots[slotKeyFor(day)] ?? null
          const legSlot  = legacy[legacyKeyFor(day)] ?? null
          // archSlot wins; legSlot is shown as a "shared default" indicator only.
          const slot = archSlot
          const fallback = defaultTypeFor(day)
          const currentType = chosenType[day] ?? slot?.media_type ?? fallback
          const isBusy = busy === day
          return (
            <div key={day} style={{
              background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
              padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap',
            }}>
              {/* Day badge + status */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 64 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: slot ? 'var(--gold-pale)' : 'var(--paper2)',
                  border: `1px solid ${slot ? 'var(--gold-line)' : 'var(--line)'}`,
                  color: slot ? 'var(--gold)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
                }}>
                  D{day}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {slot ? slot.media_type : legSlot ? 'shared' : 'empty'}
                </div>
              </div>

              {/* Preview pane — archetype slot wins, then legacy, then placeholder */}
              <div style={{ flex: '0 0 180px', maxWidth: 200 }}>
                {(slot ?? legSlot) ? (() => {
                  const display = slot ?? legSlot!
                  const opacity = slot ? 1 : 0.55  // dim legacy fallback
                  return display.media_type === 'video' ? (
                    <video src={display.media_url} controls preload="metadata" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 8, background: '#000', objectFit: 'cover', opacity }} />
                  ) : display.media_type === 'audio' ? (
                    <div style={{ width: '100%', aspectRatio: '2 / 1', borderRadius: 8, background: 'var(--paper2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', opacity }}>
                      <audio src={display.media_url} controls preload="metadata" style={{ width: '100%' }} />
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={display.media_url} alt="" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)', opacity }} />
                  )
                })() : (
                  <div style={{
                    width: '100%',
                    aspectRatio: fallback === 'audio' ? '2 / 1' : '1 / 1',
                    borderRadius: 8,
                    background: 'var(--paper2)',
                    border: '1px dashed var(--line-md)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)', fontSize: 11, gap: 4,
                  }}>
                    <span style={{ fontSize: 22, color: 'var(--gold)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>✦</span>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                      {fallback === 'audio' ? 'Voice slot' : 'Video slot'}
                    </span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Type
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['video', 'audio'] as MediaSlotType[]).map(t => {
                    const on = currentType === t
                    return (
                      <button
                        key={t}
                        onClick={() => setChosenType(prev => ({ ...prev, [day]: t }))}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '6px 12px', borderRadius: 7,
                          border: `1px solid ${on ? 'var(--gold)' : 'var(--line-md)'}`,
                          background: on ? 'var(--gold-pale)' : '#fff',
                          color: on ? 'var(--gold)' : 'var(--text-soft)',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {t === 'video' ? '🎬 Video' : '🎙 Voice'}
                      </button>
                    )
                  })}
                </div>

                <label style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 14px', borderRadius: 7, cursor: isBusy ? 'wait' : 'pointer',
                  background: isBusy ? 'var(--line)' : 'var(--gold)', color: '#fff',
                  fontSize: 12, fontWeight: 600, marginTop: 4, alignSelf: 'flex-start',
                  fontFamily: 'inherit',
                  opacity: isBusy ? 0.7 : 1,
                }}>
                  {isBusy ? 'Uploading…' : slot ? 'Replace media' : 'Upload media'}
                  <input
                    type="file"
                    accept={currentType === 'video' ? 'video/*' : currentType === 'audio' ? 'audio/*' : 'image/*'}
                    style={{ display: 'none' }}
                    disabled={isBusy}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (file) handleUpload(day, file, currentType)
                    }}
                  />
                </label>

                {errorByDay[day] && (
                  <p style={{ fontSize: 11, color: 'var(--red)', margin: 0 }}>{errorByDay[day]}</p>
                )}

                {!slot && legSlot && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                    Showing shared {legSlot.media_type} from the legacy slot. Upload here to override for {ARCHETYPES.find(a => a.id === archetype)?.name}.
                  </p>
                )}

                {slot && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      Updated {new Date(slot.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleRemove(day)}
                      disabled={isBusy}
                      style={{
                        fontSize: 11, color: 'var(--red)', background: 'none',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        padding: '2px 0',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      )}
      {/* Active-archetype color cue at the bottom edge */}
      <div style={{ height: 2, background: activeColor, marginTop: 14, borderRadius: 2, opacity: 0.5 }} />
    </div>
  )
}
