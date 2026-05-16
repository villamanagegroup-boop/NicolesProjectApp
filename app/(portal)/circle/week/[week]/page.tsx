'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { useApp } from '@/context/AppContext'
import {
  getMyCircleMember,
  getWeekContent,
  getMyProgress,
  markWeekComplete,
  type WeeklyContent,
  type MemberProgress,
} from '@/lib/circle'
import WeeklyWinsFeed from '@/components/circle/WeeklyWinsFeed'
import ActionCompleteScreen from '@/components/circle/ActionCompleteScreen'
import DailyPromptCard from '@/components/circle/DailyPromptCard'

const ORANGE      = '#B8862E'
const ORANGE_DEEP = '#a66128'
const ORANGE_PALE = '#fdf6f2'

const MONTH_COLORS: Record<string, { label: string; tint: string }> = {
  root:    { label: 'Month 1 · Root',    tint: 'var(--green)' },
  rebuild: { label: 'Month 2 · Rebuild', tint: ORANGE_DEEP },
  rise:    { label: 'Month 3 · Rise',    tint: 'var(--gold)' },
}

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

export default function WeekPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthed, loading: appLoading } = useApp()
  const weekNum = parseInt(params.week as string, 10)

  const [universal, setUniversal]         = useState<WeeklyContent | null>(null)
  const [personal, setPersonal]           = useState<WeeklyContent | null>(null)
  const [memberId, setMemberId]           = useState<string>('')
  const [authUserId, setAuthUserId]       = useState<string>('')
  const [cohortId, setCohortId]           = useState<string>('')
  const [cohortMemberCount, setCohortMemberCount] = useState<number>(0)
  const [archetype, setArchetype]         = useState<string>('')
  const [progress, setProgress]           = useState<Partial<MemberProgress> | null>(null)
  const [journalText, setJournalText]     = useState('')
  const [saving, setSaving]               = useState(false)
  const [activeTab, setActiveTab]         = useState<'teaching' | 'journal' | 'action' | 'partner'>('teaching')
  const [loading, setLoading]             = useState(true)
  // ActionCompleteScreen lifts up after a successful "I did this" click.
  // We only show it on the transition, not for already-completed weeks,
  // so a member returning to a finished week doesn't get the celebration
  // popping back open.
  const [actionCelebrate, setActionCelebrate] = useState(false)

  useEffect(() => {
    if (appLoading) return
    if (isNaN(weekNum) || weekNum < 1 || weekNum > 12) {
      router.push('/circle')
      return
    }
    if (!isAuthed) { router.replace('/login'); return }

    (async () => {
      const member = await getMyCircleMember()
      if (!member) { router.push('/circle'); return }

      setMemberId(member.id)
      setArchetype(member.archetype)
      setCohortId(member.cohort_id)

      const { data: { user: authed } } = await supabaseClient.auth.getUser()
      if (authed) setAuthUserId(authed.id)

      const [content, prog, countRes] = await Promise.all([
        getWeekContent(weekNum, member.archetype, member.cohort_id),
        getMyProgress(member.id),
        supabaseClient
          .from('circle_members')
          .select('id', { count: 'exact', head: true })
          .eq('cohort_id', member.cohort_id),
      ])

      setUniversal(content.universal)
      setPersonal(content.personal)
      setCohortMemberCount(countRes.count ?? 0)

      const weekProg = (prog as MemberProgress[]).find(p => p.week_number === weekNum)
      setProgress(weekProg ?? null)
      if (weekProg?.journal_entry) setJournalText(weekProg.journal_entry)

      setLoading(false)
    })()
  }, [appLoading, weekNum, router, isAuthed])

  // Re-pull progress from the DB; used by DailyPromptStack after a card saves.
  async function refreshProgress() {
    if (!memberId) return
    const prog = await getMyProgress(memberId)
    const weekProg = (prog as MemberProgress[]).find(p => p.week_number === weekNum)
    setProgress(weekProg ?? null)
  }

  async function handleMarkComplete(
    field: 'teaching_completed' | 'journal_completed' | 'action_completed',
  ) {
    if (!memberId) return
    const wasComplete = !!progress?.[field]
    setSaving(true)
    const ok = await markWeekComplete(
      memberId,
      weekNum,
      field,
      field === 'journal_completed' ? journalText : undefined,
    )
    if (ok) {
      setProgress(prev => ({ ...(prev ?? {}), [field]: true, week_number: weekNum }))
      // Fire the celebration only on the *transition* from incomplete →
      // complete for the action step. Returning to a finished week
      // doesn't re-open the screen.
      if (field === 'action_completed' && !wasComplete) {
        setActionCelebrate(true)
      }
    }
    setSaving(false)
  }

  function handleShareWin() {
    setActionCelebrate(false)
    // Scroll the wins composer into view. WeeklyWinsFeed anchors itself
    // with id="wins-composer" so this works from any tab.
    requestAnimationFrame(() => {
      document.getElementById('wins-composer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const month = MONTH_COLORS[universal?.month_name ?? 'root']

  if (loading) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading week {weekNum}…</p>
  }

  if (!universal) {
    return (
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 40 }}>
        <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>Content for week {weekNum} isn&apos;t available yet.</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
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

      {/* Tabs — each tab carries its own completion checkbox so we don't
          need a separate progress-pill row above. */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
        {(['teaching', 'journal', 'action', 'partner'] as const).map(tab => {
          const active = activeTab === tab
          const done =
            tab === 'teaching' ? !!progress?.teaching_completed
            : tab === 'journal' ? !!progress?.journal_completed
            : tab === 'action' ? !!progress?.action_completed
            : !!progress?.partner_checkin_sent_at
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 12, fontWeight: 600, padding: '8px 14px',
                borderRadius: 8, border: 'none',
                background: active ? ORANGE_PALE : 'transparent',
                color: active ? ORANGE : 'var(--text-muted)',
                cursor: 'pointer', fontFamily: 'inherit',
                textTransform: 'capitalize',
                transition: 'all .15s',
              }}
            >
              <StepCheckbox done={done} active={active} />
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
          {memberId && (
            <DailyPromptStack
              memberId={memberId}
              weekNumber={weekNum}
              mondayPrompt={personal?.monday_prompt ?? universal.monday_prompt ?? null}
              wednesdayPrompt={universal.wednesday_prompt ?? null}
              fridayPrompt={universal.friday_prompt ?? null}
              progress={progress}
              onChange={() => refreshProgress()}
            />
          )}
          <button
            onClick={() => handleMarkComplete('teaching_completed')}
            disabled={saving || progress?.teaching_completed}
            style={{
              ...bigBtn,
              background: progress?.teaching_completed ? 'var(--paper3)' : month.tint,
              color: progress?.teaching_completed ? 'var(--text-soft)' : '#fff',
              cursor: (saving || progress?.teaching_completed) ? 'not-allowed' : 'pointer',
            }}
          >
            {progress?.teaching_completed ? '✓ Teaching complete' : saving ? 'Saving…' : "I've read this →"}
          </button>
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
            {progress?.action_completed ? '✓ Action complete' : saving ? 'Saving…' : 'I did this →'}
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

      {/* Weekly wins feed — always visible at the bottom, regardless of
          which tab is active, so members can read wins even before
          completing their own steps. */}
      {cohortId && universal && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
          <WeeklyWinsFeed
            cohortId={cohortId}
            weekNumber={weekNum}
            winsPrompt={personal?.wins_prompt ?? universal.wins_prompt ?? null}
            cohortMemberCount={cohortMemberCount}
          />
        </div>
      )}

      {/* Action-complete celebration overlay */}
      <ActionCompleteScreen
        open={actionCelebrate}
        weekNumber={weekNum}
        cohortId={cohortId}
        excludeUserId={authUserId}
        onShareWin={handleShareWin}
        onBackHome={() => { setActionCelebrate(false); router.push('/circle') }}
      />
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
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

function StepCheckbox({ done, active }: { done: boolean; active: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 14, height: 14, borderRadius: 4,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: done ? ORANGE : 'transparent',
        border: `1.5px solid ${done ? ORANGE : (active ? ORANGE : 'var(--line-md)')}`,
        flexShrink: 0,
        transition: 'background .15s, border-color .15s',
      }}
    >
      {done && (
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

// Day-aware stack of the three daily prompts. Once a successor day unlocks,
// the prior prompt collapses to a single line above the active card. A
// completed prompt also defaults to minimized but remains expandable.
function DailyPromptStack({
  memberId, weekNumber, mondayPrompt, wednesdayPrompt, fridayPrompt, progress, onChange,
}: {
  memberId: string
  weekNumber: number
  mondayPrompt: string | null
  wednesdayPrompt: string | null
  fridayPrompt: string | null
  progress: Partial<MemberProgress> | null
  onChange: () => void
}) {
  // 0=Sun, 1=Mon ... 6=Sat — used to drive what's "today's" prompt.
  const today = new Date().getDay()

  const monCompleted = !!progress?.monday_completed_at
  const wedCompleted = !!progress?.partner_checkin_sent_at
  const friCompleted = !!progress?.friday_completed_at

  // We render all three slots so the stack feels consistent week to week.
  // A slot with no prompt content shows a "not yet posted" placeholder.
  // Day-aware visibility now only decides which slots are *expanded* vs minimized.
  const hasMon = !!mondayPrompt
  const hasWed = !!wednesdayPrompt
  const hasFri = !!fridayPrompt
  const wedUnlocked = today >= 3 || today === 0 || wedCompleted
  const friUnlocked = today >= 5 || today === 0 || friCompleted

  // Minimization: a slot is collapsed once a later slot is unlocked (and has
  // content) OR if it's been completed. Slots without content are always
  // minimized — there's nothing to expand into.
  const monMinimized = !hasMon || (hasWed && wedUnlocked) || monCompleted
  const wedMinimized = !hasWed || (hasFri && friUnlocked) || wedCompleted
  const friMinimized = !hasFri || friCompleted

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <DailyPromptCard
        day="monday"
        memberId={memberId}
        weekNumber={weekNumber}
        prompt={mondayPrompt ?? ''}
        initialText={progress?.monday_response ?? ''}
        completed={monCompleted}
        defaultMinimized={monMinimized}
        onSaved={onChange}
      />
      <DailyPromptCard
        day="wednesday"
        memberId={memberId}
        weekNumber={weekNumber}
        prompt={wednesdayPrompt ?? ''}
        initialText=""
        completed={wedCompleted}
        defaultMinimized={wedMinimized}
        onSaved={onChange}
      />
      <DailyPromptCard
        day="friday"
        memberId={memberId}
        weekNumber={weekNumber}
        prompt={fridayPrompt ?? ''}
        initialText={progress?.friday_win ?? ''}
        completed={friCompleted}
        defaultMinimized={friMinimized}
        onSaved={onChange}
      />
    </div>
  )
}

const bigBtn: React.CSSProperties = {
  width: '100%', padding: '14px 20px',
  borderRadius: 12, border: 'none',
  fontSize: 14, fontWeight: 600,
  color: '#fff', fontFamily: 'inherit',
  transition: 'background .15s',
}
