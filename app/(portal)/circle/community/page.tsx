'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import {
  getMyCircleMember,
  getCommunityPosts,
  createPost,
  updatePost,
  deletePost,
  toggleReaction,
  getCurrentWeekNumber,
  uploadCircleAttachment,
  type CirclePost,
  type PostType,
} from '@/lib/circle'
import AttachmentPicker, { type AttachmentSlots, type AttachmentSlot } from '@/components/circle/AttachmentPicker'
import CommentThread from '@/components/circle/CommentThread'
import EmojiPickerPopover from '@/components/circle/EmojiPickerPopover'
import GifPicker from '@/components/circle/GifPicker'

const ORANGE      = '#B8862E'
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
  const { loading, isAuthed, authUser, user } = useApp()

  const [posts, setPosts]           = useState<CirclePost[]>([])
  const [cohortId, setCohortId]     = useState<string>('')
  const [weekNumber, setWeekNumber] = useState<number>(1)
  const [hydrating, setHydrating]   = useState(true)
  const [filter, setFilter]         = useState<PostType | 'all'>('all')

  const [newBody, setNewBody]       = useState('')
  const [newType, setNewType]       = useState<PostType>('wins')
  const [posting, setPosting]       = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [attachments, setAttachments] = useState<AttachmentSlots>({ audio: null, video: null, image: null, doc: null })
  /** Tenor GIF URL — separate from `attachments` because GIFs are external
   *  CDN links, not files that need uploading. Mutually exclusive with the
   *  uploaded image slot in handlePost. */
  const [gifUrl, setGifUrl]         = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [postError, setPostError]     = useState<string | null>(null)

  function setSlot(slot: AttachmentSlot, file: File | null) {
    setAttachments(prev => ({ ...prev, [slot]: file }))
  }
  function clearAttachments() {
    setAttachments({ audio: null, video: null, image: null, doc: null })
  }

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
    if (!newBody.trim() && !gifUrl) return
    if (!cohortId) return
    setPosting(true)
    setPostError(null)

    const urls: { audio_url?: string | null; video_url?: string | null; image_url?: string | null; file_url?: string | null; file_name?: string | null } = {}

    if (attachments.audio || attachments.video || attachments.image || attachments.doc) {
      setUploading(true)
      try {
        if (attachments.audio) urls.audio_url = await uploadCircleAttachment(attachments.audio)
        if (attachments.video) urls.video_url = await uploadCircleAttachment(attachments.video)
        if (attachments.image) urls.image_url = await uploadCircleAttachment(attachments.image)
        if (attachments.doc) {
          urls.file_url  = await uploadCircleAttachment(attachments.doc)
          urls.file_name = attachments.doc.name
        }
      } finally {
        setUploading(false)
      }
      const allOk =
        (!attachments.audio || !!urls.audio_url) &&
        (!attachments.video || !!urls.video_url) &&
        (!attachments.image || !!urls.image_url) &&
        (!attachments.doc   || !!urls.file_url)
      if (!allOk) {
        setPostError('One or more uploads failed. Try a smaller file or check the storage bucket.')
        setPosting(false)
        return
      }
    }

    // Tenor GIF picker writes directly into image_url (no upload needed).
    // If both an uploaded image and a GIF were chosen, the GIF wins —
    // last-action-wins is the intuitive behavior here.
    if (gifUrl) urls.image_url = gifUrl

    const ok = await createPost(cohortId, newType, newBody.trim(), weekNumber, urls)
    if (ok) {
      setNewBody('')
      setGifUrl(null)
      clearAttachments()
      setShowCompose(false)
      const data = await getCommunityPosts(cohortId, filter === 'all' ? undefined : filter)
      setPosts(data)
    } else {
      setPostError('Could not save the post. Try again.')
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

  async function handleUpdatePost(postId: string, body: string): Promise<boolean> {
    const ok = await updatePost(postId, body)
    if (ok && cohortId) {
      const data = await getCommunityPosts(cohortId, filter === 'all' ? undefined : filter)
      setPosts(data)
    }
    return ok
  }

  async function handleDeletePost(postId: string) {
    if (!confirm('Delete this post? This will also remove its replies and reactions.')) return
    const ok = await deletePost(postId)
    if (ok && cohortId) {
      const data = await getCommunityPosts(cohortId, filter === 'all' ? undefined : filter)
      setPosts(data)
    }
  }

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading community…</p>
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* Hero */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 6px' }}>
            The Circle
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            Community
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '8px 0 0', lineHeight: 1.6 }}>
            Wins, prompts, and partner check-ins from your cohort.
          </p>
        </div>
        {!showCompose && (
          <button onClick={() => setShowCompose(true)} style={primaryBtn}>+ Post</button>
        )}
      </div>

      {/* Feed (left) + filters/info (right) on desktop, stacked on mobile */}
      <div className="community-cols" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 28, alignItems: 'start',
      }}>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
          {/* GIF preview — appears after user picks one */}
          {gifUrl && (
            <div style={{
              position: 'relative',
              alignSelf: 'flex-start',
              border: '1px solid var(--line-md)', borderRadius: 10,
              overflow: 'hidden',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={gifUrl} alt="" style={{ display: 'block', maxHeight: 200, maxWidth: 300 }} />
              <button
                type="button"
                onClick={() => setGifUrl(null)}
                aria-label="Remove GIF"
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 24, height: 24, borderRadius: '50%',
                  border: 'none', background: 'rgba(0,0,0,0.65)',
                  color: '#fff', fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>
          )}

          <AttachmentPicker slots={attachments} onChange={setSlot} />

          {postError && <p style={{ fontSize: 12, color: 'var(--red)', margin: 0 }}>{postError}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <GifPicker onPick={url => setGifUrl(url)} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {uploading ? 'Uploading…' : `Tagged to Week ${weekNumber}`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowCompose(false); setNewBody(''); setGifUrl(null); clearAttachments() }} style={ghostBtn}>Cancel</button>
              <button onClick={handlePost} disabled={posting || (!newBody.trim() && !gifUrl)} style={{
                ...primaryBtn,
                background: posting || (!newBody.trim() && !gifUrl) ? 'var(--paper3)' : ORANGE,
                cursor: posting || (!newBody.trim() && !gifUrl) ? 'not-allowed' : 'pointer',
              }}>
                {posting ? (uploading ? 'Uploading…' : 'Posting…') : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visiblePosts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            No posts yet. Be the first to share.
          </div>
        ) : visiblePosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={authUser?.id ?? null}
            isAdmin={user.isAdmin}
            onReact={emoji => handleReaction(post.id, emoji)}
            onUpdate={body => handleUpdatePost(post.id, body)}
            onDelete={() => handleDeletePost(post.id)}
          />
        ))}
      </div>

      </div>

      {/* Right column — filter sidebar (sticky on desktop) */}
      <div style={{ position: 'sticky', top: 24 }}>
        <section style={{ marginBottom: 24 }}>
          <header style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            paddingBottom: 8, borderBottom: '1px solid var(--line)',
            marginBottom: 12,
          }}>
            <h2 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--text-soft)',
              margin: 0, fontFamily: 'var(--font-body)',
            }}>
              Filter
            </h2>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              {visiblePosts.length} {visiblePosts.length === 1 ? 'post' : 'posts'}
            </span>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <FilterRow active={filter === 'all'} onClick={() => setFilter('all')}>All</FilterRow>
            {POST_TYPES.map(t => (
              <FilterRow key={t.id} dot={t.dot} active={filter === t.id} onClick={() => setFilter(t.id)}>
                {t.label}
              </FilterRow>
            ))}
          </div>
        </section>

        <section>
          <header style={{
            paddingBottom: 8, borderBottom: '1px solid var(--line)',
            marginBottom: 12,
          }}>
            <h2 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: 'var(--text-soft)',
              margin: 0, fontFamily: 'var(--font-body)',
            }}>
              About this feed
            </h2>
          </header>
          <p style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
            Everything posted here is visible to your full cohort. Use <strong>Wins</strong> to celebrate small shifts, <strong>Monday</strong> for the weekly prompt, <strong>Partner</strong> for accountability check-ins, and <strong>General</strong> for anything else.
          </p>
        </section>
      </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          .community-cols {
            grid-template-columns: 1fr !important;
          }
          .community-cols > div { position: static !important; }
        }
      `}</style>
    </div>
  )
}

function FilterRow({ active, onClick, dot, children }: {
  active: boolean
  onClick: () => void
  dot?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 7,
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        textAlign: 'left', width: '100%',
        background: active ? ORANGE_PALE : 'transparent',
        color: active ? ORANGE : 'var(--text-soft)',
        fontSize: 13, fontWeight: active ? 600 : 500,
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)'
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: dot ?? 'var(--text-muted)',
        flexShrink: 0,
      }} />
      {children}
    </button>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PostCard({
  post, currentUserId, isAdmin, onReact, onUpdate, onDelete,
}: {
  post: CirclePost
  currentUserId: string | null
  isAdmin: boolean
  onReact: (emoji: string) => void
  onUpdate: (body: string) => Promise<boolean>
  onDelete: () => void
}) {
  const typeMeta = POST_TYPES.find(t => t.id === post.post_type)
  const isCoach = post.post_type === 'coach_note'
  const authorName = post.author?.name ?? 'Member'
  const isOwn = !!currentUserId && post.author_id === currentUserId
  const canManage = isOwn || isAdmin

  // Replies expand inline. We track count locally so the row label updates
  // as the user posts/deletes inside the thread without a full feed refetch.
  const [showThread, setShowThread] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)

  // Edit state — inline textarea swap.
  const [editing, setEditing]   = useState(false)
  const [editBody, setEditBody] = useState(post.body)
  const [savingEdit, setSavingEdit] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  // Close kebab menu on outside click + ESC
  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('mousedown', onDocClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDocClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  async function saveEdit() {
    const trimmed = editBody.trim()
    if (!trimmed || savingEdit) return
    setSavingEdit(true)
    const ok = await onUpdate(trimmed)
    setSavingEdit(false)
    if (ok) setEditing(false)
  }

  // Emojis the user has already reacted with — used to highlight in the picker.
  const userReacted = (post.reactions ?? []).filter(r => r.user_reacted).map(r => r.emoji)

  return (
    <div style={{
      background: isCoach ? ORANGE_PALE : '#fff',
      border: `1px solid ${isCoach ? ORANGE : 'var(--line)'}`,
      borderRadius: 14, padding: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: isCoach ? ORANGE : avatarColorFor(authorName),
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, flexShrink: 0,
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
            {post.edited_at && (
              <span title={`Edited ${new Date(post.edited_at).toLocaleString()}`} style={{ marginLeft: 6, fontStyle: 'italic' }}>
                · edited
              </span>
            )}
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

        {/* Kebab menu — only for author or admin */}
        {canManage && !editing && (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Post actions"
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 6, fontSize: 16,
                lineHeight: 1, fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div role="menu" style={{
                position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                zIndex: 30,
                background: '#fff',
                border: '1px solid var(--line-md)', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(12,12,10,0.12)',
                minWidth: 140, padding: 4,
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setEditBody(post.body)
                    setEditing(true)
                  }}
                  style={menuItemStyle}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  ✏ Edit
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete() }}
                  style={{ ...menuItemStyle, color: 'var(--red)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(180,40,40,0.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  🗑 Delete
                </button>
                {!isOwn && isAdmin && (
                  <p style={{
                    fontSize: 10, color: 'var(--text-muted)',
                    margin: '4px 8px 2px', fontStyle: 'italic',
                  }}>
                    Acting as admin
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body — text or inline editor */}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={editBody}
            onChange={e => setEditBody(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void saveEdit() }
              if (e.key === 'Escape') { setEditing(false); setEditBody(post.body) }
            }}
            rows={4}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '12px 14px',
              border: `1px solid ${ORANGE}`, borderRadius: 10,
              fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit',
              resize: 'vertical', background: '#fff', color: 'var(--ink)',
              outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setEditing(false); setEditBody(post.body) }}
              style={ghostBtn}
            >
              Cancel
            </button>
            <button
              onClick={() => void saveEdit()}
              disabled={savingEdit || !editBody.trim() || editBody.trim() === post.body}
              style={{
                ...primaryBtn,
                background: savingEdit || !editBody.trim() || editBody.trim() === post.body ? 'var(--paper3)' : ORANGE,
                cursor: savingEdit || !editBody.trim() || editBody.trim() === post.body ? 'not-allowed' : 'pointer',
              }}
            >
              {savingEdit ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p style={{
          fontSize: 14, lineHeight: 1.7, color: 'var(--text-soft)',
          whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {post.body}
        </p>
      )}

      {/* Attachments */}
      {(post.video_url || post.audio_url || post.image_url || post.file_url) && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {post.video_url && (
            <video controls src={post.video_url} style={{ width: '100%', borderRadius: 10, background: '#000', maxHeight: 380 }} />
          )}
          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="" style={{ width: '100%', borderRadius: 10, maxHeight: 480, objectFit: 'cover' }} />
          )}
          {post.audio_url && (
            <audio controls src={post.audio_url} style={{ width: '100%', height: 36 }} />
          )}
          {post.file_url && (
            <a href={post.file_url} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--line-md)', background: '#fff',
              color: 'var(--ink)', textDecoration: 'none', fontSize: 13,
            }}>
              📎 <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {post.file_name ?? 'attachment'}
              </span>
              <span style={{ color: ORANGE, fontWeight: 600 }}>Download</span>
            </a>
          )}
        </div>
      )}

      {/* Reactions row + Reply toggle */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
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

        {/* Reactions the user picked from the extended palette that aren't
            in the always-visible quick row — render them inline so they
            stay clickable + countable without forcing the quick row to grow. */}
        {(post.reactions ?? [])
          .filter(r => !EMOJIS.includes(r.emoji))
          .map(r => (
            <button
              key={r.emoji}
              onClick={() => onReact(r.emoji)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, padding: '4px 10px', borderRadius: 999,
                border: `1px solid ${r.user_reacted ? ORANGE : 'var(--line-md)'}`,
                background: r.user_reacted ? ORANGE_PALE : 'transparent',
                color: r.user_reacted ? ORANGE : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s',
              }}
            >
              <span>{r.emoji}</span>
              {r.count > 0 && <span style={{ fontSize: 11, fontWeight: 600 }}>{r.count}</span>}
            </button>
          ))}

        {/* Extended emoji picker */}
        <EmojiPickerPopover activeEmojis={userReacted} onPick={onReact} />

        {/* Reply toggle pushed to the right */}
        <button
          onClick={() => setShowThread(s => !s)}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, padding: '5px 12px', borderRadius: 999,
            border: `1px solid ${showThread ? ORANGE : 'var(--line-md)'}`,
            background: showThread ? ORANGE_PALE : 'transparent',
            color: showThread ? ORANGE : 'var(--text-soft)',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
            transition: 'all .15s',
          }}
        >
          <span style={{ fontSize: 13 }}>💬</span>
          {commentCount > 0
            ? `${commentCount} ${commentCount === 1 ? 'reply' : 'replies'}`
            : 'Reply'}
          <span style={{ fontSize: 10, marginLeft: 2 }}>{showThread ? '▴' : '▾'}</span>
        </button>
      </div>

      {/* Inline thread — lazy-mounted on first expand */}
      {showThread && (
        <CommentThread
          postId={post.id}
          userId={currentUserId}
          isAdmin={isAdmin}
          onCountChange={setCommentCount}
        />
      )}
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

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%',
  padding: '8px 12px', borderRadius: 6,
  border: 'none', background: 'transparent',
  color: 'var(--ink)',
  fontSize: 13, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
  textAlign: 'left',
  transition: 'background 0.12s',
}

