// Starter content for The Circle — Weeks 1 & 2 across all five tracks
// (universal + door / throne / engine / push). Loaded from the admin
// page via a "Load starter content" button; the admin can edit it in
// the JSON textarea before upserting into circle_weekly_content for
// the selected cohort.
//
// Convention (matches getWeekContent + week/[week] page):
//   universal track → teaching + monday_prompt + wednesday_prompt + friday_prompt
//   archetype track → journal_prompt + weekly_action

export type WeeklyContentSeed = {
  week_number: number
  archetype: 'universal' | 'door' | 'throne' | 'engine' | 'push'
  month_name: 'root' | 'rebuild' | 'rise'
  week_title: string
  teaching?: string
  journal_prompt?: string
  weekly_action?: string
  monday_prompt?: string
  wednesday_prompt?: string
  friday_prompt?: string
  live_call_week?: boolean
}

export const CIRCLE_STARTER_CONTENT: WeeklyContentSeed[] = [
  // ─── WEEK 1 · ROOT · THE GROUND YOU ACTUALLY STAND ON ──────────────────────
  {
    week_number: 1,
    archetype: 'universal',
    month_name: 'root',
    week_title: 'The ground you actually stand on',
    teaching:
`Before anything changes, we have to look at what's already here.

This week isn't about fixing. It's about naming. The patterns you want to shift don't live in theory — they live in your actual days, your actual relationships, the specific moments you've been overriding yourself.

Over the next 90 days you'll be building something new. But first we need a clear map of where you're starting from. Not the performed version. The real one.

Three practices this week:

1. Notice. Every time you override your own "no" this week — say yes when you meant no, push through when you needed rest, agreed to something you didn't actually want — write it down. Don't fix it yet. Just name it.

2. Share one with your partner on Wednesday. Not the worst one. Just one. The practice is letting someone else see you without the polish.

3. Bring one win on Friday. Small counts. The practice is noticing what's already working.`,
    monday_prompt:
`Record a 2–3 minute voice note: What is the specific pattern or override you most want to name this week? Be concrete — not "I overgive" but "I say yes to my sister's requests before I check with myself."`,
    wednesday_prompt:
`Message your partner with one example from this week where you caught yourself overriding your own no. Don't edit it for delivery. Just describe what happened.`,
    friday_prompt:
`Post one win to the community — a moment this week where you honored yourself instead of overriding. Boundary, rest, truth-telling, rest, whatever it was. Small is welcome. The practice is noticing.`,
    live_call_week: true,
  },
  {
    week_number: 1,
    archetype: 'door',
    month_name: 'root',
    week_title: 'The ground you actually stand on',
    journal_prompt:
`Write about the last time you said yes when you meant no. Where did you feel it first — jaw, chest, stomach? What did you tell yourself about why the yes was the "right" answer? And what would you have done if you'd let yourself not give?`,
    weekly_action:
`Choose one low-stakes ask this week — someone asking for your time, energy, or attention — and give yourself a 24-hour rule before answering. You do not need to explain the delay. "Let me get back to you tomorrow" is a complete sentence.`,
  },
  {
    week_number: 1,
    archetype: 'throne',
    month_name: 'root',
    week_title: 'The ground you actually stand on',
    journal_prompt:
`Write about a decision you've been turning over for more than 72 hours. Get all of it out — every angle, every fear, every version. Then underline the one sentence that feels the most true. Just the one.`,
    weekly_action:
`Pick one decision you've been analyzing and give yourself 10 minutes and a timer. When the timer ends, choose. You do not need to be right. You need to practice moving. Notice what the mind does in the hours after.`,
  },
  {
    week_number: 1,
    archetype: 'engine',
    month_name: 'root',
    week_title: 'The ground you actually stand on',
    journal_prompt:
`Write about the last time your momentum got interrupted — a sick kid, a bad week at work, anything. What was the story you told yourself when you couldn't do the thing? What did you do instead of starting over?`,
    weekly_action:
`Choose one practice you've been doing in "all or nothing" mode and scale it down to a 5-minute floor this week. 5-minute walk. 5-minute journal. 5-minute stretch. The point isn't the minutes. The point is proving to yourself the engine runs in ordinary conditions.`,
  },
  {
    week_number: 1,
    archetype: 'push',
    month_name: 'root',
    week_title: 'The ground you actually stand on',
    journal_prompt:
`Write about a signal your body has been sending you that you've been overriding. Fatigue, tightness, a dread, a knot somewhere. When did it first show up? What did you do instead of listening?`,
    weekly_action:
`Pick one body signal you noticed this week and schedule a direct response to it — a nap, a canceled meeting, a walk at lunch, going to bed an hour earlier. Put it on the calendar. Treat it like any other commitment.`,
  },

  // ─── WEEK 2 · ROOT · THE COST OF OVERRIDING ────────────────────────────────
  {
    week_number: 2,
    archetype: 'universal',
    month_name: 'root',
    week_title: 'The cost of overriding',
    teaching:
`Last week you named what you've been overriding. This week we look at what the overriding costs.

Every time you ignore a no, a need, a body signal, a truth — there's a price. It gets paid somewhere. In your sleep, your resentment, your capacity for joy, your relationships, your health. The pattern doesn't hold itself up for free.

The reason we don't usually look at the cost is that naming it makes the pattern harder to keep doing. That's the point.

This week: look honestly at what your override pattern has been paying for, and who has been paying. Not to shame yourself. To stop pretending it's free.`,
    monday_prompt:
`Record a voice note: What has your most-named override pattern actually cost you — in the last year, or the last decade? Be specific. Missed sleep, missed connection, missed health, missed opportunities, missed versions of yourself.`,
    wednesday_prompt:
`Message your partner: tell them one thing the pattern has cost that you haven't fully admitted out loud before. They aren't there to fix it — just to witness it.`,
    friday_prompt:
`Post one win: a moment this week where you chose the short-term discomfort of honoring yourself over the long-term cost of overriding. Even a small one.`,
    live_call_week: false,
  },
  {
    week_number: 2,
    archetype: 'door',
    month_name: 'root',
    week_title: 'The cost of overriding',
    journal_prompt:
`What have the people who benefit from your yes never had to face because you never made them? This isn't about blame. It's about seeing clearly what your overgiving has shielded others from.`,
    weekly_action:
`Identify one relationship where you've been doing 80% of the emotional or logistical labor. This week, do 50%. Don't announce it, don't negotiate it. Just stop filling the gap and see what happens.`,
  },
  {
    week_number: 2,
    archetype: 'throne',
    month_name: 'root',
    week_title: 'The cost of overriding',
    journal_prompt:
`What opportunities, conversations, or relationships have passed you by while you were "still thinking about it"? Name three. Don't soften them. The overthinking is paid for by the thing you didn't do.`,
    weekly_action:
`Pick one thing you've been "still deciding on" for more than two weeks. Decide this week. Send the message, book the call, make the choice. Not because it's right. Because the deciding itself is the practice.`,
  },
  {
    week_number: 2,
    archetype: 'engine',
    month_name: 'root',
    week_title: 'The cost of overriding',
    journal_prompt:
`When your engine stops, what do you make it mean about you? Write the exact sentences. "I'm the person who…" "I always…" These are the stories doing the actual damage — not the pause.`,
    weekly_action:
`This week, when you hit a day where the full version of your practice isn't possible, do the 5-minute floor without beating yourself up for not doing more. Note in your journal how you talked to yourself. The practice is the self-talk, not the minutes.`,
  },
  {
    week_number: 2,
    archetype: 'push',
    month_name: 'root',
    week_title: 'The cost of overriding',
    journal_prompt:
`What has the pushing through cost your body in the last year? Name specific things — sleep debt, a persistent ache, a medication, an injury you ignored. The body keeps receipts. What are yours?`,
    weekly_action:
`This week, build one rest block into your calendar before you need it. Not a recovery day after you've crashed — a preventative pause. 90 minutes, nothing scheduled, phone on do-not-disturb. Take it whether or not you feel tired.`,
  },
]
