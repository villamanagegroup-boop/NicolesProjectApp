// scripts/backfill-emailit-quiz-takers.ts
// One-shot script — pushes every row in public.quiz_leads into the Emailit
// "Quiz Takers" audience. Safe to re-run; dupes are reported, not retried.
//
// HOW TO RUN (Node 20.6+ — uses --env-file for the secrets)
//   node --env-file=.env.local --experimental-strip-types \
//     scripts/backfill-emailit-quiz-takers.ts
//
// or, if tsx is installed:
//   npx tsx --env-file=.env.local scripts/backfill-emailit-quiz-takers.ts
//
// Idempotency: on duplicate email, Emailit returns 422 with "already
// subscribed" — we count those as ok rather than retrying or failing.

interface QuizLead {
  id: string
  name: string | null
  email: string
  quiz_result: 'seeker' | 'builder' | 'healer' | 'visionary' | null
  created_at: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAILIT_KEY  = process.env.EMAILIT_API_KEY
const AUDIENCE_ID  = process.env.EMAILIT_QUIZ_AUDIENCE_ID

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars')
if (!EMAILIT_KEY)  throw new Error('Missing EMAILIT_API_KEY')
if (!AUDIENCE_ID)  throw new Error('Missing EMAILIT_QUIZ_AUDIENCE_ID')
if (AUDIENCE_ID.startsWith('http')) {
  throw new Error('EMAILIT_QUIZ_AUDIENCE_ID looks like a URL — it should be the bare ID starting with "aud_"')
}

async function fetchLeads(): Promise<QuizLead[]> {
  const url = `${SUPABASE_URL}/rest/v1/quiz_leads?select=id,name,email,quiz_result,created_at&order=created_at.asc`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY!,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return res.json() as Promise<QuizLead[]>
}

function dedupe(leads: QuizLead[]): QuizLead[] {
  // Keep the latest entry per email — answers may have shifted.
  const byEmail = new Map<string, QuizLead>()
  for (const l of leads) {
    const key = l.email.trim().toLowerCase()
    const prev = byEmail.get(key)
    if (!prev || new Date(l.created_at) > new Date(prev.created_at)) {
      byEmail.set(key, l)
    }
  }
  return [...byEmail.values()]
}

interface PostResult {
  status: number
  body: unknown
}

async function addToAudience(lead: QuizLead): Promise<PostResult> {
  const firstName = lead.name?.trim().split(/\s+/)[0] ?? undefined
  const customFields: Record<string, unknown> = {}
  if (lead.quiz_result) customFields.archetype = lead.quiz_result

  const body: Record<string, unknown> = {
    email: lead.email.trim().toLowerCase(),
  }
  if (firstName) body.first_name = firstName
  if (Object.keys(customFields).length > 0) body.custom_fields = customFields

  const res = await fetch(
    `https://api.emailit.com/v2/audiences/${encodeURIComponent(AUDIENCE_ID!)}/subscribers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${EMAILIT_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  const text = await res.text()
  let parsed: unknown
  try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }
  return { status: res.status, body: parsed }
}

function looksLikeDuplicate(result: PostResult): boolean {
  if (result.status === 422 || result.status === 409) return true
  const msg = JSON.stringify(result.body ?? '').toLowerCase()
  return msg.includes('already') && msg.includes('subscrib')
}

async function main() {
  const raw = await fetchLeads()
  console.log(`Fetched ${raw.length} quiz_leads rows`)
  const leads = dedupe(raw)
  console.log(`Deduped to ${leads.length} unique emails`)
  console.log()

  let added = 0
  let already = 0
  const failed: { email: string; status: number; body: unknown }[] = []

  for (const lead of leads) {
    const result = await addToAudience(lead)
    if (result.status >= 200 && result.status < 300) {
      added++
      console.log(`  + ${lead.email} (${lead.quiz_result ?? 'no archetype'})`)
    } else if (looksLikeDuplicate(result)) {
      already++
      console.log(`  = ${lead.email} (already subscribed)`)
    } else {
      failed.push({ email: lead.email, status: result.status, body: result.body })
      console.log(`  ! ${lead.email} failed: ${result.status}`)
    }
  }

  console.log()
  console.log('─'.repeat(40))
  console.log(`Added:                ${added}`)
  console.log(`Already subscribed:   ${already}`)
  console.log(`Failed:               ${failed.length}`)
  if (failed.length > 0) {
    console.log()
    console.log('Failures:')
    for (const f of failed) {
      console.log(`  ${f.email} → HTTP ${f.status}`)
      console.log(`    ${JSON.stringify(f.body).slice(0, 200)}`)
    }
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
