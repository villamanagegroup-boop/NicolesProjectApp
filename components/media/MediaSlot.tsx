'use client'

// components/media/MediaSlot.tsx
// Read-only renderer for admin-curated media at a fixed slot key.
//
// Three states:
//   • loading        → faint placeholder, no flicker
//   • slot empty     → logo placeholder at the slot's default aspect ratio
//   • slot present   → the uploaded video / audio / image
//
// Aspect ratios per the design spec:
//   video → 1:1   (square)
//   audio → 2:1   ("0.5x1" — half-height of the square)
//   image → 1:1   (square, same as video by default)
//
// Both the placeholder and the real player share the same outer box, so
// swapping in real media doesn't reflow the page.

import { useEffect, useState } from 'react'
import { fetchMediaSlot, type MediaSlot as MediaSlotRow, type MediaSlotType } from '@/lib/admin/hooks'

interface Props {
  slotKey: string
  /** Default media type — controls the aspect ratio of the placeholder
   *  shown before any real media is uploaded. */
  defaultType: MediaSlotType
  /** Accent color for the placeholder gradient (the program's color). */
  accent: string
  /** Optional caption shown under the player. */
  fallbackCaption?: string
}

const ASPECT: Record<MediaSlotType, string> = {
  video: '1 / 1',
  audio: '2 / 1',
  image: '1 / 1',
}

export default function MediaSlot({ slotKey, defaultType, accent, fallbackCaption }: Props) {
  const [slot, setSlot] = useState<MediaSlotRow | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    fetchMediaSlot(slotKey).then(s => {
      if (cancelled) return
      setSlot(s)
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [slotKey])

  const type = slot?.media_type ?? defaultType
  const aspect = ASPECT[type]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: aspect,
        borderRadius: '10px',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
        border: `1px solid ${accent}30`,
      }}>
        {!loaded ? null : !slot ? (
          <LogoPlaceholder type={defaultType} accent={accent} />
        ) : slot.media_type === 'video' ? (
          <video
            src={slot.media_url}
            controls
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }}
          />
        ) : slot.media_type === 'audio' ? (
          <AudioPlayer src={slot.media_url} accent={accent} />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={slot.media_url} alt={slot.title ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      {(slot?.caption ?? fallbackCaption) && (
        <p style={{
          fontSize: 11, color: 'var(--text-muted)', margin: 0,
          fontFamily: 'var(--font-body)', lineHeight: 1.5,
        }}>
          {slot?.caption ?? fallbackCaption}
        </p>
      )}
    </div>
  )
}

function LogoPlaceholder({ type, accent }: { type: MediaSlotType; accent: string }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '6px', position: 'relative',
    }}>
      {/* Brand mark — matches the ✦ used in the sidebar wordmarks. */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: type === 'audio' ? 28 : 44,
        color: accent,
        lineHeight: 1,
        letterSpacing: '0.05em',
        textShadow: `0 1px 0 ${accent}30`,
      }}>
        ✦
      </div>
      <div style={{
        fontSize: 9, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.16em',
        color: accent, opacity: 0.8,
        fontFamily: 'var(--font-body)',
      }}>
        {type === 'audio' ? 'Voice message' : type === 'image' ? 'Image' : 'Video'}
      </div>
    </div>
  )
}

function AudioPlayer({ src, accent }: { src: string; accent: string }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 14px',
      background: `linear-gradient(135deg, ${accent}10, ${accent}04)`,
    }}>
      <audio src={src} controls preload="metadata" style={{ width: '100%' }} />
    </div>
  )
}
