// app/api/admin/generate-seal-card/route.ts
//
// Graduation seal card generator. Renders a 1080×1080 PNG using Satori
// (next/og) and uploads it to the public circle-assets bucket. The
// resulting URL is written back to circle_members.graduation_seal_card_url
// so the admin Graduation ceremony section can show a preview + share link.
//
// Body: { member_id: string }
// Returns: { url: string }
//
// Auth: signed-in admin only. The route uses the service-role client to
// write to storage (Supabase storage RLS will block non-admin uploads even
// for the public bucket, see migration 032).

import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from 'next/og'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase/server'
import { buildSealCard } from './card'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ARCHETYPE_LABELS: Record<string, string> = {
  door:   'The Open Door',
  throne: "The Overthinker's Throne",
  engine: 'The Interrupted Engine',
  push:   'The Pushthrough',
}

const FALLBACK_STORY = 'She sealed the leak.'

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

// Trim the transformation story to the first 1–2 sentences. Keep it under
// ~160 chars so it fits cleanly on the card without wrapping past 2 lines.
function trimStory(body: string | null): string {
  if (!body) return FALLBACK_STORY
  const trimmed = body.trim()
  if (!trimmed) return FALLBACK_STORY
  const matches = trimmed.match(/[^.!?]+[.!?]+/g)
  if (!matches || matches.length === 0) {
    return trimmed.length > 160 ? trimmed.slice(0, 157).trim() + '…' : trimmed
  }
  let out = matches[0].trim()
  if (matches.length > 1 && (out.length + matches[1].length) < 160) out += ' ' + matches[1].trim()
  return out.length > 160 ? out.slice(0, 157).trim() + '…' : out
}

export async function POST(request: NextRequest) {
  // Auth — admin only.
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

  let body: { member_id?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!body.member_id) return NextResponse.json({ error: 'member_id required' }, { status: 400 })

  // Load the data needed for the card.
  const { data: member, error: mErr } = await admin
    .from('circle_members')
    .select('id, user_id, cohort_id, archetype, graduation_date')
    .eq('id', body.member_id)
    .maybeSingle()
  if (mErr || !member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const [profileRes, cohortRes, storyRes] = await Promise.all([
    admin.from('users').select('name').eq('id', member.user_id).maybeSingle(),
    admin.from('circle_cohorts').select('name').eq('id', member.cohort_id).maybeSingle(),
    admin.from('circle_transformation_stories').select('body').eq('member_id', member.id).maybeSingle(),
  ])

  const fullName       = (profileRes.data?.name ?? '').trim() || 'Graduate'
  const cohortName     = cohortRes.data?.name ?? 'The Circle'
  const archetypeLabel = ARCHETYPE_LABELS[member.archetype] ?? member.archetype
  const storyLine      = trimStory(storyRes.data?.body ?? null)
  const yearStr        = (() => {
    const d = member.graduation_date ? new Date(member.graduation_date) : new Date()
    return String(d.getUTCFullYear())
  })()

  // Render the card (1080×1080 — Instagram square).
  const png = await new ImageResponse(
    buildSealCard({ fullName, archetypeLabel, storyLine, cohortName, yearStr }),
    { width: 1080, height: 1080 },
  ).arrayBuffer()

  // Upload to circle-assets. upsert=true so a regen overwrites in place.
  const objectPath = `seal-cards/${member.id}-graduation.png`
  const { error: upErr } = await admin.storage
    .from('circle-assets')
    .upload(objectPath, Buffer.from(png), {
      contentType: 'image/png',
      upsert: true,
    })
  if (upErr) {
    return NextResponse.json({ error: `Storage upload failed: ${upErr.message}` }, { status: 500 })
  }

  // Cache-bust the URL so admin previews refresh after a regenerate.
  const { data: pub } = admin.storage.from('circle-assets').getPublicUrl(objectPath)
  const url = `${pub.publicUrl}?v=${Date.now()}`

  await admin
    .from('circle_members')
    .update({ graduation_seal_card_url: url })
    .eq('id', member.id)

  return NextResponse.json({ url })
}
