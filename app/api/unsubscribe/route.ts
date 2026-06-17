// app/api/unsubscribe/route.ts
// Public endpoint hit by the unsubscribe footer + the List-Unsubscribe header
// on every marketing email. Verifies the signed token (no DB lookup needed for
// auth — the HMAC is proof the email link came from us) and flips the
// corresponding flag off.
//
// GET  — for users clicking the link in the footer (email clients rewrite/wrap
//        links, and some turn POSTs into GETs).
// POST — RFC 8058 one-click unsubscribe, triggered by the List-Unsubscribe-Post
//        header. Mail providers fire this automatically from the inbox UI.
//
// kind === 'all' is a global opt-out: it sets users.email_opt_out = true AND
// turns off every notification_prefs flag, so the user stops getting any
// non-critical email. Idempotent — re-clicking is safe.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

async function applyUnsubscribe(token: string | null): Promise<NextResponse> {
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const decoded = verifyUnsubscribeToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(url, key)
  const { data: row, error } = await supabase
    .from('users')
    .select('notification_prefs')
    .eq('id', decoded.userId)
    .maybeSingle()
  if (error || !row) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  if (decoded.kind === 'all') {
    // Global opt-out: flip the master switch and turn every category off so a
    // later schema addition can't accidentally re-enable a stream.
    const allOff = {
      ...(row.notification_prefs ?? {}),
      daily_reminder: false,
      weekly_digest: false,
      milestone_alerts: false,
    }
    const { error: upErr } = await supabase
      .from('users')
      .update({
        email_opt_out: true,
        email_opt_out_at: new Date().toISOString(),
        notification_prefs: allOff,
      })
      .eq('id', decoded.userId)
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    return NextResponse.json({ unsubscribed: 'all' })
  }

  const next = { ...(row.notification_prefs ?? {}), [decoded.kind]: false }
  const { error: upErr } = await supabase
    .from('users')
    .update({ notification_prefs: next })
    .eq('id', decoded.userId)
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({ unsubscribed: decoded.kind })
}

export async function GET(request: NextRequest) {
  return applyUnsubscribe(request.nextUrl.searchParams.get('token'))
}

// RFC 8058 one-click. The token can arrive in the query string (mail clients
// POST to the List-Unsubscribe URL as-is) or, per spec, in the form body.
export async function POST(request: NextRequest) {
  let token = request.nextUrl.searchParams.get('token')
  if (!token) {
    try {
      const form = await request.formData()
      token = (form.get('token') as string | null) ?? null
    } catch {
      /* no form body — fall through with whatever we have */
    }
  }
  return applyUnsubscribe(token)
}
