// app/api/admin/invoice/route.ts
// Send a Stripe invoice to a user from the admin portal.
//
// Flow:
//   1. Verify the caller is authenticated AND has an admin_roles row.
//   2. Look up the target user (must be in public.users).
//   3. If they don't have a stripe_customer_id, create a Stripe customer
//      using their email + name and persist it.
//   4. Create an invoice item, then an invoice that auto-finalizes and sends.
//   5. Return the hosted invoice URL.
//
// Stripe handles email delivery, the hosted payment page, and retries. The
// existing webhook (app/api/stripe/webhook/route.ts) catches invoice.paid
// (subscription invoices) — for one-off invoices we can extend it later or
// rely on the admin checking the Stripe dashboard.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  // 1. Auth
  const sb = await createSupabaseServer()
  if (!sb) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: roleRow } = await admin
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', caller.id)
    .maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 })

  // 2. Body
  let body: { userId?: string; amountCents?: number; description?: string; assignPath?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { userId, amountCents, description } = body
  if (!userId || !amountCents || amountCents < 50 || amountCents > 1_000_000) {
    return NextResponse.json({ error: 'userId and amountCents (50–1,000,000) required' }, { status: 400 })
  }
  if (!description || description.trim().length < 3) {
    return NextResponse.json({ error: 'description required (min 3 chars)' }, { status: 400 })
  }
  const assignPath = body.assignPath === 'A' || body.assignPath === 'B' || body.assignPath === 'C'
    ? body.assignPath
    : null

  // 3. Find user
  const { data: u, error: userErr } = await admin
    .from('users')
    .select('id, name, email, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()
  if (userErr || !u) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (!u.email) return NextResponse.json({ error: 'User has no email on file' }, { status: 400 })

  // 4. Ensure Stripe customer
  let customerId = u.stripe_customer_id as string | null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: u.email,
      name: u.name ?? undefined,
      metadata: { user_id: u.id },
    })
    customerId = customer.id
    await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', u.id)
  }

  // 5. Build invoice. We create the invoice first so we can attach the item to it.
  let invoice: Stripe.Invoice
  try {
    invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 7,
      description,
      auto_advance: true,
      metadata: {
        user_id: u.id,
        sent_by_admin: caller.id,
        ...(assignPath ? { assign_path: assignPath } : {}),
      },
    })

    await stripe.invoiceItems.create({
      customer: customerId,
      invoice: invoice.id,
      amount: amountCents,
      currency: 'usd',
      description,
    })

    // Finalize + send. send_invoice collection_method emails the customer.
    if (!invoice.id) {
      throw new Error('Stripe did not return an invoice id')
    }
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
    if (!finalized.id) {
      throw new Error('Stripe did not return a finalized invoice id')
    }
    await stripe.invoices.sendInvoice(finalized.id)

    return NextResponse.json({
      ok: true,
      invoice_id: finalized.id,
      hosted_invoice_url: finalized.hosted_invoice_url,
      invoice_pdf: finalized.invoice_pdf,
      amount_due: finalized.amount_due,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error'
    console.error('admin/invoice error', err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
