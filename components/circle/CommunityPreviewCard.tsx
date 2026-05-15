'use client'

// components/circle/CommunityPreviewCard.tsx
// "In The Circle this week" — a compact, tabbed feed of recent cohort
// posts shown on the Circle home page. Tabs: Wins | Prompts | All.
//
// Friday/Saturday transformation (controlled by `friday` prop):
//   - Header relabels to "Friday wins — add yours"
//   - Default tab forced to Wins
//   - Limit bumped from 3 → 5
//   - Caller is expected to move this card higher in the home layout
//     (above This Week, below Voice Note) — that lives on the page itself.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getCohortPostsForWeek,
  toggleReaction,
  ARCHETYPE_COLOR,
  type CohortFeedPost,
  type PostType,
} from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'
const GOLD        = '#C8941F'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

type Tab = 'wins' | 'prompts' | 'all'

interface Props {
  cohortId: string
  weekNumber: number
  /** Friday/Saturday mode — relabels + expands the card. */
  friday?: boolean
}

export default function CommunityPreviewCard({ cohortId, weekNumber, friday = false }: Props) {
  const [tab, setTab]         = useState<Tab>('wins')
  const [posts, setPosts]     = useState<CohortFeedPost[]>([])
  const [loading, setLoading] = useState(true)

  const limit = friday ? 5 : 3
  const headerLabel = friday ? 'Friday wins — add yours' : 'In The Circle this week'
  const headerTitle = friday ? "Today's wins from your cohort"  : 'What your cohort is doing'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const postType: PostType | null =
        tab === 'wins'    ? 'wins'
      : tab === 'prompts' ? 'monday_prompt'
      : null
      const rows = await getCohortPostsForWeek(cohortId, weekNumber, postType, limit)
      if (!cancelled) {
        setPosts(rows)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [cohortId, weekNumber, tab, limit])

  // Re-fetch when Friday flips, since the limit changes.
  // (Tabs effect already covers this via `limit` in deps.)

  return (
    <section style={{
      border: '1px solid var(--line)',
      borderRadius: 14,
      overflow: 'hidden',
      background: 'var(--card)',
      boxShadow: '0 1px 2px rgba(12,12,10,0.03), 0 12px 30px -18px rgba(184,134,46,0.18)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 18px 0',
        background: friday
          ? `linear-gradient(135deg, ${ORANGE_PALE} 0%, #fff 70%)`
          : 'transparent',
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: ORANGE,
          margin: '0 0 6px', fontFamily: 'var(--font-body)',
        }}>
          {headerLabel}
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18, fontWeight: 500,
          color: 'var(--ink)', margin: 0,
          letterSpacing: '-0.01em',
        }}>
          {headerTitle}
        </h2>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginTop: 14, marginBottom: 0,
          borderBottom: '1px solid var(--line)',
        }}>
          {(['wins', 'prompts', 'all'] as Tab[]).map(t => {
            const active = t === tab
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '8px 12px 10px',
                  marginBottom: -1,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12, fontWeight: active ? 600 : 500,
                  color: active ? ORANGE : 'var(--text-muted)',
                  borderBottom: `2px solid ${active ? ORANGE : 'transparent'}`,
                  textTransform: 'capitalize',
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Body */}
      <div>
        {loading ? (
          <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '24px 18px 28px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Nobody&apos;s posted {tab === 'all' ? '' : tab + ' '}yet this week.
            {tab === 'wins' && ' Be the first to share one.'}
          </div>
        ) : (
          posts.map((post, i) => (
            <PostRow key={post.id} post={post} last={i === posts.length - 1} />
          ))
        )}
      </div>

      {/* Footer */}
      <Link
        href="/circle/community"
        style={{
          display: 'block',
          textDecoration: 'none',
          padding: '12px 18px',
          borderTop: '1px solid var(--line)',
          background: 'var(--paper)',
          fontSize: 12, fontWeight: 600,
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = ORANGE_PALE; e.currentTarget.style.color = ORANGE }}
        onMouseLeave={e => { e.currentTarget.style.background = 'var(--paper)'; e.currentTarget.style.color = 'var(--text-soft)' }}
      >
        See all activity →
      </Link>
    </section>
  )
}

// ── Post row ────────────────────────────────────────────────────────────────

function PostRow({ post, last }: { post: CohortFeedPost; last: boolean }) {
  const authorName = post.author?.name ?? 'A member'
  const initials = authorName
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(s => s.charAt(0).toUpperCase()).join('')
  const archetype = post.author_archetype
  const archetypeColor = archetype ? ARCHETYPE_COLOR[archetype] : '#3a3a3a'
  const archetypeLabel = archetype ? ARCHETYPE_LABELS[archetype] : null
  const [reactions, setReactions] = useState(post.reactions ?? [])

  async function handleReact(emoji: string) {
    // Optimistic toggle.
    const next = reactions.map(r => r.emoji === emoji
      ? { ...r, count: r.user_reacted ? r.count - 1 : r.count + 1, user_reacted: !r.user_reacted }
      : r
    ).filter(r => r.count > 0)
    setReactions(next)
    const ok = await toggleReaction(post.id, emoji)
    if (!ok) setReactions(post.reactions ?? []) // rollback
  }

  return (
    <article style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 18px',
      borderBottom: last ? 'none' : '1px solid var(--line)',
    }}>
      {/* Avatar */}
      <div
        aria-hidden
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: archetypeColor,
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.04em',
          flexShrink: 0,
          fontFamily: 'var(--font-body)',
        }}
      >
        {initials || '·'}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        {/* Name + archetype + time */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
            {authorName.split(/\s+/)[0]}
          </span>
          {archetypeLabel && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: GOLD,
              fontFamily: 'var(--font-body)',
            }}>
              {archetypeLabel}
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
            {formatRelative(post.created_at)}
          </span>
        </div>

        {/* Body, max 2 lines */}
        {post.body && (
          <p style={{
            fontSize: 13, color: 'var(--text-soft)',
            margin: '4px 0 0', lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-body)',
          }}>
            {post.body}
          </p>
        )}

        {/* Reactions */}
        {reactions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => handleReact(r.emoji)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: r.user_reacted ? `${ORANGE}1f` : 'var(--paper)',
                  border: `1px solid ${r.user_reacted ? ORANGE : 'var(--line)'}`,
                  color: r.user_reacted ? ORANGE : 'var(--text-soft)',
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'background 0.15s',
                }}
              >
                <span>{r.emoji}</span>
                <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

// ── Relative-time util ──────────────────────────────────────────────────────

/** "2 hours ago", "Yesterday", "Jun 12" — capped sensibly for a feed card. */
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const now  = Date.now()
  const sec  = Math.floor((now - then) / 1000)
  if (sec < 60)     return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60)     return `${min} ${min === 1 ? 'minute' : 'minutes'} ago`
  const hr  = Math.floor(min / 60)
  if (hr  < 24)     return `${hr} ${hr === 1 ? 'hour' : 'hours'} ago`
  const day = Math.floor(hr / 24)
  if (day === 1)    return 'Yesterday'
  if (day < 7)      return `${day} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

