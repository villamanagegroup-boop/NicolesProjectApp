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

import type { CircleMember, CirclePost, PartnerMessage, WeeklyContent, LiveCall } from '@/lib/circle'
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

// ─── COHORT MEMBER ROSTER (for Community feed authorship) ───────────────────

export const MOCK_COHORT_AUTHORS: Record<string, { name: string; archetype: string }> = {
  'mock-user-1':        { name: 'You',        archetype: 'door'   }, // viewer
  'mock-author-jordan': { name: 'Jordan P.',  archetype: 'engine' },
  'mock-author-maya':   { name: 'Maya T.',    archetype: 'engine' },
  'mock-author-renee':  { name: 'Renée J.',   archetype: 'push'   },
  'mock-author-simone': { name: 'Simone K.',  archetype: 'throne' },
  'mock-author-alicia': { name: 'Alicia W.',  archetype: 'door'   },
  'mock-author-tamara': { name: 'Tamara B.',  archetype: 'throne' },
  'mock-author-nicole': { name: 'Nicole',     archetype: 'door'   }, // coach
}

// ─── COMMUNITY POSTS ────────────────────────────────────────────────────────

function hoursAgo(h: number): string { return new Date(now - h * 3600_000).toISOString() }
function daysAgo(d: number): string  { return new Date(now - d * DAY).toISOString() }

export const MOCK_POSTS: CirclePost[] = [
  {
    id: 'mock-post-1',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-nicole',
    post_type: 'coach_note',
    week_number: 3,
    body:
      "Week 3, Circle. This is the week a lot of you will want to start skipping the Monday voice note. Don't. The practice isn't the content — it's the showing up. Keep it short. Keep it honest.",
    audio_url: null,
    created_at: hoursAgo(2),
    author: { name: 'Nicole', avatar_url: null },
    reactions: [
      { emoji: '❤️', count: 5, user_reacted: true },
      { emoji: '🔥', count: 2, user_reacted: false },
      { emoji: '💪', count: 3, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-2',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-renee',
    post_type: 'wins',
    week_number: 2,
    body:
      "Friday win: said no to a client call that would've run into my kid's pickup. No apology, no long explanation. Just 'I can't do 4pm — how about Tuesday?' Felt weird. Felt right.",
    audio_url: null,
    created_at: hoursAgo(18),
    author: { name: 'Renée J.', avatar_url: null },
    reactions: [
      { emoji: '🔥', count: 4, user_reacted: true },
      { emoji: '👏', count: 3, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-3',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-simone',
    post_type: 'monday_prompt',
    week_number: 3,
    body:
      "Monday voice note theme (text version, I couldn't bring myself to record): the pattern I keep spinning on is saying I'll 'decide tomorrow' about things I've already decided. I'm not indecisive — I'm avoiding the part where I tell someone no.",
    audio_url: null,
    created_at: daysAgo(1),
    author: { name: 'Simone K.', avatar_url: null },
    reactions: [
      { emoji: '✨', count: 2, user_reacted: false },
      { emoji: '❤️', count: 1, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-4',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-maya',
    post_type: 'general',
    week_number: 3,
    body:
      "Is anyone else finding that naming the pattern out loud actually makes it harder to keep doing? Like — I literally caught myself mid-override this morning and just… stopped. I've never been able to do that before.",
    audio_url: null,
    created_at: daysAgo(1),
    author: { name: 'Maya T.', avatar_url: null },
    reactions: [
      { emoji: '❤️', count: 6, user_reacted: true },
      { emoji: '✨', count: 4, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-5',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-alicia',
    post_type: 'wins',
    week_number: 2,
    body:
      "My Friday win: I let my partner handle dinner and the kids' bath without stepping in to 'fix' his version of it. The kids are fine. The kitchen is messier than I'd like. I'm sitting on the couch writing this instead of cleaning.",
    audio_url: null,
    created_at: daysAgo(2),
    author: { name: 'Alicia W.', avatar_url: null },
    reactions: [
      { emoji: '👏', count: 7, user_reacted: false },
      { emoji: '🔥', count: 2, user_reacted: false },
      { emoji: '💪', count: 1, user_reacted: true },
    ],
  },
  {
    id: 'mock-post-6',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-tamara',
    post_type: 'general',
    week_number: 2,
    body:
      "The 'write it, then underline the one sentence that's most true' exercise from week 1 is living in my head rent-free. I keep going back and re-underlining different sentences. I think that's the point.",
    audio_url: null,
    created_at: daysAgo(2),
    author: { name: 'Tamara B.', avatar_url: null },
    reactions: [
      { emoji: '✨', count: 3, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-7',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-jordan',
    post_type: 'partner_checkin',
    week_number: 2,
    body:
      "Partner check-in going well so far — we agreed to a weekly Wednesday voice exchange instead of daily texts. Already way less overwhelming for both of us.",
    audio_url: null,
    created_at: daysAgo(3),
    author: { name: 'Jordan P.', avatar_url: null },
    reactions: [
      { emoji: '❤️', count: 2, user_reacted: true },
    ],
  },
  {
    id: 'mock-post-8',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-nicole',
    post_type: 'coach_note',
    week_number: 1,
    body:
      "Reminder: this is a 90-day container, not a sprint. If you miss a check-in or a prompt, don't drop out. Just show up the next day. The pattern you're breaking is the all-or-nothing one too.",
    audio_url: null,
    created_at: daysAgo(7),
    author: { name: 'Nicole', avatar_url: null },
    reactions: [
      { emoji: '❤️', count: 8, user_reacted: true },
      { emoji: '👏', count: 4, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-9',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-maya',
    post_type: 'wins',
    week_number: 1,
    body:
      "Small win: I did the 5-minute floor. That's it. Felt silly, like 'this doesn't count.' But I did it four days in a row and that's more consistency than I've had in months.",
    audio_url: null,
    created_at: daysAgo(8),
    author: { name: 'Maya T.', avatar_url: null },
    reactions: [
      { emoji: '🔥', count: 5, user_reacted: true },
      { emoji: '💪', count: 3, user_reacted: false },
      { emoji: '❤️', count: 2, user_reacted: false },
    ],
  },
  {
    id: 'mock-post-10',
    cohort_id: MOCK_COHORT.id,
    author_id: 'mock-author-simone',
    post_type: 'general',
    week_number: 1,
    body:
      "Hi everyone — Simone, throne archetype, enneagram 5. I'm here because I've been 'about to start' my business for four years. My 90-day focus is: make decisions without spiraling for days.",
    audio_url: null,
    created_at: daysAgo(11),
    author: { name: 'Simone K.', avatar_url: null },
    reactions: [
      { emoji: '❤️', count: 6, user_reacted: false },
      { emoji: '✨', count: 3, user_reacted: false },
    ],
  },
]

// ─── PARTNER THREAD ──────────────────────────────────────────────────────────
// Wednesday partner check-ins with Jordan P. Viewer user_id = mock-user-1,
// partner user_id = mock-user-jordan. Flow:
//   - Intro exchange in week 1
//   - Wednesday check-in in week 2 responding to the "cost of overriding" prompt
//   - Casual follow-up earlier this week

export const MOCK_PARTNER_USER_ID = 'mock-user-jordan'

export const MOCK_PARTNER_THREAD: PartnerMessage[] = [
  {
    id: 'mock-msg-1',
    sender_id: MOCK_PARTNER_USER_ID,
    receiver_id: MOCK_MEMBER.user_id,
    body:
      "Hey! Jordan here — just got paired with you. Interrupted Engine, enneagram 9, I'm in Chicago. My 90-day focus is finishing the business plan I keep restarting. Looking forward to doing this together.",
    audio_url: null,
    read_at: new Date(now - 12 * DAY).toISOString(),
    created_at: new Date(now - 12 * DAY).toISOString(),
  },
  {
    id: 'mock-msg-2',
    sender_id: MOCK_MEMBER.user_id,
    receiver_id: MOCK_PARTNER_USER_ID,
    body:
      "Hi Jordan! Open Door, enneagram 2, in Atlanta. Mine is 'stop saying yes before I check with myself.' Wednesdays work for our voice exchange — does 7pm your time work?",
    audio_url: null,
    read_at: new Date(now - 12 * DAY).toISOString(),
    created_at: new Date(now - 12 * DAY + 20 * 60_000).toISOString(),
  },
  {
    id: 'mock-msg-3',
    sender_id: MOCK_PARTNER_USER_ID,
    receiver_id: MOCK_MEMBER.user_id,
    body: "7pm Central works. Cool. See you Wednesday.",
    audio_url: null,
    read_at: new Date(now - 12 * DAY).toISOString(),
    created_at: new Date(now - 12 * DAY + 35 * 60_000).toISOString(),
  },
  {
    id: 'mock-msg-4',
    sender_id: MOCK_PARTNER_USER_ID,
    receiver_id: MOCK_MEMBER.user_id,
    body:
      "Wednesday check-in, week 2 — cost of overriding. For me it's been the business plan. Every time I restart I'm paying in momentum and self-trust. I can see the cost clearly now and it's making it harder to do the restart move.",
    audio_url: null,
    read_at: new Date(now - 6 * DAY).toISOString(),
    created_at: new Date(now - 6 * DAY).toISOString(),
  },
  {
    id: 'mock-msg-5',
    sender_id: MOCK_MEMBER.user_id,
    receiver_id: MOCK_PARTNER_USER_ID,
    body:
      "That's huge. What I noticed this week is my overgiving has been paying for other people's comfort with their own unfinished emotional work. My sister, mostly. If I stop filling the gap, she might have to face it herself. That feels uncomfortable — and important.",
    audio_url: null,
    read_at: new Date(now - 6 * DAY).toISOString(),
    created_at: new Date(now - 6 * DAY + 45 * 60_000).toISOString(),
  },
  {
    id: 'mock-msg-6',
    sender_id: MOCK_PARTNER_USER_ID,
    receiver_id: MOCK_MEMBER.user_id,
    body:
      "Yeah. And that's the part the people around us don't want us to see. Let me know how it goes with your sister this week if you want.",
    audio_url: null,
    read_at: new Date(now - 6 * DAY).toISOString(),
    created_at: new Date(now - 6 * DAY + 60 * 60_000).toISOString(),
  },
  {
    id: 'mock-msg-7',
    sender_id: MOCK_MEMBER.user_id,
    receiver_id: MOCK_PARTNER_USER_ID,
    body:
      "Quick update — she asked me to pick up my niece Friday (again). I said 'I can't this week, but Sunday afternoon works if that helps.' No long explanation. She was quiet for a second and said ok. That's it. But I felt different after.",
    audio_url: null,
    read_at: new Date(now - 2 * DAY).toISOString(),
    created_at: new Date(now - 2 * DAY).toISOString(),
  },
  {
    id: 'mock-msg-8',
    sender_id: MOCK_PARTNER_USER_ID,
    receiver_id: MOCK_MEMBER.user_id,
    body: "That's the move. Proud of you. I'm at the laptop right now, first time in 3 weeks. We'll see how long it lasts but I'm here.",
    audio_url: null,
    read_at: new Date(now - 2 * DAY).toISOString(),
    created_at: new Date(now - 2 * DAY + 12 * 60_000).toISOString(),
  },
]

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
