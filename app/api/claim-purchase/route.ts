import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

// Lazy-init so importing this module during `next build` doesn't crash
// when env vars aren't configured yet.
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

  // Verify the caller is the user they claim to be. Without this guard, anyone
  // could claim any pending purchase by guessing an email.
  const sb = await createSupabaseServer()
  if (!sb) {
    return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  }
  const { data: { user: authed } } = await sb.auth.getUser()
  if (!authed) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { userId, email } = await request.json()
  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
  }
  if (userId !== authed.id || (authed.email && authed.email.toLowerCase() !== String(email).trim().toLowerCase())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Look for an unclaimed purchase matching this email
  const { data: purchase } = await admin
    .from('pending_purchases')
    .select('*')
    .ilike('email', email.trim())
    .is('claimed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!purchase) {
    return NextResponse.json({ claimed: false })
  }

  // Grant access
  await admin.from('users').update({
    has_paid: true,
    selected_path: purchase.path,
    stripe_customer_id: purchase.stripe_customer_id ?? null,
    onboarding_complete: purchase.path !== 'C',
  }).eq('id', userId)

  // Mark as claimed
  await admin.from('pending_purchases')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', purchase.id)

  return NextResponse.json({ claimed: true, path: purchase.path })
}
