'use client'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { getMyCircleMember, getLiveCalls, type LiveCall } from '@/lib/circle'
import { MOCK_CALLS } from '@/data/mockCircle'

const ORANGE      = '#C97D3A'
const ORANGE_PALE = '#fdf6f2'

const CALL_DESCRIPTIONS: Record<number, string> = {
  1: 'Welcome session. Meet your cohort, meet your partner, state your 90-day commitment out loud.',
  2: 'Root — the cost conversation. Making your pattern\'s cost specific and witnessed.',
  3: 'Rebuild — the first interruption. What it felt like, what it proved, how to do it again.',
  4: 'Rebuild — identity shift moments. Catching the small ones and naming them publicly.',
  5: 'Rise — the new identity. Coaching the present-tense language shift from "I\'m trying to" to "I am."',
  6: 'Graduation. Transformation shares, partner appreciation, what comes next beyond these 90 days.',
}

const MONTH_FOR_CALL: Record<number, { label: string; tint: string }> = {
  1: { label: 'Welcome',  tint: ORANGE            },
  2: { label: 'Root',     tint: 'var(--green)'    },
  3: { label: 'Rebuild',  tint: '#a66128'         },
  4: { label: 'Rebuild',  tint: '#a66128'         },
  5: { label: 'Rise',     tint: 'var(--gold)'     },
  6: { label: 'Rise',     tint: 'var(--gold)'     },
}

export default function CallsPage() {
  const { loading, isAuthed, effectiveIsAdmin } = useApp()

  const [calls, setCalls] = useState<LiveCall[]>([])
  const [hydrating, setHydrating] = useState(true)

  const useMock = !loading && (!isAuthed || effectiveIsAdmin)

  useEffect(() => {
    if (loading) return

    if (useMock) {
      setCalls(MOCK_CALLS)
      setHydrating(false)
      return
    }

    (async () => {
      const member = await getMyCircleMember()
      if (!member) { setHydrating(false); return }
      const data = await getLiveCalls(member.cohort_id)
      setCalls(data)
      setHydrating(false)
    })()
  }, [loading, useMock])

  const { past, upcoming, nextId } = useMemo(() => {
    const now = Date.now()
    const past: LiveCall[]     = []
    const upcoming: LiveCall[] = []
    for (const c of calls) {
      if (new Date(c.scheduled_at).getTime() < now) past.push(c)
      else upcoming.push(c)
    }
    past.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    return { past, upcoming, nextId: upcoming[0]?.id ?? null }
  }, [calls])

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading calls…</p>
  }

  if (calls.length === 0) {
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
          Calls haven&apos;t been scheduled yet
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>
          Your cohort&apos;s 6 live calls will appear here once they&apos;re on the calendar.
        </p>
      </div>
    )
  }

  const next = upcoming[0]

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 4px' }}>
          The Circle
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', margin: '0 0 4px' }}>
          Live calls
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0 }}>
          6 calls across your 90-day journey · {past.length} complete, {upcoming.length} upcoming
        </p>
      </div>

      {/* Next up hero */}
      {next && <NextUpCard call={next} />}

      {/* Upcoming (minus next) */}
      {upcoming.length > 1 && (
        <Section title="Upcoming">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {upcoming.slice(1).map(call => <CallRow key={call.id} call={call} kind="upcoming" />)}
          </div>
        </Section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <Section title="Past calls">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {past.map(call => <CallRow key={call.id} call={call} kind="past" />)}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function NextUpCard({ call }: { call: LiveCall }) {
  const date = new Date(call.scheduled_at)
  const meta = MONTH_FOR_CALL[call.call_number]
  const countdown = humanCountdown(date)

  return (
    <div style={{
      background: ORANGE, color: '#fff',
      borderRadius: 16, padding: 24,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, flexShrink: 0,
          }}>
            {call.call_number}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>
              Next up · {meta?.label ?? ''}
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, margin: 0 }}>{call.title}</h2>
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '4px 12px', borderRadius: 999,
          background: 'rgba(255,255,255,0.2)',
          flexShrink: 0,
        }}>
          {countdown}
        </span>
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.92)', margin: '10px 0 0' }}>
        {CALL_DESCRIPTIONS[call.call_number]}
      </p>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', margin: '10px 0 0' }}>
        {date.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        })}
      </p>

      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
        {call.zoom_url && (
          <a href={call.zoom_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#fff', color: ORANGE,
              padding: '10px 20px', borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Join Zoom →
            </button>
          </a>
        )}
        <button
          onClick={() => downloadIcs(call)}
          style={{
            background: 'transparent', color: '#fff',
            border: '1px solid rgba(255,255,255,0.5)',
            padding: '10px 18px', borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Add to calendar
        </button>
      </div>
    </div>
  )
}

function CallRow({ call, kind }: { call: LiveCall; kind: 'upcoming' | 'past' }) {
  const date = new Date(call.scheduled_at)
  const meta = MONTH_FOR_CALL[call.call_number]
  const isPast = kind === 'past'

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line)',
      borderRadius: 12, padding: 16,
      display: 'flex', gap: 14, alignItems: 'flex-start',
      opacity: isPast ? 0.85 : 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: isPast ? 'var(--paper2)' : ORANGE_PALE,
        color: isPast ? 'var(--text-muted)' : ORANGE,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, flexShrink: 0,
      }}>
        {call.call_number}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>{call.title}</p>
          {meta && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: meta.tint,
            }}>
              · {meta.label}
            </span>
          )}
          {isPast && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: 'var(--text-muted)',
              padding: '2px 8px', borderRadius: 999,
              border: '1px solid var(--line-md)',
            }}>
              Complete
            </span>
          )}
        </div>

        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
          {date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </p>

        <p style={{ fontSize: 12, color: 'var(--text-soft)', margin: '8px 0 0', lineHeight: 1.5 }}>
          {CALL_DESCRIPTIONS[call.call_number]}
        </p>

        {call.notes && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0', fontStyle: 'italic' }}>
            {call.notes}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {isPast && call.recording_url && (
            <a href={call.recording_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#fff', border: `1px solid ${ORANGE}`,
                color: ORANGE,
                padding: '6px 14px', borderRadius: 8,
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Watch replay
              </button>
            </a>
          )}
          {isPast && !call.recording_url && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Replay will be posted soon.
            </span>
          )}
          {!isPast && (
            <>
              <button
                onClick={() => downloadIcs(call)}
                style={{
                  background: '#fff', border: '1px solid var(--line-md)',
                  color: 'var(--text-soft)',
                  padding: '6px 14px', borderRadius: 8,
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Add to calendar
              </button>
              {call.zoom_url && (
                <a href={call.zoom_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button style={{
                    background: 'transparent', border: 'none',
                    color: ORANGE,
                    padding: '6px 4px',
                    fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    Zoom link →
                  </button>
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: 'var(--text-muted)',
        margin: '0 0 10px',
      }}>
        {title}
      </p>
      {children}
    </div>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function humanCountdown(date: Date): string {
  const diff = date.getTime() - Date.now()
  if (diff <= 0) return 'Live now'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `In ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `In ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `In ${days}d`
  const weeks = Math.floor(days / 7)
  return `In ${weeks}w`
}

function downloadIcs(call: LiveCall) {
  const dtStart = formatIcsDate(new Date(call.scheduled_at))
  // Assume 90-minute calls for the .ics end time.
  const dtEnd   = formatIcsDate(new Date(new Date(call.scheduled_at).getTime() + 90 * 60_000))
  const uid     = `${call.id}@clarity-portal`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Clarity Portal//The Circle//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:The Circle — Call ${call.call_number}: ${call.title}`,
    `DESCRIPTION:${(CALL_DESCRIPTIONS[call.call_number] ?? '').replace(/\n/g, '\\n')}`,
    call.zoom_url ? `URL:${call.zoom_url}` : '',
    call.zoom_url ? `LOCATION:${call.zoom_url}` : 'LOCATION:Zoom',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
  const blob = new Blob([lines], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `circle-call-${call.call_number}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
