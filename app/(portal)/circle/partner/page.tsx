'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import {
  getMyCircleMember,
  getMyPartner,
  getPartnerThread,
  sendPartnerMessage,
  markPartnerCheckinSent,
  getCurrentWeekNumber,
  getWeekContent,
  uploadCircleAttachment,
  getCohortPostsByAuthor,
  getPastPartnerThreads,
  ARCHETYPE_COLOR,
  type PartnerMessage,
  type CohortFeedPost,
  type PastThreadSummary,
} from '@/lib/circle'
import AttachmentPicker, { type AttachmentSlots, type AttachmentSlot } from '@/components/circle/AttachmentPicker'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

export default function PartnerPage() {
  const router = useRouter()
  const { loading, isAuthed, user } = useApp()

  const [messages, setMessages]   = useState<PartnerMessage[]>([])
  const [partner, setPartner]     = useState<any>(null)
  const [myUserId, setMyUserId]   = useState<string>('')
  const [partnerUserId, setPartnerUserId] = useState<string>('')
  const [cohortId, setCohortId]   = useState<string>('')
  const [memberId, setMemberId]   = useState<string>('')
  const [weekPrompt, setWeekPrompt] = useState<string>('')
  const [weekNumber, setWeekNumber] = useState<number | null>(null)
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [attachments, setAttachments] = useState<AttachmentSlots>({ audio: null, video: null, image: null, doc: null })
  const [showPicker, setShowPicker]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Tabs — Chat is the default. The other tabs lazy-load their data on
  // first switch so the page stays snappy even with a heavy posts feed.
  type Tab = 'chat' | 'wins' | 'posts' | 'past'
  const [tab, setTab] = useState<Tab>('chat')
  const [winsPosts, setWinsPosts]   = useState<CohortFeedPost[] | null>(null)
  const [allPosts,  setAllPosts]    = useState<CohortFeedPost[] | null>(null)
  const [pastThreads, setPastThreads] = useState<PastThreadSummary[] | null>(null)
  // When the user opens a past thread we load it into here and show it
  // read-only inside the same panel; null returns them to the list.
  const [pastViewUserId,  setPastViewUserId]  = useState<string | null>(null)
  const [pastViewName,    setPastViewName]    = useState<string | null>(null)
  const [pastViewMessages, setPastViewMessages] = useState<PartnerMessage[]>([])

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
      const member = await getMyCircleMember()
      if (!member || !member.partner_id) { setHydrating(false); return }
      setCohortId(member.cohort_id)
      setMemberId(member.id)

      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      if (authUser) setMyUserId(authUser.id)

      const partnerData = await getMyPartner(member.partner_id)
      setPartner(partnerData)

      const { data: partnerMember } = await supabaseClient
        .from('circle_members')
        .select('user_id')
        .eq('id', member.partner_id)
        .maybeSingle()

      if (partnerMember) {
        setPartnerUserId(partnerMember.user_id)
        const msgs = await getPartnerThread(partnerMember.user_id)
        setMessages(msgs)
      }

      const { data: cohort } = await supabaseClient
        .from('circle_cohorts').select('starts_at').eq('id', member.cohort_id).maybeSingle()
      if (cohort) {
        const wn = getCurrentWeekNumber(cohort.starts_at)
        if (wn) {
          setWeekNumber(wn)
          const { universal } = await getWeekContent(wn, member.archetype, member.cohort_id)
          if (universal?.wednesday_prompt) setWeekPrompt(universal.wednesday_prompt)
        }
      }
      setHydrating(false)
    })()
  }, [loading, isAuthed, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Lazy-load per-tab data on first view.
  useEffect(() => {
    if (!cohortId || !partnerUserId) return
    if (tab === 'wins' && winsPosts === null) {
      void getCohortPostsByAuthor(cohortId, partnerUserId, 'wins', 30).then(setWinsPosts)
    }
    if (tab === 'posts' && allPosts === null) {
      void getCohortPostsByAuthor(cohortId, partnerUserId, null, 30).then(setAllPosts)
    }
    if (tab === 'past' && pastThreads === null) {
      void getPastPartnerThreads(partnerUserId).then(setPastThreads)
    }
  }, [tab, cohortId, partnerUserId, winsPosts, allPosts, pastThreads])

  async function openPastThread(userId: string, name: string | null) {
    setPastViewUserId(userId)
    setPastViewName(name)
    const msgs = await getPartnerThread(userId)
    setPastViewMessages(msgs)
  }
  function closePastThread() {
    setPastViewUserId(null)
    setPastViewName(null)
    setPastViewMessages([])
  }

  async function handleSend() {
    if (!body.trim() && !hasAttachment) return
    if (!partnerUserId || !cohortId) return
    setSending(true)

    const urls: { audio_url?: string | null; video_url?: string | null; image_url?: string | null; file_url?: string | null; file_name?: string | null } = {}
    if (attachments.audio) urls.audio_url = await uploadCircleAttachment(attachments.audio)
    if (attachments.video) urls.video_url = await uploadCircleAttachment(attachments.video)
    if (attachments.image) urls.image_url = await uploadCircleAttachment(attachments.image)
    if (attachments.doc)  { urls.file_url = await uploadCircleAttachment(attachments.doc); urls.file_name = attachments.doc.name }

    const ok = await sendPartnerMessage(partnerUserId, cohortId, body.trim(), urls)
    if (ok) {
      setBody('')
      clearAttachments()
      setShowPicker(false)
      const msgs = await getPartnerThread(partnerUserId)
      setMessages(msgs)
      // Sending any message this week counts as the weekly partner check-in.
      // Stamp the progress row so the Circle home card shows "Check-in done".
      if (memberId && weekNumber) {
        void markPartnerCheckinSent(memberId, weekNumber)
      }
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
  }

  if (!partner) {
    return (
      <div style={{
        maxWidth: 520, margin: '40px auto', textAlign: 'center',
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 40,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: ORANGE_PALE, color: ORANGE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', fontSize: 22,
        }}>✦</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300, color: 'var(--ink)', margin: '0 0 8px' }}>
          No partner yet
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
          Your accountability partner will appear here once the cohort fills up. We&apos;ll notify you the moment pairing happens.
        </p>
      </div>
    )
  }

  const partnerName = partner.users?.name ?? 'Partner'
  const myName = user.name || 'You'
  const lastByPartner = [...messages].reverse().find(m => m.sender_id !== myUserId)
  const daysSinceLast = lastByPartner
    ? Math.floor((Date.now() - new Date(lastByPartner.created_at).getTime()) / 86_400_000)
    : null

  // Group messages by day for date separators.
  const grouped: { date: string; items: PartnerMessage[] }[] = []
  for (const m of messages) {
    const d = new Date(m.created_at).toDateString()
    const last = grouped[grouped.length - 1]
    if (last && last.date === d) last.items.push(m)
    else grouped.push({ date: d, items: [m] })
  }

  return (
    <div
      className="partner-shell"
      style={{
        maxWidth: 720, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        minHeight: 500,
      }}
    >

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0', borderBottom: '1px solid var(--line)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: ORANGE, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 700, flexShrink: 0,
        }}>
          {partnerName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{partnerName}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Accountability partner · {ARCHETYPE_LABELS[partner.archetype] ?? 'Partner'}
          </p>
        </div>
        {daysSinceLast !== null && daysSinceLast > 5 && (
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--red)', background: 'var(--red-pale)',
            padding: '4px 10px', borderRadius: 999,
          }}>
            Quiet {daysSinceLast}d
          </span>
        )}
      </div>

      {/* Partner focus snapshot */}
      {partner.goal_90day && (
        <div style={{
          background: ORANGE_PALE, border: `1px solid ${ORANGE}`,
          borderRadius: 12, padding: 12,
          margin: '14px 0 6px',
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: ORANGE, margin: '0 0 4px',
          }}>
            Their 12-week focus
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            &ldquo;{partner.goal_90day}&rdquo;
          </p>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginTop: 14,
        borderBottom: '1px solid var(--line)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {([
          { id: 'chat',  label: 'Chat' },
          { id: 'wins',  label: 'Their wins' },
          { id: 'posts', label: 'Their posts' },
          { id: 'past',  label: 'Past chats' },
        ] as { id: Tab; label: string }[]).map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 14px',
                marginBottom: -1,
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                fontFamily: 'var(--font-body)',
                color: active ? ORANGE : 'var(--text-muted)',
                borderBottom: `2px solid ${active ? ORANGE : 'transparent'}`,
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Wednesday prompt — only visible under the Chat tab. */}
      {tab === 'chat' && weekPrompt && weekNumber && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderRadius: 12, padding: 14,
          margin: '6px 0 10px',
          flexShrink: 0,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--text-muted)', margin: '0 0 6px',
          }}>
            Week {weekNumber} · Wednesday prompt
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
            {weekPrompt}
          </p>
          <Link href={`/circle/week/${weekNumber}`} style={{ textDecoration: 'none' }}>
            <button style={{
              marginTop: 10,
              background: 'transparent', border: `1px solid ${ORANGE}`,
              color: ORANGE,
              padding: '5px 12px', borderRadius: 8,
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Open week →
            </button>
          </Link>
        </div>
      )}

      {/* Messages */}
      {tab === 'chat' && (
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '6px 2px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {messages.length === 0 && (
          <div style={{ padding: '24px 4px 16px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: ORANGE_PALE, color: ORANGE,
                margin: '0 auto 12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                ✦
              </div>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18, fontWeight: 300, fontStyle: 'italic',
                color: 'var(--ink)',
                margin: '0 0 6px',
              }}>
                Say hello to {partner.full_name?.split(/\s+/)[0] ?? 'your partner'}.
              </p>
              <p style={{
                fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6,
                margin: 0,
              }}>
                You&apos;re paired for these 12 weeks. Show up however you can — even a quick check-in counts.
              </p>
            </div>

            {/* Icebreakers */}
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
              textTransform: 'uppercase', color: 'var(--text-muted)',
              marginBottom: 10, textAlign: 'center',
            }}>
              Tap an icebreaker to start
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 8,
            }}>
              {[
                `Hey${partner.full_name?.split(/\s+/)[0] ? ` ${partner.full_name?.split(/\s+/)[0]}` : ''} — excited we got matched. Where are you tuning in from?`,
                "What pulled you toward The Circle? I'd love to know your why.",
                "How's your week landing? I'll go first if it helps.",
                "I'm working on this right now — any thoughts?",
              ].map(starter => (
                <button
                  key={starter}
                  onClick={() => setBody(starter)}
                  style={{
                    textAlign: 'left',
                    background: '#fff', border: '1px solid var(--line)',
                    borderRadius: 10, padding: '10px 12px',
                    fontSize: 12, color: 'var(--ink)', lineHeight: 1.5,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = ORANGE_PALE
                    e.currentTarget.style.borderColor = ORANGE
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#fff'
                    e.currentTarget.style.borderColor = 'var(--line)'
                  }}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}
        {grouped.map(g => (
          <div key={g.date} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              alignSelf: 'center',
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '6px 0',
            }}>
              {dayLabel(g.date)}
            </div>
            {g.items.map(msg => {
              const isMe = msg.sender_id === myUserId
              return (
                <div key={msg.id} style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  padding: '0 2px',
                }}>
                  <div style={{
                    maxWidth: '75%',
                    padding: '10px 14px',
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 4,
                    fontSize: 14, lineHeight: 1.5,
                    background: isMe ? ORANGE : 'var(--paper2)',
                    color: isMe ? '#fff' : 'var(--ink)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.body && <div>{msg.body}</div>}
                    {(msg.video_url || msg.image_url || msg.audio_url || msg.file_url) && (
                      <div style={{ marginTop: msg.body ? 8 : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {msg.video_url && (
                          <video controls src={msg.video_url} style={{ width: '100%', maxWidth: 320, borderRadius: 10, background: '#000' }} />
                        )}
                        {msg.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={msg.image_url} alt="" style={{ width: '100%', maxWidth: 320, borderRadius: 10, objectFit: 'cover' }} />
                        )}
                        {msg.audio_url && (
                          <audio controls src={msg.audio_url} style={{ width: 260, height: 32 }} />
                        )}
                        {msg.file_url && (
                          <a href={msg.file_url} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 10px', borderRadius: 8,
                            background: isMe ? 'rgba(255,255,255,0.15)' : '#fff',
                            color: isMe ? '#fff' : 'var(--ink)',
                            border: isMe ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--line-md)',
                            textDecoration: 'none', fontSize: 12,
                          }}>
                            📎 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                              {msg.file_name ?? 'attachment'}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                    <div style={{
                      fontSize: 10,
                      marginTop: 4,
                      color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit',
                      })}
                      {isMe && msg.read_at && ' · Seen'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      )}

      {/* Compose */}
      {tab === 'chat' && (
      <div style={{
        padding: '12px 0 4px',
        borderTop: '1px solid var(--line)',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {(showPicker || hasAttachment) && (
          <AttachmentPicker compact slots={attachments} onChange={setSlot} />
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowPicker(s => !s)}
            title="Add attachment"
            style={{
              background: showPicker ? ORANGE_PALE : '#fff',
              border: `1px solid ${showPicker ? ORANGE : 'var(--line-md)'}`,
              color: showPicker ? ORANGE : 'var(--text-soft)',
              borderRadius: 12,
              padding: '0 14px',
              fontSize: 16,
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >
            +
          </button>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${partnerName.split(' ')[0]}…`}
            rows={2}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid var(--line-md)',
              borderRadius: 12,
              fontSize: 14, lineHeight: 1.5,
              fontFamily: 'inherit',
              resize: 'none',
              background: '#fff', color: 'var(--ink)',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
          />
          <button
            onClick={handleSend}
            disabled={sending || (!body.trim() && !hasAttachment)}
            style={{
              background: sending || (!body.trim() && !hasAttachment) ? 'var(--paper3)' : ORANGE,
              color: '#fff',
              border: 'none', borderRadius: 12,
              padding: '0 18px',
              fontSize: 14, fontWeight: 600,
              cursor: sending || (!body.trim() && !hasAttachment) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
      )}

      {/* Their wins */}
      {tab === 'wins' && (
        <ActivityList
          loading={winsPosts === null}
          posts={winsPosts ?? []}
          emptyLabel={`${partnerName.split(/\s+/)[0]} hasn’t posted any wins yet this cohort.`}
        />
      )}

      {/* Their posts */}
      {tab === 'posts' && (
        <ActivityList
          loading={allPosts === null}
          posts={allPosts ?? []}
          emptyLabel={`Nothing from ${partnerName.split(/\s+/)[0]} in the cohort feed yet.`}
        />
      )}

      {/* Past chats */}
      {tab === 'past' && (
        pastViewUserId ? (
          <PastThreadView
            name={pastViewName}
            messages={pastViewMessages}
            myUserId={myUserId}
            onBack={closePastThread}
          />
        ) : (
          <PastThreadList
            loading={pastThreads === null}
            threads={pastThreads ?? []}
            onOpen={openPastThread}
          />
        )
      )}
    </div>
  )
}

// ── Activity list (Their wins / Their posts) ─────────────────────────────

function ActivityList({
  loading, posts, emptyLabel,
}: {
  loading: boolean
  posts: CohortFeedPost[]
  emptyLabel: string
}) {
  if (loading) {
    return <p style={{ padding: '24px 4px', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
  }
  if (posts.length === 0) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 12, marginTop: 14,
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          {emptyLabel}
        </p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, paddingBottom: 24 }}>
      {posts.map(p => <ActivityCard key={p.id} post={p} />)}
    </div>
  )
}

function ActivityCard({ post }: { post: CohortFeedPost }) {
  const typeLabel = TYPE_LABELS[post.post_type] ?? post.post_type
  const archColor = post.author_archetype ? ARCHETYPE_COLOR[post.author_archetype] : '#3a3a3a'
  return (
    <article style={{
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderLeft: `3px solid ${archColor}`,
      borderRadius: 12, padding: '14px 16px',
    }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        marginBottom: 6, flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: ORANGE,
          fontFamily: 'var(--font-body)',
        }}>
          {typeLabel}
        </span>
        {post.week_number != null && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            Week {post.week_number}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
          {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </header>
      {post.body && (
        <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
      )}
      {(post.reactions?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {post.reactions!.map(r => (
            <span key={r.emoji} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 999,
              background: 'var(--paper)', border: '1px solid var(--line)',
              fontSize: 11, color: 'var(--text-soft)',
            }}>
              <span>{r.emoji}</span><span>{r.count}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

const TYPE_LABELS: Record<string, string> = {
  wins:           'Win',
  monday_prompt:  'Prompt response',
  partner_checkin: 'Partner check-in',
  general:        'Post',
  coach_note:     'Coach note',
}

// ── Past chats ───────────────────────────────────────────────────────────

function PastThreadList({
  loading, threads, onOpen,
}: {
  loading: boolean
  threads: PastThreadSummary[]
  onOpen: (userId: string, name: string | null) => void
}) {
  if (loading) {
    return <p style={{ padding: '24px 4px', fontSize: 13, color: 'var(--text-muted)' }}>Loading past chats…</p>
  }
  if (threads.length === 0) {
    return (
      <div style={{
        padding: '32px 20px', textAlign: 'center',
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 12, marginTop: 14,
      }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          No past chats yet. If you&apos;re ever re-paired, the previous conversations will live here.
        </p>
      </div>
    )
  }
  return (
    <ul style={{
      listStyle: 'none', padding: 0, margin: '14px 0 24px',
      border: '1px solid var(--line)', borderRadius: 12,
      overflow: 'hidden', background: 'var(--card)',
    }}>
      {threads.map((t, i) => {
        const name = t.name ?? 'Member'
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s.charAt(0).toUpperCase()).join('') || '·'
        const archColor = t.archetype ? ARCHETYPE_COLOR[t.archetype] : '#3a3a3a'
        return (
          <li key={t.user_id} style={{ borderBottom: i < threads.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <button
              onClick={() => onOpen(t.user_id, t.name)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '12px 14px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = ORANGE_PALE }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: archColor, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(t.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p style={{
                  fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.last_message_preview}
                </p>
              </div>
              {t.unread_count > 0 && (
                <span style={{
                  flexShrink: 0,
                  background: ORANGE, color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  padding: '2px 7px', borderRadius: 999,
                  fontFamily: 'var(--font-body)',
                }}>
                  {t.unread_count}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PastThreadView({
  name, messages, myUserId, onBack,
}: {
  name: string | null
  messages: PartnerMessage[]
  myUserId: string
  onBack: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14, marginBottom: 24 }}>
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 12,
          padding: '0 0 8px', fontFamily: 'inherit',
        }}
      >
        ← Back to past chats
      </button>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>
        Read-only thread with {name ?? 'a past partner'}.
      </p>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 12, padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 6,
        maxHeight: '60vh', overflowY: 'auto',
      }}>
        {messages.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>No messages.</p>
        ) : messages.map(msg => {
          const isMe = msg.sender_id === myUserId
          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
            }}>
              <div style={{
                maxWidth: '75%',
                padding: '8px 12px',
                borderRadius: 14,
                fontSize: 13, lineHeight: 1.5,
                background: isMe ? ORANGE : 'var(--paper2)',
                color: isMe ? '#fff' : 'var(--ink)',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.body}
                <div style={{
                  fontSize: 9, marginTop: 3,
                  color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                }}>
                  {new Date(msg.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const dd = new Date(d);    dd.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - dd.getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)   return d.toLocaleDateString('en-US', { weekday: 'long' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
