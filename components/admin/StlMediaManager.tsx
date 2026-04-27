'use client'

// components/admin/StlMediaManager.tsx
// Admin-side uploader for the seven Seal the Leak "opening frame" media slots.
// One row per day (1-7); each row lets the admin choose video or voice and
// upload a file. Unchosen days render the logo placeholder client-side.

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

export default function StlMediaManager() {
  const [slots, setSlots] = useState<Record<string, MediaSlot | null>>({})
  const [loading, setLoading] = useState(true)
  // Per-day local UI state (chosen type before upload, current upload status)
  const [chosenType, setChosenType] = useState<Record<number, MediaSlotType>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [errorByDay, setErrorByDay] = useState<Record<number, string | null>>({})

  const slotKeyFor = (day: number) => `stl_day${day}_opening`

  async function refresh() {
    const keys = DAYS.map(slotKeyFor)
    const rows = await fetchMediaSlots(keys)
    const map: Record<string, MediaSlot | null> = {}
    for (const k of keys) map[k] = rows.find(r => r.slot_key === k) ?? null
    setSlots(map)
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

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

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '12px 0' }}>Loading media…</div>
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
        Drop a video or voice message above the &ldquo;opening frame&rdquo; on each day&apos;s session.
        Day 1 defaults to video, days 2-7 default to voice — but you can pick either for any day.
        Empty slots show the logo placeholder (1×1 for video, 0.5×1 for voice).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DAYS.map(day => {
          const slot = slots[slotKeyFor(day)] ?? null
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
                  {slot ? slot.media_type : 'empty'}
                </div>
              </div>

              {/* Preview pane */}
              <div style={{ flex: '0 0 180px', maxWidth: 200 }}>
                {slot ? (
                  slot.media_type === 'video' ? (
                    <video src={slot.media_url} controls preload="metadata" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 8, background: '#000', objectFit: 'cover' }} />
                  ) : slot.media_type === 'audio' ? (
                    <div style={{ width: '100%', aspectRatio: '2 / 1', borderRadius: 8, background: 'var(--paper2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px' }}>
                      <audio src={slot.media_url} controls preload="metadata" style={{ width: '100%' }} />
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={slot.media_url} alt="" style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 8, objectFit: 'cover', border: '1px solid var(--line)' }} />
                  )
                ) : (
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
    </div>
  )
}
