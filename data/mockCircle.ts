// Mock Circle dataset — used by /circle, /circle/week, /circle/welcome
// when the viewer is not signed in (authUser === null). Mirrors the row
// shapes returned by lib/circle.ts so the pages can consume either.
//
// Shape of the mock cohort:
//   • Started 14 days ago → we're in Week 3
//   • 8 members, viewer is "The Open Door" and paired with "Jordan P."
//   • Weeks 1-2 fully complete in viewer's progress
//   • One live call in the past (with a recording), one upcoming
//   • Full teaching content for weeks 1-2 (from circleStarterContent),
//     skeleton titles for weeks 3-12

import type { CircleMember, WeeklyContent, LiveCall } from '@/lib/circle'
import { CIRCLE_STARTER_CONTENT } from '@/data/circleStarterContent'

const DAY = 86400000
const now = Date.now()
const startedAt = new Date(now - 14 * DAY)
const endsAt    = new Date(now + (90 - 14) * DAY)

export const MOCK_COHORT = {
  id: 'mock-cohort-1',
  name: 'Cohort 1 — Spring 2026',
  starts_at: startedAt.toISOString(),
  ends_at:   endsAt.toISOString(),
  is_active: true,
  max_members: 16,
}

export const MOCK_MEMBER: CircleMember = {
  id: 'mock-member-me',
  user_id: 'mock-user-1',
  cohort_id: MOCK_COHORT.id,
  archetype: 'door',
  enneagram_type: '2',
  attachment_style: 'secure',
  feedback_pref: 'context',
  goal_90day: "Stop volunteering for things before checking if I want to",
  partner_id: 'mock-member-jordan',
  joined_at: startedAt.toISOString(),
}

export const MOCK_PARTNER = {
  id: 'mock-member-jordan',
  archetype: 'engine',
  goal_90day: 'Finally finish the business plan I keep restarting',
  users: {
    name: 'Jordan P.',
    avatar_url: null,
  },
}

export const MOCK_MEMBER_COUNT = 8

// Viewer's progress — weeks 1-2 fully done, week 3 in progress.
export const MOCK_PROGRESS = [
  {
    member_id: MOCK_MEMBER.id,
    week_number: 1,
    journal_completed: true,
    action_completed: true,
    journal_entry:
      "The last time I said yes when I meant no was Friday, when my sister asked me to pick up my niece. I felt it in my chest — this tight, heavy thing — and I said yes before I even checked what my day looked like. I told myself she needed me. But I also needed that hour.",
    completed_at: new Date(now - 10 * DAY).toISOString(),
  },
  {
    member_id: MOCK_MEMBER.id,
    week_number: 2,
    journal_completed: true,
    action_completed: true,
    journal_entry:
      "What my overgiving has cost me: hours of sleep, a hobby I actually loved, a version of myself that was creative and weird and had time to waste. It's also cost the people around me the chance to become more capable — I've been filling gaps that were theirs to close.",
    completed_at: new Date(now - 3 * DAY).toISOString(),
  },
]

// Skeleton content for weeks 3-12 so the overview page renders all pills.
const FILLER_TITLES: { title: string; month: 'root' | 'rebuild' | 'rise' }[] = [
  { title: 'What you keep reaching for',          month: 'root'    }, // wk 3
  { title: 'The yes before the yes',              month: 'root'    }, // wk 4
  { title: 'Interruption vs. abandonment',        month: 'rebuild' }, // wk 5
  { title: 'Ask for what you need',               month: 'rebuild' }, // wk 6
  { title: 'Let them do it wrong',                month: 'rebuild' }, // wk 7
  { title: 'The body, the bill',                  month: 'rebuild' }, // wk 8
  { title: 'Identity beyond performance',         month: 'rise'    }, // wk 9
  { title: 'The quiet kind of power',             month: 'rise'    }, // wk 10
  { title: 'Who gets to have this?',              month: 'rise'    }, // wk 11
  { title: 'Integration — the version that lasts',month: 'rise'    }, // wk 12
]

const filler: WeeklyContent[] = FILLER_TITLES.map((t, i) => ({
  id: `mock-w${i + 3}-universal`,
  week_number: i + 3,
  archetype: 'universal',
  month_name: t.month,
  week_title: t.title,
  teaching: null,
  journal_prompt: null,
  weekly_action: null,
  monday_prompt: null,
  wednesday_prompt: null,
  friday_prompt: null,
  video_url: null,
  live_call_week: [5, 7, 9, 11].includes(i + 3),
}))

// All 12 weeks — pull real content for weeks 1-2 from the starter file.
export const MOCK_WEEKS_OVERVIEW: WeeklyContent[] = [
  ...CIRCLE_STARTER_CONTENT
    .filter(r => r.archetype === 'universal')
    .map((r, i): WeeklyContent => ({
      id: `mock-w${r.week_number}-universal`,
      week_number: r.week_number,
      archetype: 'universal',
      month_name: r.month_name,
      week_title: r.week_title,
      teaching: r.teaching ?? null,
      journal_prompt: null,
      weekly_action: null,
      monday_prompt: r.monday_prompt ?? null,
      wednesday_prompt: r.wednesday_prompt ?? null,
      friday_prompt: r.friday_prompt ?? null,
      video_url: null,
      live_call_week: r.live_call_week ?? false,
    })),
  ...filler,
]

// Full pair (universal + archetype-specific) for a given week. Returns
// both weeks 1-2 from starter content, falls back to title-only for 3-12.
export function getMockWeekContent(
  weekNumber: number,
  archetype: 'door' | 'throne' | 'engine' | 'push',
): { universal: WeeklyContent | null; personal: WeeklyContent | null } {
  const universalSeed = CIRCLE_STARTER_CONTENT.find(
    r => r.week_number === weekNumber && r.archetype === 'universal',
  )
  const personalSeed = CIRCLE_STARTER_CONTENT.find(
    r => r.week_number === weekNumber && r.archetype === archetype,
  )

  const mkRow = (
    r: typeof CIRCLE_STARTER_CONTENT[number] | undefined,
    fallbackArchetype: string,
  ): WeeklyContent | null => {
    if (!r) return null
    return {
      id: `mock-w${r.week_number}-${r.archetype}`,
      week_number: r.week_number,
      archetype: r.archetype,
      month_name: r.month_name,
      week_title: r.week_title,
      teaching: r.teaching ?? null,
      journal_prompt: r.journal_prompt ?? null,
      weekly_action: r.weekly_action ?? null,
      monday_prompt: r.monday_prompt ?? null,
      wednesday_prompt: r.wednesday_prompt ?? null,
      friday_prompt: r.friday_prompt ?? null,
      video_url: null,
      live_call_week: r.live_call_week ?? false,
    }
  }

  // Weeks 3+ — pull title from the overview and return a minimal universal
  // row so the page renders something instead of "not available yet."
  if (!universalSeed) {
    const overview = MOCK_WEEKS_OVERVIEW.find(w => w.week_number === weekNumber)
    return {
      universal: overview
        ? {
            ...overview,
            teaching: `Content for ${overview.week_title} will publish ${overview.month_name === 'root' ? 'soon' : 'when we reach this week'}. In the meantime — keep the practice from your current week going.`,
          }
        : null,
      personal: null,
    }
  }

  return {
    universal: mkRow(universalSeed, 'universal'),
    personal:  mkRow(personalSeed,  archetype),
  }
}

export const MOCK_CALLS: LiveCall[] = [
  {
    id: 'mock-call-1',
    call_number: 1,
    title: 'Welcome + ground your cohort',
    scheduled_at: new Date(now - 7 * DAY).toISOString(),
    zoom_url: null,
    recording_url: 'https://example.com/replay-call-1',
    notes: 'Replay available — we introduced everyone and set the 90-day frame.',
  },
  {
    id: 'mock-call-2',
    call_number: 2,
    title: 'Naming the pattern out loud',
    scheduled_at: new Date(now + 3 * DAY).toISOString(),
    zoom_url: 'https://zoom.us/j/mock-circle',
    recording_url: null,
    notes: null,
  },
  {
    id: 'mock-call-3',
    call_number: 3,
    title: 'What the override costs',
    scheduled_at: new Date(now + 17 * DAY).toISOString(),
    zoom_url: 'https://zoom.us/j/mock-circle',
    recording_url: null,
    notes: null,
  },
]
