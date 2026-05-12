// app/api/unsubscribe/route.ts
// Public endpoint hit by the unsubscribe footer on every marketing email.
// Verifies the signed token (no DB lookup needed for auth — the HMAC is
// proof the email link came from us) and flips the corresponding flag off.
//
// GET so it works from email clients that wrap links and rewrite POSTs.
// Idempotent — re-clicking the link is safe.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
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
