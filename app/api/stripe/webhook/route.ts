// app/api/stripe/webhook/route.ts
// Stripe webhook handler — single source of truth for paid-access changes.
//
// Events we care about:
//   checkout.session.completed     User bought via a Payment Link.
//   invoice.paid                   Subscription renewed OR an admin-sent
//                                  invoice was paid. We grant access either
//                                  way so users come back from churn cleanly.
//   customer.subscription.deleted  Path B sub canceled — revoke access.
//   customer.subscription.updated  Sub status moved (active/past_due/etc).
//   invoice.payment_failed         Logged for ops visibility.
//
// Send all five from the Stripe dashboard webhook subscription.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { addSubscriber, removeSubscriber } from '@/lib/email/emailit'

// Lazy-init: avoid throwing during `next build` page-data collection if
// env vars aren't yet wired up. The handler returns a clean 500 instead.
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured')
    _stripe = new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
  }
  return _stripe
}

let _supabase: SupabaseClient | null = null
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase service-role env vars are not configured')
    _supabase = createClient(url, key)
  }
  return _supabase
}

// Map Stripe product IDs → app paths. Resolved at handler time so a missing
// env var doesn't crash the build — it just falls through to the unknown-
// product warning below.
function getProductPathMap(): Record<string, 'A' | 'B' | 'C'> {
  const map: Record<string, 'A' | 'B' | 'C'> = {}
  if (process.env.STRIPE_PRODUCT_CARDS)          map[process.env.STRIPE_PRODUCT_CARDS]          = 'B'
  if (process.env.STRIPE_PRODUCT_LEAK)           map[process.env.STRIPE_PRODUCT_LEAK]           = 'A'
  if (process.env.STRIPE_PRODUCT_CIRCLE_ONETIME) map[process.env.STRIPE_PRODUCT_CIRCLE_ONETIME] = 'C'
  if (process.env.STRIPE_PRODUCT_CIRCLE_MONTHLY) map[process.env.STRIPE_PRODUCT_CIRCLE_MONTHLY] = 'C'
  return map
}

export async function POST(request: NextRequest) {
  let stripe: Stripe
  let supabase: SupabaseClient
  try {
    stripe   = getStripe()
    supabase = getSupabase()
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Server misconfigured',
    }, { status: 500 })
  }
  const PRODUCT_TO_PATH = getProductPathMap()

  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ── Initial purchase via Payment Link ──────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email   = session.customer_details?.email?.toLowerCase()
        if (!email) break

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
        })
        const product   = lineItems.data[0]?.price?.product as Stripe.Product | undefined
        const productId = product?.id
        const path      = productId ? PRODUCT_TO_PATH[productId] : undefined

        if (!path) {
          console.warn('checkout.session.completed: unknown product', productId)
          break
        }

        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email)
          .maybeSingle()

        if (existingUser) {
          await supabase.from('users').update({
            has_paid: true,
            selected_path: path,
            stripe_customer_id: (session.customer as string) ?? null,
          }).eq('id', existingUser.id)
          console.log(`checkout: granted Path ${path} to existing user ${existingUser.id}`)
        } else {
          await supabase.from('pending_purchases').upsert({
            email,
            path,
            stripe_customer_id: (session.customer as string) ?? null,
            stripe_session_id: session.id,
            price_id: lineItems.data[0]?.price?.id ?? null,
          }, { onConflict: 'stripe_session_id' })
          console.log(`checkout: stored pending purchase for ${email} (Path ${path})`)
        }

        // Any purchase converts a lead to a customer — remove them from the
        // Quiz Takers audience on every path so they don't keep receiving
        // the nurture sequence after they've already bought. Path A buyers
        // also land in the dedicated Seal the Leak Buyers audience.
        // Fire-and-forget — Emailit hiccups must not fail the webhook
        // (Stripe will retry and we'd double-grant access).
        const firstName = session.customer_details?.name?.split(' ')[0]
        const quizAudience = process.env.EMAILIT_QUIZ_AUDIENCE_ID
        if (quizAudience) {
          void removeSubscriber({ audienceId: quizAudience, email })
        }
        if (path === 'A') {
          const buyersAudience = process.env.EMAILIT_BUYERS_AUDIENCE_ID
          if (buyersAudience) {
            void addSubscriber({ audienceId: buyersAudience, email, firstName })
          }
        }
        break
      }

      // ── Invoice paid ───────────────────────────────────────────────────
      // Two cases: (1) admin-sent invoice — metadata.user_id is set;
      // (2) subscription invoice (renewal) — keep has_paid = true.
      case 'invoice.paid': {
        const invoice    = event.data.object as Stripe.Invoice
        const userIdMeta = invoice.metadata?.user_id ?? null
        const assignMeta = invoice.metadata?.assign_path ?? null
        const customerId = (invoice.customer as string) ?? null

        if (userIdMeta) {
          // Admin-sent invoice: grant access. If the admin specified
          // assign_path when creating the invoice, also set selected_path
          // and onboarding_complete (Path C still needs intake).
          const updates: Record<string, unknown> = {
            has_paid: true,
            stripe_customer_id: customerId,
          }
          if (assignMeta === 'A' || assignMeta === 'B' || assignMeta === 'C') {
            updates.selected_path = assignMeta
            updates.onboarding_complete = assignMeta !== 'C'
          }
          await supabase.from('users').update(updates).eq('id', userIdMeta)
          console.log(`invoice.paid: admin-sent invoice cleared has_paid for user ${userIdMeta}${assignMeta ? ` and assigned Path ${assignMeta}` : ''}`)
          break
        }

        // Subscription invoice: re-affirm access in case has_paid was
        // previously false (e.g. they came back from cancellation).
        if (customerId) {
          const { data: user } = await supabase
            .from('users')
            .select('id, has_paid')
            .eq('stripe_customer_id', customerId)
            .maybeSingle()
          if (user && !user.has_paid) {
            await supabase.from('users').update({ has_paid: true }).eq('id', user.id)
            console.log(`invoice.paid: re-granted access to ${user.id} after subscription renewal`)
          }
        }
        break
      }

      // ── Subscription deleted ───────────────────────────────────────────
      // Revoke access for Path B (monthly cards) — they paid by the month.
      // Path C 3-month subscriptions are intentionally left alone so the
      // member doesn't lose access at the end of their cohort.
      case 'customer.subscription.deleted': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const { data: user } = await supabase
          .from('users')
          .select('id, selected_path, name, email')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()
        if (!user) {
          console.warn('subscription.deleted: no user matched customer', customerId)
          break
        }
        if (user.selected_path === 'B') {
          await supabase.from('users').update({ has_paid: false }).eq('id', user.id)
          console.log(`subscription.deleted: revoked Path B access for ${user.email ?? user.id}`)
        } else {
          console.log(`subscription.deleted: leaving access intact for Path ${user.selected_path} user ${user.email ?? user.id}`)
        }
        break
      }

      // ── Subscription state change ─────────────────────────────────────
      // Mostly informational. Past-due is the one to watch — we don't
      // revoke immediately (Stripe retries automatically), but we surface
      // it in logs so ops can investigate.
      case 'customer.subscription.updated': {
        const sub        = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        if (sub.status === 'past_due' || sub.status === 'unpaid' || sub.status === 'incomplete_expired') {
          console.warn(`subscription.updated: customer ${customerId} now ${sub.status}`)
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice    = event.data.object as Stripe.Invoice
        const customerId = (invoice.customer as string) ?? null
        console.warn('invoice.payment_failed:', {
          customerId,
          invoiceId: invoice.id,
          attempt: invoice.attempt_count,
          nextAttempt: invoice.next_payment_attempt,
        })
        // Email notification not yet wired — when Resend is added, send a
        // friendly "your card didn't go through" message here.
        break
      }

    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
