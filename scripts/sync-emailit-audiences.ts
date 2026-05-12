export {}
// scripts/sync-emailit-audiences.ts
// Reconciles the Emailit audiences against current user state:
//   - Any user with selected_path set is a converted customer — remove them
//     from Quiz Takers (they should be getting customer email, not nurture).
//   - Any Path A user (Seal the Leak buyer) is added to the Buyers audience.
//
// Safe to re-run; both ops are idempotent.
//
// Run with:
//   node --env-file=.env.local --experimental-strip-types \
//     scripts/sync-emailit-audiences.ts

interface UserRow {
  id: string
  email: string | null
  selected_path: 'A' | 'B' | 'C' | null
  name: string | null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAILIT_KEY  = process.env.EMAILIT_API_KEY
const QUIZ_AUDIENCE   = process.env.EMAILIT_QUIZ_AUDIENCE_ID
const BUYERS_AUDIENCE = process.env.EMAILIT_BUYERS_AUDIENCE_ID

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars')
if (!EMAILIT_KEY) throw new Error('Missing EMAILIT_API_KEY')
if (!QUIZ_AUDIENCE || !BUYERS_AUDIENCE) throw new Error('Missing Emailit audience IDs')

async function fetchConvertedUsers(): Promise<UserRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/users?select=id,email,name,selected_path&selected_path=not.is.null`
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY!, Authorization: `Bearer ${SUPABASE_KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return res.json() as Promise<UserRow[]>
}

async function emailitDelete(audienceId: string, email: string): Promise<number> {
  const res = await fetch(
    `https://api.emailit.com/v2/audiences/${encodeURIComponent(audienceId)}/subscribers/${encodeURIComponent(email)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${EMAILIT_KEY}` } },
  )
  return res.status
}

async function emailitAdd(audienceId: string, email: string, firstName?: string): Promise<number> {
  const body: Record<string, unknown> = { email }
  if (firstName) body.first_name = firstName
  const res = await fetch(
    `https://api.emailit.com/v2/audiences/${encodeURIComponent(audienceId)}/subscribers`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${EMAILIT_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return res.status
}

function ok(status: number): boolean {
  return status === 200 || status === 201 || status === 204 || status === 404 || status === 422 || status === 409
}

async function main() {
  const users = await fetchConvertedUsers()
  console.log(`Found ${users.length} users with selected_path set`)
  console.log()

  let removed = 0
  let alreadyOut = 0
  let addedToBuyers = 0
  let alreadyBuyer = 0
  const fails: string[] = []

  for (const u of users) {
    if (!u.email) continue
    const email = u.email.toLowerCase()
    const firstName = u.name?.trim().split(/\s+/)[0]

    // 1. Remove from Quiz Takers
    const delStatus = await emailitDelete(QUIZ_AUDIENCE!, email)
    if (delStatus === 200 || delStatus === 204) {
      removed++
      console.log(`  ↓ ${email} removed from Quiz Takers`)
    } else if (delStatus === 404) {
      alreadyOut++
    } else if (!ok(delStatus)) {
      fails.push(`${email}: delete from Quiz returned ${delStatus}`)
    }

    // 2. Add Path A buyers to Buyers audience
    if (u.selected_path === 'A') {
      const addStatus = await emailitAdd(BUYERS_AUDIENCE!, email, firstName)
      if (addStatus === 200 || addStatus === 201) {
        addedToBuyers++
        console.log(`  + ${email} added to Buyers`)
      } else if (addStatus === 422 || addStatus === 409) {
        alreadyBuyer++
      } else if (!ok(addStatus)) {
        fails.push(`${email}: add to Buyers returned ${addStatus}`)
      }
    }
  }

  console.log()
  console.log('─'.repeat(40))
  console.log(`Removed from Quiz Takers:  ${removed}`)
  console.log(`Already out of Quiz:       ${alreadyOut}`)
  console.log(`Added to Buyers:           ${addedToBuyers}`)
  console.log(`Already in Buyers:         ${alreadyBuyer}`)
  console.log(`Failures:                  ${fails.length}`)
  for (const f of fails) console.log(`  ! ${f}`)
}

main().catch(err => { console.error(err); process.exit(1) })
