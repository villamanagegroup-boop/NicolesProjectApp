// app/api/admin/send-postgrad-checkins/route.ts
//
// Daily cron that delivers Nicole's pre-recorded post-graduation voice
// notes at day 15 and day 30 after each member's graduation_date.
//
// Each "notification" is just a row inserted into circle_coach_messages
// with audio_url set to the configured voice-note URL — the existing
// /circle/coach DM page plays audio attachments natively, so members
// see "Nicole left you a message" in their inbox + an inline player.
//
// The URLs are configured via two env vars on Vercel:
//   POST_GRAD_DAY15_VOICE_NOTE_URL
//   POST_GRAD_DAY30_VOICE_NOTE_URL
// Nicole records each once; they're reused for every graduating cohort.
// If either env var is missing, that wave is skipped (the route doesn't
// throw, so cron stays healthy until the URL lands).
//
// Dual auth (same pattern as send-graduation-letters):
//   • Bearer $CRON_SECRET for Vercel Cron
//   • Admin role for manual runs from a server tool

import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DAY15_BODY = 'Nicole left you a message — 15 days out.'
const DAY30_BODY = 'Nicole left you a message — 30 days out.'

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

async function authorize(request: NextRequest): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization') ?? ''
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return { ok: true }

  const sb = await createSupabaseServer()
  if (!sb) return { ok: false, res: NextResponse.json({ error: 'Auth not configured' }, { status: 500 }) }
  const { data: { user: caller } } = await sb.auth.getUser()
  if (!caller) return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  const admin = getAdmin()
  const { data: roleRow } = await admin
    .from('admin_roles').select('user_id').eq('user_id', caller.id).maybeSingle()
  if (!roleRow) return { ok: false, res: NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 }) }
  return { ok: true }
}

interface DueMember {
  id: string
  user_id: string
  alumni_since: string
  post_grad_day15_sent: boolean
  post_grad_day30_sent: boolean
}

// Service-role insert is required because the existing coach_messages RLS
// expects either the owning user or an admin role on the JWT — cron has
// neither, so we go via the service-role client (which bypasses RLS).
async function sendVoiceNote(
  admin: SupabaseClient,
  recipientUserId: string,
  audioUrl: string,
  body: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  // We need a sender_id that isn't NULL. The auth schema requires it to
  // be a real user. Look up any admin to "send from" — defaults to the
  // oldest admin (most likely Nicole) — and use that user_id.
  const { data: admins } = await admin
    .from('admin_roles')
    .select('user_id, created_at')
    .order('created_at', { ascending: true })
    .limit(1)
  const senderId = admins?.[0]?.user_id
  if (!senderId) return { ok: false, reason: 'no admin_roles row to send from' }

  const { error } = await admin.from('circle_coach_messages').insert({
    user_id:   recipientUserId,
    sender_id: senderId,
    body,
    audio_url: audioUrl,
  })
  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

async function runWave(
  admin: SupabaseClient,
  url: string | undefined,
  days: 15 | 30,
): Promise<{ sent: number; errors: string[] }> {
  if (!url) return { sent: 0, errors: [`POST_GRAD_DAY${days}_VOICE_NOTE_URL not configured`] }

  // Anchor cutoff to today.
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - days)
  const cutoffISO = cutoff.toISOString().slice(0, 10)

  const flagColumn = days === 15 ? 'post_grad_day15_sent' : 'post_grad_day30_sent'
  const body       = days === 15 ? DAY15_BODY : DAY30_BODY

  const { data, error } = await admin
    .from('circle_members')
    .select('id, user_id, alumni_since, post_grad_day15_sent, post_grad_day30_sent')
    .eq('is_alumni', true)
    .not('alumni_since', 'is', null)
    .eq(flagColumn, false)
    .lte('alumni_since', cutoffISO)

  if (error) return { sent: 0, errors: [`day${days} query: ${error.message}`] }

  const rows = (data ?? []) as DueMember[]
  let sent = 0
  const errors: string[] = []
  for (const row of rows) {
    const result = await sendVoiceNote(admin, row.user_id, url, body)
    if (!result.ok) { errors.push(`day${days} ${row.id}: ${result.reason}`); continue }
    const { error: flagErr } = await admin
      .from('circle_members')
      .update({ [flagColumn]: true })
      .eq('id', row.id)
    if (flagErr) {
      errors.push(`day${days} ${row.id}: sent but flag failed (${flagErr.message}) — manual fix required`)
    }
    sent += 1
  }
  return { sent, errors }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (!auth.ok) return auth.res

  let admin: SupabaseClient
  try { admin = getAdmin() } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server misconfigured' }, { status: 500 })
  }

  const day15Url = process.env.POST_GRAD_DAY15_VOICE_NOTE_URL
  const day30Url = process.env.POST_GRAD_DAY30_VOICE_NOTE_URL

  const [d15, d30] = await Promise.all([
    runWave(admin, day15Url, 15),
    runWave(admin, day30Url, 30),
  ])

  return NextResponse.json({
    day15: d15,
    day30: d30,
    total_sent:   d15.sent + d30.sent,
    total_errors: d15.errors.length + d30.errors.length,
  })
}

export async function GET(request: NextRequest) { return POST(request) }
