'use client'

// components/circle/WeeklyWinsFeed.tsx
// "What your cohort proved this week" — wins feed shown at the bottom of
// each weekly view (/circle/week/[week]). Always visible so members can
// read the wins even before completing their own steps.
//
//   - Header: "This week's wins · Week N · X of Y posted"
//   - Win cards: full text (no truncation), name + archetype label in gold,
//     Nicole's reply rendered below when one exists.
//   - Composer at the bottom: if the caller hasn't posted yet, show a
//     dashed "add your win" card pre-populated with wins_prompt. If they
//     have, highlight their existing win and skip the composer.
//
// Anchor: <section id="wins-composer" /> wraps the composer, so the
// ActionCompleteScreen's "Share your win →" CTA can scroll the caller
// here from anywhere on the page.

import { useEffect, useState } from 'react'
import {
  createPost,
  getCohortPostsForWeek,
  getMyWinForWeek,
  getAdminRepliesForPosts,
  ARCHETYPE_COLOR,
  type CohortFeedPost,
  type CirclePost,
} from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'
const GOLD        = '#C8941F'
const GREEN       = '#1F5C3A'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

interface Props {
  cohortId: string
  weekNumber: number
  /** Pre-populated copy for the composer when the member hasn't posted yet. */
  winsPrompt: string | null
  /** Total members in the cohort — used for the "X of Y posted" header. */
  cohortMemberCount: number
}

export default function WeeklyWinsFeed({
  cohortId, weekNumber, winsPrompt, cohortMemberCount,
}: Props) {
  const [wins, setWins]   = useState<CohortFeedPost[]>([])
  const [myWin, setMyWin] = useState<CirclePost | null>(null)
  const [nicoleReplies, setNicoleReplies] = useState<Record<string, { body: string; author_name: string | null; created_at: string }>>({})
  const [loading, setLoading] = useState(true)

  // Composer state.
  const [draft, setDraft]   = useState<string>('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string>('')

  async function refresh() {
    const [allWins, mine] = await Promise.all([
      getCohortPostsForWeek(cohortId, weekNumber, 'wins', 50),
      getMyWinForWeek(weekNumber),
    ])
    setWins(allWins)
    setMyWin(mine)
    const replies = await getAdminRepliesForPosts(allWins.map(w => w.id))
    setNicoleReplies(replies)
    if (!mine && winsPrompt && draft === '') {
      setDraft(winsPrompt)
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => { if (!cancelled) await refresh() })()
    return () => { cancelled = true }
    // refresh changes when week or cohort changes; intentionally skipping
    // winsPrompt/draft from deps so the composer stays user-editable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortId, weekNumber])

  async function handlePost() {
    if (!draft.trim()) return
    setPosting(true)
    setError('')
    const ok = await createPost(cohortId, 'wins', draft.trim(), weekNumber)
    setPosting(false)
    if (!ok) { setError('Couldn\'t post that. Try again.'); return }
    setDraft('')
    await refresh()
  }

  const postedCount = wins.length
  const denominator = Math.max(postedCount, cohortMemberCount)

  return (
    <section style={{ marginTop: 8 }}>
      <header style={{ marginBottom: 14 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: ORANGE,
          margin: '0 0 6px', fontFamily: 'var(--font-body)',
        }}>
          This week&apos;s wins · Week {weekNumber} · {postedCount} of {denominator} posted
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22, fontWeight: 400,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          What your cohort proved this week
        </h2>
      </header>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading wins…</p>
      ) : wins.length === 0 ? (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 12, padding: '18px 20px',
          fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6,
        }}>
          No wins yet this week — your post can be the first.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wins.map(w => (
            <WinCard
              key={w.id}
              post={w}
              isMine={!!myWin && myWin.id === w.id}
              nicoleReply={nicoleReplies[w.id] ?? null}
            />
          ))}
        </div>
      )}

      {/* Composer — anchored for the ActionCompleteScreen scroll target. */}
      <section id="wins-composer" style={{ marginTop: 18, scrollMarginTop: 80 }}>
        {myWin ? (
          <div style={{
            border: `1px solid ${GREEN}33`,
            background: '#eaf2ec',
            borderRadius: 10,
            padding: '12px 16px',
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: GREEN,
              margin: '0 0 4px', fontFamily: 'var(--font-body)',
            }}>
              ✓ Your win this week
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.55 }}>
              {myWin.body}
            </p>
          </div>
        ) : (
          <div style={{
            border: `1.5px dashed ${ORANGE}aa`,
            background: ORANGE_PALE,
            borderRadius: 12,
            padding: '16px 18px',
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: ORANGE,
              margin: '0 0 10px', fontFamily: 'var(--font-body)',
            }}>
              Add your win for this week
            </p>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder={winsPrompt ?? "Small or big — what's one thing that landed this week?"}
              rows={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                border: '1px solid var(--line-md)',
                borderRadius: 10,
                background: '#fff',
                fontSize: 13, lineHeight: 1.6,
                fontFamily: 'var(--font-body)',
                color: 'var(--ink)',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
            />
            {error && (
              <p style={{ fontSize: 12, color: 'rgba(180,40,40,0.85)', margin: '8px 0 0' }}>{error}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={handlePost}
                disabled={posting || !draft.trim()}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  background: posting || !draft.trim() ? `${ORANGE}99` : ORANGE,
                  color: '#fff',
                  fontSize: 13, fontWeight: 600,
                  border: 'none',
                  cursor: posting || !draft.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-body)',
                  transition: 'opacity 0.15s',
                }}
              >
                {posting ? 'Posting…' : 'Post my win →'}
              </button>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}

// ── Win card ────────────────────────────────────────────────────────────────

function WinCard({
  post, isMine, nicoleReply,
}: {
  post: CohortFeedPost
  isMine: boolean
  nicoleReply: { body: string; author_name: string | null; created_at: string } | null
}) {
  const firstName = (post.author?.name ?? 'A member').split(/\s+/)[0]
  const archColor = post.author_archetype ? ARCHETYPE_COLOR[post.author_archetype] : '#3a3a3a'
  const archLabel = post.author_archetype ? ARCHETYPE_LABELS[post.author_archetype] : null

  return (
    <article style={{
      background: isMine ? '#eaf2ec' : 'var(--card)',
      border: `1px solid ${isMine ? GREEN + '33' : 'var(--line)'}`,
      borderLeft: `3px solid ${archColor}`,
      borderRadius: 12,
      padding: '16px 18px',
    }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        marginBottom: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {firstName}
        </span>
        {archLabel && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: GOLD,
          }}>
            {archLabel}
          </span>
        )}
        {isMine && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: GREEN,
          }}>
            Your win
          </span>
        )}
      </header>
      <p style={{
        fontSize: 14, color: 'var(--ink)',
        margin: 0, lineHeight: 1.65, whiteSpace: 'pre-wrap',
      }}>
        {post.body}
      </p>

      {nicoleReply && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: ORANGE_PALE,
          borderLeft: `2px solid ${ORANGE}`,
          borderRadius: 6,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: ORANGE,
            margin: '0 0 4px', fontFamily: 'var(--font-body)',
          }}>
            {nicoleReply.author_name ?? 'Nicole'} replied
          </p>
          <p style={{
            fontSize: 13, color: 'var(--ink)',
            margin: 0, lineHeight: 1.55, fontStyle: 'italic',
          }}>
            {nicoleReply.body}
          </p>
        </div>
      )}
    </article>
  )
}
