'use client'

// app/(admin)/admin/week6/page.tsx
//
// Week 6 personal check-in composer.
//
// Lists every active member in the chosen cohort whose week6_message_sent
// flag is false, pre-populates each one with a personal-but-templated body
// keyed by their first name, and lets Nicole personalize + send one at a
// time. Sending uses the existing sendCoachMessage (writes to
// circle_coach_messages, surfaced in the member's coach DM thread) and
// flips week6_message_sent so the row drops out of the pending list.
//
// Members who already received the Week 6 message are shown greyed out
// at the bottom with the date sent, so Nicole can see her progress
// through the cohort without losing context.

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { sendCoachMessage, fetchAdminCohorts, type AdminCohortSummary } from '@/lib/admin/hooks'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'Open Door',
  throne: "Overthinker's Throne",
  engine: 'Interrupted Engine',
  push:   'Pushthrough',
}

interface PendingMember {
  id: string
  user_id: string
  archetype: string
  week6_message_sent: boolean
  week6_message_sent_at: string | null  // synthesized client-side if column missing
  name: string
}

function defaultBody(firstName: string): string {
  return `Hey ${firstName || 'there'},\n\nYou are at Week 6. I know what this week costs. I see you showing up anyway.\n\nTell me one thing that has shifted — even something small.\n\nI am here.\nNicole`
}

export default function Week6Page() {
  return (
    <Suspense fallback={<div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</div>}>
      <Week6Inner />
    </Suspense>
  )
}

function Week6Inner() {
  const router = useRouter()
  const params = useSearchParams()
  const targetCohortId = params?.get('cohort') ?? ''

  const [cohort, setCohort]   = useState<AdminCohortSummary | null>(null)
  const [members, setMembers] = useState<PendingMember[]>([])
  const [drafts, setDrafts]   = useState<Record<string, string>>({})
  const [adminId, setAdminId] = useState<string>('')
  const [sending, setSending] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) setAdminId(user.id)

      const cohorts = await fetchAdminCohorts()
      const match = cohorts.find(c => c.id === targetCohortId)
        ?? cohorts.find(c => c.status === 'active' && c.current_week === 6)
      if (!match) { setLoading(false); return }
      setCohort(match)

      // Pull every member in this cohort + their week6 status + name.
      const { data: rows } = await supabaseClient
        .from('circle_members')
        .select(`
          id, user_id, archetype, week6_message_sent,
          user:user_id (name)
        `)
        .eq('cohort_id', match.id)
        .order('joined_at', { ascending: true })

      const mapped: PendingMember[] = ((rows ?? []) as any[]).map(r => ({
        id:                    r.id,
        user_id:               r.user_id,
        archetype:             r.archetype,
        week6_message_sent:    !!r.week6_message_sent,
        week6_message_sent_at: null,
        name:                  Array.isArray(r.user) ? (r.user[0]?.name ?? '') : (r.user?.name ?? ''),
      }))
      setMembers(mapped)
      const initDrafts: Record<string, string> = {}
      for (const m of mapped) {
        if (!m.week6_message_sent) initDrafts[m.id] = defaultBody((m.name || 'there').split(' ')[0])
      }
      setDrafts(initDrafts)
      setLoading(false)
    })()
  }, [targetCohortId])

  async function handleSend(m: PendingMember) {
    if (!adminId) return
    const body = drafts[m.id]?.trim()
    if (!body) { setError('Message is empty.'); return }
    setSending(m.id); setError(null)
    const { error: sendErr } = await sendCoachMessage({
      user_id:   m.user_id,
      sender_id: adminId,
      body,
    })
    if (sendErr) { setSending(null); setError(sendErr.message); return }
    const { error: flagErr } = await supabaseClient
      .from('circle_members')
      .update({ week6_message_sent: true })
      .eq('id', m.id)
    if (flagErr) {
      // Message already landed — surface as a soft error, but mark sent
      // locally so Nicole doesn't double-send.
      console.error('[week6] flag update failed after send', flagErr)
    }
    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, week6_message_sent: true } : x))
    setDrafts(prev => { const next = { ...prev }; delete next[m.id]; return next })
    setSending(null)
  }

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>
  }

  if (!cohort) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 24 }}>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>No active cohort is in Week 6 right now.</p>
        <Link href="/admin" style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600 }}>← Back to dashboard</Link>
      </div>
    )
  }

  const pending = members.filter(m => !m.week6_message_sent)
  const sent    = members.filter(m => m.week6_message_sent)

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', color: 'var(--ink)' }}>
      <button
        onClick={() => router.push('/admin')}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 14,
          fontFamily: 'inherit',
        }}
      >
        ← Back to dashboard
      </button>

      <div style={{ marginBottom: 18 }}>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--text-muted)', margin: '0 0 8px',
        }}>
          {cohort.name} · Week 6 personal check-ins
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300,
          color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0,
        }}>
          {pending.length} message{pending.length === 1 ? '' : 's'} to send.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 600 }}>
          Personalize each one before sending. The cohort has hit the hardest week —
          a message that lands as personal lands as proof you see them.
        </p>
      </div>

      {error && (
        <div style={{
          fontSize: 12, color: 'var(--red)', background: 'rgba(187,52,52,0.08)',
          border: '1px solid rgba(187,52,52,0.3)', borderRadius: 8,
          padding: '8px 12px', marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Pending composers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        {pending.length === 0 && (
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
            padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
          }}>
            🎉 All Week 6 messages have been sent for this cohort.
          </div>
        )}
        {pending.map(m => (
          <div key={m.id} style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
            padding: '16px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{m.name || '(unnamed)'}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                  {ARCHETYPE_LABELS[m.archetype] ?? m.archetype}
                </div>
              </div>
              <Link
                href={`/admin/members/${m.id}`}
                style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}
              >
                View profile →
              </Link>
            </div>
            <textarea
              value={drafts[m.id] ?? defaultBody((m.name || 'there').split(' ')[0])}
              onChange={e => setDrafts(prev => ({ ...prev, [m.id]: e.target.value }))}
              rows={7}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', borderRadius: 10,
                border: '1px solid var(--line-md)', background: '#fff',
                fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)',
                resize: 'vertical', minHeight: 140, lineHeight: 1.6, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <button
                onClick={() => handleSend(m)}
                disabled={sending === m.id}
                style={{
                  background: '#B8862E', color: '#fff',
                  padding: '8px 18px', borderRadius: 8,
                  fontSize: 13, fontWeight: 600, border: 'none',
                  cursor: sending === m.id ? 'wait' : 'pointer', fontFamily: 'inherit',
                  opacity: sending === m.id ? 0.7 : 1,
                }}
              >
                {sending === m.id ? 'Sending…' : 'Send →'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Already-sent (greyed) */}
      {sent.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: 10,
          }}>
            Sent · {sent.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sent.map(m => (
              <div key={m.id} style={{
                fontSize: 12, color: 'var(--text-muted)',
                background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8,
                padding: '8px 12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                opacity: 0.7,
              }}>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ color: 'var(--green, #3c6f47)' }}>✓</span>
                  <strong style={{ color: 'var(--ink)' }}>{m.name || '(unnamed)'}</strong>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    · {ARCHETYPE_LABELS[m.archetype] ?? m.archetype}
                  </span>
                </span>
                <Link
                  href={`/admin/members/${m.id}`}
                  style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none' }}
                >
                  View thread →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
