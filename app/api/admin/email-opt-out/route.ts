// app/api/admin/email-opt-out/route.ts
// Admin tool to manually remove a user from all email (or restore them).
// This is the staff-side counterpart to the self-serve unsubscribe link.
//
// POST body: { userId: string, optOut?: boolean }   (optOut defaults to true)
//   optOut=true  → set email_opt_out, stamp email_opt_out_at, turn off all
//                  notification_prefs. The user receives no further non-critical
//                  email until restored.
//   optOut=false → clear the global flag and re-enable all categories.
//
// Auth: signed-in user with an admin_roles row.

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  const sb = await createSupabaseServer()
  if (!sb) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let admin: SupabaseClient
  try { admin = getAdmin() } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server misconfigured' }, { status: 500 })
  }

  const { data: roleRow } = await admin
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', caller.id)
    .maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 })

  let body: { userId?: string; optOut?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const userId = body.userId
  const optOut = body.optOut !== false // default true
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const prefs = optOut
    ? { daily_reminder: false, weekly_digest: false, milestone_alerts: false }
    : { daily_reminder: true,  weekly_digest: true,  milestone_alerts: true }

  const { error: upErr } = await admin
    .from('users')
    .update({
      email_opt_out: optOut,
      email_opt_out_at: optOut ? new Date().toISOString() : null,
      notification_prefs: prefs,
    })
    .eq('id', userId)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  return NextResponse.json({ userId, email_opt_out: optOut })
}
