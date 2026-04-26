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
  getCurrentWeekNumber,
  getWeekContent,
  type PartnerMessage,
} from '@/lib/circle'

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
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
  const [weekPrompt, setWeekPrompt] = useState<string>('')
  const [weekNumber, setWeekNumber] = useState<number | null>(null)
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }

    (async () => {
      const member = await getMyCircleMember()
      if (!member || !member.partner_id) { setHydrating(false); return }
      setCohortId(member.cohort_id)

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

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)

    if (!partnerUserId || !cohortId) { setSending(false); return }
    const ok = await sendPartnerMessage(partnerUserId, cohortId, body.trim())
    if (ok) {
      setBody('')
      const msgs = await getPartnerThread(partnerUserId)
      setMessages(msgs)
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
        background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 40,
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
            Their 90-day focus
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            &ldquo;{partner.goal_90day}&rdquo;
          </p>
        </div>
      )}

      {/* Wednesday prompt */}
      {weekPrompt && weekNumber && (
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
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
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '6px 2px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--text-muted)', fontSize: 13,
          }}>
            No messages yet. Say hello to your partner.
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
                    <div>{msg.body}</div>
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

      {/* Compose */}
      <div style={{
        display: 'flex', gap: 8,
        padding: '12px 0 4px',
        borderTop: '1px solid var(--line)',
        flexShrink: 0,
      }}>
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
          disabled={sending || !body.trim()}
          style={{
            background: sending || !body.trim() ? 'var(--paper3)' : ORANGE,
            color: '#fff',
            border: 'none', borderRadius: 12,
            padding: '0 18px',
            fontSize: 14, fontWeight: 600,
            cursor: sending || !body.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          {sending ? '…' : 'Send'}
        </button>
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
