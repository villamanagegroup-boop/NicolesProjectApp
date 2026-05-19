// app/api/circle/first-action/route.ts
//
// Called by the week page when a member marks any weekly action complete.
// On the FIRST EVER completion for that member it:
//   1. stamps circle_members.first_action_completed_at = NOW()
//   2. inserts an amber row into circle_engagement_alerts so Nicole sees
//      "First action completed — send personal message" in the admin
//      engagement feed
//
// Subsequent calls are a no-op (the response says { first: false }).
//
// Service-role is required because circle_engagement_alerts has admin-only
// RLS — members cannot insert their own alert. We verify the caller is
// signed in and only allow them to act on their own member row.

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
  // Auth — caller must be signed in.
  const sb = await createSupabaseServer()
  if (!sb) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let admin: SupabaseClient
  try { admin = getAdmin() } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server misconfigured' }, { status: 500 })
  }

  // Look up the caller's circle_members row. We don't trust a memberId from
  // the body — the row must belong to the caller, full stop.
  const { data: member, error: memErr } = await admin
    .from('circle_members')
    .select('id, cohort_id, first_action_completed_at')
    .eq('user_id', caller.id)
    .maybeSingle()
  if (memErr || !member) {
    return NextResponse.json({ error: 'Not enrolled in a cohort' }, { status: 404 })
  }

  // Already had a first action. Nothing to do — the normal celebration
  // overlay handles every subsequent completion.
  if (member.first_action_completed_at) {
    return NextResponse.json({ first: false })
  }

  const now = new Date().toISOString()

  // Stamp the timestamp. UPDATE with a NULL guard so a race between two
  // tabs only writes one. (PostgreSQL doesn't return rowCount via PostgREST
  // for filtered updates, but we re-read below to confirm.)
  await admin
    .from('circle_members')
    .update({ first_action_completed_at: now })
    .eq('id', member.id)
    .is('first_action_completed_at', null)

  // Re-read to confirm we were the writer. If another tab beat us to it,
  // their timestamp wins and we skip the alert insert.
  const { data: reread } = await admin
    .from('circle_members')
    .select('first_action_completed_at')
    .eq('id', member.id)
    .maybeSingle()
  if (!reread || reread.first_action_completed_at !== now) {
    return NextResponse.json({ first: false })
  }

  // Insert the admin alert. Best-effort — failure here doesn't break the
  // celebration UX, but we surface the error so it's visible in logs.
  const { error: alertErr } = await admin
    .from('circle_engagement_alerts')
    .insert({
      member_id:     member.id,
      cohort_id:     member.cohort_id,
      alert_level:   'amber',
      reason:        'First action completed — send personal message',
      days_inactive: 0,
    })
  if (alertErr) console.error('[first-action] alert insert failed', alertErr)

  return NextResponse.json({ first: true })
}
