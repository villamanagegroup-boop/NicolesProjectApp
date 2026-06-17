// app/api/admin/send-pair-intro/route.ts
//
// Send the accountability-partner introduction emails when a new pair is
// confirmed in /admin/pairs. Sends one personalized email to each side, so
// both members see "your partner" + "what they know about you" framed from
// their own vantage point.
//
// Body: { memberAId: string, memberBId: string }
//
// Auth: signed-in user must have an admin_roles row. (Not callable from
// cron — pairing is an admin action.)
//
// Hooked into the existing handlePair() in app/(admin)/admin/pairs/page.tsx
// so admins don't have to remember to click "send intro" after pairing.
// Failures don't surface to the admin as a hard error — pairing is the
// load-bearing action and a missing email can be resent manually.

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/emailit'
import { canEmailUser } from '@/lib/email/guard'
import { listUnsubscribeHeaders } from '@/lib/email/unsubscribe'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'

const FROM = 'Nicole <nicole@theenergyleader.com>'
const SUBJECT = 'Your accountability partner is here'
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://theenergyleader.com'
const NO_INTAKE_FALLBACK = 'Their intake is still in progress.'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

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

interface SidePayload {
  memberId:        string
  userId:          string
  name:            string
  email:           string
  archetypeLabel:  string
  goal90Day:       string | null
  partnerNeeds:    string | null
}

async function loadSide(admin: SupabaseClient, memberId: string): Promise<SidePayload | { error: string }> {
  const { data: member, error: mErr } = await admin
    .from('circle_members')
    .select('id, user_id, archetype, goal_90day, partner_needs')
    .eq('id', memberId)
    .maybeSingle()
  if (mErr || !member) return { error: `member ${memberId} not found (${mErr?.message ?? 'no row'})` }

  const { data: profile } = await admin
    .from('users')
    .select('name')
    .eq('id', member.user_id)
    .maybeSingle()

  const { data: authLookup, error: aErr } = await admin.auth.admin.getUserById(member.user_id)
  if (aErr || !authLookup?.user?.email) {
    return { error: `member ${memberId}: no email (${aErr?.message ?? 'auth lookup returned null'})` }
  }

  return {
    memberId:       member.id,
    userId:         member.user_id,
    name:           (profile?.name ?? '').trim() || authLookup.user.email.split('@')[0],
    email:          authLookup.user.email,
    archetypeLabel: ARCHETYPE_LABELS[member.archetype] ?? member.archetype,
    goal90Day:      member.goal_90day,
    partnerNeeds:   member.partner_needs,
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderHtml(recipient: SidePayload, partner: SidePayload): string {
  const fmt = (v: string | null) => escapeHtml(v?.trim() ? v.trim() : NO_INTAKE_FALLBACK).replace(/\n/g, '<br>')
  return `
<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#1a1a1a;max-width:560px;">
<p>Your accountability partner is <strong>${escapeHtml(partner.name)}</strong>.</p>

<p>Here is what I want you to know about them:</p>
<p style="margin-left:14px">
<strong>Their archetype:</strong> ${escapeHtml(partner.archetypeLabel)}<br>
<strong>Their 90-day focus:</strong> ${fmt(partner.goal90Day)}<br>
<strong>What they need from this partnership:</strong> ${fmt(partner.partnerNeeds)}
</p>

<p>And here is what they know about you:</p>
<p style="margin-left:14px">
<strong>Your archetype:</strong> ${escapeHtml(recipient.archetypeLabel)}<br>
<strong>Your 90-day focus:</strong> ${fmt(recipient.goal90Day)}<br>
<strong>What you need from this partnership:</strong> ${fmt(recipient.partnerNeeds)}
</p>

<p>I matched you intentionally. There is a reason these two patterns are in conversation with each other for the next 90 days. You will find out what it is as you go.</p>

<p>Your first job this week is one conversation. I have given you a guide for it inside the app. Three questions. No agenda beyond getting to know each other honestly.</p>

<p><strong>Do not skip this conversation.</strong></p>

<p>Reach out to ${escapeHtml(partner.name)} today.</p>

<p>With you,<br>Nicole</p>
</div>
`.trim()
}

function renderText(recipient: SidePayload, partner: SidePayload): string {
  const txt = (v: string | null) => (v?.trim() ? v.trim() : NO_INTAKE_FALLBACK)
  return [
    `Your accountability partner is ${partner.name}.`,
    '',
    'Here is what I want you to know about them:',
    `  Their archetype: ${partner.archetypeLabel}`,
    `  Their 90-day focus: ${txt(partner.goal90Day)}`,
    `  What they need from this partnership: ${txt(partner.partnerNeeds)}`,
    '',
    'And here is what they know about you:',
    `  Your archetype: ${recipient.archetypeLabel}`,
    `  Your 90-day focus: ${txt(recipient.goal90Day)}`,
    `  What you need from this partnership: ${txt(recipient.partnerNeeds)}`,
    '',
    'I matched you intentionally. There is a reason these two patterns are in conversation with each other for the next 90 days. You will find out what it is as you go.',
    '',
    'Your first job this week is one conversation. I have given you a guide for it inside the app. Three questions. No agenda beyond getting to know each other honestly.',
    '',
    'Do not skip this conversation.',
    '',
    `Reach out to ${partner.name} today.`,
    '',
    'With you,',
    'Nicole',
  ].join('\n')
}

export async function POST(request: NextRequest) {
  // Auth
  const sb = await createSupabaseServer()
  if (!sb) return NextResponse.json({ error: 'Auth not configured' }, { status: 500 })
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  let admin: SupabaseClient
  try { admin = getAdmin() } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server misconfigured' }, { status: 500 })
  }

  const { data: roleRow } = await admin
    .from('admin_roles')
    .select('user_id')
    .eq('user_id', caller.id)
    .maybeSingle()
  if (!roleRow) return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 })

  // Body
  let body: { memberAId?: string; memberBId?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { memberAId, memberBId } = body
  if (!memberAId || !memberBId || memberAId === memberBId) {
    return NextResponse.json({ error: 'memberAId and memberBId required (distinct UUIDs)' }, { status: 400 })
  }

  const [sideA, sideB] = await Promise.all([loadSide(admin, memberAId), loadSide(admin, memberBId)])
  if ('error' in sideA) return NextResponse.json({ error: sideA.error }, { status: 404 })
  if ('error' in sideB) return NextResponse.json({ error: sideB.error }, { status: 404 })

  const errors: string[] = []
  let sent = 0

  for (const [recipient, partner] of [[sideA, sideB], [sideB, sideA]] as const) {
    const gate = await canEmailUser(admin, recipient.userId)
    if (!gate.allowed) {
      errors.push(`${recipient.memberId}: skipped — recipient opted out (${gate.reason})`)
      continue
    }
    const result = await sendEmail({
      to: recipient.email,
      from: FROM,
      subject: SUBJECT,
      html: renderHtml(recipient, partner),
      text: renderText(recipient, partner),
      // Idempotency: same pair => same key => Emailit dedupes within 24h.
      // Order the IDs so memberA+memberB and memberB+memberA hash the same.
      idempotencyKey: `pair_intro_${[memberAId, memberBId].sort().join('_')}_${recipient.memberId}`,
      headers: listUnsubscribeHeaders(APP_BASE_URL, recipient.userId),
    })
    if (result.sent) sent += 1
    else errors.push(`${recipient.memberId}: ${result.reason ?? 'send failed'}${result.status ? ` ${result.status}` : ''}`)
  }

  return NextResponse.json({ sent, errors })
}
