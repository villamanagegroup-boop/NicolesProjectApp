import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Stripe product IDs → app paths
const PRODUCT_TO_PATH: Record<string, 'A' | 'B' | 'C'> = {
  [process.env.STRIPE_PRODUCT_CARDS!]:          'B',
  [process.env.STRIPE_PRODUCT_LEAK!]:           'A',
  [process.env.STRIPE_PRODUCT_CIRCLE_ONETIME!]: 'C',
  [process.env.STRIPE_PRODUCT_CIRCLE_MONTHLY!]: 'C',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email   = session.customer_details?.email?.toLowerCase()
        if (!email) break

        // Get the product that was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
        })
        const product   = lineItems.data[0]?.price?.product as Stripe.Product | undefined
        const productId = product?.id
        const path      = productId ? PRODUCT_TO_PATH[productId] : undefined

        if (!path) {
          console.warn('Unknown product purchased:', productId)
          break
        }

        // Check if the user already has an account
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email)
          .maybeSingle()

        if (existingUser) {
          // User exists — grant access immediately
          await supabase.from('users').update({
            has_paid: true,
            selected_path: path,
            stripe_customer_id: session.customer as string ?? null,
          }).eq('id', existingUser.id)
        } else {
          // No account yet — store for claim at signup
          await supabase.from('pending_purchases').upsert({
            email,
            path,
            stripe_customer_id: session.customer as string ?? null,
            stripe_session_id: session.id,
            price_id: lineItems.data[0]?.price?.id ?? null,
          }, { onConflict: 'stripe_session_id' })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        // Revoke access for cancelled subscriptions (Path B only)
        const { data: user } = await supabase
          .from('users')
          .select('id, selected_path')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        if (user && user.selected_path === 'B') {
          await supabase.from('users').update({ has_paid: false }).eq('id', user.id)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = (invoice.customer as string)
        console.warn('Payment failed for customer:', customerId)
        // TODO: trigger email notification to user via Resend
        break
      }

    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
