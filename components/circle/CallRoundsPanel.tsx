'use client'

// components/circle/CallRoundsPanel.tsx
//
// Opening round + closing integration UI anchored to one live call.
//
// Time phases (computed from call.scheduled_at + recording_url):
//   • pre        — more than 30 min before the call. Show nothing
//                  (just the join button when zoom_url is set).
//   • opening    — within the 30 min before scheduled_at. Show the
//                  "I am arriving today as someone who __" prompt,
//                  hide the Zoom join until they submit, then show
//                  feed of other members' arrivals + the join button.
//   • during     — between scheduled_at and scheduled_at + 2h. Show
//                  the join button + the opening feed (still useful).
//   • closing    — after scheduled_at + 2h OR once recording_url is
//                  set by the admin. Show the "What I am taking from
//                  this call..." prompt. After submission hold the
//                  feed reveal until 60s elapse OR 80% of the cohort
//                  has submitted, whichever comes first.
//
// Polls every 5 seconds for sibling responses — no realtime
// subscription needed for cohort-sized audiences.

import { useEffect, useMemo, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { ARCHETYPE_COLOR, type LiveCall } from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'

const ARCHETYPE_LABELS: Record<string, string> = {
  door: 'Open Door', throne: "Overthinker's Throne",
  engine: 'Interrupted Engine', push: 'Pushthrough',
}

const POLL_MS = 5_000
const OPENING_WINDOW_MIN = 30
const CALL_DURATION_HRS = 2
const REVEAL_DELAY_MS = 60_000
const REVEAL_PCT_THRESHOLD = 0.8

type Phase = 'pre' | 'opening' | 'during' | 'closing'

interface RoundResponse {
  id: string
  call_id: string
  member_id: string
  response_type: 'opening_round' | 'closing_integration'
  response_text: string
  created_at: string
  member_archetype: string | null
  member_name: string | null
  is_admin: boolean
}

interface Props {
  call: LiveCall
  memberId: string
  cohortId: string
  archetype: string
}

export default function CallRoundsPanel({ call, memberId, cohortId, archetype }: Props) {
  const [now, setNow] = useState<number>(Date.now())
  const [responses, setResponses] = useState<RoundResponse[]>([])
  const [openingDraft, setOpeningDraft] = useState('')
  const [closingDraft, setClosingDraft] = useState('')
  const [saving, setSaving] = useState<'opening' | 'closing' | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [cohortMemberCount, setCohortMemberCount] = useState<number>(0)
  // Timestamp of the caller's closing submission. Used to hold the
  // reveal for 60s after they hit submit.
  const [myClosingAt, setMyClosingAt] = useState<number | null>(null)

  const scheduledMs = new Date(call.scheduled_at).getTime()

  const phase: Phase = useMemo(() => {
    const recordingMarked = !!call.recording_url
    if (recordingMarked) return 'closing'
    const minBefore = (scheduledMs - now) / 60_000
    if (now > scheduledMs + CALL_DURATION_HRS * 3600_000) return 'closing'
    if (now >= scheduledMs && now <= scheduledMs + CALL_DURATION_HRS * 3600_000) return 'during'
    if (minBefore <= OPENING_WINDOW_MIN && minBefore > 0) return 'opening'
    return 'pre'
  }, [now, scheduledMs, call.recording_url])

  // Hydrate cohort size for the 80% reveal threshold.
  useEffect(() => {
    void supabaseClient
      .from('circle_members')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId)
      .then(res => setCohortMemberCount(res.count ?? 0))
  }, [cohortId])

  // Poll responses for this call. Phase boundaries can flip in the
  // background (the call clock keeps moving), so this also bumps `now`.
  useEffect(() => {
    let cancelled = false
    async function pull() {
      const { data } = await supabaseClient
        .from('circle_call_responses')
        .select(`
          id, call_id, member_id, response_type, response_text, created_at,
          member:member_id (
            archetype,
            user:user_id ( name )
          )
        `)
        .eq('call_id', call.id)
        .order('created_at', { ascending: true })
      if (cancelled) return
      const rows: RoundResponse[] = ((data ?? []) as any[]).map(r => {
        const mem = Array.isArray(r.member) ? r.member[0] : r.member
        const u   = mem ? (Array.isArray(mem.user) ? mem.user[0] : mem.user) : null
        return {
          id: r.id,
          call_id: r.call_id,
          member_id: r.member_id,
          response_type: r.response_type,
          response_text: r.response_text,
          created_at: r.created_at,
          member_archetype: mem?.archetype ?? null,
          member_name: u?.name ?? null,
          // Members with no circle_members row but whose response made
          // it through admin RLS — treat as Nicole / coach. (Admin
          // posts won't generally happen here, kept for future.)
          is_admin: !mem,
        }
      })
      setResponses(rows)
      const ownClosing = rows.find(r => r.member_id === memberId && r.response_type === 'closing_integration')
      if (ownClosing && !myClosingAt) setMyClosingAt(new Date(ownClosing.created_at).getTime())
      setNow(Date.now())
    }
    void pull()
    const id = setInterval(pull, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [call.id, memberId, myClosingAt])

  const opening = responses.filter(r => r.response_type === 'opening_round')
  const closing = responses.filter(r => r.response_type === 'closing_integration')
  const myOpening = opening.find(r => r.member_id === memberId)
  const myClosing = closing.find(r => r.member_id === memberId)

  // 60-second reveal: hold until 60s after the caller submitted OR 80%
  // of the cohort has submitted, whichever comes first.
  const reveal80Hit  = cohortMemberCount > 0 && closing.length >= cohortMemberCount * REVEAL_PCT_THRESHOLD
  const reveal60Hit  = !!myClosingAt && (now - myClosingAt) >= REVEAL_DELAY_MS
  const closingRevealed = !!myClosing && (reveal80Hit || reveal60Hit)

  async function submitOpening() {
    if (!openingDraft.trim()) return
    setSaving('opening'); setError(null)
    const { error: e } = await supabaseClient
      .from('circle_call_responses')
      .insert({
        call_id: call.id,
        member_id: memberId,
        response_type: 'opening_round',
        response_text: openingDraft.trim().slice(0, 100),
      })
    setSaving(null)
    if (e) { setError(e.message); return }
    setOpeningDraft('')
  }

  async function submitClosing() {
    if (!closingDraft.trim()) return
    setSaving('closing'); setError(null)
    const { error: e } = await supabaseClient
      .from('circle_call_responses')
      .insert({
        call_id: call.id,
        member_id: memberId,
        response_type: 'closing_integration',
        response_text: closingDraft.trim().slice(0, 150),
      })
    setSaving(null)
    if (e) { setError(e.message); return }
    setClosingDraft('')
    setMyClosingAt(Date.now())
  }

  // Only the calendar button stays in the hero — the join lives here so
  // we can hide it during the opening composer phase.
  const joinBtn = call.zoom_url ? (
    <a
      href={call.zoom_url}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'inline-block',
        padding: '11px 22px', borderRadius: 8,
        background: ORANGE, color: '#fff',
        fontSize: 13, fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      Join live stream →
    </a>
  ) : null

  // ────────────────────────────────────────────────────────────────────
  // Render branches
  // ────────────────────────────────────────────────────────────────────

  if (phase === 'pre') {
    // Show only the join button (when zoom is set). Opening prompt
    // appears 30 min before scheduled_at.
    return joinBtn ? <Card>{joinBtn}</Card> : null
  }

  if (phase === 'during') {
    return (
      <Card>
        {joinBtn}
        {opening.length > 0 && (
          <ResponseFeed
            title={`Cohort opening round · ${opening.length}`}
            items={opening}
          />
        )}
      </Card>
    )
  }

  if (phase === 'opening') {
    if (!myOpening) {
      return (
        <Card>
          <SectionEyebrow>Before we start — opening round</SectionEyebrow>
          <Subtitle>Complete this before joining the call.</Subtitle>
          <FieldLabel>I am arriving today as someone who ___</FieldLabel>
          <TextInput
            value={openingDraft}
            onChange={setOpeningDraft}
            placeholder="Complete this sentence…"
            maxLength={100}
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <button
            onClick={submitOpening}
            disabled={!openingDraft.trim() || saving === 'opening'}
            style={primaryBtnStyle(!openingDraft.trim() || saving === 'opening')}
          >
            {saving === 'opening' ? 'Submitting…' : 'Submit and join call →'}
          </button>
        </Card>
      )
    }
    return (
      <Card>
        {joinBtn}
        <ResponseFeed
          title={`Cohort opening round · ${opening.length}`}
          items={opening}
          highlightMemberId={memberId}
        />
      </Card>
    )
  }

  // phase === 'closing'
  if (!myClosing) {
    return (
      <Card>
        <SectionEyebrow>Before you go</SectionEyebrow>
        <Subtitle>
          Type your answer below — everyone submits at the same time.
        </Subtitle>
        <FieldLabel>What I am taking from this call into my week is ___</FieldLabel>
        <TextInput
          value={closingDraft}
          onChange={setClosingDraft}
          placeholder="One sentence…"
          maxLength={150}
        />
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <button
          onClick={submitClosing}
          disabled={!closingDraft.trim() || saving === 'closing'}
          style={primaryBtnStyle(!closingDraft.trim() || saving === 'closing')}
        >
          {saving === 'closing' ? 'Submitting…' : 'Submit'}
        </button>
      </Card>
    )
  }

  if (!closingRevealed) {
    const secondsLeft = myClosingAt
      ? Math.max(0, Math.ceil((myClosingAt + REVEAL_DELAY_MS - now) / 1000))
      : 60
    return (
      <Card>
        <SectionEyebrow>Holding the moment</SectionEyebrow>
        <p style={{ fontSize: 14, color: 'var(--text-soft)', lineHeight: 1.7, margin: '4px 0 14px' }}>
          {closing.length} of {cohortMemberCount || '?'} submitted. The cohort&apos;s answers will reveal
          {secondsLeft > 0 ? ` in ${secondsLeft}s` : ' shortly'} — or as soon as 80% have submitted.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <ResponseFeed
        title={`Cohort closing integration · ${closing.length}`}
        items={closing}
        highlightMemberId={memberId}
      />
    </Card>
  )
}

// ── Small UI helpers ──────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line)',
      borderRadius: 12, padding: '18px 22px', marginBottom: 22,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {children}
    </div>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: ORANGE,
    }}>
      {children}
    </div>
  )
}

function Subtitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
      {children}
    </p>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 600, color: 'var(--ink)', marginTop: 4,
    }}>
      {children}
    </div>
  )
}

function TextInput({
  value, onChange, placeholder, maxLength,
}: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={e => onChange(e.target.value)}
      onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
      onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '11px 14px',
        border: '1px solid var(--line-md)',
        borderRadius: 10, fontSize: 14, fontFamily: 'inherit',
        background: '#fff', color: 'var(--ink)',
        outline: 'none', transition: 'border-color .15s',
      }}
    />
  )
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? 'var(--paper3)' : ORANGE,
    color: '#fff', padding: '11px 22px', borderRadius: 10,
    fontSize: 13, fontWeight: 600, border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    alignSelf: 'flex-start',
  }
}

function ErrorMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 12, color: 'var(--red)', margin: '0' }}>{children}</p>
}

function ResponseFeed({
  title, items, highlightMemberId,
}: { title: string; items: RoundResponse[]; highlightMemberId?: string }) {
  return (
    <div>
      <SectionEyebrow>{title}</SectionEyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        {items.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            No responses yet.
          </p>
        )}
        {items.map(r => {
          const accent = r.is_admin
            ? '#3D3080'
            : (r.member_archetype ? (ARCHETYPE_COLOR[r.member_archetype] ?? ORANGE) : ORANGE)
          const archetypeLabel = r.member_archetype ? (ARCHETYPE_LABELS[r.member_archetype] ?? r.member_archetype) : ''
          const isMe = !!highlightMemberId && r.member_id === highlightMemberId
          return (
            <div
              key={r.id}
              style={{
                background: isMe ? ORANGE_PALE : 'var(--paper)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 6,
                padding: '10px 14px',
                fontSize: 13, lineHeight: 1.55,
                color: 'var(--ink)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 13, color: 'var(--ink)' }}>
                  {r.member_name ?? (r.is_admin ? 'Nicole' : 'Member')}
                </strong>
                {r.is_admin ? (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#3D3080',
                    background: 'rgba(61,48,128,0.12)',
                    padding: '2px 7px', borderRadius: 999,
                  }}>
                    Coach
                  </span>
                ) : archetypeLabel ? (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: accent,
                    background: `${accent}1A`,
                    padding: '2px 7px', borderRadius: 999,
                  }}>
                    {archetypeLabel}
                  </span>
                ) : null}
              </div>
              <div style={{ color: 'var(--text-soft)' }}>
                {r.response_type === 'opening_round'
                  ? <>arriving as someone who <em>{r.response_text}</em></>
                  : <em>{r.response_text}</em>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
