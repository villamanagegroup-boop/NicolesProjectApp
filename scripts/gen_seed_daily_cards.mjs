// Generates supabase/seed_daily_cards.sql from data/mockCards.ts
// Run: node scripts/gen_seed_daily_cards.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcPath   = resolve(__dirname, '../data/mockCards.ts')
const outPath   = resolve(__dirname, '../supabase/seed_daily_cards.sql')

// Read the TS file and extract the mockCards array by evaluating it.
// Strip the TS import + the `: DailyCard[]` annotation so plain JS can eval it.
let src = readFileSync(srcPath, 'utf8')
src = src
  .replace(/^import[^\n]*\n/m, '')
  .replace(/:\s*DailyCard\[\]/, '')
  .replace(/^export\s+/m, '')

const fn = new Function(`${src}; return mockCards;`)
const cards = fn()

const esc = (v) => v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`

const values = cards.map(c =>
  `  (${c.dayNumber}, ${esc(c.theme)}, ${esc(c.title)}, ${esc(c.bodyText)}, ${esc(c.affirmation)}, ${esc(c.journalPrompt)}, ${esc(c.imageUrl)}, ${esc(c.cardColor)}, ${esc(c.emoji)})`
).join(',\n')

const sql = `-- Seed: daily_cards (generated from data/mockCards.ts)
-- Idempotent: safe to re-run; updates on day_number conflict.

insert into public.daily_cards
  (day_number, theme, title, body_text, affirmation, journal_prompt, image_url, card_color, emoji)
values
${values}
on conflict (day_number) do update set
  theme         = excluded.theme,
  title         = excluded.title,
  body_text     = excluded.body_text,
  affirmation   = excluded.affirmation,
  journal_prompt = excluded.journal_prompt,
  image_url     = excluded.image_url,
  card_color    = excluded.card_color,
  emoji         = excluded.emoji;
`

writeFileSync(outPath, sql, 'utf8')
console.log(`Wrote ${cards.length} cards → ${outPath}`)
