'use client'

// app/(portal)/inbox/page.tsx
// User-facing inbox. Merges Nicole's 1:1 DMs (circle_coach_messages) with
// path-targeted broadcast messages (admin_messages, inbox channel). Read-
// state lives in user_message_reads for broadcasts and in
// circle_coach_messages.read_at for DMs.

import { useEffect, useState } from 'react'
import {
  fetchUserInbox, markMessageRead,
  type InboxItem,
} from '@/lib/admin/hooks'
import { supabaseClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/Skeleton'

const GOLD = '#C8941F'

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchUserInbox().then(rows => {
      if (cancelled) return
      setItems(rows)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  async function open(item: InboxItem) {
    setOpenId(item.id)
    if (item.read_at) return
    // Optimistic: mark read locally, then persist.
    setItems(prev => prev.map(p => p.id === item.id ? { ...p, read_at: new Date().toISOString() } : p))
    if (item.source === 'broadcast') {
      void markMessageRead(item.id)
    } else {
      void supabaseClient
        .from('circle_coach_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', item.id)
    }
  }

  const openItem = items.find(i => i.id === openId) ?? null

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 26 }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: GOLD, margin: '0 0 6px',
        }}>
          From Nicole
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 300,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          Your inbox
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '6px 0 0', lineHeight: 1.6 }}>
          Notes from Nicole &mdash; announcements, encouragements, the occasional check-in.
        </p>
      </div>

      {loading ? (
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)',
          gap: 20, alignItems: 'flex-start',
        }} className="inbox-grid">
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                padding: '14px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                <Skeleton width="70%" height={12} />
                <Skeleton width="95%" height={10} />
                <Skeleton width="60%" height={10} />
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 20px' }}>
            <Skeleton width={120} height={10} style={{ marginBottom: 16 }} />
            <Skeleton width="80%" height={20} style={{ marginBottom: 14 }} />
            <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="92%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="78%" height={12} />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px dashed var(--line-md)',
          borderRadius: 10, padding: '40px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            No messages yet. Nicole will write here as the program unfolds.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)',
          gap: 20, alignItems: 'flex-start',
        }} className="inbox-grid">

          {/* Left — list */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10,
            overflow: 'hidden',
          }}>
            {items.map((item, i) => {
              const unread = !item.read_at
              const active = openId === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => open(item)}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 4,
                    padding: '14px 16px',
                    background: active ? 'rgba(200,148,31,0.06)' : '#fff',
                    border: 'none',
                    borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                    borderLeft: active ? `3px solid ${GOLD}` : '3px solid transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    {unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />}
                    <span style={{
                      fontSize: 13, fontWeight: unread ? 700 : 500,
                      color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      flex: 1, minWidth: 0,
                    }}>
                      {item.title ?? (item.source === 'coach' ? 'Message from Nicole' : 'Untitled')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {timeAgo(item.created_at)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: 'var(--text-soft)',
                    margin: 0, lineHeight: 1.5,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {item.body}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Right — detail */}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 10,
            padding: '18px 20px', minHeight: 240,
          }}>
            {openItem ? (
              <>
                <p style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: GOLD, margin: '0 0 10px',
                }}>
                  {openItem.source === 'coach' ? 'Direct message' : 'Note from Nicole'}
                  &nbsp;·&nbsp;
                  {new Date(openItem.created_at).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                </p>
                {openItem.title && (
                  <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300,
                    color: 'var(--ink)', margin: '0 0 16px', lineHeight: 1.25,
                  }}>
                    {openItem.title}
                  </h2>
                )}
                <p style={{
                  fontSize: 15, color: 'var(--ink)', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', margin: 0,
                }}>
                  {openItem.body}
                </p>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                Pick a message to read.
              </p>
            )}
          </div>

          <style>{`
            @media (max-width: 760px) {
              .inbox-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
