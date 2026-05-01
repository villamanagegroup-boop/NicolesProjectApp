import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const { userId, email } = await request.json()
  if (!userId || !email) {
    return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 })
  }

  // Look for an unclaimed purchase matching this email
  const { data: purchase } = await supabase
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
  await supabase.from('users').update({
    has_paid: true,
    selected_path: purchase.path,
    stripe_customer_id: purchase.stripe_customer_id ?? null,
    onboarding_complete: purchase.path !== 'C',
  }).eq('id', userId)

  // Mark as claimed
  await supabase.from('pending_purchases')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', purchase.id)

  return NextResponse.json({ claimed: true, path: purchase.path })
}
