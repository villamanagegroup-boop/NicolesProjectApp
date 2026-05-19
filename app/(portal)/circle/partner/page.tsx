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
  togglePartnerMessageReaction,
  markPartnerCheckinSent,
  getMyProgress,
  getCurrentWeekNumber,
  getWeekContent,
  uploadCircleAttachment,
  getCohortPostsByAuthor,
  getPastPartnerThreads,
  ARCHETYPE_COLOR,
  type PartnerMessage,
  type CohortFeedPost,
  type PastThreadSummary,
  type MemberProgress,
} from '@/lib/circle'
import AttachmentPicker, { type AttachmentSlots, type AttachmentSlot } from '@/components/circle/AttachmentPicker'
import EmojiPickerPopover, { EXTENDED_EMOJIS } from '@/components/circle/EmojiPickerPopover'
import GifPicker from '@/components/circle/GifPicker'

// Quick-react row shown on message hover.
const QUICK_REACTIONS = ['❤️', '🔥', '👏', '🙌', '😂']

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

type SupportType = 'witness' | 'reflection' | 'honest_feedback' | 'question' | 'accountability'

const SUPPORT_OPTIONS: { value: SupportType; emoji: string; label: string; sub: string }[] = [
  { value: 'witness',         emoji: '🤝', label: 'Witness',          sub: 'Just hear me, no response needed.' },
  { value: 'reflection',      emoji: '🔁', label: 'Reflection',       sub: 'Tell me what you hear me saying.' },
  { value: 'honest_feedback', emoji: '💬', label: 'Honest feedback',  sub: 'Tell me what you actually think.' },
  { value: 'question',        emoji: '❓', label: 'A question',        sub: 'Ask me something that helps me think.' },
  { value: 'accountability',  emoji: '✓',  label: 'Accountability',   sub: 'Check if I did the thing.' },
]

function supportLabel(t: SupportType): string {
  const o = SUPPORT_OPTIONS.find(x => x.value === t)
  return o ? `${o.emoji} ${o.label}` : t
}

export default function PartnerPage() {
  const router = useRouter()
  const { loading, isAuthed, user, avatarUrl: myAvatarUrl } = useApp()

  const [messages, setMessages]   = useState<PartnerMessage[]>([])
  const [partner, setPartner]     = useState<any>(null)
  const [myUserId, setMyUserId]   = useState<string>('')
  const [partnerUserId, setPartnerUserId] = useState<string>('')
  const [cohortId, setCohortId]   = useState<string>('')
  const [memberId, setMemberId]   = useState<string>('')
  const [weekPrompt, setWeekPrompt] = useState<string>('')
  const [weekNumber, setWeekNumber] = useState<number | null>(null)
  /** Whether the user has already sent this week's Wednesday partner check-in. */
  const [checkinDone, setCheckinDone] = useState(false)

  // First-conversation overlay (Phase 2 — migration 031). Stays shown until
  // the member clicks "Start the conversation →", which writes
  // partner_thread_opened = true and seeds the composer.
  const [partnerThreadOpened, setPartnerThreadOpened] = useState(true)

  // Wednesday check-in selector (Phase 2 — partner_checkin_preferences).
  // mySupport is the caller's selection for the current week; partnerSupport
  // is whatever the partner has chosen (or null if they haven't yet).
  const [mySupport, setMySupport] = useState<SupportType | null>(null)
  const [partnerSupport, setPartnerSupport] = useState<SupportType | null>(null)
  const [freeNote, setFreeNote] = useState('')
  const [savingPref, setSavingPref] = useState(false)
  const [partnerMemberId, setPartnerMemberId] = useState<string>('')
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [attachments, setAttachments] = useState<AttachmentSlots>({ audio: null, video: null, image: null, doc: null })
  const [showPicker, setShowPicker]   = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  /** GIF URL staged in compose. Sent as image_url on next send. */
  const [pendingGifUrl, setPendingGifUrl] = useState<string | null>(null)
  /** Message currently being hovered — drives the hover action bar. */
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
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
  const hasAttachment = !!(attachments.audio || attachments.video || attachments.image || attachments.doc) || !!pendingGifUrl

  function insertEmojiAtCursor(emoji: string) {
    const ta = textareaRef.current
    if (!ta) { setBody(b => b + emoji); return }
    const start = ta.selectionStart ?? body.length
    const end   = ta.selectionEnd   ?? body.length
    const next  = body.slice(0, start) + emoji + body.slice(end)
    setBody(next)
    // Restore caret position after the inserted emoji on next tick.
    requestAnimationFrame(() => {
      ta.focus()
      const caret = start + emoji.length
      ta.setSelectionRange(caret, caret)
    })
  }

  async function handleReact(messageId: string, emoji: string) {
    await togglePartnerMessageReaction(messageId, emoji)
    if (partnerUserId) {
      const msgs = await getPartnerThread(partnerUserId)
      setMessages(msgs)
    }
  }

  // Dismiss the first-conversation overlay. Flip the DB flag, seed the
  // composer with a starter line so the member doesn't stare at a blank
  // textarea, focus it. If the DB update fails we still dismiss so a
  // transient error doesn't trap them on the overlay forever.
  async function dismissFirstConversation() {
    setPartnerThreadOpened(true)
    const firstName = (partner?.users?.name ?? '').split(' ')[0]
    const seed = `Hey${firstName ? ' ' + firstName : ''} — I just read through our first conversation guide. Here is my answer to Question 1: `
    setBody(seed)
    setTab('chat')
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) { ta.focus(); ta.setSelectionRange(seed.length, seed.length) }
    })
    if (memberId) {
      await supabaseClient
        .from('circle_members')
        .update({ partner_thread_opened: true })
        .eq('id', memberId)
    }
  }

  // Upsert my Wednesday support-type preference for the current week.
  // member_id + week_number is the unique key, so re-selecting overwrites.
  async function chooseSupport(next: SupportType) {
    if (!memberId || !weekNumber) return
    setMySupport(next)
    setSavingPref(true)
    await supabaseClient
      .from('partner_checkin_preferences')
      .upsert(
        { member_id: memberId, week_number: weekNumber, support_type: next, free_note: freeNote || null },
        { onConflict: 'member_id,week_number' },
      )
    setSavingPref(false)
  }

  // Save the free-space note alongside the existing selection. No-op if
  // they haven't picked a support type yet — the row needs support_type
  // to satisfy NOT NULL.
  async function saveFreeNote(text: string) {
    setFreeNote(text)
    if (!memberId || !weekNumber || !mySupport) return
    await supabaseClient
      .from('partner_checkin_preferences')
      .upsert(
        { member_id: memberId, week_number: weekNumber, support_type: mySupport, free_note: text || null },
        { onConflict: 'member_id,week_number' },
      )
  }

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }

    (async () => {
      const member = await getMyCircleMember()
      if (!member || !member.partner_id) { setHydrating(false); return }
      setCohortId(member.cohort_id)
      setMemberId(member.id)
      setPartnerMemberId(member.partner_id)

      // partner_thread_opened lives on the same row but isn't returned by
      // getMyCircleMember(); fetch it directly. Treats missing column /
      // unmigrated DB as "already opened" so the overlay never blocks.
      try {
        const { data: openedRow } = await supabaseClient
          .from('circle_members')
          .select('partner_thread_opened')
          .eq('id', member.id)
          .maybeSingle()
        setPartnerThreadOpened(openedRow?.partner_thread_opened !== false)
      } catch { /* migration 031 not applied yet — overlay stays hidden */ }

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
          const [{ universal }, progressRows] = await Promise.all([
            getWeekContent(wn, member.archetype, member.cohort_id),
            getMyProgress(member.id),
          ])
          // Prefer the newer partner_prompt (migration 025) when set;
          // fall back to wednesday_prompt for weeks that haven't been
          // edited under the new field yet.
          setWeekPrompt(universal?.partner_prompt ?? universal?.wednesday_prompt ?? '')
          const weekProg = (progressRows as MemberProgress[]).find(p => p.week_number === wn)
          setCheckinDone(!!weekProg?.partner_checkin_sent_at)

          // Load this week's Wednesday support selections — both mine
          // and my partner's. RLS in 031 lets each side read the other.
          try {
            const { data: prefs } = await supabaseClient
              .from('partner_checkin_preferences')
              .select('member_id, support_type, free_note')
              .in('member_id', [member.id, member.partner_id])
              .eq('week_number', wn)
            const mine    = prefs?.find(r => r.member_id === member.id)
            const theirs  = prefs?.find(r => r.member_id === member.partner_id)
            if (mine) {
              setMySupport(mine.support_type as SupportType)
              setFreeNote(mine.free_note ?? '')
            }
            if (theirs) setPartnerSupport(theirs.support_type as SupportType)
          } catch { /* migration 031 not applied yet */ }
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
    // A staged GIF wins over a same-message file upload — both at once is ambiguous.
    if (pendingGifUrl && !urls.image_url) urls.image_url = pendingGifUrl

    const ok = await sendPartnerMessage(partnerUserId, cohortId, body.trim(), urls)
    if (ok) {
      setBody('')
      clearAttachments()
      setPendingGifUrl(null)
      setShowPicker(false)
      setShowEmojiPicker(false)
      const msgs = await getPartnerThread(partnerUserId)
      setMessages(msgs)
      // Sending any message this week counts as the weekly partner check-in.
      // Stamp the progress row so the Circle home card shows "Check-in done".
      if (memberId && weekNumber) {
        void markPartnerCheckinSent(memberId, weekNumber)
        setCheckinDone(true)
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
    <>
    {!partnerThreadOpened && (
      <FirstConversationOverlay
        partnerName={(partner.users?.name ?? 'your partner').split(' ')[0]}
        onStart={dismissFirstConversation}
      />
    )}
    <div
      className="partner-shell"
      style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', flexDirection: 'column',
        // Fill the viewport minus the portal chrome (topbar + padding + Circle
        // menu + page header) so the chat panel behaves like a real chat app.
        height: 'calc(100vh - 180px)',
        minHeight: 520,
      }}
    >

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 0', borderBottom: '1px solid var(--line)',
        flexShrink: 0,
      }}>
        {partner.users?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.users.avatar_url}
            alt=""
            style={{
              width: 44, height: 44, borderRadius: '50%',
              objectFit: 'cover', flexShrink: 0, display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: ORANGE, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, flexShrink: 0,
          }}>
            {partnerName.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{partnerName}</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Accountability partner · {ARCHETYPE_LABELS[partner.archetype] ?? 'Partner'}
          </p>
          {partner.goal_90day && (
            <p
              title={partner.goal_90day}
              style={{
                fontSize: 11, color: ORANGE, margin: '3px 0 0',
                fontStyle: 'italic', lineHeight: 1.4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 520,
              }}
            >
              <span style={{ fontWeight: 700, fontStyle: 'normal', marginRight: 6, letterSpacing: '0.04em' }}>
                12-WEEK FOCUS ·
              </span>
              &ldquo;{partner.goal_90day}&rdquo;
            </p>
          )}
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

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginTop: 14,
        borderBottom: '1px solid var(--line)',
        flexShrink: 0,
        flexWrap: 'wrap',
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

      {/* Wednesday check-in card — pinned above the messages.
          • On Wednesday: full card with prompt + support-type selector
            + partner's selection + free space.
          • Other days: collapsed prompt only.
          Spec: Phase 2 Task 3. */}
      {tab === 'chat' && weekPrompt && weekNumber && (
        <WeekCheckinCard
          weekNumber={weekNumber}
          prompt={weekPrompt}
          isWednesday={new Date().getDay() === 3}
          mySupport={mySupport}
          partnerSupport={partnerSupport}
          partnerName={(partner?.users?.name ?? 'Your partner').split(' ')[0]}
          freeNote={freeNote}
          saving={savingPref}
          onChoose={chooseSupport}
          onFreeNote={saveFreeNote}
        />
      )}

      {/* Messages */}
      {tab === 'chat' && (
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '10px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 12,
        marginTop: 8,
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
          <div key={g.date} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{
              alignSelf: 'center',
              fontSize: 10, fontWeight: 600,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '10px 0 6px',
            }}>
              {dayLabel(g.date)}
            </div>
            {g.items.map((msg, idx) => {
              const isMe = msg.sender_id === myUserId
              const prev = g.items[idx - 1]
              // Slack-style "burst": a follow-up message from the same sender
              // within 5 minutes collapses the avatar/name/timestamp header.
              const grouped = !!prev
                && prev.sender_id === msg.sender_id
                && (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 5 * 60_000
              const hovered = hoveredMsgId === msg.id
              const senderName = isMe ? myName : (partner.users?.name ?? 'Partner')
              const senderAvatar = isMe ? myAvatarUrl : (partner.users?.avatar_url ?? null)
              const initial = (senderName || '·').charAt(0).toUpperCase()
              const userReacted = (msg.reactions ?? []).filter(r => r.user_reacted).map(r => r.emoji)
              return (
                <div
                  key={msg.id}
                  onMouseEnter={() => setHoveredMsgId(msg.id)}
                  onMouseLeave={() => setHoveredMsgId(prev => prev === msg.id ? null : prev)}
                  style={{
                    display: 'flex',
                    flexDirection: isMe ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: grouped ? '2px 2px' : '8px 2px 2px',
                    position: 'relative',
                  }}
                >
                  {/* Avatar slot — visible only on first message of a burst */}
                  <div style={{ width: 32, flexShrink: 0 }}>
                    {!grouped && (
                      senderAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={senderAvatar}
                          alt=""
                          style={{
                            width: 32, height: 32, borderRadius: '50%',
                            objectFit: 'cover', display: 'block',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: isMe ? ORANGE : 'var(--paper3)',
                          color: isMe ? '#fff' : 'var(--text-soft)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                        }}>
                          {initial}
                        </div>
                      )
                    )}
                  </div>

                  <div style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    gap: 4,
                  }}>
                    {!grouped && (
                      <div style={{
                        display: 'flex', alignItems: 'baseline', gap: 8,
                        flexDirection: isMe ? 'row-reverse' : 'row',
                      }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                          {senderName}
                        </span>
                        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    <div style={{ position: 'relative', maxWidth: '78%' }}>
                      <div style={{
                        padding: msg.body ? '8px 13px' : '4px',
                        borderRadius: 14,
                        borderTopLeftRadius:  !grouped && !isMe ? 4 : 14,
                        borderTopRightRadius: !grouped && isMe  ? 4 : 14,
                        fontSize: 14, lineHeight: 1.5,
                        background: isMe ? ORANGE : 'var(--paper2)',
                        color: isMe ? '#fff' : 'var(--ink)',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {msg.body && <div>{msg.body}</div>}
                        {(msg.video_url || msg.image_url || msg.audio_url || msg.file_url) && (
                          <div style={{ marginTop: msg.body ? 8 : 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {msg.video_url && (
                              <video controls src={msg.video_url} style={{ width: '100%', maxWidth: 320, borderRadius: 10, background: '#000' }} />
                            )}
                            {msg.image_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={msg.image_url} alt="" style={{ width: '100%', maxWidth: 320, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
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
                      </div>

                      {/* Hover action bar — anchored to the bubble's top edge,
                          on the same outer side as the bubble so it never
                          drifts across the chat. */}
                      {hovered && (
                        <div style={{
                          position: 'absolute',
                          top: -16,
                          [isMe ? 'right' : 'left']: 0,
                          display: 'flex', alignItems: 'center', gap: 2,
                          background: '#fff',
                          border: '1px solid var(--line-md)',
                          borderRadius: 999,
                          padding: '2px 4px',
                          boxShadow: '0 4px 14px rgba(12,12,10,0.10)',
                          zIndex: 5,
                          whiteSpace: 'nowrap',
                        }}>
                          {QUICK_REACTIONS.map(emoji => {
                            const active = userReacted.includes(emoji)
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleReact(msg.id, emoji)}
                                title={`React with ${emoji}`}
                                style={{
                                  background: active ? ORANGE_PALE : 'transparent',
                                  border: 'none', borderRadius: 999,
                                  width: 26, height: 26, fontSize: 14,
                                  cursor: 'pointer', fontFamily: 'inherit',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'background .12s, transform .12s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.18)' }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                              >
                                {emoji}
                              </button>
                            )
                          })}
                          <EmojiPickerPopover
                            activeEmojis={userReacted}
                            align={isMe ? 'right' : 'left'}
                            onPick={emoji => handleReact(msg.id, emoji)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Reactions row — pills below the bubble */}
                    {(msg.reactions?.length ?? 0) > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {msg.reactions!.map(r => (
                          <button
                            key={r.emoji}
                            onClick={() => handleReact(msg.id, r.emoji)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '2px 8px', borderRadius: 999,
                              border: `1px solid ${r.user_reacted ? ORANGE : 'var(--line-md)'}`,
                              background: r.user_reacted ? ORANGE_PALE : '#fff',
                              color: r.user_reacted ? ORANGE : 'var(--text-soft)',
                              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'all .15s',
                            }}
                          >
                            <span>{r.emoji}</span>
                            <span style={{ fontSize: 11, fontWeight: 600 }}>{r.count}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isMe && idx === g.items.length - 1 && msg.read_at && (
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Seen</span>
                    )}
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
        {(showPicker || attachments.audio || attachments.video || attachments.image || attachments.doc) && (
          <AttachmentPicker compact slots={attachments} onChange={setSlot} />
        )}

        {/* Staged GIF preview */}
        {pendingGifUrl && (
          <div style={{
            display: 'inline-flex', alignItems: 'flex-start', gap: 8,
            padding: 6, borderRadius: 10,
            background: 'var(--paper2)', border: '1px solid var(--line)',
            alignSelf: 'flex-start',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingGifUrl} alt="GIF" style={{ width: 120, borderRadius: 6, display: 'block' }} />
            <button
              type="button"
              onClick={() => setPendingGifUrl(null)}
              aria-label="Remove GIF"
              style={{
                background: '#fff', border: '1px solid var(--line)',
                color: 'var(--text-muted)', borderRadius: 999,
                width: 22, height: 22, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit', lineHeight: 1,
              }}
            >×</button>
          </div>
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
            ref={textareaRef}
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

        {/* Compose toolbar — emoji + GIF triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4, position: 'relative' }}>
          {/* Emoji popover — floats above the trigger so the chat doesn't shift. */}
          {showEmojiPicker && (
            <div style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)', left: 0,
              zIndex: 50,
              background: '#fff',
              border: '1px solid var(--line-md)',
              borderRadius: 12,
              padding: 10,
              boxShadow: '0 10px 30px rgba(12,12,10,0.18)',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 36px)',
              gap: 4,
              width: 'fit-content',
            }}>
              {EXTENDED_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { insertEmojiAtCursor(emoji); setShowEmojiPicker(false) }}
                  style={{
                    fontSize: 18, padding: '4px 6px',
                    border: 'none', borderRadius: 6,
                    background: 'transparent', cursor: 'pointer',
                    lineHeight: 1, fontFamily: 'inherit',
                    transition: 'background .12s, transform .12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.18)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(s => !s)}
            title="Insert emoji"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, padding: '5px 11px', borderRadius: 999,
              border: `1px solid ${showEmojiPicker ? ORANGE : 'var(--line-md)'}`,
              background: showEmojiPicker ? ORANGE_PALE : '#fff',
              color: showEmojiPicker ? ORANGE : 'var(--text-soft)',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              transition: 'all .15s',
            }}
          >
            <span style={{ fontSize: 14 }}>😊</span>
            Emoji
          </button>
          <GifPicker onPick={url => { setPendingGifUrl(url) }} />
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
    </>
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
              {t.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.avatar_url}
                  alt=""
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    objectFit: 'cover', flexShrink: 0, display: 'block',
                  }}
                />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: archColor, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}>
                  {initials}
                </div>
              )}
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

// ── Wednesday check-in card ────────────────────────────────────────────────
// Pinned above the message thread. Shows the full selector + free space on
// Wednesdays; collapses to a small prompt card the rest of the week. The
// row in partner_checkin_preferences is keyed by (member_id, week_number),
// so each new week starts unselected automatically — no Sunday-reset job.

function WeekCheckinCard({
  weekNumber, prompt, isWednesday, mySupport, partnerSupport,
  partnerName, freeNote, saving, onChoose, onFreeNote,
}: {
  weekNumber: number
  prompt: string
  isWednesday: boolean
  mySupport: SupportType | null
  partnerSupport: SupportType | null
  partnerName: string
  freeNote: string
  saving: boolean
  onChoose: (t: SupportType) => void
  onFreeNote: (text: string) => void
}) {
  // Collapsed card on non-Wednesday days. Keeps the prompt visible all week
  // but doesn't take the screen real estate of the full selector.
  if (!isWednesday) {
    return (
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 12, padding: 12,
        margin: '6px 0 10px',
        flexShrink: 0,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px',
        }}>
          This week&apos;s check-in prompt · Week {weekNumber}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
          {prompt}
        </p>
      </div>
    )
  }

  // Wednesday expanded card.
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderLeft: `3px solid ${ORANGE}`,
      borderRadius: 12, padding: '14px 16px',
      margin: '6px 0 10px',
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: ORANGE, marginBottom: 8,
      }}>
        Wednesday check-in · Week {weekNumber}
      </div>

      {/* Section 1 — this week's prompt */}
      <blockquote style={{
        margin: '0 0 14px', padding: '10px 14px',
        background: ORANGE_PALE, borderRadius: 8,
        fontSize: 14, lineHeight: 1.65, color: 'var(--ink)',
        fontStyle: 'italic',
      }}>
        {prompt}
      </blockquote>

      {/* Section 2 — what I need this week */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
          What kind of support do you need from your partner this week?
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
          Your partner will see your selection.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {SUPPORT_OPTIONS.map(o => {
            const on = mySupport === o.value
            return (
              <button
                key={o.value}
                onClick={() => onChoose(o.value)}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '9px 12px', borderRadius: 9,
                  border: `1px solid ${on ? ORANGE : 'var(--line-md)'}`,
                  background: on ? ORANGE_PALE : '#fff',
                  cursor: saving ? 'wait' : 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', transition: 'all .15s',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{o.emoji}</span>
                <span style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-soft)' }}>
                  <strong style={{ color: 'var(--ink)', display: 'block' }}>{o.label}</strong>
                  {o.sub}
                </span>
              </button>
            )
          })}
        </div>

        {partnerSupport && (
          <div style={{
            marginTop: 10, padding: '8px 12px',
            background: 'var(--paper)', borderRadius: 8,
            fontSize: 12, color: 'var(--text-soft)',
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
          }}>
            <strong style={{ color: 'var(--ink)' }}>{partnerName}</strong> needs
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              background: `${ORANGE}20`, color: ORANGE, fontWeight: 600,
            }}>
              {supportLabel(partnerSupport)}
            </span>
            this week.
          </div>
        )}
      </div>

      {/* Section 3 — free space */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          Anything else on your mind this week?
        </div>
        <textarea
          value={freeNote}
          onChange={e => onFreeNote(e.target.value)}
          placeholder="A short note for your partner (optional)…"
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '8px 12px', borderRadius: 8,
            border: '1px solid var(--line-md)', background: '#fff',
            fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)',
            resize: 'vertical', minHeight: 60, outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

// ── First-conversation overlay ─────────────────────────────────────────────
// Full-screen scrollable cover shown on the member's first visit to the
// partner thread. Three question cards + closing text + "Start the
// conversation →" button that dismisses and seeds the composer.

function FirstConversationOverlay({
  partnerName, onStart,
}: { partnerName: string; onStart: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: ORANGE_PALE,
      overflowY: 'auto',
      padding: '40px 20px 80px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--text-muted)', margin: '0 0 10px',
        }}>
          The Circle · First conversation
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 300,
          color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1,
          margin: '0 0 16px',
        }}>
          Your first conversation.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '0 0 26px' }}>
          This guide is for your first real conversation with your accountability partner.
          You do not have to cover everything in one sitting — this can happen over a few
          messages or one voice note exchange. What matters is that you actually have it.
          <br /><br />
          These three questions are not small talk. They are the foundation of the
          partnership. The more honest you are here, the more useful this relationship
          will be for both of you over the next 90 days.
        </p>

        <QuestionCard
          label="Question 1 — The unsaid thing"
          prompt={
            <>
              Tell your partner one thing you have never said out loud about your pattern.
              Not your archetype description — you both already have that. Something
              specific. A moment, a cost, a version of yourself you have been carrying
              quietly.
              <br /><br />
              It does not have to be dramatic. It just has to be honest.
            </>
          }
          guidance={
            <>
              When your partner shares — do not fix it, advise it, or relate it back to
              yourself immediately. Just receive it. A simple &ldquo;thank you for telling
              me that&rdquo; is enough. You will have 90 days to go deeper. Right now your
              only job is to make this safe.
            </>
          }
        />

        <QuestionCard
          label="Question 2 — What support actually looks like"
          prompt={
            <>
              Tell your partner what support looks like for you — not what you think you
              should need, what you actually need.
              <br /><br />
              When you are struggling, do you want someone to:
              <ul style={{ margin: '8px 0 0 20px', padding: 0, lineHeight: 1.8 }}>
                <li>Ask questions that help you think it through?</li>
                <li>Reflect back what they hear without adding anything?</li>
                <li>Remind you of your own strength?</li>
                <li>Tell you the honest truth even if it is hard to hear?</li>
                <li>Just be present — no words needed?</li>
              </ul>
              <br />
              Or something else entirely? Be specific.
            </>
          }
          guidance={
            <>
              Share your own answer too. This goes both directions. By the end of this
              question you should both know exactly what to do when the other person
              comes to you on a hard day.
            </>
          }
        />

        <QuestionCard
          label="Question 3 — The fear underneath"
          prompt={
            <>
              Tell your partner what you are most afraid of about this program. About
              doing this work, about being seen, about what you might find — or about
              what might not change even after 90 days of trying.
              <br /><br />
              The woman who says &ldquo;I am afraid this will not work because nothing
              else has&rdquo; is more ready for this program than the one who performs
              certainty.
            </>
          }
          guidance={
            <>
              After you both share — tell each other: &ldquo;I will not let that fear be
              the reason you stop. And I need you to do the same for me.&rdquo; Mean it.
            </>
          }
        />

        <div style={{
          background: 'var(--card)', border: '1px solid var(--line)',
          borderLeft: `3px solid ${ORANGE}`,
          borderRadius: 12, padding: '20px 22px', margin: '6px 0 26px',
          fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7,
        }}>
          You have just done something most people in programs never do. You showed up
          honestly before you had to.
          <br /><br />
          That is the whole work of the next 90 days.
          <br /><br />
          Check in with each other every Wednesday. The prompt will be waiting for you.
          But do not wait for the prompt — reach out when something happens, when
          something shifts, when you almost quit, when you need someone to hold the
          proof with you.
          <br /><br />
          That is what this partnership is for.
          <div style={{
            marginTop: 10, fontFamily: 'var(--font-display)', fontStyle: 'italic',
            fontSize: 14, color: 'var(--ink)',
          }}>
            — Nicole
          </div>
        </div>

        <button
          onClick={onStart}
          style={{
            background: ORANGE, color: '#fff',
            padding: '14px 28px', borderRadius: 10,
            fontSize: 14, fontWeight: 600, border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'block', width: '100%', maxWidth: 360, margin: '0 auto',
          }}
        >
          Start the conversation →
        </button>
        <p style={{
          fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
          margin: '12px 0 0',
        }}>
          Opens your thread with {partnerName} and seeds your first message.
        </p>
      </div>
    </div>
  )
}

function QuestionCard({
  label, prompt, guidance,
}: { label: string; prompt: React.ReactNode; guidance: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--line)',
      borderRadius: 12, padding: '20px 22px', marginBottom: 16,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: ORANGE, marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7, marginBottom: 14 }}>
        {prompt}
      </div>
      <div style={{
        fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7,
        fontStyle: 'italic', borderTop: '1px solid var(--line)', paddingTop: 12,
      }}>
        {guidance}
      </div>
    </div>
  )
}
