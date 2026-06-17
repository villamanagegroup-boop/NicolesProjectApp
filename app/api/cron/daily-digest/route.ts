// app/api/cron/daily-digest/route.ts
//
// Daily "what's new today" digest. For each user with a program, computes the
// items new since their last digest and emails a single combined message —
// only when there's at least one item. Respects notification_prefs
// (daily_reminder), the global email_opt_out, and the EMAIL_SENDING_PAUSED
// kill switch (enforced inside sendEmail).
//
// Scheduled daily via Vercel Cron (vercel.json). Auth: CRON_SECRET bearer for
// the scheduler, or a signed-in admin for manual runs.
//
// Idempotent within a day: the Emailit idempotency key is keyed to the UTC
// date, so a double-fire won't double-send. last_digest_sent_at advances the
// "new since" window.

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/emailit'
import { listUnsubscribeHeaders } from '@/lib/email/unsubscribe'
import { buildDigest, type DigestUser } from '@/lib/notifications/digest'
import { dailyDigestEmail } from '@/lib/email/templates/dailyDigest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theenergyleader.com'
const DAY_MS = 24 * 60 * 60 * 1000

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
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization') ?? ''
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return { ok: true }

  const sb = await createSupabaseServer()
  if (!sb) return { ok: false, res: NextResponse.json({ error: 'Auth not configured' }, { status: 500 }) }
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  const admin = getAdmin()
  const { data: roleRow } = await admin.from('admin_roles').select('user_id').eq('user_id', caller.id).maybeSingle()
  if (!roleRow) return { ok: false, res: NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 }) }
  return { ok: true }
}

interface CandidateRow extends DigestUser {
  notification_prefs: Record<string, unknown> | null
  email_opt_out: boolean | null
  last_digest_sent_at: string | null
}

async function run(): Promise<{ processed: number; sent: number; skipped: number; errors: string[] }> {
  const admin = getAdmin()
  const errors: string[] = []
  let processed = 0, sent = 0, skipped = 0

  const { data: users, error } = await admin
    .from('users')
    .select('id, email, name, selected_path, signup_date, cards_addon_started_at, notification_prefs, email_opt_out, last_digest_sent_at')
    .not('selected_path', 'is', null)
    .eq('email_opt_out', false)

  if (error) return { processed, sent, skipped, errors: [`query_failed: ${error.message}`] }

  const nowISO = new Date().toISOString()
  const todayKey = nowISO.slice(0, 10)

  for (const u of (users ?? []) as CandidateRow[]) {
    processed++
    try {
      // Per-category opt-out (global opt-out already filtered in the query).
      if (u.notification_prefs?.daily_reminder === false) { skipped++; continue }

      const windowStart = u.last_digest_sent_at ? new Date(u.last_digest_sent_at) : new Date(Date.now() - DAY_MS)
      const items = await buildDigest(admin, u, windowStart, APP_BASE_URL)

      if (items.length === 0) {
        // Nothing new — advance the window so tomorrow starts fresh.
        await admin.from('users').update({ last_digest_sent_at: nowISO }).eq('id', u.id)
        skipped++
        continue
      }

      // Resolve a deliverable address.
      let email = u.email
      if (!email) {
        const { data: au } = await admin.auth.admin.getUserById(u.id)
        email = au?.user?.email ?? null
      }
      if (!email) { errors.push(`${u.id}: no email`); continue }

      const firstName = (u.name ?? '').trim().split(/\s+/)[0] || 'there'
      const tpl = dailyDigestEmail({ firstName, items, appBaseUrl: APP_BASE_URL, userId: u.id })

      const res = await sendEmail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        idempotencyKey: `daily-digest-${u.id}-${todayKey}`,
        headers: listUnsubscribeHeaders(APP_BASE_URL, u.id, 'daily_reminder'),
      })

      if (res.sent) {
        sent++
        await admin.from('users').update({ last_digest_sent_at: nowISO }).eq('id', u.id)
      } else {
        errors.push(`${u.id}: send ${res.reason ?? 'failed'}${res.status ? ` ${res.status}` : ''}`)
      }
    } catch (err) {
      errors.push(`${u.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { processed, sent, skipped, errors }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (!auth.ok) return auth.res
  try {
    return NextResponse.json(await run())
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unexpected error' }, { status: 500 })
  }
}

// Vercel Cron triggers via GET.
export async function GET(request: NextRequest) {
  return POST(request)
}
