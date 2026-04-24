// app/circle/page.tsx
// ─────────────────────────────────────────────────────────────
// Main Circle dashboard — the first page a member lands on.
// Add a link to this page in your existing sidebar nav
// alongside "Daily Alignment", "The Becoming", etc.
//
// WHERE TO ADD THE SIDEBAR LINK:
// Open your existing sidebar/nav component (likely in
// components/Sidebar.tsx or app/layout.tsx) and add:
//   <Link href="/circle">The Circle</Link>
// in the same pattern as your other nav items.
// ─────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabaseClient } from '@/lib/supabase/client'
import {
  getMyCircleMember,
  getMyPartner,
  getAllWeeksOverview,
  getMyProgress,
  getLiveCalls,
  getCurrentWeekNumber,
  type CircleMember,
  type WeeklyContent,
  type LiveCall,
} from '@/lib/circle'

// ─── Month label helper ──────────────────────────────────────
const MONTH_COLORS: Record<string, string> = {
  root:    'bg-[#1B4332] text-white',
  rebuild: 'bg-[#7a4800] text-white',
  rise:    'bg-[#3c2a8a] text-white',
}

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: 'The Overthink Throne',
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

export default function CirclePage() {
  const [member, setMember]       = useState<CircleMember | null>(null)
  const [partner, setPartner]     = useState<any>(null)
  const [weeks, setWeeks]         = useState<WeeklyContent[]>([])
  const [progress, setProgress]   = useState<any[]>([])
  const [calls, setCalls]         = useState<LiveCall[]>([])
  const [loading, setLoading]     = useState(true)
  const [currentWeek, setCurrentWeek] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const m = await getMyCircleMember()
      if (!m) { setLoading(false); return }
      setMember(m)

      const [partnerData, weeksData, progressData, callsData] = await Promise.all([
        m.partner_id ? getMyPartner(m.partner_id) : Promise.resolve(null),
        getAllWeeksOverview(m.cohort_id),
        getMyProgress(m.id),
        getLiveCalls(m.cohort_id),
      ])

      setPartner(partnerData)
      setWeeks(weeksData)
      setProgress(progressData)
      setCalls(callsData)
      setLoading(false)
    }
    load()
  }, [])

  // Need cohort start date to compute current week — fetch it once member is loaded
  useEffect(() => {
    if (!member) return
    async function loadCohortDate() {
      const { data } = await supabaseClient
        .from('circle_cohorts')
        .select('starts_at')
        .eq('id', member!.cohort_id)
        .single()
      if (data) setCurrentWeek(getCurrentWeekNumber(data.starts_at))
    }
    loadCohortDate()
  }, [member])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-500">Loading your Circle...</p>
      </div>
    )
  }

  // Not enrolled
  if (!member) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <h1 className="text-2xl font-semibold mb-3">The Circle</h1>
        <p className="text-gray-500 mb-6">
          You haven't joined a cohort yet. When enrollment opens you'll receive an invitation here.
        </p>
      </div>
    )
  }

  const completedWeeks = progress.filter(p => p.journal_completed && p.action_completed).length
  const nextCall = calls.find(c => new Date(c.scheduled_at) > new Date())

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-[#C9A84C] mb-1">
          The Circle
        </p>
        <h1 className="text-2xl font-bold">
          {ARCHETYPE_LABELS[member.archetype]}
        </h1>
        {member.goal_90day && (
          <p className="text-sm text-gray-500 mt-1 italic">
            90-day focus: {member.goal_90day}
          </p>
        )}
      </div>

      {/* ── Progress strip ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
            Your progress
          </span>
          <span className="text-xs text-gray-500">{completedWeeks} / 12 weeks complete</span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 12 }, (_, i) => {
            const wn = i + 1
            const done = progress.find(p => p.week_number === wn && p.journal_completed && p.action_completed)
            const current = wn === currentWeek
            return (
              <Link key={wn} href={`/circle/week/${wn}`}>
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all cursor-pointer
                  ${done    ? 'bg-[#1B4332] text-white'            : ''}
                  ${current && !done ? 'bg-[#C9A84C] text-white ring-2 ring-[#C9A84C] ring-offset-1' : ''}
                  ${!done && !current ? 'bg-gray-100 text-gray-400' : ''}
                `}>
                  {wn}
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── This week ── */}
      {currentWeek && (
        <Link href={`/circle/week/${currentWeek}`}>
          <div className="bg-[#1B4332] text-white rounded-2xl p-5 cursor-pointer hover:opacity-95 transition-opacity">
            <p className="text-xs font-bold tracking-widest uppercase text-[#C9A84C] mb-1">
              This week — Week {currentWeek}
            </p>
            <h2 className="text-lg font-bold">
              {weeks.find(w => w.week_number === currentWeek)?.week_title ?? 'Loading...'}
            </h2>
            <p className="text-sm text-green-200 mt-2">Tap to open this week's content →</p>
          </div>
        </Link>
      )}

      {/* ── Accountability partner ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">
          Accountability partner
        </p>
        {partner ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(partner.users?.name ?? 'P').charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{partner.users?.name}</p>
              <p className="text-xs text-gray-400">{ARCHETYPE_LABELS[partner.archetype]}</p>
            </div>
            <Link href={`/circle/partner`}>
              <button className="text-xs font-semibold text-[#1B4332] border border-[#1B4332] rounded-lg px-3 py-1.5 hover:bg-[#1B4332] hover:text-white transition-colors">
                Message
              </button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-400">Partner pairing coming soon.</p>
        )}
      </div>

      {/* ── Next live call ── */}
      {nextCall && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-2">
            Next live call
          </p>
          <p className="font-semibold text-sm">{nextCall.title}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(nextCall.scheduled_at).toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
              hour: 'numeric', minute: '2-digit',
            })}
          </p>
          {nextCall.zoom_url && (
            <a
              href={nextCall.zoom_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-3 text-xs font-semibold bg-[#1B4332] text-white px-4 py-2 rounded-lg hover:opacity-90"
            >
              Join call →
            </a>
          )}
          {nextCall.recording_url && (
            <a
              href={nextCall.recording_url}
              target="_blank"
              rel="noreferrer"
              className="inline-block mt-2 ml-2 text-xs font-semibold text-[#1B4332] border border-[#1B4332] px-4 py-2 rounded-lg hover:bg-[#1B4332] hover:text-white transition-colors"
            >
              Watch replay
            </a>
          )}
        </div>
      )}

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/circle/community">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:border-[#C9A84C] transition-colors">
            <p className="text-sm font-semibold">Community</p>
            <p className="text-xs text-gray-400 mt-1">Wins, prompts, posts</p>
          </div>
        </Link>
        <Link href="/circle/calls">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 cursor-pointer hover:border-[#C9A84C] transition-colors">
            <p className="text-sm font-semibold">All calls</p>
            <p className="text-xs text-gray-400 mt-1">Schedule + replays</p>
          </div>
        </Link>
      </div>

    </div>
  )
}
