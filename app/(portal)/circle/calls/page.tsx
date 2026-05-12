'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { getMyCircleMember, getLiveCalls, type LiveCall } from '@/lib/circle'

const ORANGE      = '#B8862E'
const ORANGE_PALE = '#fdf6f2'

const CALL_DESCRIPTIONS: Record<number, string> = {
  1: 'Welcome session. Meet your cohort, meet your partner, state your 12-week commitment out loud.',
  2: 'Root — the cost conversation. Making your pattern\'s cost specific and witnessed.',
  3: 'Rebuild — the first interruption. What it felt like, what it proved, how to do it again.',
  4: 'Rebuild — identity shift moments. Catching the small ones and naming them publicly.',
  5: 'Rise — the new identity. Coaching the present-tense language shift from "I\'m trying to" to "I am."',
  6: 'Graduation. Transformation shares, partner appreciation, what comes next beyond these 12 weeks.',
}

const MONTH_FOR_CALL: Record<number, { label: string }> = {
  1: { label: 'Welcome' },
  2: { label: 'Root' },
  3: { label: 'Rebuild' },
  4: { label: 'Rebuild' },
  5: { label: 'Rise' },
  6: { label: 'Rise' },
}

export default function CallsPage() {
  const router = useRouter()
  const { loading, isAuthed } = useApp()

  const [calls, setCalls] = useState<LiveCall[]>([])
  const [hydrating, setHydrating] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!isAuthed) { router.replace('/login'); return }
    (async () => {
      const member = await getMyCircleMember()
      if (!member) { setHydrating(false); return }
      const data = await getLiveCalls(member.cohort_id)
      setCalls(data)
      setHydrating(false)
    })()
  }, [loading, isAuthed, router])

  const { past, upcoming } = useMemo(() => {
    const now = Date.now()
    const past: LiveCall[]     = []
    const upcoming: LiveCall[] = []
    for (const c of calls) {
      if (new Date(c.scheduled_at).getTime() < now) past.push(c)
      else upcoming.push(c)
    }
    past.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    return { past, upcoming }
  }, [calls])

  if (loading || hydrating) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading calls…</p>
  }

  if (calls.length === 0) {
    return (
      <div style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center', padding: 40 }}>
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
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
          The Circle
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300, color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.1 }}>
          Live calls
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-soft)', margin: '12px 0 0', lineHeight: 1.55, maxWidth: 520 }}>
          6 calls across your 12-week journey · {past.length} complete, {upcoming.length} upcoming.
        </p>
      </div>

      {/* Next-up centerpiece — full width, gradient bar like the affirmation */}
      {next && <NextUpHero call={next} />}

      {/* Below the hero: upcoming on left, past replays on right */}
      <div className="calls-cols" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 28, alignItems: 'start',
      }}>
        <div>
          {upcoming.length > 1 && (
            <Section title="Upcoming" count={upcoming.length - 1}>
              {upcoming.slice(1).map(call => <CallRow key={call.id} call={call} kind="upcoming" />)}
            </Section>
          )}
          {upcoming.length === 1 && (
            <Section title="Upcoming">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 22px', margin: 0 }}>
                No calls beyond the next one. Future calls will appear here as they&apos;re scheduled.
              </p>
            </Section>
          )}
        </div>

        <div style={{ position: 'sticky', top: 24 }}>
          {past.length > 0 ? (
            <Section title="Past calls" count={past.length}>
              {past.map(call => <CallRow key={call.id} call={call} kind="past" />)}
            </Section>
          ) : (
            <Section title="Past calls">
              <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 22px', margin: 0 }}>
                You haven&apos;t finished any calls yet. Replays will collect here as you go.
              </p>
            </Section>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .calls-cols {
            grid-template-columns: 1fr !important;
          }
          .calls-cols > div { position: static !important; }
        }
        .call-row:last-child { border-bottom: none !important; }
        .call-row:hover { background: rgba(200,148,31,0.04) !important; }
      `}</style>
    </div>
  )
}

// ── Hero (Next up) ───────────────────────────────────────────────────────────
function NextUpHero({ call }: { call: LiveCall }) {
  const date = new Date(call.scheduled_at)
  const meta = MONTH_FOR_CALL[call.call_number]
  const countdown = humanCountdown(date)

  return (
    <div style={{
      background: `linear-gradient(135deg, ${ORANGE_PALE} 0%, #fff 70%)`,
      borderTop: `2px solid ${ORANGE}`,
      borderBottom: '1px solid var(--line)',
      padding: '32px 4px 32px 24px',
      marginBottom: 36,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: ORANGE, margin: '0 0 12px' }}>
            Next up · {meta?.label ?? ''} · Call {call.call_number}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontStyle: 'italic', fontWeight: 300, color: 'var(--ink)', margin: '0 0 12px', lineHeight: 1.25 }}>
            {call.title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 8px', lineHeight: 1.6, maxWidth: 720 }}>
            {CALL_DESCRIPTIONS[call.call_number]}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            {' · '}
            <span style={{ color: ORANGE, fontWeight: 600 }}>{countdown}</span>
          </p>

          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {call.zoom_url && (
              <a href={call.zoom_url} target="_blank" rel="noreferrer" style={{
                padding: '10px 18px', borderRadius: 8,
                background: ORANGE, color: '#fff',
                fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}>
                Join live stream →
              </a>
            )}
            <button
              onClick={() => downloadIcs(call)}
              style={{
                background: '#fff', color: 'var(--text-soft)',
                border: '1px solid var(--line-md)',
                padding: '10px 16px', borderRadius: 8,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Add to calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Row (matches CircleRow style from /circle home) ──────────────────────────
function CallRow({ call, kind }: { call: LiveCall; kind: 'upcoming' | 'past' }) {
  const date = new Date(call.scheduled_at)
  const meta = MONTH_FOR_CALL[call.call_number]
  const isPast = kind === 'past'

  return (
    <div
      className="call-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '20px 20px 20px 22px',
        borderBottom: '1px solid var(--line)',
        position: 'relative', flexWrap: 'wrap',
        transition: 'background 0.15s',
      }}
    >
      <span style={{
        position: 'absolute', left: 0, top: 18, bottom: 18,
        width: 3, background: isPast ? 'var(--line-md)' : ORANGE,
        borderRadius: 2,
      }} />

      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: isPast ? 'var(--text-muted)' : ORANGE, marginBottom: 8, fontFamily: 'var(--font-body)' }}>
          {meta?.label ?? ''} · Call {call.call_number}
          <span style={{
            marginLeft: 10, fontWeight: 600, fontSize: 9,
            padding: '3px 8px', borderRadius: 6,
            background: `${isPast ? 'rgba(0,0,0,0.04)' : ORANGE + '14'}`,
            color: isPast ? 'var(--text-muted)' : ORANGE,
            letterSpacing: '0.08em',
          }}>
            {isPast ? 'Replay' : humanCountdown(date)}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 4, lineHeight: 1.4 }}>
          {call.title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 4, lineHeight: 1.5 }}>
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
          {CALL_DESCRIPTIONS[call.call_number]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {isPast && call.recording_url && (
          <a href={call.recording_url} target="_blank" rel="noreferrer" style={{
            padding: '6px 12px', borderRadius: 6,
            background: ORANGE, color: '#fff',
            fontSize: 11, fontWeight: 600,
            textDecoration: 'none',
          }}>
            Watch replay ↗
          </a>
        )}
        {!isPast && (
          <>
            <button
              onClick={() => downloadIcs(call)}
              style={{
                background: '#fff', border: '1px solid var(--line-md)',
                color: 'var(--text-soft)',
                padding: '6px 11px', borderRadius: 6,
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + Calendar
            </button>
            {call.zoom_url && (
              <a href={call.zoom_url} target="_blank" rel="noreferrer" style={{
                padding: '6px 12px', borderRadius: 6,
                background: ORANGE, color: '#fff',
                fontSize: 11, fontWeight: 600,
                textDecoration: 'none',
              }}>
                Zoom ↗
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {count !== undefined && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {count} {count === 1 ? 'call' : 'calls'}
          </span>
        )}
      </header>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 12, overflow: 'hidden',
      }}>{children}</div>
    </section>
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
    call.zoom_url ? `LOCATION:${call.zoom_url}` : 'LOCATION:Live stream',
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
