// app/api/program/seal-day-7/route.ts
// Records that the user sealed Day 7 of Seal the Leak on their own
// archetype path, and grants them the 30-day Cards window if they
// don't already have an add-on. Also fires confirmation emails.
//
// Idempotent: callable any number of times. The first call sets
// seal_completed_at + grants the unlock; subsequent calls are no-ops.
//
// Behavior:
//   - Verify auth.
//   - Read the user row.
//   - If `seal_completed_at` is null, set it to now() and fire the admin
//     alert email.
//   - Grant the 30-day window only when:
//       * selected_path === 'A' (Path A — Seal the Leak)
//       * cards_addon_started_at is null (don't trample an existing
//         add-on, paid Cards subscription, or admin-issued grant)
//     Sets started_at = now, expires_at = now + 30 days, source = 'seal_day7',
//     and fires the user celebration email.
//
// Email sends are fire-and-forget — failures are logged but never block
// the grant. Without EMAILIT_API_KEY set the wrapper no-ops cleanly.
//
// Returns: { granted: boolean, expiresAt: string | null, alreadySealed: boolean }

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/emailit'
import { canEmailUser } from '@/lib/email/guard'
import { listUnsubscribeHeaders } from '@/lib/email/unsubscribe'
import { sealDay7UserEmail, sealDay7AdminEmail } from '@/lib/email/templates/sealDay7'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

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

export async function POST(request: NextRequest) {
  let admin: SupabaseClient
  try { admin = getAdmin() }
  catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Server misconfigured',
    }, { status: 500 })
  }

  const sb = await createSupabaseServer()
  if (!sb) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })

  const { data: { user: authed } } = await sb.auth.getUser()
  if (!authed) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: row, error: readErr } = await admin
    .from('users')
    .select('id, name, email, quiz_result, selected_path, cards_addon_started_at, cards_addon_expires_at, cards_addon_source, seal_completed_at')
    .eq('id', authed.id)
    .maybeSingle()

  if (readErr || !row) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now      = new Date()
  const expiry   = new Date(now.getTime() + THIRTY_DAYS_MS)
  const updates: Record<string, unknown> = {}

  const alreadySealed = !!row.seal_completed_at
  if (!alreadySealed) updates.seal_completed_at = now.toISOString()

  // Grant the 30-day window only for Path A users without an existing add-on.
  // Path B users already have full access. Path C doesn't get cards. Anyone
  // with an existing add-on (paid sub, admin grant, prior seal) is left alone.
  let granted = false
  let expiresAt: string | null = row.cards_addon_expires_at
  if (row.selected_path === 'A' && !row.cards_addon_started_at) {
    updates.cards_addon_started_at = now.toISOString()
    updates.cards_addon_expires_at = expiry.toISOString()
    updates.cards_addon_source     = 'seal_day7'
    granted   = true
    expiresAt = expiry.toISOString()
  }

  if (Object.keys(updates).length > 0) {
    const { error: writeErr } = await admin.from('users').update(updates).eq('id', authed.id)
    if (writeErr) {
      console.error('seal-day-7: write failed', writeErr)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }
  }

  // ── Email side-effects ──────────────────────────────────────────────────
  // Compute the app base URL once. Prefer NEXT_PUBLIC_APP_URL when set;
  // otherwise derive from the incoming request so dev/preview URLs work.
  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const userName  = (row.name as string | null)  ?? ''
  const userEmail = (row.email as string | null) ?? authed.email ?? ''
  const firstName = userName.split(/\s+/)[0] || 'there'
  const archetype = (row.quiz_result as string | null) ?? 'unknown'

  // 1. User celebration — only when we just granted the 30-day window.
  //    Idempotency-key keyed on user + day so a re-seal in the same window
  //    can't double-send. Emailit dedupes for 24h.
  if (granted && userEmail) {
    const gate = await canEmailUser(admin, row.id as string)
    if (gate.allowed) {
      const tpl = sealDay7UserEmail({
        firstName,
        daysRemaining: 30,
        expiresAt: expiry.toISOString(),
        appBaseUrl,
      })
      void sendEmail({
        to: userEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        idempotencyKey: `seal-day-7-user-${row.id}`,
        headers: listUnsubscribeHeaders(appBaseUrl, row.id as string),
      }).catch(err => console.error('seal-day-7: user email error', err))
    }
  }

  // 2. Admin alert — fired the first time seal_completed_at is set,
  //    regardless of whether a new grant happened. Skipped silently when
  //    ADMIN_NOTIFY_EMAIL isn't configured.
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL
  if (!alreadySealed && adminTo) {
    const tpl = sealDay7AdminEmail({
      userName,
      userEmail,
      archetype,
      expiresAt: (expiresAt ?? expiry.toISOString()),
      granted,
      appBaseUrl,
      userId: row.id as string,
    })
    void sendEmail({
      to: adminTo,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      idempotencyKey: `seal-day-7-admin-${row.id}`,
    }).catch(err => console.error('seal-day-7: admin email error', err))
  }

  return NextResponse.json({
    granted,
    expiresAt,
    alreadySealed,
  })
}
