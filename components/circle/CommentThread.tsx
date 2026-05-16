'use client'

// components/circle/CommentThread.tsx
// Inline reply thread under a community post.
// - Lazy-loads on first expand (caller passes initial=null + opens it).
// - Shows existing replies with author, time, body, reactions.
// - Compose footer: textarea + emoji picker insert + Post.
// - Reactions on each reply: 5 inline emojis + extended popover.
// - Each user can delete their own reply.

import { useEffect, useState } from 'react'
import {
  getCommentsForPost,
  createComment,
  deleteComment,
  updateComment,
  toggleCommentReaction,
  type CircleComment,
} from '@/lib/circle'
import EmojiPickerPopover, { EXTENDED_EMOJIS } from './EmojiPickerPopover'
import GifPicker from './GifPicker'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'
const QUICK_EMOJIS = ['❤️', '🔥', '✨', '👏', '💪']

interface CommentThreadProps {
  postId: string
  /** Current user's id, for "delete own" / "edit own" affordances. */
  userId: string | null
  /** Admin override — admins can edit + delete any reply. */
  isAdmin?: boolean
  /** Called whenever the comment count changes (for the post-card label). */
  onCountChange?: (count: number) => void
}

export default function CommentThread({ postId, userId, isAdmin = false, onCountChange }: CommentThreadProps) {
  const [comments, setComments] = useState<CircleComment[]>([])
  const [loading, setLoading]   = useState(true)
  const [body, setBody]         = useState('')
  const [gifUrl, setGifUrl]     = useState<string | null>(null)
  const [posting, setPosting]   = useState(false)

  async function refresh() {
    const next = await getCommentsForPost(postId)
    setComments(next)
    onCountChange?.(next.length)
  }

  useEffect(() => {
    let cancel = false
    setLoading(true)
    getCommentsForPost(postId).then(next => {
      if (cancel) return
      setComments(next)
      setLoading(false)
      onCountChange?.(next.length)
    })
    return () => { cancel = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

  async function submit() {
    const trimmed = body.trim()
    if ((!trimmed && !gifUrl) || posting) return
    setPosting(true)
    const id = await createComment(postId, trimmed, gifUrl)
    setPosting(false)
    if (id) {
      setBody('')
      setGifUrl(null)
      await refresh()
    }
  }

  async function onReact(commentId: string, emoji: string) {
    await toggleCommentReaction(commentId, emoji)
    await refresh()
  }

  async function onDelete(commentId: string) {
    if (!confirm('Delete this reply?')) return
    const ok = await deleteComment(commentId)
    if (ok) await refresh()
  }

  async function onUpdate(commentId: string, body: string): Promise<boolean> {
    const ok = await updateComment(commentId, body)
    if (ok) await refresh()
    return ok
  }

  return (
    <div style={{
      marginTop: 14, paddingTop: 14,
      borderTop: '1px dashed var(--line-md)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Existing replies */}
      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Loading replies…</p>
      ) : comments.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
          No replies yet — be the first.
        </p>
      ) : (
        comments.map(c => (
          <CommentRow
            key={c.id}
            comment={c}
            isOwn={!!userId && c.author_id === userId}
            isAdmin={isAdmin}
            onReact={emoji => onReact(c.id, emoji)}
            onDelete={() => onDelete(c.id)}
            onUpdate={body => onUpdate(c.id, body)}
          />
        ))
      )}

      {/* Compose */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        background: 'var(--paper2)',
        borderRadius: 10, padding: 12,
      }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void submit()
            }
          }}
          placeholder="Write a reply…"
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 8, padding: '10px 12px',
            fontSize: 13, lineHeight: 1.6,
            fontFamily: 'inherit', color: 'var(--ink)',
            resize: 'vertical', outline: 'none',
            transition: 'border-color .15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
        />
        {/* GIF preview — shown after picking, with a remove button */}
        {gifUrl && (
          <div style={{
            position: 'relative',
            display: 'inline-block',
            border: '1px solid var(--line-md)', borderRadius: 8,
            overflow: 'hidden', alignSelf: 'flex-start',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gifUrl} alt="" style={{ display: 'block', maxHeight: 160, maxWidth: 240 }} />
            <button
              type="button"
              onClick={() => setGifUrl(null)}
              aria-label="Remove GIF"
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 22, height: 22, borderRadius: '50%',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <EmojiPickerPopover onPick={emoji => setBody(b => b + emoji)} />
          <GifPicker onPick={url => setGifUrl(url)} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>
            Tip: ⌘ Enter to post
          </span>
          <button
            onClick={() => void submit()}
            disabled={(!body.trim() && !gifUrl) || posting}
            style={{
              background: (!body.trim() && !gifUrl) || posting ? 'var(--paper3)' : ORANGE,
              color: (!body.trim() && !gifUrl) || posting ? 'var(--text-muted)' : '#fff',
              border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: 12, fontWeight: 600,
              cursor: (!body.trim() && !gifUrl) || posting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {posting ? 'Posting…' : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CommentRow({
  comment, isOwn, isAdmin, onReact, onDelete, onUpdate,
}: {
  comment: CircleComment
  isOwn: boolean
  isAdmin: boolean
  onReact: (emoji: string) => void
  onDelete: () => void
  onUpdate: (body: string) => Promise<boolean>
}) {
  const authorName = comment.author?.name ?? 'Member'
  const canManage  = isOwn || isAdmin
  const [editing, setEditing]       = useState(false)
  const [editBody, setEditBody]     = useState(comment.body)
  const [savingEdit, setSavingEdit] = useState(false)

  // The full set of emojis the user has already reacted with on this comment,
  // so the popover can highlight them too.
  const userReacted = (comment.reactions ?? [])
    .filter(r => r.user_reacted)
    .map(r => r.emoji)

  async function saveEdit() {
    const trimmed = editBody.trim()
    if (!trimmed || savingEdit) return
    setSavingEdit(true)
    const ok = await onUpdate(trimmed)
    setSavingEdit(false)
    if (ok) setEditing(false)
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      {comment.author?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={comment.author.avatar_url}
          alt=""
          style={{
            width: 28, height: 28, borderRadius: '50%',
            objectFit: 'cover', flexShrink: 0, display: 'block',
          }}
        />
      ) : (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: avatarColorFor(authorName),
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0,
        }}>
          {authorName.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
            {authorName}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {relativeTime(comment.created_at)}
            {comment.edited_at && (
              <span title={`Edited ${new Date(comment.edited_at).toLocaleString()}`} style={{ marginLeft: 4, fontStyle: 'italic' }}>
                · edited
              </span>
            )}
          </span>
          {canManage && !editing && (
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button
                onClick={() => { setEditBody(comment.body); setEditing(true) }}
                style={rowActionBtn}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = ORANGE }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                style={rowActionBtn}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
              >
                Delete
              </button>
            </span>
          )}
        </div>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '6px 0 8px' }}>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void saveEdit() }
                if (e.key === 'Escape') { setEditing(false); setEditBody(comment.body) }
              }}
              rows={2}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#fff',
                border: `1px solid ${ORANGE}`,
                borderRadius: 8, padding: '8px 10px',
                fontSize: 13, lineHeight: 1.6,
                fontFamily: 'inherit', color: 'var(--ink)',
                resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setEditing(false); setEditBody(comment.body) }}
                style={smallGhostBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => void saveEdit()}
                disabled={savingEdit || !editBody.trim() || editBody.trim() === comment.body}
                style={{
                  ...smallPrimaryBtn,
                  background: savingEdit || !editBody.trim() || editBody.trim() === comment.body ? 'var(--paper3)' : ORANGE,
                  color:      savingEdit || !editBody.trim() || editBody.trim() === comment.body ? 'var(--text-muted)' : '#fff',
                  cursor:     savingEdit || !editBody.trim() || editBody.trim() === comment.body ? 'not-allowed' : 'pointer',
                }}
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {comment.body && (
              <p style={{
                fontSize: 13, lineHeight: 1.6, color: 'var(--text-soft)',
                margin: '4px 0 8px', whiteSpace: 'pre-wrap',
              }}>
                {comment.body}
              </p>
            )}
            {comment.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.image_url}
                alt=""
                style={{
                  display: 'block', maxWidth: 320, maxHeight: 240,
                  borderRadius: 10, margin: comment.body ? '4px 0 8px' : '4px 0 8px',
                  border: '1px solid var(--line)',
                }}
              />
            )}
          </>
        )}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {QUICK_EMOJIS.map(e => {
            const r = comment.reactions?.find(rx => rx.emoji === e)
            const active = r?.user_reacted ?? false
            return (
              <button
                key={e}
                onClick={() => onReact(e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 12, padding: '2px 8px', borderRadius: 999,
                  border: `1px solid ${active ? ORANGE : 'var(--line-md)'}`,
                  background: active ? ORANGE_PALE : 'transparent',
                  color: active ? ORANGE : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .12s',
                }}
              >
                <span>{e}</span>
                {r && r.count > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 600 }}>{r.count}</span>
                )}
              </button>
            )
          })}
          {/* Other emojis the user reacted with that aren't in the quick row */}
          {(comment.reactions ?? [])
            .filter(r => !QUICK_EMOJIS.includes(r.emoji))
            .map(r => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 12, padding: '2px 8px', borderRadius: 999,
                  border: `1px solid ${r.user_reacted ? ORANGE : 'var(--line-md)'}`,
                  background: r.user_reacted ? ORANGE_PALE : 'transparent',
                  color: r.user_reacted ? ORANGE : 'var(--text-muted)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span>{r.emoji}</span>
                {r.count > 0 && <span style={{ fontSize: 10, fontWeight: 600 }}>{r.count}</span>}
              </button>
            ))}
          <EmojiPickerPopover activeEmojis={userReacted} onPick={onReact} />
        </div>
      </div>
    </div>
  )
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

const rowActionBtn: React.CSSProperties = {
  background: 'transparent', border: 'none',
  color: 'var(--text-muted)', fontSize: 10, cursor: 'pointer',
  fontFamily: 'inherit', padding: 0,
  transition: 'color 0.12s',
}

const smallGhostBtn: React.CSSProperties = {
  background: '#fff', border: '1px solid var(--line-md)',
  color: 'var(--text-soft)',
  padding: '5px 12px', borderRadius: 7,
  fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}

const smallPrimaryBtn: React.CSSProperties = {
  background: '#B8862E', color: '#fff',
  border: 'none', borderRadius: 7,
  padding: '5px 14px', fontSize: 11, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
}

// Keep the export so callers can import the curated set if they want to
// match the picker's list elsewhere.
export { EXTENDED_EMOJIS }
