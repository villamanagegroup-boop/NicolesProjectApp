// app/api/stripe/portal/route.ts
// Creates a Stripe Billing Portal session for the signed-in user and returns
// the URL. The portal handles subscription cancel/resume, payment method
// updates, and invoice history — so we don't have to build those UIs.
//
// Requires:
//   - Stripe Customer Portal enabled in the Stripe dashboard
//     (Settings → Billing → Customer portal — turn it on, set return URL).
//   - The user row has stripe_customer_id populated (the webhook writes
//     this on first paid purchase).

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase/server'

let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

export async function POST(_request: NextRequest) {
  const supabase = await createSupabaseServer()
  if (!supabase) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: row, error: lookupErr } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .maybeSingle()
  if (lookupErr) {
    return NextResponse.json({ error: lookupErr.message }, { status: 500 })
  }
  if (!row?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'No active subscription. Once you purchase a plan, billing management will appear here.' },
      { status: 404 },
    )
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.theenergyleader.com'}/settings`

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: returnUrl,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    console.error('billing portal session failed', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
