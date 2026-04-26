'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import { uploadCircleAttachment } from '@/lib/circle'
import AttachmentPicker, { type AttachmentSlots, type AttachmentSlot } from '@/components/circle/AttachmentPicker'

type CoachMessage = {
  id: string
  user_id: string
  sender_id: string
  body: string
  audio_url: string | null
  video_url: string | null
  image_url: string | null
  file_url:  string | null
  file_name: string | null
  created_at: string
  read_at: string | null
}

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

export default function CoachChatPage() {
  const router = useRouter()
  const { loading, isAuthed, user } = useApp()

  const [messages, setMessages] = useState<CoachMessage[]>([])
  const [body, setBody]         = useState('')
  const [myUserId, setMyUserId] = useState<string>('')
  const [hydrating, setHydrating] = useState(true)
  const [sending, setSending]   = useState(false)
  const [attachments, setAttachments] = useState<AttachmentSlots>({ audio: null, video: null, image: null, doc: null })
  const [showPicker, setShowPicker]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  function setSlot(slot: AttachmentSlot, file: File | null) {
    setAttachments(prev => ({ ...prev, [slot]: file }))
  }
  function clearAttachments() {
    setAttachments({ audio: null, video: null, image: null, doc: null })
  }
  const hasAttachment = !!(attachments.audio || attachments.video || attachments.image || attachments.doc)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }

    (async () => {
      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      if (!authUser) { setHydrating(false); return }
      setMyUserId(authUser.id)

      const { data: msgs } = await supabaseClient
        .from('circle_coach_messages')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true })

      setMessages((msgs ?? []) as CoachMessage[])
      setHydrating(false)
    })()
  }, [loading, isAuthed, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if ((!body.trim() && !hasAttachment) || !myUserId) return
    setSending(true)

    const urls: { audio_url?: string | null; video_url?: string | null; image_url?: string | null; file_url?: string | null; file_name?: string | null } = {}
    if (attachments.audio) urls.audio_url = await uploadCircleAttachment(attachments.audio)
    if (attachments.video) urls.video_url = await uploadCircleAttachment(attachments.video)
    if (attachments.image) urls.image_url = await uploadCircleAttachment(attachments.image)
    if (attachments.doc)  { urls.file_url = await uploadCircleAttachment(attachments.doc); urls.file_name = attachments.doc.name }

    const { data, error } = await supabaseClient
      .from('circle_coach_messages')
      .insert({
        user_id: myUserId,    // member's own thread
        sender_id: myUserId,  // member is sending
        body: body.trim(),
        ...urls,
      })
      .select()
      .single()
    setSending(false)
    if (error || !data) return
    setMessages(prev => [...prev, data as CoachMessage])
    setBody('')
    clearAttachments()
    setShowPicker(false)
  }

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
  }

  const firstName = user.name?.split(' ')[0] ?? ''

  return (
    <div
      className="portal-full-bleed"
      style={{ background: ORANGE_PALE, minHeight: 'calc(100vh - 60px)', padding: '36px 24px' }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 6px' }}>
            The Circle · Coach chat
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, color: 'var(--ink)', margin: 0 }}>
            Direct line to your coach{firstName ? `, ${firstName}` : ''}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: '6px 0 0' }}>
            One-on-one. Anything you want her to see lives here.
          </p>
        </div>

        {/* Thread */}
        <div style={{
          background: '#fff', border: '1px solid var(--line)', borderRadius: 14,
          padding: 18, minHeight: 280,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 0' }}>
              No messages yet. Send the first one when you’re ready.
            </div>
          ) : (
            messages.map(m => {
              const isMe = m.sender_id === myUserId
              return (
                <div key={m.id} style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                }}>
                  <div style={{
                    maxWidth: '78%',
                    background: isMe ? ORANGE : ORANGE_PALE,
                    color: isMe ? '#fff' : 'var(--ink)',
                    border: isMe ? 'none' : '1px solid var(--line)',
                    borderRadius: 14,
                    padding: '10px 14px',
                    fontSize: 14,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {!isMe && (
                      <div style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '.1em',
                        textTransform: 'uppercase', color: ORANGE, marginBottom: 4,
                      }}>
                        Coach
                      </div>
                    )}
                    {m.body && <div>{m.body}</div>}
                    {(m.video_url || m.image_url || m.audio_url || m.file_url) && (
                      <div style={{ marginTop: m.body ? 8 : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {m.video_url && <video controls src={m.video_url} style={{ width: '100%', maxWidth: 320, borderRadius: 10, background: '#000' }} />}
                        {m.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.image_url} alt="" style={{ width: '100%', maxWidth: 320, borderRadius: 10, objectFit: 'cover' }} />
                        )}
                        {m.audio_url && <audio controls src={m.audio_url} style={{ width: 260, height: 32 }} />}
                        {m.file_url && (
                          <a href={m.file_url} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 10px', borderRadius: 8,
                            background: isMe ? 'rgba(255,255,255,0.15)' : '#fff',
                            color: isMe ? '#fff' : 'var(--ink)',
                            border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--line-md)',
                            textDecoration: 'none', fontSize: 12,
                          }}>
                            📎 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                              {m.file_name ?? 'attachment'}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                    <div style={{
                      fontSize: 10, opacity: 0.65, marginTop: 6, textAlign: 'right',
                    }}>
                      {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write to your coach…"
            style={{
              width: '100%', minHeight: 80, resize: 'vertical',
              border: '1px solid var(--line-md)', borderRadius: 10,
              padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box', background: '#fff',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
          />

          {(showPicker || hasAttachment) && (
            <AttachmentPicker slots={attachments} onChange={setSlot} />
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowPicker(s => !s)}
              style={{
                background: showPicker ? ORANGE_PALE : 'transparent',
                border: `1px solid ${showPicker ? ORANGE : 'var(--line-md)'}`,
                color: showPicker ? ORANGE : 'var(--text-soft)',
                borderRadius: 10, padding: '6px 12px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Attach
            </button>
            <button
              onClick={handleSend}
              disabled={(!body.trim() && !hasAttachment) || sending}
              style={{
                background: (body.trim() || hasAttachment) ? ORANGE : 'var(--paper3)',
                color: '#fff', padding: '8px 18px', borderRadius: 10,
                fontSize: 13, fontWeight: 600, border: 'none',
                cursor: (body.trim() || hasAttachment) ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
