// app/api/admin/send-graduation-letters/route.ts
//
// 180-day graduation letter dispatcher.
//
// Scans circle_members for rows where:
//   - letter_to_self IS NOT NULL
//   - graduation_date IS NOT NULL
//   - letter_sent_at IS NULL
//   - graduation_date + 180 days <= now()
//
// For each match it emails the member their own letter (subject + body only;
// no header/footer/CTA/unsubscribe — this is a personal letter, not a
// marketing email) and stamps letter_sent_at = now() so it never sends twice.
//
// Call this daily via Vercel Cron (configured in vercel.json) or a Supabase
// scheduled function. The cron path is `/api/admin/send-graduation-letters`.
//
// Authorization:
//   - CRON_SECRET header (Authorization: Bearer …) is checked first so the
//     scheduler can run unauthenticated.
//   - A signed-in admin can also POST to it manually for ad-hoc dispatch.

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/emailit'
import { canEmailUser } from '@/lib/email/guard'
import { listUnsubscribeHeaders } from '@/lib/email/unsubscribe'

export const runtime = 'nodejs'
// Letting Vercel cache this would be a disaster — every run must hit the DB.
export const dynamic = 'force-dynamic'

const GRADUATION_FROM = 'Nicole <nicole@theenergyleader.com>'
const SUBJECT         = 'A letter you wrote to yourself — 6 months ago'
const APP_BASE_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theenergyleader.com'

let _admin: SupabaseClient | null = null
function getAdmin(): SupabaseClient {
  if (!_admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase service-role env vars are not configured')
    _admin = createClient(url, key)
  }
  return _admin
}

async function authorize(request: NextRequest): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  // 1) Cron path — bearer token shared with Vercel Cron / Supabase scheduler.
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization') ?? ''
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return { ok: true }

  // 2) Admin path — signed-in user with an admin_roles row.
  const sb = await createSupabaseServer()
  if (!sb) return { ok: false, res: NextResponse.json({ error: 'Auth not configured' }, { status: 500 }) }
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }

  const admin = getAdmin()
  const { data: roleRow } = await admin
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', caller.id)
    .maybeSingle()
  if (!roleRow) return { ok: false, res: NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 }) }

  return { ok: true }
}

interface DueMember {
  id: string
  user_id: string
  letter_to_self: string
  graduation_date: string
}

async function sendLetters(): Promise<{ sent: number; errors: string[] }> {
  const admin = getAdmin()
  const errors: string[] = []
  let sent = 0

  // Anchor the 180-day cutoff to "today" — graduation_date is a DATE column,
  // so any row whose date is <= today minus 180 is due.
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - 180)
  const cutoffISODate = cutoff.toISOString().slice(0, 10)

  const { data: due, error: queryError } = await admin
    .from('circle_members')
    .select('id, user_id, letter_to_self, graduation_date')
    .not('letter_to_self', 'is', null)
    .not('graduation_date', 'is', null)
    .is('letter_sent_at', null)
    .lte('graduation_date', cutoffISODate)

  if (queryError) {
    errors.push(`query_failed: ${queryError.message}`)
    return { sent, errors }
  }

  const dueRows = (due ?? []) as DueMember[]
  if (dueRows.length === 0) return { sent, errors }

  // Resolve email addresses. auth.users isn't reachable through the JS API,
  // so we read it via admin.auth.admin.getUserById() one at a time.
  for (const row of dueRows) {
    try {
      const { data: u, error: userErr } = await admin.auth.admin.getUserById(row.user_id)
      if (userErr || !u?.user?.email) {
        errors.push(`${row.id}: no email on file (${userErr?.message ?? 'auth lookup returned null'})`)
        continue
      }

      // Honor a global opt-out. Stamp letter_sent_at so the daily cron stops
      // re-evaluating this row forever, but record it as skipped.
      const gate = await canEmailUser(admin, row.user_id)
      if (!gate.allowed) {
        await admin.from('circle_members')
          .update({ letter_sent_at: new Date().toISOString() })
          .eq('id', row.id)
        errors.push(`${row.id}: skipped — recipient opted out (${gate.reason})`)
        continue
      }

      const result = await sendEmail({
        to: u.user.email,
        from: GRADUATION_FROM,
        subject: SUBJECT,
        html: renderLetterHtml(row.letter_to_self),
        text: renderLetterText(row.letter_to_self),
        idempotencyKey: `graduation_letter_${row.id}`,
        headers: listUnsubscribeHeaders(APP_BASE_URL, row.user_id),
      })

      if (!result.sent) {
        errors.push(`${row.id}: send failed (${result.reason ?? 'unknown'}${result.status ? ` ${result.status}` : ''})`)
        continue
      }

      const { error: updateErr } = await admin
        .from('circle_members')
        .update({ letter_sent_at: new Date().toISOString() })
        .eq('id', row.id)

      if (updateErr) {
        // The email already went out — record the failure to update so it
        // can be cleaned up by hand, but DON'T retry (would resend the
        // letter). Emailit's Idempotency-Key would deduplicate retries
        // within 24h, but past that window we'd double-send. Manual fix is
        // safer than risking a second emotional letter landing in their inbox.
        errors.push(`${row.id}: sent but stamp failed (${updateErr.message}) — manual fix required`)
        sent += 1
        continue
      }

      sent += 1
    } catch (err) {
      errors.push(`${row.id}: exception (${err instanceof Error ? err.message : String(err)})`)
    }
  }

  return { sent, errors }
}

// Letters are deliberately bare — a single paragraph block, signed "— Nicole".
// No nav, no logo, no footer, no unsubscribe. Plain text alongside HTML so
// privacy-conscious clients render it cleanly.
function renderLetterHtml(letter: string): string {
  const escaped = letter
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  return `<div style="font-family:Georgia,serif;font-size:16px;line-height:1.7;color:#1a1a1a;white-space:normal;">${escaped}<br><br>— Nicole</div>`
}

function renderLetterText(letter: string): string {
  return `${letter}\n\n— Nicole`
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (!auth.ok) return auth.res
  try {
    const result = await sendLetters()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 },
    )
  }
}

// Vercel Cron triggers via GET. Same handler.
export async function GET(request: NextRequest) {
  return POST(request)
}
