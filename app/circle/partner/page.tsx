// app/circle/partner/page.tsx
// ─────────────────────────────────────────────────────────────
// Direct message thread between accountability partners.
// URL: /circle/partner
// ─────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState, useRef } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import {
  getMyCircleMember,
  getMyPartner,
  getPartnerThread,
  sendPartnerMessage,
  getCurrentWeekNumber,
  getWeekContent,
  type PartnerMessage,
} from '@/lib/circle'

export default function PartnerPage() {
  const [messages, setMessages]   = useState<PartnerMessage[]>([])
  const [partner, setPartner]     = useState<any>(null)
  const [myUserId, setMyUserId]   = useState<string>('')
  const [partnerId, setPartnerId] = useState<string>('')  // circle_members.user_id of partner
  const [cohortId, setCohortId]   = useState<string>('')
  const [weekPrompt, setWeekPrompt] = useState<string>('')
  const [body, setBody]           = useState('')
  const [sending, setSending]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const member = await getMyCircleMember()
      if (!member || !member.partner_id) { setLoading(false); return }

      setCohortId(member.cohort_id)

      // Get current user id
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) setMyUserId(user.id)

      // Get partner
      const partnerData = await getMyPartner(member.partner_id)
      setPartner(partnerData)

      // Resolve partner's user_id from their circle_member record
      const { data: partnerMember } = await supabaseClient
        .from('circle_members')
        .select('user_id')
        .eq('id', member.partner_id)
        .single()

      if (partnerMember) {
        setPartnerId(partnerMember.user_id)
        const msgs = await getPartnerThread(partnerMember.user_id)
        setMessages(msgs)
      }

      // Load this week's partner prompt
      const { data: cohort } = await supabaseClient
        .from('circle_cohorts')
        .select('starts_at')
        .eq('id', member.cohort_id)
        .single()

      if (cohort) {
        const wn = getCurrentWeekNumber(cohort.starts_at)
        if (wn) {
          const { universal } = await getWeekContent(wn, member.archetype, member.cohort_id)
          if (universal?.wednesday_prompt) setWeekPrompt(universal.wednesday_prompt)
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!body.trim() || !partnerId || !cohortId) return
    setSending(true)
    const ok = await sendPartnerMessage(partnerId, cohortId, body.trim())
    if (ok) {
      setBody('')
      const msgs = await getPartnerThread(partnerId)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">No partner yet</h2>
        <p className="text-sm text-gray-500">
          Your accountability partner pairing will appear here once the cohort begins.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-80px)]">

      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center text-white font-bold">
          {(partner.users?.name ?? 'P').charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm">{partner.users?.name}</p>
          <p className="text-xs text-gray-400">Accountability partner</p>
        </div>
      </div>

      {/* This week's prompt */}
      {weekPrompt && (
        <div className="mx-5 mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex-shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-1">
            Wednesday prompt
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">{weekPrompt}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No messages yet. Say hello to your partner.
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === myUserId
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? 'bg-[#1B4332] text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                <p>{msg.body}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-green-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit',
                  })}
                  {isMe && msg.read_at && ' · Seen'}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your partner..."
          rows={2}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-gray-400 bg-white"
        />
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="bg-[#1B4332] text-white px-4 rounded-xl text-sm font-bold disabled:opacity-40 flex-shrink-0"
        >
          {sending ? '...' : '→'}
        </button>
      </div>
    </div>
  )
}
