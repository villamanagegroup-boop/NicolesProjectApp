// app/circle/calls/page.tsx
// ─────────────────────────────────────────────────────────────
// Shows all 6 live calls — upcoming with Zoom link,
// past with recording link.
// URL: /circle/calls
// ─────────────────────────────────────────────────────────────
'use client'

import { useEffect, useState } from 'react'
import { getMyCircleMember, getLiveCalls, type LiveCall } from '@/lib/circle'

const CALL_DESCRIPTIONS: Record<number, string> = {
  1: 'Welcome session. Meet your cohort, meet your partner, state your 90-day commitment.',
  2: 'Root — The cost conversation. Making your pattern\'s cost specific and witnessed.',
  3: 'Rebuild — The first interruption. What it felt like, what it proved.',
  4: 'Rebuild — Identity shift moments. Catching and naming them publicly.',
  5: 'Rise — The new identity. Coaching the present-tense language shift.',
  6: 'Graduation. Transformation shares, partner appreciation, what comes next.',
}

export default function CallsPage() {
  const [calls, setCalls]   = useState<LiveCall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const member = await getMyCircleMember()
      if (!member) { setLoading(false); return }
      const data = await getLiveCalls(member.cohort_id)
      setCalls(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-gray-400">Loading calls...</p>
      </div>
    )
  }

  const now = new Date()

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      <div>
        <p className="text-xs font-bold tracking-widest uppercase text-[#C9A84C] mb-1">The Circle</p>
        <h1 className="text-xl font-bold">Live calls</h1>
        <p className="text-sm text-gray-400 mt-1">6 calls across your 90-day journey</p>
      </div>

      <div className="space-y-3">
        {calls.map(call => {
          const callDate = new Date(call.scheduled_at)
          const isPast   = callDate < now
          const isNext   = !isPast && calls.filter(c => new Date(c.scheduled_at) < now).length === call.call_number - 1

          return (
            <div
              key={call.id}
              className={`bg-white border rounded-2xl p-5 ${
                isNext ? 'border-[#1B4332] ring-1 ring-[#1B4332]' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isPast
                      ? 'bg-gray-100 text-gray-400'
                      : isNext
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {call.call_number}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{call.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {callDate.toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                {isNext && (
                  <span className="text-xs font-bold bg-[#1B4332] text-white px-2.5 py-1 rounded-full">
                    Next up
                  </span>
                )}
                {isPast && (
                  <span className="text-xs font-semibold text-gray-400 border border-gray-200 px-2.5 py-1 rounded-full">
                    Complete
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                {CALL_DESCRIPTIONS[call.call_number]}
              </p>

              {call.notes && (
                <p className="text-xs text-gray-400 mt-2 italic">{call.notes}</p>
              )}

              <div className="flex gap-2 mt-3 flex-wrap">
                {!isPast && call.zoom_url && (
                  <a
                    href={call.zoom_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold bg-[#1B4332] text-white px-4 py-2 rounded-xl hover:opacity-90"
                  >
                    Join Zoom →
                  </a>
                )}
                {call.recording_url && (
                  <a
                    href={call.recording_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold border border-[#1B4332] text-[#1B4332] px-4 py-2 rounded-xl hover:bg-[#1B4332] hover:text-white transition-colors"
                  >
                    Watch replay
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
