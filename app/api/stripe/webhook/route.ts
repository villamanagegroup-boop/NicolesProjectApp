import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: Implement webhook when Stripe is configured
  // Steps:
  // 1. Get raw body: const body = await request.text()
  // 2. Get Stripe signature: const sig = request.headers.get('stripe-signature')!
  // 3. Verify webhook: const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  // 4. Handle checkout.session.completed:
  //    if (event.type === 'checkout.session.completed') {
  //      const session = event.data.object
  //      const userId = session.metadata?.userId
  //      // Update users table: SET has_paid = true WHERE id = userId
  //    }
  // 5. Return { received: true }

  return NextResponse.json({ received: true })
}
