'use client'

// components/circle/ActionCompleteScreen.tsx
// Celebration overlay shown after the member taps "I did this" on a
// weekly action. Sits over the week page, never blocks navigation:
//
//   - Big checkmark, "Week N action complete", "You showed up."
//   - Two random recent wins from OTHER cohort members so the celebration
//     lands inside the cohort, not in a vacuum. Compact quote cards —
//     no reactions, no timestamp, just the words and who.
//   - Two CTAs: "Share your win →" (opens the wins composer) or
//     "Back to home" (closes + routes to /circle).
//
// Sharing a win is always optional; closing always works.

import { useEffect, useState } from 'react'
import {
  getCohortPostsForWeek,
  ARCHETYPE_COLOR,
  type CohortFeedPost,
} from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'
const GREEN       = '#1F5C3A'
const GOLD        = '#C8941F'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

interface Props {
  open: boolean
  weekNumber: number
  cohortId: string
  /** Caller's user id, so we exclude them from the cohort wins preview. */
  excludeUserId: string
  onShareWin: () => void
  onBackHome: () => void
}

export default function ActionCompleteScreen({
  open, weekNumber, cohortId, excludeUserId, onShareWin, onBackHome,
}: Props) {
  const [wins, setWins] = useState<CohortFeedPost[]>([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      // Pull a few extras so we can drop our own and still show 2.
      const rows = await getCohortPostsForWeek(cohortId, weekNumber, 'wins', 6)
      if (cancelled) return
      const filtered = rows.filter(p => p.author_id !== excludeUserId)
      // "Random recent" — shuffle the recent slice, take 2.
      const shuffled = [...filtered].sort(() => Math.random() - 0.5).slice(0, 2)
      setWins(shuffled)
    })()
    return () => { cancelled = true }
  }, [open, cohortId, weekNumber, excludeUserId])

  // ESC closes — keeps the screen always escapable.
  useEffect(() => {
    if (!open) return
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onBackHome() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onBackHome])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-complete-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(12,12,10,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={onBackHome}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 540, width: '100%',
          maxHeight: '92vh', overflow: 'auto',
          background: '#ffffff',
          borderRadius: 18,
          boxShadow: '0 24px 60px -12px rgba(12,12,10,0.30)',
          padding: '36px 32px 28px',
          textAlign: 'center',
        }}
      >
        {/* Big checkmark */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: GREEN, color: '#fff',
          margin: '0 auto 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 0 8px ${GREEN}1a`,
        }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 12 10 18 20 6" />
          </svg>
        </div>

        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: GREEN,
          margin: '0 0 8px', fontFamily: 'var(--font-body)',
        }}>
          Week {weekNumber} action complete
        </p>
        <h2 id="action-complete-title" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32, fontWeight: 300, fontStyle: 'italic',
          color: 'var(--ink)',
          margin: '0 0 10px', letterSpacing: '-0.015em', lineHeight: 1.15,
        }}>
          You showed up.
        </h2>
        <p style={{
          fontSize: 14, color: 'var(--text-soft)',
          margin: '0 auto', maxWidth: 400, lineHeight: 1.6,
        }}>
          That is the whole practice. One action, one day at a time.
        </p>

        {/* Cohort preview — only render when we have at least one win */}
        {wins.length > 0 && (
          <div style={{ marginTop: 28, textAlign: 'left' }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              margin: '0 0 10px', fontFamily: 'var(--font-body)',
              textAlign: 'center',
            }}>
              Your cohort is doing this too
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {wins.map(w => <QuoteCard key={w.id} post={w} />)}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 28 }}>
          <button
            onClick={onShareWin}
            style={{
              width: '100%', padding: '13px 20px',
              borderRadius: 10, border: 'none',
              background: ORANGE, color: '#fff',
              fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Share your win →
          </button>
          <button
            onClick={onBackHome}
            style={{
              width: '100%', padding: '12px 20px',
              borderRadius: 10,
              background: 'transparent',
              border: '1px solid var(--line-md)',
              color: 'var(--text-soft)',
              fontSize: 14, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.color = 'var(--ink)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-soft)' }}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compact quote card ──────────────────────────────────────────────────────

function QuoteCard({ post }: { post: CohortFeedPost }) {
  const firstName = (post.author?.name ?? 'A member').split(/\s+/)[0]
  const archColor = post.author_archetype ? ARCHETYPE_COLOR[post.author_archetype] : '#3a3a3a'
  const archLabel = post.author_archetype ? ARCHETYPE_LABELS[post.author_archetype] : null

  return (
    <div style={{
      background: ORANGE_PALE,
      border: '1px solid rgba(184,134,46,0.18)',
      borderLeft: `3px solid ${archColor}`,
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <p style={{
        fontFamily: 'var(--font-display)',
        fontSize: 14, fontStyle: 'italic', fontWeight: 300,
        color: 'var(--ink)',
        margin: 0, lineHeight: 1.55,
      }}>
        &ldquo;{post.body}&rdquo;
      </p>
      <p style={{
        fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        fontFamily: 'var(--font-body)',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{firstName}</span>
        {archLabel && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: GOLD,
          }}>
            {archLabel}
          </span>
        )}
      </p>
    </div>
  )
}
