import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // TODO: Connect Stripe when env vars are configured
  // Steps to implement:
  // 1. Import Stripe from 'stripe'
  // 2. const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  // 3. Get userId from request body
  // 4. Create or retrieve Stripe customer for user
  // 5. Create checkout session:
  //    const session = await stripe.checkout.sessions.create({
  //      customer: stripeCustomerId,
  //      payment_method_types: ['card'],
  //      line_items: [{ price: PRICE_ID, quantity: 1 }],
  //      mode: 'payment',
  //      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
  //      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paths`,
  //      metadata: { userId },
  //    })
  // 6. Return { url: session.url }

  return NextResponse.json(
    { error: 'Stripe not yet configured. Add STRIPE_SECRET_KEY to .env.local' },
    { status: 501 }
  )
}
