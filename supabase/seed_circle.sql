-- Seed: The Circle (generated from data/circleStarterContent.ts)
-- Creates a default active cohort + all 12 weeks of weekly content
-- (universal + 4 archetype tracks for weeks 1-2, universal-only skeletons
-- for weeks 3-12) + 6 live calls. Idempotent: safe to re-run.
--
-- To regenerate: node scripts/gen_seed_circle.mjs

-- 1. COHORT ─────────────────────────────────────────────────────────────────
insert into public.circle_cohorts (id, name, starts_at, ends_at, is_active, max_members)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Cohort 1 — Charter',
  current_date,
  current_date + interval '90 days',
  true,
  16
)
on conflict (id) do update set
  name        = excluded.name,
  is_active   = excluded.is_active,
  max_members = excluded.max_members;

-- 2. WEEKLY CONTENT ──────────────────────────────────────────────────────────
insert into public.circle_weekly_content
  (cohort_id, week_number, archetype, month_name, week_title, teaching, journal_prompt, weekly_action, monday_prompt, wednesday_prompt, friday_prompt, live_call_week)
values
  ('a0000000-0000-0000-0000-000000000001', 1, 'universal', 'root', 'The ground you actually stand on', 'Before anything changes, we have to look at what''s already here.

This week isn''t about fixing. It''s about naming. The patterns you want to shift don''t live in theory — they live in your actual days, your actual relationships, the specific moments you''ve been overriding yourself.

Over the next 90 days you''ll be building something new. But first we need a clear map of where you''re starting from. Not the performed version. The real one.

Three practices this week:

1. Notice. Every time you override your own "no" this week — say yes when you meant no, push through when you needed rest, agreed to something you didn''t actually want — write it down. Don''t fix it yet. Just name it.

2. Share one with your partner on Wednesday. Not the worst one. Just one. The practice is letting someone else see you without the polish.

3. Bring one win on Friday. Small counts. The practice is noticing what''s already working.', NULL, NULL, 'Record a 2–3 minute voice note: What is the specific pattern or override you most want to name this week? Be concrete — not "I overgive" but "I say yes to my sister''s requests before I check with myself."', 'Message your partner with one example from this week where you caught yourself overriding your own no. Don''t edit it for delivery. Just describe what happened.', 'Post one win to the community — a moment this week where you honored yourself instead of overriding. Boundary, rest, truth-telling, rest, whatever it was. Small is welcome. The practice is noticing.', true),
  ('a0000000-0000-0000-0000-000000000001', 1, 'door', 'root', 'The ground you actually stand on', NULL, 'Write about the last time you said yes when you meant no. Where did you feel it first — jaw, chest, stomach? What did you tell yourself about why the yes was the "right" answer? And what would you have done if you''d let yourself not give?', 'Choose one low-stakes ask this week — someone asking for your time, energy, or attention — and give yourself a 24-hour rule before answering. You do not need to explain the delay. "Let me get back to you tomorrow" is a complete sentence.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 1, 'throne', 'root', 'The ground you actually stand on', NULL, 'Write about a decision you''ve been turning over for more than 72 hours. Get all of it out — every angle, every fear, every version. Then underline the one sentence that feels the most true. Just the one.', 'Pick one decision you''ve been analyzing and give yourself 10 minutes and a timer. When the timer ends, choose. You do not need to be right. You need to practice moving. Notice what the mind does in the hours after.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 1, 'engine', 'root', 'The ground you actually stand on', NULL, 'Write about the last time your momentum got interrupted — a sick kid, a bad week at work, anything. What was the story you told yourself when you couldn''t do the thing? What did you do instead of starting over?', 'Choose one practice you''ve been doing in "all or nothing" mode and scale it down to a 5-minute floor this week. 5-minute walk. 5-minute journal. 5-minute stretch. The point isn''t the minutes. The point is proving to yourself the engine runs in ordinary conditions.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 1, 'push', 'root', 'The ground you actually stand on', NULL, 'Write about a signal your body has been sending you that you''ve been overriding. Fatigue, tightness, a dread, a knot somewhere. When did it first show up? What did you do instead of listening?', 'Pick one body signal you noticed this week and schedule a direct response to it — a nap, a canceled meeting, a walk at lunch, going to bed an hour earlier. Put it on the calendar. Treat it like any other commitment.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 2, 'universal', 'root', 'The cost of overriding', 'Last week you named what you''ve been overriding. This week we look at what the overriding costs.

Every time you ignore a no, a need, a body signal, a truth — there''s a price. It gets paid somewhere. In your sleep, your resentment, your capacity for joy, your relationships, your health. The pattern doesn''t hold itself up for free.

The reason we don''t usually look at the cost is that naming it makes the pattern harder to keep doing. That''s the point.

This week: look honestly at what your override pattern has been paying for, and who has been paying. Not to shame yourself. To stop pretending it''s free.', NULL, NULL, 'Record a voice note: What has your most-named override pattern actually cost you — in the last year, or the last decade? Be specific. Missed sleep, missed connection, missed health, missed opportunities, missed versions of yourself.', 'Message your partner: tell them one thing the pattern has cost that you haven''t fully admitted out loud before. They aren''t there to fix it — just to witness it.', 'Post one win: a moment this week where you chose the short-term discomfort of honoring yourself over the long-term cost of overriding. Even a small one.', false),
  ('a0000000-0000-0000-0000-000000000001', 2, 'door', 'root', 'The cost of overriding', NULL, 'What have the people who benefit from your yes never had to face because you never made them? This isn''t about blame. It''s about seeing clearly what your overgiving has shielded others from.', 'Identify one relationship where you''ve been doing 80% of the emotional or logistical labor. This week, do 50%. Don''t announce it, don''t negotiate it. Just stop filling the gap and see what happens.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 2, 'throne', 'root', 'The cost of overriding', NULL, 'What opportunities, conversations, or relationships have passed you by while you were "still thinking about it"? Name three. Don''t soften them. The overthinking is paid for by the thing you didn''t do.', 'Pick one thing you''ve been "still deciding on" for more than two weeks. Decide this week. Send the message, book the call, make the choice. Not because it''s right. Because the deciding itself is the practice.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 2, 'engine', 'root', 'The cost of overriding', NULL, 'When your engine stops, what do you make it mean about you? Write the exact sentences. "I''m the person who…" "I always…" These are the stories doing the actual damage — not the pause.', 'This week, when you hit a day where the full version of your practice isn''t possible, do the 5-minute floor without beating yourself up for not doing more. Note in your journal how you talked to yourself. The practice is the self-talk, not the minutes.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 2, 'push', 'root', 'The cost of overriding', NULL, 'What has the pushing through cost your body in the last year? Name specific things — sleep debt, a persistent ache, a medication, an injury you ignored. The body keeps receipts. What are yours?', 'This week, build one rest block into your calendar before you need it. Not a recovery day after you''ve crashed — a preventative pause. 90 minutes, nothing scheduled, phone on do-not-disturb. Take it whether or not you feel tired.', NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 3, 'universal', 'root', 'What you keep reaching for', NULL, NULL, NULL, NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 4, 'universal', 'root', 'The yes before the yes', NULL, NULL, NULL, NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 5, 'universal', 'rebuild', 'Interruption vs. abandonment', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('a0000000-0000-0000-0000-000000000001', 6, 'universal', 'rebuild', 'Ask for what you need', NULL, NULL, NULL, NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 7, 'universal', 'rebuild', 'Let them do it wrong', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('a0000000-0000-0000-0000-000000000001', 8, 'universal', 'rebuild', 'The body, the bill', NULL, NULL, NULL, NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 9, 'universal', 'rise', 'Identity beyond performance', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('a0000000-0000-0000-0000-000000000001', 10, 'universal', 'rise', 'The quiet kind of power', NULL, NULL, NULL, NULL, NULL, NULL, false),
  ('a0000000-0000-0000-0000-000000000001', 11, 'universal', 'rise', 'Who gets to have this?', NULL, NULL, NULL, NULL, NULL, NULL, true),
  ('a0000000-0000-0000-0000-000000000001', 12, 'universal', 'rise', 'Integration — the version that lasts', NULL, NULL, NULL, NULL, NULL, NULL, false)
on conflict (cohort_id, week_number, archetype) do update set
  month_name       = excluded.month_name,
  week_title       = excluded.week_title,
  teaching         = excluded.teaching,
  journal_prompt   = excluded.journal_prompt,
  weekly_action    = excluded.weekly_action,
  monday_prompt    = excluded.monday_prompt,
  wednesday_prompt = excluded.wednesday_prompt,
  friday_prompt    = excluded.friday_prompt,
  live_call_week   = excluded.live_call_week;

-- 3. LIVE CALLS ──────────────────────────────────────────────────────────────
insert into public.circle_live_calls (cohort_id, call_number, title, scheduled_at)
values
  ('a0000000-0000-0000-0000-000000000001', 1, 'Welcome + ground your cohort', current_date + interval '0 days' + interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 2, 'The cost conversation', current_date + interval '14 days' + interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 3, 'The first interruption', current_date + interval '28 days' + interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 4, 'When the rebuild gets messy', current_date + interval '42 days' + interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 5, 'Identity shift moments', current_date + interval '56 days' + interval '12 hours'),
  ('a0000000-0000-0000-0000-000000000001', 6, 'Graduation', current_date + interval '77 days' + interval '12 hours')
on conflict (cohort_id, call_number) do update set
  title        = excluded.title,
  scheduled_at = excluded.scheduled_at;
