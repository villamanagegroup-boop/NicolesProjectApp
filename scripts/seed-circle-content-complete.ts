// scripts/seed-circle-content-complete.ts
// ============================================================
// THE CIRCLE — Complete 90-day curriculum seed
// ALL 12 weeks × 5 tracks (universal + 4 archetypes) = 60 rows.
//
// HOW TO RUN (Node 20.6+ — required for --env-file)
//   1. Make sure SUPABASE_SERVICE_ROLE_KEY is in .env.local alongside
//      NEXT_PUBLIC_SUPABASE_URL.
//   2. From the project root:
//        node --env-file=.env.local --experimental-strip-types \
//          scripts/seed-circle-content-complete.ts
//      (or, if you have tsx installed:
//        npx tsx --env-file=.env.local scripts/seed-circle-content-complete.ts)
//
// SCHEMA MAPPING — what this script writes vs the source content fields
// (the actual DB column comes second):
//   phase                 -> month_name           ('root' | 'rebuild' | 'rise')
//   month_number          -> dropped              (redundant with month_name)
//   partner_prompt        -> wednesday_prompt     (the partner check-in day)
//   wins_prompt           -> friday_prompt        (the wins-share day)
//   is_live_call_week     -> live_call_week       (boolean only — schema has no live_call_number)
//   live_call_number      -> dropped              (not in schema; tracked in circle_live_calls)
//   published_at          -> dropped              (not in schema)
//   target table          -> circle_weekly_content (NOT circle_content)
//
// COHORT_ID: the unique constraint on circle_weekly_content is
// (cohort_id, week_number, archetype). NULL cohort_id won't dedupe — Postgres
// treats NULL as not-equal-to-NULL — so re-runs with COHORT_ID = null would
// duplicate rows. Default below points to the existing "Cohort 1 — Charter"
// from supabase/seed_circle.sql; change it for a different cohort.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.')
  console.error('Run with: node --env-file=.env.local --experimental-strip-types scripts/seed-circle-content-complete.ts')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// Default cohort — the existing charter cohort created by seed_circle.sql.
// Change this UUID to scope content to a different cohort. Do not set null
// unless you've also added a unique partial index that handles NULL.
const COHORT_ID: string = 'a0000000-0000-0000-0000-000000000001'

type SourceRow = {
  week_number: number
  month_number: 1 | 2 | 3
  archetype: 'universal' | 'door' | 'throne' | 'engine' | 'push'
  phase: 'root' | 'rebuild' | 'rise'
  week_title: string
  teaching?: string
  journal_prompt?: string
  weekly_action?: string
  partner_prompt?: string
  wins_prompt?: string
  is_live_call_week?: boolean
  live_call_number?: number
}

const content: SourceRow[] = [

  // ================================================================
  // MONTH 1 — ROOT (Weeks 1–4)
  // Central question: What is actually happening — and why?
  // ================================================================

  // ── WEEK 1 — The full picture ────────────────────────────────────

  {
    week_number: 1, month_number: 1, archetype: 'universal', phase: 'root',
    week_title: 'The full picture',
    teaching: `Your pattern is not your personality.

This week we make one essential distinction — the difference between who you are and what you learned to do. The pattern you carry was not born with you. It was built. It was built by a younger version of you who was navigating something real, and it was smart then. It worked.

The problem is not that you learned it. The problem is that it's still running in a context that no longer requires it.

You are not your pattern. You are the person who can finally see it clearly.

This week's only job is to see it. Not fix it. Not judge it. Just name it honestly for the first time.`,
    partner_prompt: 'Share one moment from this week where you saw your pattern show up. Not to fix it — just to say it out loud to someone safe.',
    wins_prompt: 'What is one thing you noticed about yourself this week that you have never named before?',
    is_live_call_week: true, live_call_number: 1,
  },
  {
    week_number: 1, month_number: 1, archetype: 'door', phase: 'root',
    week_title: 'The full picture',
    journal_prompt: 'Map your giving from the last 7 days. Who got your energy — your time, attention, help, or emotional presence? Was each one asked for or did you offer it before being asked? What happened in your body each time you gave — relief, resentment, warmth, depletion, nothing at all? Do not judge what you find. Just map it honestly.',
    weekly_action: 'For 7 days, before you give anything — a response, a favor, a yes, your attention, your advice — pause for 3 full seconds first. You do not have to stop giving. You just have to notice the impulse exists before it exits. Write down how many times you catch the impulse each day. That count is the beginning of your awareness.',
  },
  {
    week_number: 1, month_number: 1, archetype: 'throne', phase: 'root',
    week_title: 'The full picture',
    journal_prompt: 'List every thought that has been looping this week — decisions you have not made, conversations you have replayed, scenarios you have been running in your head. At the end of the list, mark each one: is this actually in my control right now? Circle the ones that are. Look at everything that is not circled. That is your surveillance system running without a real threat.',
    weekly_action: 'When a thought replays more than once today, write it down in one sentence. Underneath write: "I have recorded this. It does not need to repeat." Then close the journal and walk away. Practice this once each day this week. The thought will come back — that is the pattern testing you. You do not have to take the bait.',
  },
  {
    week_number: 1, month_number: 1, archetype: 'engine', phase: 'root',
    week_title: 'The full picture',
    journal_prompt: 'List every major thing you have started and restarted in the last year. A goal, a habit, a project, a plan, a routine. Next to each one, write not why you stopped — but what it felt like emotionally to have to start again. Shame? Frustration? A quiet giving-up? A loss of belief? The emotional cost of restarting is where the real damage lives, not the lost time.',
    weekly_action: 'Identify the one thing you have restarted most often. This week, show up to it for 10 minutes every single day. Not more. Just 10 minutes. You are not rebuilding the result. You are rebuilding the relationship with yourself around that thing. Track each day you show up.',
  },
  {
    week_number: 1, month_number: 1, archetype: 'push', phase: 'root',
    week_title: 'The full picture',
    journal_prompt: 'Sit quietly for 3 minutes. Starting from your feet, scan slowly upward through your entire body. Write down every physical sensation you notice — tension, heaviness, tightness, numbness, pain you have normalized, places that feel empty. This is your body\'s current report. When did these sensations start? How long have you been carrying this without telling anyone, including yourself?',
    weekly_action: 'Set three phone alarms today at random times. When each one goes off, stop whatever you are doing and answer: what is my body telling me right now? Write three words for each alarm. Do this every day for the week. You are building a body audit log — the very first step in learning to listen to what has been speaking to you for years.',
  },

  // ── WEEK 2 — The origin ──────────────────────────────────────────

  {
    week_number: 2, month_number: 1, archetype: 'universal', phase: 'root',
    week_title: 'The origin',
    teaching: `You learned this somewhere.

Before we go further I want to say something directly: this is not about blame. Not toward your parents, not toward the people who shaped your earliest environments, not toward anyone who did not know what they were doing to you by doing what they did.

But the pattern you carry did not come from nowhere.

A younger version of you was navigating something real — a home environment, a relationship dynamic, a season of life where this behavior kept things okay. And they learned it. And it worked. The child who learned to always give learned that her value was in her usefulness. The child who stayed mentally alert learned that preparation prevented pain. The child who kept restarting learned that stopping felt like failing. The child who pushed through learned that needing things made her a burden.

Those children were doing the only thing they knew. This week, you see them clearly — and you begin to separate their survival strategy from your identity.`,
    partner_prompt: 'What did your pattern get you when you were younger — safety, love, control, approval, belonging? Tell your partner. This is the root.',
    wins_prompt: 'One act of compassion toward the version of you who learned this pattern. What would you say to her if you could?',
    is_live_call_week: false,
  },
  {
    week_number: 2, month_number: 1, archetype: 'door', phase: 'root',
    week_title: 'The origin',
    journal_prompt: 'Who first taught you that being needed was how you stayed safe, loved, or valued? Write about that relationship or environment — not with blame, but with honesty. What did giving get you then that felt essential to your survival or belonging? Was it a parent\'s approval? A friendship that required you to be useful? A home where your needs caused problems? How much of that original trade is still running quietly in the background of your life today?',
    weekly_action: 'Delay one response each day by 30 or more minutes — a message, a request, a favor you would normally jump to immediately. While it sits, notice what comes up in your body. Guilt? Relief? Anxiety? Fear that something will fall apart? Write down what you feel each time. That feeling is showing you exactly what you have been managing with your constant availability.',
  },
  {
    week_number: 2, month_number: 1, archetype: 'throne', phase: 'root',
    week_title: 'The origin',
    journal_prompt: 'When did constant mental activity first feel like safety? Was there an environment where being mentally prepared meant you could anticipate the next difficult or painful thing before it arrived? Describe that environment in specific detail — what was unpredictable, who was unpredictable, what your mind was protecting you from. The Overthink Throne was not built because you were broken. It was built because something required it.',
    weekly_action: 'Make one decision per day this week in under 60 seconds — any decision, small is fine. What to eat, what to wear, which task to start with, which message to send. Notice how the world responds. Notice that nothing breaks. By the end of the week you will have a record of 7 decisions made without over-preparation. That record is the beginning of new evidence.',
  },
  {
    week_number: 2, month_number: 1, archetype: 'engine', phase: 'root',
    week_title: 'The origin',
    journal_prompt: 'Think of a time in the last two years when you were genuinely in momentum — working toward something and feeling good about your progress. Describe it in specific detail: what were you working on, what time of day, what was your environment like, what had you done the night before, who knew what you were doing, what made you feel locked in. You are mapping your personal flow blueprint. It is specific to you and it is real data.',
    weekly_action: 'Recreate one condition from your flow blueprint today. Work on anything in that condition — the output does not matter. The point is to remind your nervous system what momentum feels like. It remembers. Let it remember. Write down how it felt compared to when you are not in those conditions.',
  },
  {
    week_number: 2, month_number: 1, archetype: 'push', phase: 'root',
    week_title: 'The origin',
    journal_prompt: 'When did you first learn that stopping was not safe — that needing rest made you lazy, or weak, or a burden, or too much? Describe that environment or relationship with compassion for the child who learned it. She was not wrong for learning it. What did pushing through get her then that felt worth the cost? And what has it cost her since?',
    weekly_action: 'Stop one task earlier than you normally would — every day this week. Before you hit the wall. Before the exhaustion arrives. Before you have squeezed every drop. Stop while there is still something left in you. Notice the discomfort of stopping early. Write about it each day. That discomfort is the old programming. You are not obeying it anymore.',
  },

  // ── WEEK 3 — The cost ────────────────────────────────────────────

  {
    week_number: 3, month_number: 1, archetype: 'universal', phase: 'root',
    week_title: 'The cost',
    teaching: `Let's make the cost real.

We have named the pattern. We have traced it back. Now we do the hardest thing: we stop abstracting the damage and look at it directly.

Not "this pattern has affected my relationships" — but: which specific relationship, what specifically happened, what did you lose.

Not "this has affected my health" — but: which symptoms, which seasons of depletion, which moments your body sent an emergency signal you overrode.

Not "this has cost me opportunities" — but: which opportunity, which year, which version of a life you did not live.

This week is not comfortable. It is not supposed to be. The emotional reckoning that happens when the cost becomes specific and real is exactly what creates the momentum for Month 2. You cannot fully commit to change until you have let yourself feel what staying the same has actually cost you.

This is that week.`,
    partner_prompt: 'Tell your partner one specific thing your pattern has cost you. Not a category — a specific moment, person, or opportunity. Make it real and let them witness it.',
    wins_prompt: 'What became clear this week that you have not fully let yourself see before?',
    is_live_call_week: true, live_call_number: 2,
  },
  {
    week_number: 3, month_number: 1, archetype: 'door', phase: 'root',
    week_title: 'The cost',
    journal_prompt: 'What has being over-accessible cost you? Write three specific things — not categories. A specific friendship that became one-directional and you stayed in it anyway. A specific opportunity you were too depleted to take. A specific version of yourself — a creative, a dreamer, a rested person — that you put on hold because someone else always needed something first. Make each one concrete and real on the page.',
    weekly_action: 'Say "let me get back to you" at least once per day this week — to someone, for something. Track every time you use it and every reaction you get, including your own internal reaction. Notice whether the world falls apart when you are not immediately available. Notice whether people are actually fine. Notice how you feel in your body when you hold the pause.',
  },
  {
    week_number: 3, month_number: 1, archetype: 'throne', phase: 'root',
    week_title: 'The cost',
    journal_prompt: 'Name three specific things your overthinking has cost you. A conversation you rehearsed instead of having. A move you did not make because you were still preparing for it. A version of yourself you kept postponing until the conditions were right — and the conditions never were. Write each one with full honesty. Do not minimize them. Let them be what they are.',
    weekly_action: 'Take one imperfect action this week on something you have been thinking about for more than 30 days. Not finished — started. Existing in the world outside your head. Send the draft. Make the appointment. Write the first paragraph. Take the step. Write about what happened immediately after — not later, right after. The imperfect action always has more information in it than the perfect plan.',
  },
  {
    week_number: 3, month_number: 1, archetype: 'engine', phase: 'root',
    week_title: 'The cost',
    journal_prompt: 'Every restart has broken a small promise to yourself. Name three specific broken promises from the past year — not projects, but promises. "I told myself I would finally ___." Write them out slowly. Then ask yourself honestly: what has the accumulation of these broken self-promises done to your belief in yourself? Not your capability — your belief. There is a difference.',
    weekly_action: 'Make one small promise to yourself today and keep it by tonight. Not a big one. An embarrassingly small one. One deposit per day this week — seven deposits total. You are not building a habit yet. You are rebuilding the account. Each kept promise is evidence that you are someone who follows through. Start collecting the evidence.',
  },
  {
    week_number: 3, month_number: 1, archetype: 'push', phase: 'root',
    week_title: 'The cost',
    journal_prompt: 'What has the pushthrough cost you physically? Name specific symptoms you have normalized — the headaches you manage through, the tension that lives in your shoulders, the sleep that never fully restores you, the illness that arrives every time you finally stop. Name specific seasons of depletion. Name specific moments your body sent an emergency signal you overrode. Write them without minimizing. Then ask: what has it cost you in presence — how much of your own life have you been too depleted to actually experience?',
    weekly_action: 'Respond to one body signal per day in real time — before it becomes an emergency. Drink water when you are thirsty, not when your head is pounding. Rest when you are tired, not when you collapse. Eat when you are hungry, not when you are desperate. One real-time response per day. Track it. You are practicing a response time that has never been part of your operating system.',
  },

  // ── WEEK 4 — The decision ────────────────────────────────────────

  {
    week_number: 4, month_number: 1, archetype: 'universal', phase: 'root',
    week_title: 'The decision',
    teaching: `This is the moment you decide.

Not the moment you hope to change. Not the moment you plan to. The moment you decide.

There is a specific feeling that comes with a real decision — different from wanting to change, different from knowing you need to. A decision has a weight to it. A finality. It lands somewhere in the body, not just the mind.

You have spent four weeks looking at your pattern from every angle. You know what it is. You know where it came from. You know exactly what it has cost you. There is nothing left to understand.

All that is left is the decision.

Month 2 begins next week. The work shifts from seeing the pattern to interrupting it — in real time, repeatedly, in your actual life. That work requires a foundation. The foundation is the moment you decide.

This week you make it.`,
    partner_prompt: 'Tell your partner the decision you are making going into Month 2. One sentence. Specific. Have them say it back to you. Be witnessed.',
    wins_prompt: 'Month 1 close. What are you most proud of from these four weeks — not what you did, but who you became?',
    is_live_call_week: false,
  },
  {
    week_number: 4, month_number: 1, archetype: 'door', phase: 'root',
    week_title: 'The decision',
    journal_prompt: 'Write your decision statement: "I am done with ___. Starting now, I choose ___." Both halves must be specific to your exact pattern — not generic. Not "I am done giving too much." What specifically are you done with? What specifically are you choosing instead? This statement is your Month 2 anchor. When the pattern fights back — and it will — this is what you return to.',
    weekly_action: 'Share your decision statement with your accountability partner. Say it out loud. Let them witness it. Then ask them to hold you to it specifically over the next 30 days — not generally, but to this exact statement. Spoken decisions that are witnessed land differently than private intentions. That is the whole point of this action.',
  },
  {
    week_number: 4, month_number: 1, archetype: 'throne', phase: 'root',
    week_title: 'The decision',
    journal_prompt: 'Write your Month 2 declaration: "I am done thinking instead of living. When I feel the urge to overthink ___, my new move is ___." Fill both blanks with specifics that apply to your exact situation — not a generic statement, but the words that will actually mean something when you are in the spiral at 11pm. Write it as a reminder to your future self, not a performance for anyone else.',
    weekly_action: 'Share your declaration with your accountability partner and ask them to name one thing they have observed you thinking about instead of doing — based on what you have shared this month. Let their answer be information. Let it show you a blind spot. Thank them for it even if it stings a little.',
  },
  {
    week_number: 4, month_number: 1, archetype: 'engine', phase: 'root',
    week_title: 'The decision',
    journal_prompt: 'Write your Month 2 declaration: "I am done restarting from zero. My new pattern is ___. When life interrupts, my minimum move is ___." Both halves need to be specific enough that you can act on them tomorrow morning without having to think about what they mean. The minimum move especially — make it embarrassingly small. That is the version you protect when everything else falls apart.',
    weekly_action: 'Tell your accountability partner your minimum viable move — the version of showing up that takes 10 minutes but still counts. Write it out for them specifically: "My minimum move for ___ is ___." Ask them to check in with you about that specific version every Wednesday — not about how much you did, but whether you did the minimum.',
  },
  {
    week_number: 4, month_number: 1, archetype: 'push', phase: 'root',
    week_title: 'The decision',
    journal_prompt: 'Write a letter to your body. Acknowledge what you have asked it to carry over the years. Tell it what you learned this month. Make a specific commitment — not a list of habits, but a relationship promise. What are you committing to from here? What will you stop asking it to do without first asking what it needs? Write it as something you mean, not something that sounds right.',
    weekly_action: 'Read your body letter to your accountability partner out loud. The full letter. This act of being witnessed — in the specific weight of what you have carried and the specific promise you are making to change it — is one of the most powerful things a Pushthrough can do. Let someone hear what you have decided. Let it be real in the world, not just in your journal.',
  },

  // ================================================================
  // MONTH 2 — REBUILD (Weeks 5–8)
  // Central question: What does interrupting the pattern look like, repeatedly?
  // ================================================================

  // ── WEEK 5 — The first real interruption ────────────────────────

  {
    week_number: 5, month_number: 2, archetype: 'universal', phase: 'rebuild',
    week_title: 'The first real interruption',
    teaching: `The first real interruption feels wrong — on purpose.

This week the work shifts. You are no longer just watching the pattern. You are interrupting it — in real time, in your actual life, with actual people.

Here is what I need you to know before you try: the interruption will feel wrong. It will feel uncomfortable, selfish, foreign, maybe even dangerous. That feeling is not a sign you are doing something wrong. That feeling is the pattern losing its grip. The more wrong it feels to check in with yourself first, to act before you are ready, to keep going after an interruption, to stop before the wall — the more right it is.

The discomfort is the data. You are doing exactly what you came here to do.

Your job this week is not to do it perfectly. It is to do it once. One real interruption. And to notice what happens on the other side of it.`,
    partner_prompt: 'Share one moment this week where you interrupted your pattern — even briefly, even imperfectly. What did it feel like in your body? What happened after?',
    wins_prompt: 'Name one moment this week where you chose differently. Not perfectly — differently. That counts completely.',
    is_live_call_week: true, live_call_number: 3,
  },
  {
    week_number: 5, month_number: 2, archetype: 'door', phase: 'rebuild',
    week_title: 'The first real interruption',
    journal_prompt: 'This week you are going to say no — or delay — to something you would normally absorb immediately. Before you do it: write about the fear. What do you think will happen if you pause? What are you afraid of losing or breaking? After you do it: write about what actually happened. Was the fear accurate? Compare the two entries honestly. The gap between the fear and the reality is the pattern showing you how it has been running you.',
    weekly_action: 'Check in with yourself before every yes this week. Three seconds minimum before any response leaves your body. The rule: no automatic yeses. Every yes must pass through a brief internal question — "Do I actually want to do this right now?" Track how many chosen yeses you give versus how many automatic ones you catch yourself about to give. The catching is the work.',
  },
  {
    week_number: 5, month_number: 2, archetype: 'throne', phase: 'rebuild',
    week_title: 'The first real interruption',
    journal_prompt: 'Pick one thing you have been thinking about for more than two weeks without acting. This week you are going to take one imperfect action on it. Before: write every reason your mind gives you for why it is not ready — every piece of missing information, every risk, every not-yet. After: write what actually happened when you moved anyway. What did you learn that you could not have learned from thinking about it any longer?',
    weekly_action: 'Every time you notice yourself in a thought spiral this week, use the interrupt: write the looping thought in one sentence, write "Decision:" underneath it, and make a decision about it in under 60 seconds. Even an imperfect decision. The decision ends the spiral. The spiral cannot survive a decision. Track how many spirals you interrupt this way.',
  },
  {
    week_number: 5, month_number: 2, archetype: 'engine', phase: 'rebuild',
    week_title: 'The first real interruption',
    journal_prompt: 'Your minimum viable move from Week 4 — have you used it this week? Write honestly about one moment where life interrupted and you had a choice: use the minimum version or stop entirely. What did you choose? If you used it, what did it feel like to show up in small form instead of not at all? If you stopped, what story did you tell yourself that made stopping feel like the only option?',
    weekly_action: 'Show up to your most-restarted thing every single day this week using the minimum version only. Seven consecutive days. Do not try to do more than the minimum on any day. Just the minimum, every day, without fail. By Day 7 you will have a streak. A streak is not just a count — it is a new story your brain is starting to tell about who you are.',
  },
  {
    week_number: 5, month_number: 2, archetype: 'push', phase: 'rebuild',
    week_title: 'The first real interruption',
    journal_prompt: 'Design your proactive rest practice. Not reactive rest — not "I will rest when I crash." What does deliberate, chosen rest look like for you specifically before you need it? What time? What form — quiet, movement, sleep, nature, creative? What conditions do you need? Write it as a specific protocol. Not an intention but a plan with enough detail that you could follow it tomorrow without deciding anything in the moment.',
    weekly_action: 'Take proactive rest every day this week — before you hit your threshold. Schedule it. Protect it as fiercely as you protect your most important tasks. If someone or something tries to take it, treat it as non-negotiable. This is not indulgence. It is the practice. The resistance you feel toward protecting it is exactly the pattern we are interrupting.',
  },

  // ── WEEK 6 — When it gets hard ───────────────────────────────────

  {
    week_number: 6, month_number: 2, archetype: 'universal', phase: 'rebuild',
    week_title: 'When it gets hard',
    teaching: `The pattern always fights back hardest right before it breaks.

I am going to be direct with you about Week 6: this is statistically the hardest week in any behavior change program. The initial motivation has worn off. The new behavior has not yet become automatic. The pattern is still familiar and the new way still feels foreign.

This is the week most people quietly return to what they know.

I want you to know that I know that — and I want you to know that the difficulty you are feeling right now is not a sign that the work is not working. It is the last defense of a pattern that is losing its hold.

The pattern always fights back hardest right before it breaks.

Do not stop now. Do not restart. Do not decide the program is not working. Just keep showing up in the minimum version. Keep making the one choice. Keep writing the one entry. The breakthrough is not coming — it is already happening, underneath the difficulty.`,
    partner_prompt: 'Where did your pattern almost win this week? Tell your partner specifically — not generally. What was the moment, what did it feel like, and what did you do?',
    wins_prompt: 'You made it through Week 6. That is the win. What are you proud of — even if the week felt messy or incomplete?',
    is_live_call_week: false,
  },
  {
    week_number: 6, month_number: 2, archetype: 'door', phase: 'rebuild',
    week_title: 'When it gets hard',
    journal_prompt: 'Where did over-giving almost win this week? Describe the specific moment — what was asked, what you felt, what you did. If the pattern won, write about that without shame: what made that moment harder than the others? What was the person, the dynamic, the fear that made the automatic yes feel like the only option? If the interruption won, write about what made it possible. What was different about that moment?',
    weekly_action: 'Protect two hours of unscheduled time for yourself this week — completely non-negotiably. No giving, no helping, no responding in those two hours. If someone reaches out: "I am unavailable right now and I will get back to you at [specific time]." No explanation of why. Practice being unavailable without justifying your unavailability. Notice what you feel during those two hours and write about it afterward.',
  },
  {
    week_number: 6, month_number: 2, archetype: 'throne', phase: 'rebuild',
    week_title: 'When it gets hard',
    journal_prompt: 'Where did the spiral almost win this week? What triggered it? How long did it run before you caught it? What finally interrupted it — was it exhaustion, a decision, a distraction, or a deliberate interrupt? If it ran all the way — write about that without judgment. You are building data, not a report card. What would you do differently in that specific moment if you could do it again?',
    weekly_action: 'Deliberately give your mind a one-hour break each day this week with no analyzing, problem-solving, or planning allowed. Movement, sensory experience, something creative with your hands. If a thought surfaces during the hour, let it pass without following it. You are not suppressing — just not chasing. Track how long you lasted and what came up. The resistance itself is information.',
  },
  {
    week_number: 6, month_number: 2, archetype: 'engine', phase: 'rebuild',
    week_title: 'When it gets hard',
    journal_prompt: 'Where did the urge to quit or restart show up this week? Describe the moment — what interrupted your momentum, what the internal story was ("I already broke the streak," "what is the point," "I will start fresh Monday"). Write the story down word for word. Then write the truth underneath it. What is actually true about your progress this week that the story was trying to erase?',
    weekly_action: 'Identify and remove one friction point from your most important daily action this week. What is the single thing that makes re-entry hardest — the open tab you have to navigate back to, the gym bag you have to find, the journal that is in another room? Eliminate it or shrink it. Friction is where momentum dies. It is almost always fixable with one small change.',
  },
  {
    week_number: 6, month_number: 2, archetype: 'push', phase: 'rebuild',
    week_title: 'When it gets hard',
    journal_prompt: 'Where did the pushthrough almost win this week? What was the signal your body sent — and what was the story your mind told to override it? Write the dialogue between them as honestly as you can. Your body said: ___. Your mind said: ___. What actually happened next? Whose voice was louder? And if you listened to your body — even once — what did that feel like compared to the override?',
    weekly_action: 'Slow your pace intentionally for one hour every day this week. Whatever you are doing that hour, do it at 70% of your normal speed. Walk more slowly. Eat without looking at anything. Drive without rushing. Respond to messages without hurrying. Notice what you see, feel, or hear when you are not racing through your own life. Write one observation each day.',
  },

  // ── WEEK 7 — Building the new default ───────────────────────────

  {
    week_number: 7, month_number: 2, archetype: 'universal', phase: 'rebuild',
    week_title: 'Building the new default',
    teaching: `You are becoming someone who does it differently — automatically.

Something has been shifting. You may have noticed it already — a moment where the old pattern did not show up the way it used to. A pause that happened without effort. A decision that got made without the usual spiral. A rest that was taken before the emergency.

That moment is not an accident. It is not luck. It is who you are becoming.

Identity shifts do not announce themselves loudly. They happen quietly, in small moments that are easy to miss if you are not looking for them. This week, look for them. Catch the moment the new way happened automatically. Name it. Write it down. Say it out loud to someone.

The shift is real. The evidence is already there. You just have to stop long enough to see it.`,
    partner_prompt: 'Tell your partner about a moment this week where the new way felt natural — not forced, not effortful, just the thing you did. If it has not happened yet, tell them what is getting easier.',
    wins_prompt: 'Share one concrete piece of evidence from this week that you are becoming someone different. Not feeling different — being different.',
    is_live_call_week: true, live_call_number: 4,
  },
  {
    week_number: 7, month_number: 2, archetype: 'door', phase: 'rebuild',
    week_title: 'Building the new default',
    journal_prompt: 'Has there been a moment this week where you checked in with yourself before giving — without having to remind yourself? Where the pause happened automatically, before the yes left your body? Write about that moment in detail. What were the conditions? What made it possible? If it has not happened yet — write about what is getting less automatic. Where is the reflex beginning to slow down?',
    weekly_action: 'Give yourself something this week that you would normally give to someone else first. The time, the attention, the care, the quality of presence. Not instead of them — before. Experience what it feels like to be first on your own list, even once, in one specific way. Write about what it felt like before, during, and after.',
  },
  {
    week_number: 7, month_number: 2, archetype: 'throne', phase: 'rebuild',
    week_title: 'Building the new default',
    journal_prompt: 'Has there been a decision this week you made without spiraling? A moment where you moved before your mind finished preparing? Write about it in as much detail as you can. What was the decision, what was the feeling right before you made it, and what happened after? You are documenting the new identity as it appears in real time. The more specifically you write about it, the more real it becomes.',
    weekly_action: 'Use your analytical mind on purpose this week: give it one specific useful problem for 30 focused minutes. Then deliberately close it down and walk away. Do something physical immediately after. Practice the on-off switch. You are training your mind to follow your direction instead of running continuously. Directed thinking followed by deliberate rest — that is the new relationship.',
  },
  {
    week_number: 7, month_number: 2, archetype: 'engine', phase: 'rebuild',
    week_title: 'Building the new default',
    journal_prompt: 'Has there been a moment this week where you kept going after an interruption automatically — without the internal debate about whether to restart or start fresh? Where continuing felt more natural than stopping? Write about it specifically. If it has not happened yet — describe the closest you came. Even almost continuing is different from automatically stopping. Note the difference.',
    weekly_action: 'Complete one thing fully this week — beginning, middle, and done. It can be small. A task, a project section, a communication, a creative piece. Something you start and finish in the same week. Feel what "done" feels like in your body when it actually arrives. Write about that feeling. You are building a new data point: I am someone who finishes things.',
  },
  {
    week_number: 7, month_number: 2, archetype: 'push', phase: 'rebuild',
    week_title: 'Building the new default',
    journal_prompt: 'Has there been a moment this week where you stopped before the wall — and it felt okay? Where rest felt like a choice rather than a surrender? Write about that moment. What allowed it? What was different about that moment versus the ones where the pushthrough won? If you have not had that moment yet — write about what would need to be true for stopping to feel safe enough to choose.',
    weekly_action: 'Do something this week that moves your body purely for pleasure — not for results, not for performance, not as another thing on the list to push through. Movement that you choose because it feels good in your body. Notice the difference between your body as a tool to be used and your body as a home to live in. Write about what you notice.',
  },

  // ── WEEK 8 — Month 2 integration ────────────────────────────────

  {
    week_number: 8, month_number: 2, archetype: 'universal', phase: 'rebuild',
    week_title: 'Month 2 integration',
    teaching: `Look at what you have built.

Eight weeks ago you arrived with a pattern you could barely name. Four weeks ago you named it, traced it, and felt its full cost. Four weeks of Month 2 and you have been interrupting it in real life — not perfectly, but repeatedly.

This week is a pause before Month 3. Not a break — a stocktake.

Pull out what you wrote in Week 1. Read it. Read who arrived here eight weeks ago. Then notice who is writing today.

The contrast is not small. The person who pauses before she gives was not there eight weeks ago. The person who made a decision without a two-hour spiral was not there. The person who showed up in 10 minutes instead of not at all was not there. The person who stopped before the wall, once, even for one day — was not there.

You built something real in eight weeks. Month 3 is where it becomes permanent.`,
    partner_prompt: 'Tell your partner the most significant shift you have made in the last 30 days. Then tell them the one thing that still has its grip on you. Month 3 is where that grip gets broken.',
    wins_prompt: 'Month 2 close. What does your life look like differently than it did 60 days ago? Name it specifically — in your relationships, your body, your work, your mind.',
    is_live_call_week: false,
  },
  {
    week_number: 8, month_number: 2, archetype: 'door', phase: 'rebuild',
    week_title: 'Month 2 integration',
    journal_prompt: 'Write a comparison: who was The Open Door at Week 1 versus who she is at Week 8? What does she do differently now that she did not do then? What does she no longer do automatically? What has she gotten back — what time, energy, peace, or version of herself has returned since she started choosing differently? Make it specific. This is your evidence.',
    weekly_action: 'Share your Week 1 versus Week 8 comparison with your accountability partner. After you share it, ask them to add what they have witnessed in you over the past two months that you might have missed or minimized. Let their observations land without deflecting them. Write down what they say.',
  },
  {
    week_number: 8, month_number: 2, archetype: 'throne', phase: 'rebuild',
    week_title: 'Month 2 integration',
    journal_prompt: 'Write your Month 2 evidence log. Not what you felt or intended — what you actually did. What decisions did you make this month without spiraling? What actions did you take before you were fully prepared? What did you close, finish, or complete that would have stayed open indefinitely before? Write it as a list of facts, not a list of feelings. The facts are the identity shift made visible.',
    weekly_action: 'Tell your accountability partner the three most significant actions you took in Month 2 that you would have been overthinking rather than doing a year ago. Three specific examples. Let them hear the concrete evidence. Then ask them: what do you see in me now that you did not see in our first conversation? Listen to the full answer.',
  },
  {
    week_number: 8, month_number: 2, archetype: 'engine', phase: 'rebuild',
    week_title: 'Month 2 integration',
    journal_prompt: 'Write your Month 2 evidence log. What did you actually do — not plan, not intend, not start and abandon — actually complete or continue consistently? List it all: the days you showed up in the minimum version, the streak you built, the thing you finished, the moment you kept going after an interruption. This is your self-trust ledger. Read it back to yourself slowly when you are done.',
    weekly_action: 'Share your Month 2 evidence log with your accountability partner. After you share it, ask them to read the whole list back to you out loud while you just listen. Do not explain or qualify anything while they read. Receiving your own proof through someone else\'s voice lands in a different place than reading it to yourself. Let it land.',
  },
  {
    week_number: 8, month_number: 2, archetype: 'push', phase: 'rebuild',
    week_title: 'Month 2 integration',
    journal_prompt: 'Compare: who was the Pushthrough at Week 1 versus who is here at Week 8? What does she listen to now that she used to override? What has she stopped requiring herself to earn? What has her body told her in the last 60 days that she actually heard and responded to? Write the comparison as a before and after — not of circumstances, but of relationship with yourself.',
    weekly_action: 'Share your body letter from Week 4 with your accountability partner — read it aloud in full. Then tell them what has changed since you wrote it. What promises have you kept to your body in Month 2? What is still in progress? Let them witness the relationship between you and your body evolving from where it was 60 days ago.',
  },

  // ================================================================
  // MONTH 3 — RISE (Weeks 9–12)
  // Central question: Who am I now — and how do I protect that?
  // ================================================================

  // ── WEEK 9 — Name the new identity ──────────────────────────────

  {
    week_number: 9, month_number: 3, archetype: 'universal', phase: 'rise',
    week_title: 'Name the new identity',
    teaching: `You are not who you were on Day 1.

This is not a motivational statement. It is a factual one based on the evidence of the last eight weeks.

The person who arrived here could not name her pattern clearly. Could not interrupt it with any consistency. Had never felt what it was like to do it differently even once.

The person writing today has named it, traced it, felt its full cost, and interrupted it repeatedly in real life over 30 days. That is a different person.

This week I am asking you to name her. Not aspirationally — not the person you hope to become. Descriptively. The person you already are based on what you have already proven.

"I am someone who ___." Fill that blank with things that are true right now based on evidence. Not future tense. Not "I am working on." Present tense. What is already true about you.

That is your new identity. And this month we make it permanent.`,
    partner_prompt: 'Tell your partner: "I am now someone who ___." Fill that blank with something specific and proven from the last 60 days. Have them confirm what they have witnessed.',
    wins_prompt: 'Post your identity statement to the community. "I am now someone who ___." Watch what happens when everyone does this together.',
    is_live_call_week: true, live_call_number: 5,
  },
  {
    week_number: 9, month_number: 3, archetype: 'door', phase: 'rise',
    week_title: 'Name the new identity',
    journal_prompt: 'Write your new identity statement in present tense: "I am someone who ___." Fill it with three specific behaviors you now do that the old Open Door did not. Not aspirations — facts. Things you have already done in the last eight weeks that prove this is who you are. Read what you have written. This is not who you are trying to become. This is who the evidence says you already are.',
    weekly_action: 'Live your new identity statement deliberately this week. At the start of each morning, read it. At the end of each day, write down one moment where you lived from it. Seven moments. Seven proofs. By the end of the week you will have a concrete record of the new identity operating in real life — not as aspiration but as fact.',
  },
  {
    week_number: 9, month_number: 3, archetype: 'throne', phase: 'rise',
    week_title: 'Name the new identity',
    journal_prompt: 'Write your new identity in present tense: "I am someone who ___." Three specific statements based on decisions you have made, actions you have taken, and spirals you have interrupted in the last eight weeks. You are no longer someone who thinks instead of lives. Write exactly who you are instead — with the specific evidence that makes each statement true right now, today.',
    weekly_action: 'Make one significant decision this week — something that matters, something you would have agonized over for weeks before this program — and make it within 24 hours of identifying it. Feel the difference in your body between deciding and deliberating. Write about that difference in detail afterward. This is what your relationship with your mind feels like now.',
  },
  {
    week_number: 9, month_number: 3, archetype: 'engine', phase: 'rise',
    week_title: 'Name the new identity',
    journal_prompt: 'Write your new identity in present tense: "I am someone who ___." Base it entirely on the evidence from the last eight weeks — things you actually did, kept, continued, and completed. Not who you are aiming to be. Who the evidence already proves you are. Read it back slowly. This is not a wishlist. This is a report on what has already happened.',
    weekly_action: 'Build your personal operating system this week: a one-page document with your specific flow conditions, your minimum viable move, and the one friction point you removed. Write it as instructions for yourself — specific enough that on a hard day, you can open this document and follow it without deciding anything. This is the system that replaces motivation.',
  },
  {
    week_number: 9, month_number: 3, archetype: 'push', phase: 'rise',
    week_title: 'Name the new identity',
    journal_prompt: 'Write your new identity in present tense: "I am someone who ___." Three specific statements based on how you have treated your body in the last eight weeks. What do you now do that the old Pushthrough never allowed herself? What have you proven is possible when you listen before you override? Write what is already true — not what you hope will be.',
    weekly_action: 'Design your sustainable rhythm — the daily structure that honors both your drive and your body. What time does she start? When does she rest, not because she crashed but because she chose it? What does she never skip? What has she stopped requiring herself to push through? Write it as a lifestyle design, specific enough to follow tomorrow.',
  },

  // ── WEEK 10 — Protect the new identity ──────────────────────────

  {
    week_number: 10, month_number: 3, archetype: 'universal', phase: 'rise',
    week_title: 'Protect the new identity',
    teaching: `The old pattern will try to come back.

Not because the work failed. Not because you failed. But because stress activates old wiring. Certain people, certain environments, certain kinds of pressure — they will pull the old self forward like a reflex. That is not regression. That is neuroscience.

The difference between someone who completed a program and someone who changed is not whether the old pattern ever resurfaces. It is whether they recognize it early enough to respond before it settles back in.

This week you build your early warning system. What are the first signs — not the full relapse, but the very first signal that the old way is creeping back? And what is your specific response protocol when you feel that signal?

You are not protecting against failure. You are protecting against the moment of forgetting — the moment where the old way feels like the only way again. With a protocol, you have a different option ready.`,
    partner_prompt: 'Tell your partner: what are the three earliest signals that your old pattern is returning? And what do you need your partner to do if they see those signals in you?',
    wins_prompt: 'Share one structure, habit, or relationship you have built that protects the new identity — something that makes slipping back harder than staying forward.',
    is_live_call_week: false,
  },
  {
    week_number: 10, month_number: 3, archetype: 'door', phase: 'rise',
    week_title: 'Protect the new identity',
    journal_prompt: 'Who are the people or environments most likely to pull you back into the old pattern — not maliciously, just by their presence, their needs, or the dynamic between you? Name them honestly. For each one, write your response protocol: "When ___ happens with ___, I will ___." Specific. Rehearsed. Ready. You are not avoiding these people. You are preparing to show up differently in their presence.',
    weekly_action: 'Have one honest conversation this week with someone in your life about how you have changed. Not a declaration — a conversation. "I have been working on something and I wanted to tell you about it. I have been learning to check in with myself before I give, and it might look different from the outside." Let one important person see the new you deliberately.',
  },
  {
    week_number: 10, month_number: 3, archetype: 'throne', phase: 'rise',
    week_title: 'Protect the new identity',
    journal_prompt: 'Under what specific conditions does your overthinking resurface most reliably? Stress, certain kinds of decisions, certain relationships, late at night, when something is uncertain? Name each trigger specifically. Then write your response protocol for each one: "When I notice ___, my new move is ___." You are not trying to never have the urge to spiral again. You are building a faster exit when the urge arrives.',
    weekly_action: 'Share your regression protocol with your accountability partner this week. Ask them specifically: "If you notice me going back into analysis paralysis about something, here is what I need you to say to me: ___." Write the exact words with them. Let the support be as specific as the work has been.',
  },
  {
    week_number: 10, month_number: 3, archetype: 'engine', phase: 'rise',
    week_title: 'Protect the new identity',
    journal_prompt: 'When is your engine most vulnerable to interruption? Specific seasons, specific stressors, specific relationship dynamics that have historically broken your momentum? For each vulnerability, write your protection strategy: your minimum viable move for that specific situation, who can hold you accountable during that season, and what "I am still in the game" looks like when everything else is disrupted.',
    weekly_action: 'Share your personal operating system from Week 9 with your accountability partner this week. Ask them to review it and tell you: what is missing? What have you left out that you know you actually need? Someone who has watched you for ten weeks can see things you cannot see from the inside. Let their observation add what belongs in the system.',
  },
  {
    week_number: 10, month_number: 3, archetype: 'push', phase: 'rise',
    week_title: 'Protect the new identity',
    journal_prompt: 'When is the pushthrough pattern most likely to return? High-stakes situations, seasons of external pressure, certain relationships where you feel you have to prove yourself, times when you are being watched or evaluated? For each trigger, write your body-first response protocol: "When I feel ___, before I push, I will ___." Build the protocol before the pressure arrives, not during it.',
    weekly_action: 'Share your regression triggers and response protocols with your accountability partner this week. Then ask them to fill in this sentence together: "If you ever see me running on empty and pretending I am fine, what I need you to say is ___." Build the support structure with specificity before you need it. The structure only works if it is built in advance.',
  },

  // ── WEEK 11 — Living from the new identity ───────────────────────

  {
    week_number: 11, month_number: 3, archetype: 'universal', phase: 'rise',
    week_title: 'Living from the new identity',
    teaching: `This is not maintenance. This is just your life now.

I want to say something important before we reach the final week: the work you have been doing inside The Circle does not belong to The Circle. It belongs to you. It lives in you. It moves with you when the program ends.

You are not maintaining a behavior you learned in a program. You are living as someone you became in a program. Those are different things.

Maintaining requires effort. Being requires nothing but continuing to choose.

This is the week you make that shift fully — from "I am working on this" to "this is who I am." Not because it will never be hard again. But because hard is different from foreign now. The new way is familiar. And familiar things do not take the same energy that new things do.

You built something real. Now you just get to live in it.`,
    partner_prompt: 'What does your life look like six months from now — living from the new identity every single day? Tell your partner. Make it specific and present-tense. Let them see it with you.',
    wins_prompt: 'Post one thing that is true about you now that was not true 90 days ago. Not a goal. Not an intention. A fact you have proven.',
    is_live_call_week: false,
  },
  {
    week_number: 11, month_number: 3, archetype: 'door', phase: 'rise',
    week_title: 'Living from the new identity',
    journal_prompt: 'Design your life going forward as the person you are now — not the person you were 90 days ago. What does a typical week look like when someone who protects her own energy is living it? What is in it that was not there before? What is gone that used to drain her? How does she start her mornings? How does she end her evenings? Write it as a description of a life that is already yours.',
    weekly_action: 'Live one full day this week exactly as the new version of you would — from morning to night. How she starts, how she gives, how she pauses before she says yes, how she ends the day with something for herself. One full day as living proof of the identity. Write about it that evening: what felt natural, what still required effort, and what surprised you.',
  },
  {
    week_number: 11, month_number: 3, archetype: 'throne', phase: 'rise',
    week_title: 'Living from the new identity',
    journal_prompt: 'What does your relationship with your mind look like now as someone who uses it powerfully without being driven by it? What do you make, build, create, or decide that did not exist before because you were too busy thinking about making it? What becomes possible in your life — specifically — when your mind is a tool you direct rather than a room you are trapped in? Write that life in present tense.',
    weekly_action: 'Do one thing this week that represents living beyond your thoughts — something creative, physical, or relational that you have been thinking about starting for a long time. This week you do not think about starting it. You just start. Write about what happened when you let the action come before the readiness.',
  },
  {
    week_number: 11, month_number: 3, archetype: 'engine', phase: 'rise',
    week_title: 'Living from the new identity',
    journal_prompt: 'What is the thing you have been building toward for a long time — the thing that the Interrupted Engine kept stopping before it could become real? Now that you have an engine that runs in any weather — what is the first real move toward that thing? Not someday. This month. Write the specific next action with a specific date. The engine that runs in any weather does not wait for perfect conditions.',
    weekly_action: 'Take the first concrete step toward the thing from your journal this week. Not completion — the first real move in the world. The engine that runs in any weather starts in any conditions. This is the step that proves the whole 90 days was not preparation for the start — it was the start. Write about taking it.',
  },
  {
    week_number: 11, month_number: 3, archetype: 'push', phase: 'rise',
    week_title: 'Living from the new identity',
    journal_prompt: 'What becomes possible in your life — specifically — when you stop running on fumes and start operating from a full tank? What have you been too depleted to build, create, give, or receive? What relationships need more of you than you have had available? What version of yourself has been waiting for you to have enough in reserve to let her out? Write that life in full detail. You have been working toward it for 90 days. Let yourself see it.',
    weekly_action: 'Live three consecutive days this week from your sustainable rhythm — the design you built in Week 9. Three full days. Morning to night. Notice what is different when you are not managing depletion the whole time. Notice what becomes available when you are not running on the edge. Write about what you see, feel, and access that was not accessible before.',
  },

  // ── WEEK 12 — Graduation ─────────────────────────────────────────

  {
    week_number: 12, month_number: 3, archetype: 'universal', phase: 'rise',
    week_title: 'Graduation',
    teaching: `Ninety days.

There is no teaching this week. There is only a reflection.

Ninety days ago you walked into The Circle with a pattern you could barely name, a cost you had not fully let yourself feel, and a self-trust account that had been in the negative for a long time.

Today you walk out as someone who named the pattern, felt its cost completely, interrupted it repeatedly in real life, built a new way of operating, and named the person you are becoming.

That is not a small thing.

The work you did here does not stay here. It moves with you. It lives in the decisions you make from now on — not because you are maintaining something, but because you have become someone.

This week there is one thing to do: write your story. Who you were when you arrived. What you did. Who you are now.

I will see you on our final call.`,
    partner_prompt: 'Final accountability partner check-in: What did I prove about myself in this 90 days? What do I want you to hold me to going forward — even after the program ends?',
    wins_prompt: 'Post your three-word transformation: "I went from ___ to ___." Watch what the thread becomes.',
    is_live_call_week: true, live_call_number: 6,
  },
  {
    week_number: 12, month_number: 3, archetype: 'door', phase: 'rise',
    week_title: 'Graduation',
    journal_prompt: 'Write your transformation story in three paragraphs. Paragraph 1: who you were when you arrived at The Circle — be specific about the pattern, how it was running, what it cost you, and what you had not yet named. Paragraph 2: what you did — the specific moments, the interruptions, the hard weeks, the weeks where something shifted. Paragraph 3: who you are now — not who you hope to be, but who the evidence of 90 days proves you already are. Write it for yourself first.',
    weekly_action: 'Write a letter to the next Open Door — the woman who has not found The Circle yet but is exactly where you were 90 days ago. Tell her what you know now. Tell her what the pattern has cost you and what it was like to finally interrupt it. Tell her what is waiting on the other side. This letter becomes your testimonial. It also becomes the most generous thing you can give someone who is still where you were.',
  },
  {
    week_number: 12, month_number: 3, archetype: 'throne', phase: 'rise',
    week_title: 'Graduation',
    journal_prompt: 'Write your transformation story in three paragraphs. Paragraph 1: who you were when you arrived — the mind that never stopped, the exhaustion that came from thinking rather than doing, the life that was mostly happening in your head. Paragraph 2: what you did — the decisions made under 60 seconds, the imperfect actions taken, the spirals interrupted. Paragraph 3: who you are now — someone who thinks powerfully and lives fully. Write it in the specific language of your own experience.',
    weekly_action: 'Write a letter to the next Overthink Throne — the woman currently sitting in hers, exhausted, wondering if it is possible to live differently. Tell her what shifted for you. What was the one thing that cracked the pattern open? What would you want someone to have told you 90 days ago? Make it honest, specific, and human.',
  },
  {
    week_number: 12, month_number: 3, archetype: 'engine', phase: 'rise',
    week_title: 'Graduation',
    journal_prompt: 'Write your transformation story in three paragraphs. Paragraph 1: who you were when you arrived — the restarts, the broken self-promises, the quiet erosion of self-trust. Paragraph 2: what you did — the minimum moves, the streak you built, the promise you kept, the thing you completed. Paragraph 3: who you are now — an engine that runs in any weather. Write the evidence clearly so you can return to it when the old story tries to come back.',
    weekly_action: 'Write a letter to the next Interrupted Engine — the one who is exhausted by her own restarts and starting to believe that is just who she is. Tell her the truth about what is actually happening. Tell her what changed for you. Tell her about the minimum move. Tell her what self-trust feels like when you start rebuilding it one small promise at a time.',
  },
  {
    week_number: 12, month_number: 3, archetype: 'push', phase: 'rise',
    week_title: 'Graduation',
    journal_prompt: 'Write your transformation story in three paragraphs. Paragraph 1: who you were when you arrived — the overrides, the body signals ignored, the strength that never got to rest. Paragraph 2: what you did — the first time you stopped before the wall, the day you took proactive rest, the moment you actually heard your body. Paragraph 3: who you are now — someone who has proven she can push through anything and is now proving she does not have to. Write it with the same strength you brought to everything else.',
    weekly_action: 'Write a letter to the next Pushthrough — the one who is still running, still overriding, still telling herself rest is something she will get to eventually. Tell her what you know now that she does not yet. Tell her what is waiting on the other side of stopping. Tell her the most powerful thing you proved to yourself in these 90 days.',
  },
]

// Transform a SourceRow (rich content shape used in writing) into the actual
// circle_weekly_content row shape (matches the migration). Drops fields that
// don't exist on the table; renames partner_prompt/wins_prompt to the
// corresponding day-of-week prompts; collapses month_number/phase into
// month_name; collapses is_live_call_week + live_call_number into a boolean.
function toDbRow(c: SourceRow) {
  return {
    cohort_id:        COHORT_ID,
    week_number:      c.week_number,
    archetype:        c.archetype,
    month_name:       c.phase,                      // 'root' | 'rebuild' | 'rise'
    week_title:       c.week_title,
    teaching:         c.teaching         ?? null,   // universal weeks only
    journal_prompt:   c.journal_prompt   ?? null,   // archetype weeks only
    weekly_action:    c.weekly_action    ?? null,   // archetype weeks only
    monday_prompt:    null,                         // reserved for admin voice-note prompts
    wednesday_prompt: c.partner_prompt   ?? null,   // partner check-in
    friday_prompt:    c.wins_prompt      ?? null,   // wins post
    video_url:        null,                         // upload via admin UI later
    live_call_week:   !!c.is_live_call_week,        // schema is boolean only
  }
}

async function seed() {
  console.log(`Seeding ${content.length} content rows into circle_weekly_content (cohort: ${COHORT_ID})...`)

  const rows = content.map(toDbRow)

  // Batch in groups of 10 to keep request size reasonable.
  const batchSize = 10
  let seeded = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase
      .from('circle_weekly_content')
      .upsert(batch, { onConflict: 'cohort_id,week_number,archetype' })

    if (error) {
      console.error(`Error seeding batch ${i / batchSize + 1}:`, error.message)
      process.exit(1)
    }

    seeded += batch.length
    console.log(`✓ ${seeded}/${rows.length} rows seeded`)
  }

  console.log('\n✅ Complete — all 60 content rows seeded successfully')
  console.log('\nContent breakdown:')
  console.log('  • 12 universal teachings (one per week)')
  console.log('  • 12 weeks × Open Door journal prompts + actions')
  console.log('  • 12 weeks × Overthink Throne journal prompts + actions')
  console.log('  • 12 weeks × Interrupted Engine journal prompts + actions')
  console.log('  • 12 weeks × Pushthrough journal prompts + actions')
  console.log('\nNext steps:')
  console.log('  1. Add your 6 live calls in Supabase → Table Editor → circle_live_calls')
  console.log('  2. Upload teaching video / voice files via /admin/content (StlMediaManager handles per-archetype uploads for Seal-the-Leak; circle teaching videos go in video_url on circle_weekly_content)')
  console.log('  3. Update circle_weekly_content.video_url for each universal week with the uploaded URL')
  console.log('  4. Verify content is live: Supabase → Table Editor → circle_weekly_content → filter by cohort_id')
}

seed()
