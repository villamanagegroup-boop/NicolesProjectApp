// lib/circle.ts
// All Supabase queries for The Circle cohort sub-app.
// Uses the project's shared browser client from @/lib/supabase/client.
import { supabaseClient as supabase } from '@/lib/supabase/client'

// ─── TYPES ──────────────────────────────────────────────────

export type Archetype = 'door' | 'throne' | 'engine' | 'push'
export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'disorganized'
export type FeedbackPref = 'straight' | 'context' | 'written' | 'example'
export type PostType = 'wins' | 'monday_prompt' | 'partner_checkin' | 'general' | 'coach_note'

export interface CircleMember {
  id: string
  user_id: string
  cohort_id: string
  archetype: Archetype
  enneagram_type: string | null
  attachment_style: AttachmentStyle | null
  feedback_pref: FeedbackPref | null
  goal_90day: string | null
  partner_id: string | null
  joined_at: string
}

export interface WeeklyContent {
  id: string
  week_number: number
  archetype: string
  month_name: 'root' | 'rebuild' | 'rise'
  week_title: string
  teaching: string | null
  journal_prompt: string | null
  weekly_action: string | null
  monday_prompt: string | null
  wednesday_prompt: string | null
  friday_prompt: string | null
  video_url: string | null
  live_call_week: boolean
}

export interface CirclePost {
  id: string
  cohort_id: string
  author_id: string
  post_type: PostType
  week_number: number | null
  body: string
  audio_url: string | null
  created_at: string
  author?: { name: string; avatar_url: string | null }
  reactions?: { emoji: string; count: number; user_reacted: boolean }[]
}

export interface PartnerMessage {
  id: string
  sender_id: string
  receiver_id: string
  body: string
  audio_url: string | null
  read_at: string | null
  created_at: string
}

export interface LiveCall {
  id: string
  call_number: number
  title: string
  scheduled_at: string
  zoom_url: string | null
  recording_url: string | null
  notes: string | null
}

// ─── MEMBER ─────────────────────────────────────────────────

/**
 * Get the current user's Circle member record.
 * Returns null if the user is not enrolled in any cohort.
 */
export async function getMyCircleMember(): Promise<CircleMember | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('circle_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null
  return data as CircleMember
}

/**
 * Get the current user's accountability partner profile.
 * Returns null if not yet paired.
 */
export async function getMyPartner(partnerId: string) {
  const { data, error } = await supabase
    .from('circle_members')
    .select(`
      id,
      archetype,
      goal_90day,
      users:user_id (
        name,
        avatar_url
      )
    `)
    .eq('id', partnerId)
    .single()

  if (error) return null
  return data
}

// ─── WEEKLY CONTENT ─────────────────────────────────────────

/**
 * Get this week's content for the current user.
 * Returns both the universal track AND their archetype-specific track.
 *
 * @param weekNumber  1–12
 * @param archetype   the member's archetype
 * @param cohortId    the member's cohort id
 */
export async function getWeekContent(
  weekNumber: number,
  archetype: Archetype,
  cohortId: string
): Promise<{ universal: WeeklyContent | null; personal: WeeklyContent | null }> {
  const { data, error } = await supabase
    .from('circle_weekly_content')
    .select('*')
    .eq('cohort_id', cohortId)
    .eq('week_number', weekNumber)
    .in('archetype', ['universal', archetype])

  if (error || !data) return { universal: null, personal: null }

  return {
    universal: (data.find(d => d.archetype === 'universal') as WeeklyContent) ?? null,
    personal:  (data.find(d => d.archetype === archetype)   as WeeklyContent) ?? null,
  }
}

/**
 * Get all 12 weeks of content for the sidebar/progress view.
 * Only returns universal track for the overview.
 */
export async function getAllWeeksOverview(cohortId: string): Promise<WeeklyContent[]> {
  const { data, error } = await supabase
    .from('circle_weekly_content')
    .select('week_number, week_title, month_name, live_call_week')
    .eq('cohort_id', cohortId)
    .eq('archetype', 'universal')
    .order('week_number', { ascending: true })

  if (error || !data) return []
  return data as WeeklyContent[]
}

// ─── PROGRESS ───────────────────────────────────────────────

/**
 * Get the current user's progress across all weeks.
 */
export async function getMyProgress(memberId: string) {
  const { data, error } = await supabase
    .from('circle_member_progress')
    .select('*')
    .eq('member_id', memberId)
    .order('week_number', { ascending: true })

  if (error) return []
  return data
}

/**
 * Mark journal or action as complete for a given week.
 * Uses upsert so calling it twice is safe.
 */
export async function markWeekComplete(
  memberId: string,
  weekNumber: number,
  field: 'journal_completed' | 'action_completed',
  journalEntry?: string
) {
  const { error } = await supabase
    .from('circle_member_progress')
    .upsert({
      member_id: memberId,
      week_number: weekNumber,
      [field]: true,
      ...(journalEntry ? { journal_entry: journalEntry } : {}),
      completed_at: new Date().toISOString(),
    }, { onConflict: 'member_id,week_number' })

  return !error
}

// ─── COMMUNITY POSTS ────────────────────────────────────────

/**
 * Get all community posts for the current cohort.
 * Joins author profile and reaction counts.
 *
 * @param cohortId   the cohort to load posts for
 * @param postType   optional filter — 'wins', 'monday_prompt', etc.
 * @param weekNumber optional filter to a specific week
 */
export async function getCommunityPosts(
  cohortId: string,
  postType?: PostType,
  weekNumber?: number
): Promise<CirclePost[]> {
  let query = supabase
    .from('circle_posts')
    .select(`
      *,
      author:author_id (
        name,
        avatar_url
      ),
      circle_reactions (
        emoji,
        user_id
      )
    `)
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })

  if (postType)   query = query.eq('post_type', postType)
  if (weekNumber) query = query.eq('week_number', weekNumber)

  const { data, error } = await query
  if (error || !data) return []

  // Shape reaction counts + user_reacted flag
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  return data.map(post => ({
    ...post,
    reactions: buildReactionSummary(post.circle_reactions ?? [], userId),
  })) as CirclePost[]
}

function buildReactionSummary(
  rawReactions: { emoji: string; user_id: string }[],
  currentUserId: string
) {
  const map: Record<string, { count: number; user_reacted: boolean }> = {}
  rawReactions.forEach(r => {
    if (!map[r.emoji]) map[r.emoji] = { count: 0, user_reacted: false }
    map[r.emoji].count++
    if (r.user_id === currentUserId) map[r.emoji].user_reacted = true
  })
  return Object.entries(map).map(([emoji, v]) => ({ emoji, ...v }))
}

/**
 * Create a new community post.
 */
export async function createPost(
  cohortId: string,
  postType: PostType,
  body: string,
  weekNumber?: number,
  audioUrl?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('circle_posts')
    .insert({
      cohort_id: cohortId,
      author_id: user.id,
      post_type: postType,
      body,
      week_number: weekNumber ?? null,
      audio_url: audioUrl ?? null,
    })

  return !error
}

/**
 * Toggle a reaction on a post.
 * If the user already reacted with that emoji, remove it. Otherwise add it.
 */
export async function toggleReaction(postId: string, emoji: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: existing } = await supabase
    .from('circle_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('circle_reactions')
      .delete()
      .eq('id', existing.id)
    return !error
  } else {
    const { error } = await supabase
      .from('circle_reactions')
      .insert({ post_id: postId, user_id: user.id, emoji })
    return !error
  }
}

// ─── PARTNER MESSAGES ───────────────────────────────────────

/**
 * Get the message thread between the current user and their partner.
 */
export async function getPartnerThread(partnerId: string): Promise<PartnerMessage[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('circle_partner_messages')
    .select('*')
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),` +
      `and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`
    )
    .order('created_at', { ascending: true })

  if (error || !data) return []

  // Mark unread messages as read
  const unreadIds = data
    .filter(m => m.receiver_id === user.id && !m.read_at)
    .map(m => m.id)

  if (unreadIds.length > 0) {
    await supabase
      .from('circle_partner_messages')
      .update({ read_at: new Date().toISOString() })
      .in('id', unreadIds)
  }

  return data as PartnerMessage[]
}

/**
 * Send a message to your accountability partner.
 */
export async function sendPartnerMessage(
  receiverId: string,
  cohortId: string,
  body: string,
  audioUrl?: string
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('circle_partner_messages')
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      cohort_id: cohortId,
      body,
      audio_url: audioUrl ?? null,
    })

  return !error
}

// ─── LIVE CALLS ─────────────────────────────────────────────

/**
 * Get all 6 live calls for the cohort.
 */
export async function getLiveCalls(cohortId: string): Promise<LiveCall[]> {
  const { data, error } = await supabase
    .from('circle_live_calls')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('call_number', { ascending: true })

  if (error || !data) return []
  return data as LiveCall[]
}

// ─── PAIRING ────────────────────────────────────────────────

export interface PairableMember {
  id: string
  archetype: Archetype
  enneagram_type: string | null
  attachment_style: AttachmentStyle | null
  feedback_pref: FeedbackPref | null
  partner_id: string | null
}

/**
 * Compatibility score between two members (0–97).
 * Ported from the onboarding cohort-match algorithm.
 */
export function scoreCompat(a: PairableMember, b: PairableMember): number {
  const archetypeCompat: Record<Archetype, Record<Archetype, number>> = {
    door:   { engine:30, push:25, throne:20, door:10 },
    throne: { engine:30, push:25, door:20,   throne:8 },
    engine: { door:30,   throne:25, push:20, engine:12 },
    push:   { throne:30, door:25,   engine:20, push:8 },
  }
  let score = archetypeCompat[a.archetype]?.[b.archetype] ?? 10

  if (a.attachment_style && b.attachment_style) {
    const attachCompat: Record<AttachmentStyle, Record<AttachmentStyle, number>> = {
      secure:       { secure:20, anxious:25, avoidant:25, disorganized:20 },
      anxious:      { secure:28, avoidant:10, anxious:14, disorganized:12 },
      avoidant:     { secure:25, anxious:10,  avoidant:15, disorganized:12 },
      disorganized: { secure:28, anxious:12,  avoidant:12, disorganized:10 },
    }
    score += attachCompat[a.attachment_style]?.[b.attachment_style] ?? 10
  }

  if (a.enneagram_type && b.enneagram_type) {
    const enneaPairs: Record<string, string[]> = {
      '2':['3','8','9'], '3':['2','6','9'], '9':['3','8','1'],
      '6':['3','9','8'], '5':['8','3','7'], '1':['7','4','9'],
      '4':['1','8','2'], '8':['2','5','9'], '7':['1','5','4'],
    }
    if ((enneaPairs[a.enneagram_type] ?? []).includes(b.enneagram_type)) score += 18
    else if (a.enneagram_type !== b.enneagram_type) score += 8
  }

  if (a.feedback_pref && b.feedback_pref) {
    if (a.feedback_pref === b.feedback_pref) score += 8
    else if (
      (a.feedback_pref === 'straight' && b.feedback_pref === 'context') ||
      (a.feedback_pref === 'context'  && b.feedback_pref === 'straight')
    ) score += 5
  }

  return Math.min(score, 97)
}

/**
 * Auto-match all unpaired members in a cohort by compatibility score.
 * Greedy: picks the highest-scoring available pair each round.
 * Returns the number of new pairings created.
 */
export async function autoMatchCohort(cohortId: string): Promise<number> {
  const { data } = await supabase
    .from('circle_members')
    .select('id, archetype, enneagram_type, attachment_style, feedback_pref, partner_id')
    .eq('cohort_id', cohortId)

  if (!data) return 0
  const unpaired = (data as PairableMember[]).filter(m => !m.partner_id)
  if (unpaired.length < 2) return 0

  // Compute all pairwise scores, sort desc
  type Edge = { a: string; b: string; score: number }
  const edges: Edge[] = []
  for (let i = 0; i < unpaired.length; i++) {
    for (let j = i + 1; j < unpaired.length; j++) {
      edges.push({ a: unpaired[i].id, b: unpaired[j].id, score: scoreCompat(unpaired[i], unpaired[j]) })
    }
  }
  edges.sort((x, y) => y.score - x.score)

  const matched = new Set<string>()
  let pairings = 0
  for (const e of edges) {
    if (matched.has(e.a) || matched.has(e.b)) continue
    const { error } = await setPartner(e.a, e.b)
    if (!error) {
      matched.add(e.a)
      matched.add(e.b)
      pairings += 1
    }
  }
  return pairings
}

/**
 * Assign two members as partners (sets partner_id on both sides).
 * Safe to call on already-paired members — overwrites the existing link.
 */
export async function setPartner(aId: string, bId: string): Promise<{ error: { message: string } | null }> {
  const [r1, r2] = await Promise.all([
    supabase.from('circle_members').update({ partner_id: bId }).eq('id', aId),
    supabase.from('circle_members').update({ partner_id: aId }).eq('id', bId),
  ])
  return { error: r1.error ?? r2.error }
}

/**
 * Remove the partner link from a member (and their current partner).
 */
export async function unsetPartner(memberId: string): Promise<{ error: { message: string } | null }> {
  const { data } = await supabase
    .from('circle_members')
    .select('partner_id')
    .eq('id', memberId)
    .maybeSingle()
  const partnerId = (data as { partner_id: string | null } | null)?.partner_id
  const ops: Promise<{ error: { message: string } | null }>[] = [
    supabase.from('circle_members').update({ partner_id: null }).eq('id', memberId)
      .then(r => ({ error: r.error })) as Promise<{ error: { message: string } | null }>,
  ]
  if (partnerId) {
    ops.push(
      supabase.from('circle_members').update({ partner_id: null }).eq('id', partnerId)
        .then(r => ({ error: r.error })) as Promise<{ error: { message: string } | null }>
    )
  }
  const rs = await Promise.all(ops)
  return { error: rs[0].error ?? rs[1]?.error ?? null }
}

// ─── HELPER: compute current week number ────────────────────

/**
 * Given a cohort start date, return what week number we are in (1–12).
 * Returns null if the cohort hasn't started or has ended.
 */
export function getCurrentWeekNumber(startsAt: string): number | null {
  const start = new Date(startsAt)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return null
  const week = Math.floor(diffDays / 7) + 1
  return week > 12 ? null : week
}
