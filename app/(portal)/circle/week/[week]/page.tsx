// app/circle/week/[week]/page.tsx
// ─────────────────────────────────────────────────────────────
// Displays the full content for a single week.
// Shows the universal teaching + the member's archetype track.
// URL pattern: /circle/week/1 through /circle/week/12
// ─────────────────────────────────────────────────────────────
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

const MONTH_STYLES: Record<string, { bg: string; label: string }> = {
  root:    { bg: '#1B4332', label: 'Month 1 — Root' },
  rebuild: { bg: '#7a4800', label: 'Month 2 — Rebuild' },
  rise:    { bg: '#3c2a8a', label: 'Month 3 — Rise' },
}

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

export default function WeekPage() {
  const params  = useParams()
  const router  = useRouter()
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

    async function load() {
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
    }
    load()
  }, [weekNum])

  async function handleMarkComplete(field: 'journal_completed' | 'action_completed') {
    if (!memberId) return
    setSaving(true)
    const ok = await markWeekComplete(
      memberId,
      weekNum,
      field,
      field === 'journal_completed' ? journalText : undefined
    )
    if (ok) {
      setProgress((prev: any) => ({ ...(prev ?? {}), [field]: true, week_number: weekNum }))
    }
    setSaving(false)
  }

  const monthStyle = MONTH_STYLES[universal?.month_name ?? 'root']

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">Loading week {weekNum}...</p>
      </div>
    )
  }

  if (!universal) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <p className="text-gray-500">Content for week {weekNum} isn't available yet.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">

      {/* Back */}
      <button
        onClick={() => router.push('/circle')}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
      >
        ← Back to Circle
      </button>

      {/* Hero */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: monthStyle.bg }}
      >
        <p className="text-xs font-bold tracking-widest uppercase opacity-70 mb-1">
          {monthStyle.label} · Week {weekNum}
        </p>
        <h1 className="text-xl font-bold">{universal.week_title}</h1>
        {universal.live_call_week && (
          <span className="inline-block mt-3 text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
            📞 Live call this week
          </span>
        )}
      </div>

      {/* Progress pills */}
      <div className="flex gap-2">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
          progress?.journal_completed
            ? 'bg-[#1B4332] text-white border-[#1B4332]'
            : 'border-gray-200 text-gray-400'
        }`}>
          {progress?.journal_completed ? '✓ Journal done' : 'Journal pending'}
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
          progress?.action_completed
            ? 'bg-[#1B4332] text-white border-[#1B4332]'
            : 'border-gray-200 text-gray-400'
        }`}>
          {progress?.action_completed ? '✓ Action done' : 'Action pending'}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-100 pb-2">
        {(['teaching', 'journal', 'action', 'partner'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold px-4 py-2 rounded-lg capitalize transition-colors ${
              activeTab === tab
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab === 'partner' ? 'Partner prompt' : tab}
          </button>
        ))}
      </div>

      {/* Teaching tab */}
      {activeTab === 'teaching' && (
        <div className="space-y-4">
          {universal.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                src={universal.video_url}
                className="w-full h-full"
                allowFullScreen
                title={`Week ${weekNum} teaching`}
              />
            </div>
          )}
          {universal.teaching && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                This week's teaching
              </p>
              <div className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {universal.teaching}
              </div>
            </div>
          )}
          {universal.monday_prompt && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
                Monday voice note theme
              </p>
              <p className="text-sm text-gray-700">{universal.monday_prompt}</p>
            </div>
          )}
          {universal.friday_prompt && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 mb-2">
                Friday wins prompt
              </p>
              <p className="text-sm text-gray-700">{universal.friday_prompt}</p>
            </div>
          )}
        </div>
      )}

      {/* Journal tab */}
      {activeTab === 'journal' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: monthStyle.bg }}>
              {ARCHETYPE_LABELS[archetype]} — journal prompt
            </p>
            <p className="text-sm leading-relaxed text-gray-700 mt-2">
              {personal?.journal_prompt ?? 'No journal prompt for this week.'}
            </p>
          </div>
          <textarea
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
            placeholder="Write your response here..."
            rows={8}
            className="w-full border border-gray-200 rounded-xl p-4 text-sm resize-none focus:outline-none focus:border-gray-400 bg-white"
          />
          <button
            onClick={() => handleMarkComplete('journal_completed')}
            disabled={saving || !journalText.trim() || progress?.journal_completed}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: monthStyle.bg }}
          >
            {progress?.journal_completed ? '✓ Journal complete' : saving ? 'Saving...' : 'Mark journal complete'}
          </button>
        </div>
      )}

      {/* Action tab */}
      {activeTab === 'action' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: monthStyle.bg }}>
              {ARCHETYPE_LABELS[archetype]} — weekly action
            </p>
            <p className="text-sm leading-relaxed text-gray-700 mt-2">
              {personal?.weekly_action ?? 'No action for this week.'}
            </p>
          </div>
          <button
            onClick={() => handleMarkComplete('action_completed')}
            disabled={saving || progress?.action_completed}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: monthStyle.bg }}
          >
            {progress?.action_completed ? '✓ Action complete' : saving ? 'Saving...' : 'Mark action complete'}
          </button>
        </div>
      )}

      {/* Partner prompt tab */}
      {activeTab === 'partner' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
              Wednesday partner check-in
            </p>
            <p className="text-sm leading-relaxed text-gray-700">
              {universal.wednesday_prompt ?? 'No partner prompt this week.'}
            </p>
          </div>
          <a href="/circle/partner">
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: monthStyle.bg }}
            >
              Message your partner →
            </button>
          </a>
        </div>
      )}

    </div>
  )
}
