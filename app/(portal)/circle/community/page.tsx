'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import {
  getMyCircleMember,
  getCommunityPosts,
  createPost,
  toggleReaction,
  getCurrentWeekNumber,
  type CirclePost,
  type PostType,
} from '@/lib/circle'

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

const POST_TYPES: { id: PostType; label: string; dot: string }[] = [
  { id: 'wins',            label: 'Wins',    dot: 'var(--green)'   },
  { id: 'monday_prompt',   label: 'Monday',  dot: ORANGE           },
  { id: 'partner_checkin', label: 'Partner', dot: '#7a5cc4'        },
  { id: 'general',         label: 'General', dot: 'var(--text-muted)' },
  { id: 'coach_note',      label: 'Coach',   dot: 'var(--ink)'     },
]

const POST_TYPE_LABEL: Record<PostType, string> = {
  wins: 'Win', monday_prompt: 'Monday', partner_checkin: 'Partner', general: 'General', coach_note: 'Coach',
}

const EMOJIS = ['❤️', '🔥', '✨', '👏', '💪']

export default function CommunityPage() {
  const router = useRouter()
  const { loading, isAuthed } = useApp()

  const [posts, setPosts]           = useState<CirclePost[]>([])
  const [cohortId, setCohortId]     = useState<string>('')
  const [weekNumber, setWeekNumber] = useState<number>(1)
  const [hydrating, setHydrating]   = useState(true)
  const [filter, setFilter]         = useState<PostType | 'all'>('all')

  const [newBody, setNewBody]       = useState('')
  const [newType, setNewType]       = useState<PostType>('wins')
  const [posting, setPosting]       = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }

    (async () => {
      const member = await getMyCircleMember()
      if (!member) { setHydrating(false); return }
      setCohortId(member.cohort_id)

      const { data: cohort } = await supabaseClient
        .from('circle_cohorts').select('starts_at').eq('id', member.cohort_id).maybeSingle()
      if (cohort) {
        const wn = getCurrentWeekNumber(cohort.starts_at)
        if (wn) setWeekNumber(wn)
      }
      const data = await getCommunityPosts(member.cohort_id)
      setPosts(data)
      setHydrating(false)
    })()
  }, [loading, isAuthed, router])

  // Re-fetch on filter change.
  useEffect(() => {
    if (!cohortId) return
    (async () => {
      const data = await getCommunityPosts(cohortId, filter === 'all' ? undefined : filter)
      setPosts(data)
    })()
  }, [filter, cohortId])

  const visiblePosts = useMemo(() => {
    if (filter === 'all') return posts
    return posts.filter(p => p.post_type === filter)
  }, [posts, filter])

  async function handlePost() {
    if (!newBody.trim()) return
    setPosting(true)
    if (!cohortId) { setPosting(false); return }
    const ok = await createPost(cohortId, newType, newBody.trim(), weekNumber)
    if (ok) {
      setNewBody('')
      setShowCompose(false)
      const data = await getCommunityPosts(cohortId, filter === 'all' ? undefined : filter)
      setPosts(data)
    }
    setPosting(false)
  }

  async function handleReaction(postId: string, emoji: string) {
    await toggleReaction(postId, emoji)
    if (cohortId) {
      const data = await getCommunityPosts(cohortId, filter === 'all' ? undefined : filter)
      setPosts(data)
    }
  }

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading community…</p>
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 4px' }}>
            The Circle
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', margin: 0 }}>
            Community
          </h1>
        </div>
        {!showCompose && (
          <button onClick={() => setShowCompose(true)} style={primaryBtn}>+ Post</button>
        )}
      </div>

      {/* Compose */}
      {showCompose && (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p style={eyebrow}>Post type</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {POST_TYPES.filter(t => t.id !== 'coach_note').map(t => (
                <button
                  key={t.id}
                  onClick={() => setNewType(t.id)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '6px 12px',
                    borderRadius: 999, border: `1px solid ${newType === t.id ? ORANGE : 'var(--line-md)'}`,
                    background: newType === t.id ? ORANGE_PALE : '#fff',
                    color: newType === t.id ? ORANGE : 'var(--text-soft)',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.dot }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            placeholder={placeholderFor(newType)}
            rows={4}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1px solid var(--line-md)', borderRadius: 10,
              fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit',
              resize: 'vertical', background: '#fff', color: 'var(--ink)',
              boxSizing: 'border-box', outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tagged to Week {weekNumber}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowCompose(false); setNewBody('') }} style={ghostBtn}>Cancel</button>
              <button onClick={handlePost} disabled={posting || !newBody.trim()} style={{
                ...primaryBtn,
                background: posting || !newBody.trim() ? 'var(--paper3)' : ORANGE,
                cursor: posting || !newBody.trim() ? 'not-allowed' : 'pointer',
              }}>
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterChip>
        {POST_TYPES.map(t => (
          <FilterChip key={t.id} dot={t.dot} active={filter === t.id} onClick={() => setFilter(t.id)}>
            {t.label}
          </FilterChip>
        ))}
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visiblePosts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: '#fff', border: '1px solid var(--line)', borderRadius: 14,
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            No posts yet. Be the first to share.
          </div>
        ) : visiblePosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onReact={emoji => handleReaction(post.id, emoji)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PostCard({ post, onReact }: { post: CirclePost; onReact: (emoji: string) => void }) {
  const typeMeta = POST_TYPES.find(t => t.id === post.post_type)
  const isCoach = post.post_type === 'coach_note'
  const authorName = post.author?.name ?? 'Member'

  return (
    <div style={{
      background: isCoach ? ORANGE_PALE : '#fff',
      border: `1px solid ${isCoach ? ORANGE : 'var(--line)'}`,
      borderRadius: 14, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isCoach ? ORANGE : avatarColorFor(authorName),
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>
          {authorName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
            {authorName}
            {isCoach && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: ORANGE, marginLeft: 8,
              }}>Coach</span>
            )}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            {relativeTime(post.created_at)}
            {post.week_number ? ` · Week ${post.week_number}` : ''}
          </p>
        </div>
        {typeMeta && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '3px 10px', borderRadius: 999,
            border: '1px solid var(--line-md)',
            color: typeMeta.dot,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: typeMeta.dot }} />
            {typeMeta.label}
          </span>
        )}
      </div>

      {/* Body */}
      <p style={{
        fontSize: 14, lineHeight: 1.7, color: 'var(--text-soft)',
        whiteSpace: 'pre-wrap', margin: 0,
      }}>
        {post.body}
      </p>

      {/* Reactions */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)',
      }}>
        {EMOJIS.map(emoji => {
          const r = post.reactions?.find(rx => rx.emoji === emoji)
          const active = r?.user_reacted ?? false
          return (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, padding: '4px 10px', borderRadius: 999,
                border: `1px solid ${active ? ORANGE : 'var(--line-md)'}`,
                background: active ? ORANGE_PALE : 'transparent',
                color: active ? ORANGE : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              <span>{emoji}</span>
              {r && r.count > 0 && <span style={{ fontSize: 11, fontWeight: 600 }}>{r.count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FilterChip({
  children, active, dot, onClick,
}: { children: React.ReactNode; active: boolean; dot?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600,
        padding: '6px 12px', borderRadius: 999,
        border: `1px solid ${active ? ORANGE : 'var(--line-md)'}`,
        background: active ? ORANGE : '#fff',
        color: active ? '#fff' : 'var(--text-soft)',
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 5,
        transition: 'all .15s',
      }}
    >
      {dot && !active && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot }} />
      )}
      {children}
    </button>
  )
}

// ─── Helpers / styles ───────────────────────────────────────────────────────

function placeholderFor(t: PostType): string {
  switch (t) {
    case 'wins':            return 'Share your win this week — any size counts…'
    case 'monday_prompt':   return "Respond to this week's Monday prompt…"
    case 'partner_checkin': return 'A note from your partner check-in worth sharing…'
    case 'general':         return "What's on your mind…"
    case 'coach_note':      return 'A note to the cohort…'
  }
}

function avatarColorFor(name: string): string {
  const palette = ['#1B4332', '#7a4800', '#3c2a8a', '#7B1D1D', '#3d2c0e', '#1a1a2e', ORANGE, '#2d7a52']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return palette[Math.abs(hash) % palette.length]
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const eyebrow: React.CSSProperties = {
  fontSize: 10, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: 'var(--text-muted)',
  margin: '0 0 8px',
}

const primaryBtn: React.CSSProperties = {
  background: ORANGE, color: '#fff',
  padding: '8px 16px', borderRadius: 10,
  fontSize: 12, fontWeight: 600,
  border: 'none', cursor: 'pointer',
  fontFamily: 'inherit',
}

const ghostBtn: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--line-md)',
  color: 'var(--text-soft)',
  padding: '8px 16px', borderRadius: 10,
  fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}
