// app/circle/community/page.tsx
// ─────────────────────────────────────────────────────────────
// Community feed — wins posts, Monday prompts, general posts.
// URL: /circle/community
// ─────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import {
  getMyCircleMember,
  getCommunityPosts,
  createPost,
  toggleReaction,
  getCurrentWeekNumber,
  type CirclePost,
  type PostType,
} from '@/lib/circle'

const POST_TYPE_LABELS: Record<PostType, string> = {
  wins:            '🏆 Win',
  monday_prompt:   '🌅 Monday',
  partner_checkin: '🤝 Partner',
  general:         '💬 General',
  coach_note:      '📣 Coach',
}

const POST_TYPE_COLORS: Record<PostType, string> = {
  wins:            'bg-green-50 text-green-700 border-green-100',
  monday_prompt:   'bg-amber-50 text-amber-700 border-amber-100',
  partner_checkin: 'bg-purple-50 text-purple-700 border-purple-100',
  general:         'bg-gray-50 text-gray-600 border-gray-100',
  coach_note:      'bg-[#1B4332] text-white border-[#1B4332]',
}

const EMOJIS = ['❤️', '🔥', '✨', '👏', '💪']

export default function CommunityPage() {
  const [posts, setPosts]           = useState<CirclePost[]>([])
  const [cohortId, setCohortId]     = useState<string>('')
  const [weekNumber, setWeekNumber] = useState<number>(1)
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState<PostType | 'all'>('all')
  const [newBody, setNewBody]       = useState('')
  const [newType, setNewType]       = useState<PostType>('wins')
  const [posting, setPosting]       = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    async function load() {
      const member = await getMyCircleMember()
      if (!member) return

      setCohortId(member.cohort_id)

      // Compute current week for tagging new posts
      const { data: cohort } = await supabaseClient
        .from('circle_cohorts')
        .select('starts_at')
        .eq('id', member.cohort_id)
        .single()

      if (cohort) {
        const wn = getCurrentWeekNumber(cohort.starts_at)
        if (wn) setWeekNumber(wn)
      }

      await loadPosts(member.cohort_id)
      setLoading(false)
    }
    load()
  }, [])

  async function loadPosts(cId?: string) {
    const id = cId ?? cohortId
    if (!id) return
    const data = await getCommunityPosts(
      id,
      filter === 'all' ? undefined : filter
    )
    setPosts(data)
  }

  useEffect(() => {
    if (cohortId) loadPosts()
  }, [filter])

  async function handlePost() {
    if (!newBody.trim() || !cohortId) return
    setPosting(true)
    const ok = await createPost(cohortId, newType, newBody.trim(), weekNumber)
    if (ok) {
      setNewBody('')
      setShowCompose(false)
      await loadPosts()
    }
    setPosting(false)
  }

  async function handleReaction(postId: string, emoji: string) {
    await toggleReaction(postId, emoji)
    await loadPosts()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">Loading community...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-[#C9A84C]">The Circle</p>
          <h1 className="text-xl font-bold">Community</h1>
        </div>
        <button
          onClick={() => setShowCompose(v => !v)}
          className="bg-[#1B4332] text-white text-xs font-bold px-4 py-2 rounded-xl hover:opacity-90"
        >
          + Post
        </button>
      </div>

      {/* Compose */}
      {showCompose && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(POST_TYPE_LABELS) as PostType[])
              .filter(t => t !== 'coach_note')
              .map(t => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                  newType === t
                    ? POST_TYPE_COLORS[t]
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                {POST_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            placeholder={
              newType === 'wins'
                ? "Share your win this week — any size counts..."
                : newType === 'monday_prompt'
                ? "Respond to this week's Monday prompt..."
                : "What's on your mind..."
            }
            rows={4}
            className="w-full border border-gray-100 rounded-xl p-3 text-sm resize-none focus:outline-none focus:border-gray-300 bg-gray-50"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCompose(false)}
              className="text-xs text-gray-400 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={posting || !newBody.trim()}
              className="bg-[#1B4332] text-white text-xs font-bold px-5 py-2 rounded-xl disabled:opacity-40"
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...Object.keys(POST_TYPE_LABELS)] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-400 hover:border-gray-400'
            }`}
          >
            {f === 'all' ? 'All' : POST_TYPE_LABELS[f as PostType]}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No posts yet. Be the first to share.
          </div>
        )}
        {posts.map(post => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-2xl p-5">
            {/* Post header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {(post.author?.name ?? 'M').charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-none">
                  {post.author?.name ?? 'Member'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                  })}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${POST_TYPE_COLORS[post.post_type]}`}>
                {POST_TYPE_LABELS[post.post_type]}
              </span>
            </div>

            {/* Body */}
            <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {post.body}
            </p>

            {/* Reactions */}
            <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-50">
              {EMOJIS.map(emoji => {
                const r = post.reactions?.find(rx => rx.emoji === emoji)
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(post.id, emoji)}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      r?.user_reacted
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'border-gray-100 text-gray-400 hover:border-gray-200'
                    }`}
                  >
                    {emoji}
                    {r && r.count > 0 && (
                      <span className="font-semibold">{r.count}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
