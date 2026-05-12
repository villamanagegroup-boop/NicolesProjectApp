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
  video_url: string | null
  image_url: string | null
  file_url:  string | null
  file_name: string | null
  created_at: string
  edited_at: string | null
  author?: { name: string; avatar_url: string | null }
  reactions?: { emoji: string; count: number; user_reacted: boolean }[]
  comment_count?: number
}

export interface CircleComment {
  id: string
  post_id: string
  author_id: string
  body: string
  /** GIFs (Tenor) and uploaded images both land here. */
  image_url: string | null
  created_at: string
  edited_at: string | null
  author?: { name: string; avatar_url: string | null }
  reactions?: { emoji: string; count: number; user_reacted: boolean }[]
}

export interface PartnerMessage {
  id: string
  sender_id: string
  receiver_id: string
  body: string
  audio_url: string | null
  video_url: string | null
  image_url: string | null
  file_url:  string | null
  file_name: string | null
  read_at: string | null
  created_at: string
}

export interface Attachments {
  audio_url?: string | null
  video_url?: string | null
  image_url?: string | null
  file_url?:  string | null
  file_name?: string | null
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
      ),
      circle_post_comments ( id )
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
    comment_count: Array.isArray(post.circle_post_comments)
      ? post.circle_post_comments.length
      : 0,
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
  attachments: Attachments = {},
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
      audio_url: attachments.audio_url ?? null,
      video_url: attachments.video_url ?? null,
      image_url: attachments.image_url ?? null,
      file_url:  attachments.file_url  ?? null,
      file_name: attachments.file_name ?? null,
    })

  return !error
}

// iOS Safari often leaves File.type empty when picking from Camera Roll
// or Files; Supabase Storage then rejects the upload against the bucket's
// MIME allowlist. Fall back to extension-based inference for that case.
const EXT_MIME: Record<string, string> = {
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  mp3:  'audio/mpeg',
  m4a:  'audio/mp4',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  heic: 'image/heic',
  heif: 'image/heif',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp',
  pdf:  'application/pdf',
}
function inferContentType(file: File): string {
  if (file.type) return file.type
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

export interface UploadResult {
  url: string | null
  /** Human-readable failure reason, present when url is null. */
  error?: string
}

/** Upload a file to the public circle-uploads bucket. Returns the public URL
 *  on success, or a structured error message on failure. UI surfaces should
 *  prefer this over uploadCircleAttachment() so users see the actual cause
 *  (e.g. "File too large — limit is 500 MB") instead of a generic message. */
export async function uploadCircleAttachmentResult(file: File): Promise<UploadResult> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[uploadCircleAttachment] no auth session', {
      fileName: file.name, fileSize: file.size, fileType: file.type,
    })
    return { url: null, error: 'You\'re signed out. Refresh the page and sign in again.' }
  }
  const ext = file.name.split('.').pop() ?? 'bin'
  const contentType = inferContentType(file)
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from('circle-uploads')
    .upload(path, file, { contentType, upsert: false })
  if (error) {
    const ctx = {
      message: error.message,
      raw: error,
      fileName: file.name,
      fileSizeBytes: file.size,
      fileSizeMB: +(file.size / 1024 / 1024).toFixed(2),
      contentType,
      originalFileType: file.type,
      bucket: 'circle-uploads',
      path,
      userId: user.id,
    }
    console.error('[uploadCircleAttachment] Supabase Storage rejected upload', ctx)
    return { url: null, error: friendlyUploadError(error.message, file.size) }
  }
  const { data } = supabase.storage.from('circle-uploads').getPublicUrl(path)
  return { url: data.publicUrl }
}

/** Back-compat: callers that only need the URL (or null) keep working. */
export async function uploadCircleAttachment(file: File): Promise<string | null> {
  return (await uploadCircleAttachmentResult(file)).url
}

// Translate Supabase Storage error messages into something a non-dev user
// can act on. Anything we don't recognize falls through verbatim.
function friendlyUploadError(message: string, fileSizeBytes: number): string {
  const m = message.toLowerCase()
  if (m.includes('payload too large') || m.includes('exceeded the maximum')) {
    const mb = +(fileSizeBytes / 1024 / 1024).toFixed(1)
    // The effective cap is min(bucket file_size_limit, project global limit).
    // We don't know either from the client, so don't hardcode a number — just
    // tell the user to compress and try again.
    return `File is too large (${mb} MB). Compress the video and try again — HandBrake's "Fast 1080p30" preset usually shrinks files 3–5×.`
  }
  if (m.includes('mime type') || m.includes('not allowed')) {
    return 'File type not allowed. Use a standard video/audio/image format (mp4, mov, mp3, jpg, png, heic).'
  }
  if (m.includes('row-level security') || m.includes('rls') || m.includes('not authorized') || m.includes('permission')) {
    return 'Storage permissions blocked the upload. Sign out and back in, then try again.'
  }
  if (m.includes('bucket') && m.includes('not found')) {
    return 'Storage bucket missing — contact support.'
  }
  return `Upload failed: ${message}`
}

/**
 * Update the body of a post. Author-only at the RLS layer (admins can also
 * update via the admin override). Sets edited_at so the UI can show "(edited)".
 */
export async function updatePost(postId: string, body: string): Promise<boolean> {
  const trimmed = body.trim()
  if (!trimmed) return false
  const { error } = await supabase
    .from('circle_posts')
    .update({ body: trimmed, edited_at: new Date().toISOString() })
    .eq('id', postId)
  return !error
}

/** Delete a post. Author-only at the RLS layer; admins can delete any. */
export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('circle_posts')
    .delete()
    .eq('id', postId)
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

// ─── POST COMMENTS (replies) ─────────────────────────────────

/**
 * Fetch all replies on a post, with author + reactions.
 * Cohort-scoped at the RLS layer so we only see what we're allowed to.
 */
export async function getCommentsForPost(postId: string): Promise<CircleComment[]> {
  const { data, error } = await supabase
    .from('circle_post_comments')
    .select(`
      *,
      author:author_id ( name, avatar_url ),
      circle_comment_reactions ( emoji, user_id )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error || !data) return []

  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''

  return (data as Array<CircleComment & { circle_comment_reactions?: { emoji: string; user_id: string }[] }>).map(c => ({
    ...c,
    reactions: buildReactionSummary(c.circle_comment_reactions ?? [], userId),
  })) as CircleComment[]
}

/**
 * Create a reply on a post. Body OR image_url is required (a GIF-only reply
 * is fine). Returns the new comment's id, or null on failure.
 */
export async function createComment(
  postId: string,
  body: string,
  imageUrl?: string | null,
): Promise<string | null> {
  const trimmed = body.trim()
  if (!trimmed && !imageUrl) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('circle_post_comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      body: trimmed,
      image_url: imageUrl ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id as string
}

/** Delete the caller's own comment. Admins can delete any (RLS enforces this). */
export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('circle_post_comments')
    .delete()
    .eq('id', commentId)
  return !error
}

/**
 * Update the body of a comment. Author-only via RLS, admins can also update.
 * Sets edited_at so the UI can show "(edited)".
 */
export async function updateComment(commentId: string, body: string): Promise<boolean> {
  const trimmed = body.trim()
  if (!trimmed) return false
  const { error } = await supabase
    .from('circle_post_comments')
    .update({ body: trimmed, edited_at: new Date().toISOString() })
    .eq('id', commentId)
  return !error
}

/**
 * Toggle a reaction on a comment. Same shape as toggleReaction for posts.
 */
export async function toggleCommentReaction(commentId: string, emoji: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: existing } = await supabase
    .from('circle_comment_reactions')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('circle_comment_reactions')
      .delete()
      .eq('id', existing.id)
    return !error
  }
  const { error } = await supabase
    .from('circle_comment_reactions')
    .insert({ comment_id: commentId, user_id: user.id, emoji })
  return !error
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
  attachments: Attachments = {},
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
      audio_url: attachments.audio_url ?? null,
      video_url: attachments.video_url ?? null,
      image_url: attachments.image_url ?? null,
      file_url:  attachments.file_url  ?? null,
      file_name: attachments.file_name ?? null,
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
