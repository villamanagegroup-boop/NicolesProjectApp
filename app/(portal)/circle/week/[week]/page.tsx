'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  getMyCircleMember,
  getWeekContent,
  getMyProgress,
  markWeekComplete,
  type WeeklyContent,
} from '@/lib/circle'

const ORANGE      = '#C97D3A'
const ORANGE_DEEP = '#a66128'
const ORANGE_PALE = '#fdf6f2'

const MONTH_COLORS: Record<string, { label: string; tint: string }> = {
  root:    { label: 'Month 1 · Root',    tint: 'var(--green)' },
  rebuild: { label: 'Month 2 · Rebuild', tint: ORANGE_DEEP },
  rise:    { label: 'Month 3 · Rise',    tint: 'var(--gold)' },
}

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

export default function WeekPage() {
  const params = useParams()
  const router = useRouter()
  const weekNum = parseInt(params.week as string, 10)

  const [universal, setUniversal]         = useState<WeeklyContent | null>(null)
  const [personal, setPersonal]           = useState<WeeklyContent | null>(null)
  const [memberId, setMemberId]           = useState<string>('')
  const [archetype, setArchetype]         = useState<string>('')
  const [progress, setProgress]           = useState<any>(null)
  const [journalText, setJournalText]     = useState('')
  const [saving, setSaving]               = useState(false)
  const [activeTab, setActiveTab]         = useState<'teaching' | 'journal' | 'action' | 'partner'>('teaching')
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      router.push('/circle')
      return
    }
    (async () => {
      const member = await getMyCircleMember()
      if (!member) { router.push('/circle'); return }

      setMemberId(member.id)
      setArchetype(member.archetype)

      const [content, prog] = await Promise.all([
        getWeekContent(weekNum, member.archetype, member.cohort_id),
        getMyProgress(member.id),
      ])

      setUniversal(content.universal)
      setPersonal(content.personal)

      const weekProg = prog.find((p: any) => p.week_number === weekNum)
      setProgress(weekProg ?? null)
      if (weekProg?.journal_entry) setJournalText(weekProg.journal_entry)

      setLoading(false)
    })()
  }, [weekNum, router])

  async function handleMarkComplete(field: 'journal_completed' | 'action_completed') {
    if (!memberId) return
    setSaving(true)
    const ok = await markWeekComplete(
      memberId,
      weekNum,
      field,
      field === 'journal_completed' ? journalText : undefined,
    )
    if (ok) {
      setProgress((prev: any) => ({ ...(prev ?? {}), [field]: true, week_number: weekNum }))
    }
    setSaving(false)
  }

  const month = MONTH_COLORS[universal?.month_name ?? 'root']

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading week {weekNum}…</p>
  }

  if (!universal) {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 40 }}>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>Content for week {weekNum} isn&apos;t available yet.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Back */}
      <button
        onClick={() => router.push('/circle')}
        style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: 12, cursor: 'pointer', padding: 0, alignSelf: 'flex-start',
          fontFamily: 'inherit',
        }}
      >
        ← Back to Circle
      </button>

      {/* Hero */}
      <div style={{ background: month.tint, color: '#fff', borderRadius: 14, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', margin: '0 0 4px' }}>
          {month.label} · Week {weekNum}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: 0 }}>
          {universal.week_title}
        </h1>
        {universal.live_call_week && (
          <span style={{
            display: 'inline-block', marginTop: 12,
            fontSize: 11, fontWeight: 600,
            background: 'rgba(255,255,255,0.18)', color: '#fff',
            padding: '4px 12px', borderRadius: 999,
          }}>
            Live call this week
          </span>
        )}
      </div>

      {/* Progress pills */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Pill done={!!progress?.journal_completed} label={progress?.journal_completed ? '✓ Journal done' : 'Journal pending'} />
        <Pill done={!!progress?.action_completed}  label={progress?.action_completed  ? '✓ Action done'  : 'Action pending'}  />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
        {(['teaching', 'journal', 'action', 'partner'] as const).map(tab => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '8px 14px',
                borderRadius: 8, border: 'none',
                background: active ? ORANGE_PALE : 'transparent',
                color: active ? ORANGE : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
                transition: 'all .15s',
              }}
            >
              {tab === 'partner' ? 'Partner prompt' : tab}
            </button>
          )
        })}
      </div>

      {/* Teaching tab */}
      {activeTab === 'teaching' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {universal.video_url && (
            <div style={{ aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
              <iframe
                src={universal.video_url}
                style={{ width: '100%', height: '100%', border: 0 }}
                allowFullScreen
                title={`Week ${weekNum} teaching`}
              />
            </div>
          )}
          {universal.teaching && (
            <Panel>
              <Eyebrow>This week&apos;s teaching</Eyebrow>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-soft)', marginTop: 10, whiteSpace: 'pre-wrap' }}>
                {universal.teaching}
              </div>
            </Panel>
          )}
          {universal.monday_prompt && (
            <AccentPanel accent={ORANGE} label="Monday voice note theme" body={universal.monday_prompt} />
          )}
          {universal.friday_prompt && (
            <AccentPanel accent="var(--green)" label="Friday wins prompt" body={universal.friday_prompt} />
          )}
        </div>
      )}

      {/* Journal tab */}
      {activeTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel>
            <Eyebrow color={month.tint}>{ARCHETYPE_LABELS[archetype]} — journal prompt</Eyebrow>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-soft)', margin: '10px 0 0' }}>
              {personal?.journal_prompt ?? 'No journal prompt for this week.'}
            </p>
          </Panel>
          <textarea
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
            placeholder="Write your response here…"
            rows={8}
            style={{
              width: '100%', padding: '14px 16px',
              border: '1px solid var(--line-md)', borderRadius: 12,
              fontSize: 14, lineHeight: 1.6,
              resize: 'vertical',
              background: '#fff', color: 'var(--ink)',
              fontFamily: 'inherit',
              outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = ORANGE }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--line-md)' }}
          />
          <button
            onClick={() => handleMarkComplete('journal_completed')}
            disabled={saving || !journalText.trim() || progress?.journal_completed}
            style={{
              ...bigBtn,
              background: progress?.journal_completed ? 'var(--paper3)' : month.tint,
              cursor: (saving || !journalText.trim() || progress?.journal_completed) ? 'not-allowed' : 'pointer',
              opacity: (saving || !journalText.trim()) && !progress?.journal_completed ? 0.6 : 1,
            }}
          >
            {progress?.journal_completed ? '✓ Journal complete' : saving ? 'Saving…' : 'Mark journal complete'}
          </button>
        </div>
      )}

      {/* Action tab */}
      {activeTab === 'action' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel>
            <Eyebrow color={month.tint}>{ARCHETYPE_LABELS[archetype]} — weekly action</Eyebrow>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-soft)', margin: '10px 0 0' }}>
              {personal?.weekly_action ?? 'No action for this week.'}
            </p>
          </Panel>
          <button
            onClick={() => handleMarkComplete('action_completed')}
            disabled={saving || progress?.action_completed}
            style={{
              ...bigBtn,
              background: progress?.action_completed ? 'var(--paper3)' : month.tint,
              cursor: (saving || progress?.action_completed) ? 'not-allowed' : 'pointer',
            }}
          >
            {progress?.action_completed ? '✓ Action complete' : saving ? 'Saving…' : 'Mark action complete'}
          </button>
        </div>
      )}

      {/* Partner prompt tab */}
      {activeTab === 'partner' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Panel>
            <Eyebrow>Wednesday partner check-in</Eyebrow>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-soft)', margin: '10px 0 0' }}>
              {universal.wednesday_prompt ?? 'No partner prompt this week.'}
            </p>
          </Panel>
          <a href="/circle/partner" style={{ textDecoration: 'none' }}>
            <button style={{ ...bigBtn, background: month.tint, cursor: 'pointer', width: '100%' }}>
              Message your partner →
            </button>
          </a>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
      {children}
    </div>
  )
}

function Eyebrow({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: color ?? 'var(--text-muted)',
    }}>
      {children}
    </span>
  )
}

function AccentPanel({ accent, label, body }: { accent: string; label: string; body: string }) {
  return (
    <div style={{
      background: ORANGE_PALE, border: `1px solid ${accent}`,
      borderRadius: 12, padding: 16,
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: accent, margin: '0 0 6px',
      }}>
        {label}
      </p>
      <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6, margin: 0 }}>{body}</p>
    </div>
  )
}

function Pill({ done, label }: { done: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600,
      padding: '5px 12px', borderRadius: 999,
      background: done ? ORANGE : 'transparent',
      color: done ? '#fff' : 'var(--text-muted)',
      border: `1px solid ${done ? ORANGE : 'var(--line-md)'}`,
    }}>
      {label}
    </span>
  )
}

const bigBtn: React.CSSProperties = {
  width: '100%', padding: '14px 20px',
  borderRadius: 12, border: 'none',
  fontSize: 14, fontWeight: 600,
  color: '#fff', fontFamily: 'inherit',
  transition: 'background .15s',
}
