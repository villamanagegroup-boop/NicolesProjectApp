'use client'

// components/circle/ArchetypeVideoModal.tsx
// Archetype-specific "welcome to the next phase" video, shown over the week
// page. Two ways it opens:
//   - Auto: the first time a member opens the CURRENT week, IF the admin
//     flagged this week's archetype track with archetype_video_popup. After
//     dismissal it never auto-pops again (archetype_video_seen_at is stamped).
//   - Manual: the smaller on-page player's "Watch" button reopens it any time
//     during the week.
//
// The universal teaching video keeps its normal full-size spot on the page;
// this is the additive, archetype-personal welcome. Same overlay pattern as
// ActionCompleteScreen (fixed blur backdrop, ESC + click-outside to close).

import { useEffect } from 'react'
import { ARCHETYPE_COLOR } from '@/lib/circle'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

const MONTH_LABELS: Record<string, string> = {
  root:    'Month 1 · Root',
  rebuild: 'Month 2 · Rebuild',
  rise:    'Month 3 · Rise',
}

// Direct video files render in <video>; everything else (YouTube/Vimeo/etc.)
// renders in an <iframe>. Mirrors the detection used on the week page.
const FILE_RE = /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i

interface Props {
  open: boolean
  videoUrl: string
  archetype: string
  weekNumber: number
  monthName?: string | null
  /** Called when the member closes the modal. Stamp "seen" here. */
  onClose: () => void
}

export default function ArchetypeVideoModal({
  open, videoUrl, archetype, weekNumber, monthName, onClose,
}: Props) {
  // ESC closes — keeps the modal always escapable.
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const accent    = ARCHETYPE_COLOR[archetype as keyof typeof ARCHETYPE_COLOR] ?? '#B8862E'
  const archLabel = ARCHETYPE_LABELS[archetype] ?? 'Your path'
  const monthLine = monthName ? MONTH_LABELS[monthName] ?? null : null
  const isFile    = FILE_RE.test(videoUrl)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archetype-video-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(12,12,10,0.62)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 680, width: '100%',
          maxHeight: '92vh', overflow: 'auto',
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 24px 60px -12px rgba(12,12,10,0.34)',
          padding: '24px 24px 22px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            {monthLine && (
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: accent,
                margin: '0 0 6px', fontFamily: 'var(--font-body)',
              }}>
                {monthLine} · Week {weekNumber}
              </p>
            )}
            <h2 id="archetype-video-title" style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26, fontWeight: 300, fontStyle: 'italic',
              color: 'var(--ink)',
              margin: 0, letterSpacing: '-0.015em', lineHeight: 1.15,
            }}>
              Welcome to this week
            </h2>
            <p style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: accent,
              margin: '8px 0 0', fontFamily: 'var(--font-body)',
            }}>
              {archLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              width: 34, height: 34, borderRadius: '50%',
              border: '1px solid var(--line-md)', background: 'transparent',
              color: 'var(--text-soft)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, lineHeight: 1, fontFamily: 'var(--font-body)',
            }}
          >
            ×
          </button>
        </div>

        {/* Video */}
        <div style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
          {isFile ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              preload="metadata"
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
          ) : (
            <iframe
              src={videoUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={`Week ${weekNumber} ${archLabel} welcome`}
            />
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 16, padding: '13px 20px',
            borderRadius: 10, border: 'none',
            background: accent, color: '#fff',
            fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Continue to this week →
        </button>
      </div>
    </div>
  )
}
