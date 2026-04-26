'use client'
import { useEffect, useRef, useState } from 'react'

export type AttachmentSlots = {
  audio: File | null
  video: File | null
  image: File | null
  doc:   File | null
}

export type AttachmentSlot = keyof AttachmentSlots

interface Props {
  slots: AttachmentSlots
  onChange: (slot: AttachmentSlot, file: File | null) => void
  /** brand accent — orange in Circle */
  accent?: string
  /** compact = single row of icon-only buttons; for chat composers. */
  compact?: boolean
}

/**
 * One picker that handles all four attachment kinds.
 *
 *   audio: record via MediaRecorder OR upload via 📎 File
 *   video: record via MediaRecorder OR upload via 📎 File
 *   image: upload via 📷 Photo (dedicated; phones default to camera roll)
 *   doc:   upload via 📎 File (any other type)
 *
 * The 📎 File picker auto-routes the result to the correct slot based on
 * MIME (audio/* → audio, video/* → video, image/* → image, else → doc),
 * so users always have one upload-fallback button.
 */
export default function AttachmentPicker({ slots, onChange, accent = '#C97D3A', compact }: Props) {
  // Recording state
  const [recording, setRecording] = useState<null | 'audio' | 'video'>(null)
  const [recSeconds, setRecSeconds] = useState(0)
  const recRef    = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const previewRef  = useRef<HTMLVideoElement>(null)

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  async function startRecording(kind: 'audio' | 'video') {
    if (recording) return
    try {
      const constraints: MediaStreamConstraints =
        kind === 'audio' ? { audio: true } : { video: true, audio: true }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const mime = kind === 'audio' ? 'audio/webm' : 'video/webm'
        const blob = new Blob(chunksRef.current, { type: mime })
        const ext  = kind === 'audio' ? 'webm' : 'webm'
        const name = `${kind}-${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`
        const file = new File([blob], name, { type: mime })
        onChange(kind, file)
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      recorder.start()
      recRef.current = recorder
      setRecording(kind)
      setRecSeconds(0)
      intervalRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)

      if (kind === 'video' && previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.muted = true
        previewRef.current.play().catch(() => {})
      }
    } catch {
      alert('Microphone or camera permission is required to record.')
    }
  }

  function stopRecording() {
    recRef.current?.stop()
    setRecording(null)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRecSeconds(0)
  }

  function pickFile(slotHint: 'image' | 'doc') {
    const inp = document.createElement('input')
    inp.type = 'file'
    inp.accept = slotHint === 'image' ? 'image/*' : '*/*'
    inp.onchange = () => {
      const f = inp.files?.[0]
      if (!f) return
      // Smart routing for the generic 📎 File button
      const m = f.type
      if (slotHint === 'image' || m.startsWith('image/')) onChange('image', f)
      else if (m.startsWith('audio/')) onChange('audio', f)
      else if (m.startsWith('video/')) onChange('video', f)
      else onChange('doc', f)
    }
    inp.click()
  }

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: '1px dashed var(--line-md)', background: '#fff',
    color: 'var(--text-soft)', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: compact ? 11 : 12, fontWeight: 600,
    padding: compact ? '5px 9px' : '6px 12px', borderRadius: 999,
  }
  const liveBtn: React.CSSProperties = {
    ...btnBase,
    background: 'var(--red-pale)', borderColor: 'var(--red)',
    color: 'var(--red)',
  }
  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 600,
    padding: '5px 10px', borderRadius: 999,
    background: 'rgba(201,125,58,0.10)', color: accent,
    border: `1px solid ${accent}`,
  }
  const chipX: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: accent, fontSize: 14, padding: 0, lineHeight: 1, fontFamily: 'inherit',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {recording !== 'audio' ? (
          <button type="button" onClick={() => startRecording('audio')} style={btnBase} disabled={!!recording}>
            🎙 {compact ? '' : 'Record voice'}
          </button>
        ) : (
          <button type="button" onClick={stopRecording} style={liveBtn}>
            ⏺ Stop · {fmtTime(recSeconds)}
          </button>
        )}

        {recording !== 'video' ? (
          <button type="button" onClick={() => startRecording('video')} style={btnBase} disabled={!!recording}>
            🎬 {compact ? '' : 'Record video'}
          </button>
        ) : (
          <button type="button" onClick={stopRecording} style={liveBtn}>
            ⏺ Stop · {fmtTime(recSeconds)}
          </button>
        )}

        <button type="button" onClick={() => pickFile('image')} style={btnBase} disabled={!!recording}>
          📷 {compact ? '' : 'Photo'}
        </button>

        <button type="button" onClick={() => pickFile('doc')} style={btnBase} disabled={!!recording}>
          📎 {compact ? '' : 'File'}
        </button>
      </div>

      {/* Live video preview while recording */}
      {recording === 'video' && (
        <video
          ref={previewRef}
          style={{
            width: '100%', maxHeight: 260,
            borderRadius: 10, background: '#000',
            border: `1px solid ${accent}`,
          }}
          playsInline
        />
      )}

      {/* Selected attachments */}
      {(slots.audio || slots.video || slots.image || slots.doc) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {slots.audio && (
            <span style={chipStyle}>
              🎙 {trimName(slots.audio.name)}
              <button onClick={() => onChange('audio', null)} style={chipX} type="button">×</button>
            </span>
          )}
          {slots.video && (
            <span style={chipStyle}>
              🎬 {trimName(slots.video.name)}
              <button onClick={() => onChange('video', null)} style={chipX} type="button">×</button>
            </span>
          )}
          {slots.image && (
            <span style={chipStyle}>
              📷 {trimName(slots.image.name)}
              <button onClick={() => onChange('image', null)} style={chipX} type="button">×</button>
            </span>
          )}
          {slots.doc && (
            <span style={chipStyle}>
              📎 {trimName(slots.doc.name)}
              <button onClick={() => onChange('doc', null)} style={chipX} type="button">×</button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function trimName(n: string): string {
  return n.length > 26 ? n.slice(0, 24) + '…' : n
}
