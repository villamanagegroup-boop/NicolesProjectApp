// app/api/signup-complete/route.ts
// Fires the post-signup welcome (to user) + new-signup alert (to Nicole).
// Called by /signup right after the user's auth account is created and
// their selected_path + quiz_result are written to the users row.
//
// Idempotent at the API layer via Emailit's Idempotency-Key (24h dedupe)
// and the route's own re-entry guard: if signup_email_sent_at on the user
// row is already set, we skip silently.
//
// All sends are fire-and-forget — failures are logged but never block the
// signup flow. Without EMAILIT_API_KEY the wrapper no-ops cleanly.
//
// Returns: { sent: { user: boolean; admin: boolean } }

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendEmail, removeSubscriber } from '@/lib/email/emailit'
import { canEmailUser } from '@/lib/email/guard'
import { listUnsubscribeHeaders } from '@/lib/email/unsubscribe'
import {
  signupCompleteUserEmail,
  signupCompleteAdminEmail,
} from '@/lib/email/templates/signupComplete'
import { PATHS, type PathId } from '@/data/paths'
import { quizResults } from '@/data/quizData'

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

function nextStepFor(path: PathId, baseUrl: string): { label: string; href: string } {
  const root = baseUrl.replace(/\/$/, '')
  if (path === 'A') return { label: 'Start Day 1 →',                href: `${root}/welcome/seal-the-leak` }
  if (path === 'C') return { label: 'Start your Circle intake →',  href: `${root}/welcome/the-circle` }
  return                   { label: 'Open today\'s card →',         href: `${root}/welcome/cards` }
}

export async function POST(request: NextRequest) {
  let admin: SupabaseClient
  try { admin = getAdmin() }
  catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Server misconfigured',
    }, { status: 500 })
  }

  const sb = await createSupabaseServer()
  if (!sb) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })

  const { data: { user: authed } } = await sb.auth.getUser()
  if (!authed) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: row, error: readErr } = await admin
    .from('users')
    .select('id, name, email, selected_path, quiz_result, created_at')
    .eq('id', authed.id)
    .maybeSingle()
  if (readErr || !row) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const path = row.selected_path as PathId | null
  if (!path) {
    // Shouldn't happen — /signup writes selected_path before calling here.
    return NextResponse.json({ sent: { user: false, admin: false }, reason: 'no_path' })
  }

  const userName  = (row.name as string | null)  ?? ''
  const userEmail = (row.email as string | null) ?? authed.email ?? ''
  const firstName = userName.split(/\s+/)[0] || 'there'

  const pathDef = PATHS[path]

  // Backfill quiz_result from the quiz_leads table when the user row is
  // missing it. This is the recovery path for users who completed the quiz
  // (so a quiz_leads row exists) but lost their sessionStorage on the way
  // back from Stripe — common when the success URL opens in a fresh tab,
  // or when the client-side .update silently failed for any reason.
  // quiz_leads is service-role only, so the lookup has to live here.
  let archetypeId = (row.quiz_result as string | null) ?? null
  if (!archetypeId && userEmail) {
    const { data: lead } = await admin
      .from('quiz_leads')
      .select('quiz_result')
      .eq('email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const backfilled = lead?.quiz_result as string | null | undefined
    if (backfilled) {
      archetypeId = backfilled
      await admin.from('users').update({ quiz_result: backfilled }).eq('id', row.id)
    }
  }
  const archetype = quizResults.find(q => q.id === (archetypeId ?? 'seeker')) ?? quizResults[0]
  const archetypeBlurb = archetype.description.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${request.nextUrl.protocol}//${request.nextUrl.host}`

  // 1. User welcome email — respect a global opt-out (a user who unsubscribed
  //    from everything shouldn't be pulled back in by a re-signup).
  let userSent = false
  const welcomeGate = await canEmailUser(admin, row.id as string)
  if (userEmail && welcomeGate.allowed) {
    const next = nextStepFor(path, appBaseUrl)
    const tpl = signupCompleteUserEmail({
      firstName,
      archetypeTitle: archetype.title,
      archetypeEmoji: archetype.emoji,
      archetypeBlurb,
      pathTitle:  pathDef.title,
      pathPrice:  `${pathDef.price} · ${pathDef.priceNote}`,
      nextStepLabel: next.label,
      nextStepHref:  next.href,
      accentColor: pathDef.accent,
    })
    const res = await sendEmail({
      to: userEmail,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      idempotencyKey: `signup-user-${row.id}`,
      headers: listUnsubscribeHeaders(appBaseUrl, row.id as string),
    }).catch(err => {
      console.error('signup-complete: user email error', err)
      return { sent: false } as const
    })
    userSent = res.sent
  }

  // 2. Admin alert
  let adminSent = false
  const adminTo = process.env.ADMIN_NOTIFY_EMAIL
  if (adminTo) {
    const tpl = signupCompleteAdminEmail({
      userName,
      userEmail,
      pathTitle:      pathDef.title,
      pathPrice:      `${pathDef.price} · ${pathDef.priceNote}`,
      archetypeTitle: archetype.title,
      signedUpAt:     (row.created_at as string | null) ?? new Date().toISOString(),
      appBaseUrl,
      userId:         row.id as string,
    })
    const res = await sendEmail({
      to: adminTo,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      idempotencyKey: `signup-admin-${row.id}`,
    }).catch(err => {
      console.error('signup-complete: admin email error', err)
      return { sent: false } as const
    })
    adminSent = res.sent
  }

  // Once a user signs up they've converted from "lead" to "customer", so
  // pull them out of the Quiz Takers audience to stop the nurture sequence.
  // Idempotent — already-removed = 404 which removeSubscriber swallows.
  const quizAudience = process.env.EMAILIT_QUIZ_AUDIENCE_ID
  if (quizAudience && userEmail) {
    void removeSubscriber({ audienceId: quizAudience, email: userEmail })
  }

  return NextResponse.json({ sent: { user: userSent, admin: adminSent } })
}
