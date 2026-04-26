// Generates supabase/seed_circle.sql from data/circleStarterContent.ts.
// Creates one active cohort + all 12 weeks of weekly content (universal +
// 4 archetype tracks for weeks 1-2, universal-only skeletons for weeks 3-12)
// + 6 live calls. Idempotent: safe to re-run; updates rows on conflict.
//
// Run: node scripts/gen_seed_circle.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcPath   = resolve(__dirname, '../data/circleStarterContent.ts')
const outPath   = resolve(__dirname, '../supabase/seed_circle.sql')

// Read the TS file and eval it as JS to extract CIRCLE_STARTER_CONTENT.
// Strip the type alias + the `: WeeklyContentSeed[]` annotation + exports
// so plain JS can eval it.
let src = readFileSync(srcPath, 'utf8')
src = src
  .replace(/export\s+type\s+WeeklyContentSeed\s*=\s*\{[\s\S]*?\n\}/, '')
  .replace(/:\s*WeeklyContentSeed\[\]/, '')
  .replace(/^export\s+/gm, '')

const fn = new Function(`${src}; return CIRCLE_STARTER_CONTENT;`)
const starter = fn()

// Skeleton titles for weeks 3–12 (universal track only). Admin can edit
// these later via the admin backend or directly in Supabase.
const FILLER = [
  { week: 3,  month: 'root',    title: 'What you keep reaching for',           live: false },
  { week: 4,  month: 'root',    title: 'The yes before the yes',                live: false },
  { week: 5,  month: 'rebuild', title: 'Interruption vs. abandonment',          live: true  },
  { week: 6,  month: 'rebuild', title: 'Ask for what you need',                 live: false },
  { week: 7,  month: 'rebuild', title: 'Let them do it wrong',                  live: true  },
  { week: 8,  month: 'rebuild', title: 'The body, the bill',                    live: false },
  { week: 9,  month: 'rise',    title: 'Identity beyond performance',           live: true  },
  { week: 10, month: 'rise',    title: 'The quiet kind of power',               live: false },
  { week: 11, month: 'rise',    title: 'Who gets to have this?',                live: true  },
  { week: 12, month: 'rise',    title: 'Integration — the version that lasts',  live: false },
]

// 6 live calls scheduled at the start of weeks 1, 3, 5, 7, 9, 12.
// Times are placeholders — admin should adjust in the admin backend.
const CALLS = [
  { n: 1, week: 1,  title: 'Welcome + ground your cohort'        },
  { n: 2, week: 3,  title: 'The cost conversation'               },
  { n: 3, week: 5,  title: 'The first interruption'              },
  { n: 4, week: 7,  title: 'When the rebuild gets messy'         },
  { n: 5, week: 9,  title: 'Identity shift moments'              },
  { n: 6, week: 12, title: 'Graduation'                          },
]

// Stable cohort id so re-running the seed targets the same row.
const COHORT_ID = 'a0000000-0000-0000-0000-000000000001'

const esc = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`
const escBool = (v) => v ? 'true' : 'false'

// ─── Build SQL ───────────────────────────────────────────────────────────────

const cohortSql = `-- 1. COHORT ─────────────────────────────────────────────────────────────────
insert into public.circle_cohorts (id, name, starts_at, ends_at, is_active, max_members)
values (
  '${COHORT_ID}',
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
`

const contentRows = []
for (const r of starter) {
  contentRows.push(
    `  ('${COHORT_ID}', ${r.week_number}, ${esc(r.archetype)}, ${esc(r.month_name)}, ${esc(r.week_title)}, ${esc(r.teaching)}, ${esc(r.journal_prompt)}, ${esc(r.weekly_action)}, ${esc(r.monday_prompt)}, ${esc(r.wednesday_prompt)}, ${esc(r.friday_prompt)}, ${escBool(r.live_call_week)})`
  )
}
for (const f of FILLER) {
  contentRows.push(
    `  ('${COHORT_ID}', ${f.week}, 'universal', ${esc(f.month)}, ${esc(f.title)}, NULL, NULL, NULL, NULL, NULL, NULL, ${escBool(f.live)})`
  )
}

const contentSql = `
-- 2. WEEKLY CONTENT ──────────────────────────────────────────────────────────
insert into public.circle_weekly_content
  (cohort_id, week_number, archetype, month_name, week_title, teaching, journal_prompt, weekly_action, monday_prompt, wednesday_prompt, friday_prompt, live_call_week)
values
${contentRows.join(',\n')}
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
`

const callRows = CALLS.map(c => {
  const days = (c.week - 1) * 7
  return `  ('${COHORT_ID}', ${c.n}, ${esc(c.title)}, current_date + interval '${days} days' + interval '12 hours')`
})

const callsSql = `
-- 3. LIVE CALLS ──────────────────────────────────────────────────────────────
insert into public.circle_live_calls (cohort_id, call_number, title, scheduled_at)
values
${callRows.join(',\n')}
on conflict (cohort_id, call_number) do update set
  title        = excluded.title,
  scheduled_at = excluded.scheduled_at;
`

const sql = `-- Seed: The Circle (generated from data/circleStarterContent.ts)
-- Creates a default active cohort + all 12 weeks of weekly content
-- (universal + 4 archetype tracks for weeks 1-2, universal-only skeletons
-- for weeks 3-12) + 6 live calls. Idempotent: safe to re-run.
--
-- To regenerate: node scripts/gen_seed_circle.mjs

${cohortSql}${contentSql}${callsSql}`

writeFileSync(outPath, sql, 'utf8')
console.log(`Wrote 1 cohort + ${contentRows.length} weekly rows + ${callRows.length} live calls → ${outPath}`)
