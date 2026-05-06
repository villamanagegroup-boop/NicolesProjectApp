'use client'

// components/circle/EmojiPickerPopover.tsx
// Small popover with an extended emoji palette for community reactions.
// Anchors to the trigger element, dismisses on outside click + ESC.

import { useEffect, useRef, useState } from 'react'

const ORANGE = '#C97D3A'

// Curated set — broader than the always-visible 5 but small enough to
// scan at a glance. Grouped roughly by intent (love → fire → applause →
// vibes → emotional).
export const EXTENDED_EMOJIS = [
  '❤️', '🔥', '✨', '👏', '💪',
  '🙌', '💯', '🌱', '🌟', '🎉',
  '🤝', '🫶', '🥹', '😂', '🙏',
  '💛', '💜', '💚', '🕊️', '☀️',
]

interface EmojiPickerPopoverProps {
  /** Emojis the user has already reacted with, so we can highlight them. */
  activeEmojis?: string[]
  onPick: (emoji: string) => void
  align?: 'left' | 'right'
}

export default function EmojiPickerPopover({
  activeEmojis = [], onPick, align = 'left',
}: EmojiPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="More reactions"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 13, padding: '4px 10px', borderRadius: 999,
          border: `1px dashed var(--line-md)`,
          background: 'transparent', color: 'var(--text-muted)',
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
      >
        <span style={{ fontSize: 13 }}>＋</span>
        <span style={{ fontSize: 11, fontWeight: 600 }}>Add</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Choose a reaction"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            [align]: 0,
            zIndex: 50,
            background: '#ffffff',
            border: '1px solid var(--line-md)',
            borderRadius: 12,
            padding: 10,
            boxShadow: '0 10px 30px rgba(12,12,10,0.12)',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
            minWidth: 220,
          }}
        >
          {EXTENDED_EMOJIS.map(e => {
            const active = activeEmojis.includes(e)
            return (
              <button
                key={e}
                type="button"
                onClick={() => { onPick(e); setOpen(false) }}
                style={{
                  fontSize: 18,
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: 'none',
                  background: active ? `${ORANGE}18` : 'transparent',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background .12s, transform .12s',
                  lineHeight: 1,
                }}
                onMouseEnter={ev => {
                  (ev.currentTarget as HTMLButtonElement).style.background = active ? `${ORANGE}28` : 'var(--paper2)';
                  (ev.currentTarget as HTMLButtonElement).style.transform = 'scale(1.18)';
                }}
                onMouseLeave={ev => {
                  (ev.currentTarget as HTMLButtonElement).style.background = active ? `${ORANGE}18` : 'transparent';
                  (ev.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
                aria-label={`React with ${e}`}
              >
                {e}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
