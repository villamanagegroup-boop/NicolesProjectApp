// lib/admin/hooks.ts
// Data layer for the Circle admin panel.
// All Supabase calls go through here; admin pages import from this file only.
//
// Schema notes (drop-in code expected different names; mappings below):
//   cohort table       → circle_cohorts (start_date/end_date → starts_at/ends_at, status → is_active)
//   profiles table     → users          (full_name → name)
//   accountability_partner_id → partner_id
//   feedback_preference       → feedback_pref
//   goal_90_day               → goal_90day
//   recipient_id      (partner messages) → receiver_id
//   circle_content    → circle_weekly_content
//   replay_url        (live calls)        → recording_url
//   circle_member_progress columns we have: journal_completed, action_completed, completed_at

import { supabaseClient } from '@/lib/supabase/client'

const supabase = supabaseClient

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertLevel = 'amber' | 'orange' | 'red'
export type AdminRole = 'owner' | 'assistant'
export type RepairStatus = 'pending' | 'approved' | 'denied'
export type TemplateTrigger = 'manual'|'enrollment'|'pairing'|'repair'|'at_risk'|'graduation'|'work_invite'
export type CohortStatus = 'upcoming' | 'active' | 'completed'

export interface AdminCohortSummary {
  id: string
  name: string
  start_date: string
  end_date: string
  status: CohortStatus
  max_members: number
  current_week: number
  phase: 'root' | 'rebuild' | 'rise'
  phase_label: string
  days_remaining: number
  member_count: number
  pair_count: number
  engagement_rate: number
  next_call: AdminLiveCall | null
  alert_counts: { amber: number; orange: number; red: number }
}

export interface AdminMemberRow {
  id: string
  user_id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  cohort_id: string
  archetype: string
  enneagram_type: string | null
  attachment_style: string | null
  feedback_preference: string | null
  goal_90_day: string | null
  accountability_partner_id: string | null
  partner_name: string | null
  joined_at: string
  last_active: string | null
  days_inactive: number
  alert_level: AlertLevel | null
  week_completion_pct: number
  current_week_journal: boolean
  current_week_action: boolean
  has_transformation_story: boolean
}

export interface AdminEngagementAlert {
  id: string
  member_id: string
  member_name: string | null
  member_archetype: string
  cohort_id: string
  alert_level: AlertLevel
  reason: string
  days_inactive: number
  is_resolved: boolean
  snoozed_until: string | null
  created_at: string
}

export interface AdminLiveCall {
  id: string
  cohort_id: string
  call_number: number
  title: string
  scheduled_at: string
  zoom_url: string | null
  recording_url: string | null
  notes: string | null
}

export interface AdminPairRow {
  member_a_id: string
  member_a_name: string | null
  member_a_archetype: string
  member_b_id: string
  member_b_name: string | null
  member_b_archetype: string
  message_count: number
  last_message_at: string | null
  days_since_message: number
  pair_health: 'strong' | 'moderate' | 'quiet' | 'silent'
}

export interface RepairRequest {
  id: string
  requester_id: string
  requester_name: string | null
  requester_archetype: string
  original_partner_id: string | null
  original_partner_name: string | null
  cohort_id: string
  status: RepairStatus
  reason: string | null
  created_at: string
}

export interface MessageTemplate {
  id: string
  name: string
  trigger_type: TemplateTrigger
  subject: string | null
  body: string
  channel: string
  is_active: boolean
}

export interface CoachingNote {
  id: string
  member_id: string
  author_id: string
  note: string
  created_at: string
  updated_at: string
}

export interface ContentRow {
  id: string
  cohort_id: string | null
  week_number: number
  archetype: string
  month_name: string
  week_title: string
  teaching: string | null
  journal_prompt: string | null
  weekly_action: string | null
  monday_prompt: string | null
  wednesday_prompt: string | null
  friday_prompt: string | null
  /** Pre-populated copy for the weekly wins composer (migration 026). */
  wins_prompt: string | null
  video_url: string | null
  /** Audio for the Monday voice note card on /circle home (migration 025). */
  monday_voice_note_url: string | null
  /**
   * Archetype track only: auto-popup this week's archetype video_url as a
   * welcome modal the first time the member opens the current week (migration 034).
   */
  archetype_video_popup: boolean
  live_call_week: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusFromCohort(starts_at: string, ends_at: string, is_active: boolean): CohortStatus {
  const now = Date.now()
  const start = new Date(starts_at).getTime()
  const end = new Date(ends_at).getTime()
  if (!is_active && now < start) return 'upcoming'
  if (now > end) return 'completed'
  return 'active'
}

function currentWeekFromDate(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return Math.min(Math.max(diff + 1, 1), 12)
}

function phaseFromWeek(week: number): { phase: 'root'|'rebuild'|'rise'; label: string } {
  if (week <= 4) return { phase: 'root', label: 'Root' }
  if (week <= 8) return { phase: 'rebuild', label: 'Rebuild' }
  return { phase: 'rise', label: 'Rise' }
}

function daysInactive(lastActive: string | null): number {
  if (!lastActive) return 999
  return Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
}

function alertFromDays(days: number): AlertLevel | null {
  if (days >= 10) return 'red'
  if (days >= 7) return 'orange'
  if (days >= 5) return 'amber'
  return null
}

function pairHealth(daysSince: number): AdminPairRow['pair_health'] {
  if (daysSince <= 3) return 'strong'
  if (daysSince <= 6) return 'moderate'
  if (daysSince <= 9) return 'quiet'
  return 'silent'
}

// ─── Cohort hooks ─────────────────────────────────────────────────────────────

export async function fetchAdminCohorts(): Promise<AdminCohortSummary[]> {
  const { data: cohorts } = await supabase
    .from('circle_cohorts')
    .select('*')
    .order('starts_at', { ascending: false })

  if (!cohorts) return []

  const summaries: AdminCohortSummary[] = []

  for (const c of cohorts) {
    const status = statusFromCohort(c.starts_at, c.ends_at, c.is_active)
    const week = currentWeekFromDate(c.starts_at)
    const { phase, label } = phaseFromWeek(week)

    const { count: memberCount } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('cohort_id', c.id)

    const { count: pairCount } = await supabase
      .from('circle_members')
      .select('*', { count: 'exact', head: true })
      .eq('cohort_id', c.id)
      .not('partner_id', 'is', null)

    // Engagement this week — fraction of members with any progress this week
    const { data: memberIds } = await supabase
      .from('circle_members')
      .select('id')
      .eq('cohort_id', c.id)
    const ids = memberIds?.map(m => m.id) ?? []

    let engagementRate = 0
    if (ids.length > 0) {
      const { data: progress } = await supabase
        .from('circle_member_progress')
        .select('journal_completed, action_completed')
        .eq('week_number', week)
        .in('member_id', ids)
      const engaged = progress?.filter(p => p.journal_completed || p.action_completed).length ?? 0
      engagementRate = Math.round((engaged / ids.length) * 100)
    }

    // Next live call
    const { data: calls } = await supabase
      .from('circle_live_calls')
      .select('*')
      .eq('cohort_id', c.id)
      .gt('scheduled_at', new Date().toISOString())
      .is('recording_url', null)
      .order('scheduled_at')
      .limit(1)

    // Alert counts
    const { data: alerts } = await supabase
      .from('circle_engagement_alerts')
      .select('alert_level')
      .eq('cohort_id', c.id)
      .eq('is_resolved', false)

    const alertCounts = { amber: 0, orange: 0, red: 0 }
    alerts?.forEach(a => { alertCounts[a.alert_level as AlertLevel]++ })

    const endDate = new Date(c.ends_at)
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    summaries.push({
      id: c.id,
      name: c.name,
      start_date: c.starts_at,
      end_date: c.ends_at,
      status,
      max_members: c.max_members,
      current_week: week,
      phase,
      phase_label: label,
      days_remaining: daysRemaining,
      member_count: memberCount ?? 0,
      pair_count: Math.floor((pairCount ?? 0) / 2),
      engagement_rate: engagementRate,
      next_call: calls?.[0] ?? null,
      alert_counts: alertCounts,
    })
  }

  return summaries
}

// ─── Member hooks ─────────────────────────────────────────────────────────────

export async function fetchAdminMembers(cohortId: string, currentWeek: number): Promise<AdminMemberRow[]> {
  // Pull members + their user profile (name/email come from public.users)
  const { data: members } = await supabase
    .from('circle_members')
    .select(`
      *,
      user:user_id (name, email, avatar_url),
      partner:partner_id (
        user:user_id (name)
      )
    `)
    .eq('cohort_id', cohortId)

  if (!members) return []

  const rows: AdminMemberRow[] = []

  for (const m of members) {
    // Last activity = max of progress completion, post creation, partner DM send
    const [progressRes, postsRes, msgsRes] = await Promise.all([
      supabase.from('circle_member_progress').select('completed_at').eq('member_id', m.id).order('completed_at', { ascending: false }).limit(1),
      supabase.from('circle_posts').select('created_at').eq('author_id', m.user_id).order('created_at', { ascending: false }).limit(1),
      supabase.from('circle_partner_messages').select('created_at').eq('sender_id', m.user_id).order('created_at', { ascending: false }).limit(1),
    ])

    const dates = [
      progressRes.data?.[0]?.completed_at,
      postsRes.data?.[0]?.created_at,
      msgsRes.data?.[0]?.created_at,
    ].filter(Boolean) as string[]

    // Fall back to joined_at when there's no recorded activity yet — a member
    // who signed up today shouldn't read as 999 days inactive (which trips
    // the red-alert threshold). For new members this gives 0–1 days.
    const lastActive = dates.length > 0 ? dates.sort().reverse()[0] : (m.joined_at as string | null)
    const inactive = daysInactive(lastActive)
    const alert = alertFromDays(inactive)

    // Current week progress
    const { data: weekProgress } = await supabase
      .from('circle_member_progress')
      .select('journal_completed, action_completed')
      .eq('member_id', m.id)
      .eq('week_number', currentWeek)
      .maybeSingle()

    // Overall completion %
    const { data: allProgress } = await supabase
      .from('circle_member_progress')
      .select('journal_completed, action_completed')
      .eq('member_id', m.id)

    const totalPossible = currentWeek * 2 // journal + action per week
    const completed = allProgress?.reduce((sum, p) =>
      sum + (p.journal_completed ? 1 : 0) + (p.action_completed ? 1 : 0), 0) ?? 0
    const completionPct = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0

    // Has story?
    const { count: storyCount } = await supabase
      .from('circle_transformation_stories')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', m.id)

    const userName = (m as any).user?.name ?? null
    const userEmail = (m as any).user?.email ?? null
    const userAvatar = (m as any).user?.avatar_url ?? null
    const partnerName = (m as any).partner?.user?.name ?? null

    rows.push({
      id: m.id,
      user_id: m.user_id,
      full_name: userName,
      email: userEmail,
      avatar_url: userAvatar,
      cohort_id: m.cohort_id,
      archetype: m.archetype,
      enneagram_type: m.enneagram_type,
      attachment_style: m.attachment_style,
      feedback_preference: m.feedback_pref,
      goal_90_day: m.goal_90day,
      accountability_partner_id: m.partner_id,
      partner_name: partnerName,
      joined_at: m.joined_at,
      last_active: lastActive,
      days_inactive: inactive,
      alert_level: alert,
      week_completion_pct: completionPct,
      current_week_journal: weekProgress?.journal_completed ?? false,
      current_week_action: weekProgress?.action_completed ?? false,
      has_transformation_story: (storyCount ?? 0) > 0,
    })
  }

  return rows
}

// ─── Alert hooks ──────────────────────────────────────────────────────────────

export async function fetchEngagementAlerts(cohortId?: string): Promise<AdminEngagementAlert[]> {
  let query = supabase
    .from('circle_engagement_alerts')
    .select(`
      *,
      member:member_id (
        archetype,
        user:user_id (name)
      )
    `)
    .eq('is_resolved', false)
    .or('snoozed_until.is.null,snoozed_until.lt.' + new Date().toISOString())
    .order('alert_level', { ascending: false })
    .order('days_inactive', { ascending: false })

  if (cohortId) query = query.eq('cohort_id', cohortId)

  const { data } = await query
  return (data ?? []).map(a => ({
    id: a.id,
    member_id: a.member_id,
    member_name: (a as any).member?.user?.name ?? null,
    member_archetype: (a as any).member?.archetype ?? '',
    cohort_id: a.cohort_id,
    alert_level: a.alert_level,
    reason: a.reason,
    days_inactive: a.days_inactive,
    is_resolved: a.is_resolved,
    snoozed_until: a.snoozed_until,
    created_at: a.created_at,
  }))
}

export async function resolveAlert(alertId: string, userId: string) {
  return supabase
    .from('circle_engagement_alerts')
    .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolved_by: userId })
    .eq('id', alertId)
}

export async function snoozeAlert(alertId: string, hours: number) {
  const until = new Date(Date.now() + hours * 3600000).toISOString()
  return supabase
    .from('circle_engagement_alerts')
    .update({ snoozed_until: until })
    .eq('id', alertId)
}

// ─── Pair hooks ───────────────────────────────────────────────────────────────

export async function fetchPairMap(cohortId: string): Promise<AdminPairRow[]> {
  const { data: members } = await supabase
    .from('circle_members')
    .select(`
      id, user_id, archetype, partner_id,
      user:user_id (name)
    `)
    .eq('cohort_id', cohortId)
    .not('partner_id', 'is', null)

  if (!members) return []

  const seen = new Set<string>()
  const pairs: AdminPairRow[] = []

  for (const m of members) {
    const partnerId = m.partner_id as string | null
    if (!partnerId || seen.has(m.id) || seen.has(partnerId)) continue
    seen.add(m.id)
    seen.add(partnerId)

    const partner = members.find(x => x.id === partnerId)
    if (!partner) continue

    // Direct messages between the two USER ids (circle_partner_messages uses user_id)
    const { data: msgs } = await supabase
      .from('circle_partner_messages')
      .select('created_at')
      .or(`and(sender_id.eq.${m.user_id},receiver_id.eq.${partner.user_id}),and(sender_id.eq.${partner.user_id},receiver_id.eq.${m.user_id})`)
      .order('created_at', { ascending: false })

    const msgCount = msgs?.length ?? 0
    const lastMsg = msgs?.[0]?.created_at ?? null
    const daysSinceMsg = daysInactive(lastMsg)

    pairs.push({
      member_a_id: m.id,
      member_a_name: (m as any).user?.name ?? null,
      member_a_archetype: m.archetype,
      member_b_id: partnerId,
      member_b_name: (partner as any).user?.name ?? null,
      member_b_archetype: partner.archetype,
      message_count: msgCount,
      last_message_at: lastMsg,
      days_since_message: daysSinceMsg,
      pair_health: pairHealth(daysSinceMsg),
    })
  }

  return pairs
}

export async function fetchRepairRequests(cohortId: string): Promise<RepairRequest[]> {
  const { data } = await supabase
    .from('circle_repair_requests')
    .select(`
      *,
      requester:requester_id (
        archetype,
        user:user_id (name)
      ),
      original_partner:original_partner_id (
        user:user_id (name)
      )
    `)
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: false })

  return (data ?? []).map(r => ({
    id: r.id,
    requester_id: r.requester_id,
    requester_name: (r as any).requester?.user?.name ?? null,
    requester_archetype: (r as any).requester?.archetype ?? '',
    original_partner_id: r.original_partner_id,
    original_partner_name: (r as any).original_partner?.user?.name ?? null,
    cohort_id: r.cohort_id,
    status: r.status,
    reason: r.reason,
    created_at: r.created_at,
  }))
}

// ─── Content hooks ────────────────────────────────────────────────────────────

export async function fetchContentSchedule(cohortId: string | null): Promise<ContentRow[]> {
  let query = supabase
    .from('circle_weekly_content')
    .select('*')
    .order('week_number')
    .order('archetype')

  if (cohortId) {
    query = query.or(`cohort_id.eq.${cohortId},cohort_id.is.null`)
  } else {
    query = query.is('cohort_id', null)
  }

  const { data } = await query
  return data ?? []
}

export async function updateContent(id: string, updates: Partial<ContentRow>) {
  return supabase.from('circle_weekly_content').update(updates).eq('id', id)
}

export async function insertContent(input: {
  cohort_id: string | null
  week_number: number
  archetype: ContentRow['archetype']
  month_name: ContentRow['month_name']
  week_title: string
  teaching?: string | null
  journal_prompt?: string | null
  weekly_action?: string | null
  monday_prompt?: string | null
  wednesday_prompt?: string | null
  friday_prompt?: string | null
  wins_prompt?: string | null
  video_url?: string | null
  monday_voice_note_url?: string | null
  archetype_video_popup?: boolean
  live_call_week?: boolean
}) {
  return supabase.from('circle_weekly_content').insert({
    cohort_id:              input.cohort_id,
    week_number:            input.week_number,
    archetype:              input.archetype,
    month_name:             input.month_name,
    week_title:             input.week_title,
    teaching:               input.teaching              ?? null,
    journal_prompt:         input.journal_prompt        ?? null,
    weekly_action:          input.weekly_action         ?? null,
    monday_prompt:          input.monday_prompt         ?? null,
    wednesday_prompt:       input.wednesday_prompt      ?? null,
    friday_prompt:          input.friday_prompt         ?? null,
    wins_prompt:            input.wins_prompt           ?? null,
    video_url:              input.video_url             ?? null,
    monday_voice_note_url:  input.monday_voice_note_url ?? null,
    archetype_video_popup:  input.archetype_video_popup ?? false,
    live_call_week:         input.live_call_week        ?? false,
  }).select().single()
}

export async function fetchLiveCalls(cohortId: string): Promise<AdminLiveCall[]> {
  const { data } = await supabase
    .from('circle_live_calls')
    .select('*')
    .eq('cohort_id', cohortId)
    .order('call_number')
  return (data ?? []) as AdminLiveCall[]
}

export async function updateLiveCall(id: string, updates: Partial<AdminLiveCall>) {
  return supabase.from('circle_live_calls').update(updates).eq('id', id)
}

// ─── Messaging hooks ──────────────────────────────────────────────────────────

export async function fetchMessageTemplates(): Promise<MessageTemplate[]> {
  const { data } = await supabase
    .from('admin_message_templates')
    .select('*')
    .eq('is_active', true)
    .order('trigger_type')
  return data ?? []
}

export async function sendAdminMessage(
  senderId: string,
  recipientId: string,
  body: string,
  subject?: string,
  templateId?: string,
  channel: string = 'in_app'
) {
  return supabase.from('admin_sent_messages').insert({
    sender_id: senderId,
    recipient_id: recipientId,
    body,
    subject,
    template_id: templateId ?? null,
    channel,
  })
}

export async function sendBroadcast(
  cohortId: string,
  authorId: string,
  title: string,
  body: string,
  opts?: { targetArchetype?: string; targetStatus?: string; channel?: string; scheduledFor?: string }
) {
  return supabase.from('admin_announcements').insert({
    cohort_id: cohortId,
    author_id: authorId,
    title,
    body,
    target_archetype: opts?.targetArchetype ?? null,
    target_status: opts?.targetStatus ?? null,
    channel: opts?.channel ?? 'both',
    scheduled_for: opts?.scheduledFor ?? null,
    sent_at: opts?.scheduledFor ? null : new Date().toISOString(),
  })
}

// ─── Coaching notes hooks ─────────────────────────────────────────────────────

export async function fetchCoachingNotes(memberId: string): Promise<CoachingNote[]> {
  const { data } = await supabase
    .from('circle_coaching_notes')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addCoachingNote(memberId: string, authorId: string, note: string) {
  return supabase.from('circle_coaching_notes').insert({ member_id: memberId, author_id: authorId, note })
}

export async function updateCoachingNote(noteId: string, note: string) {
  return supabase.from('circle_coaching_notes')
    .update({ note, updated_at: new Date().toISOString() })
    .eq('id', noteId)
}

export async function deleteCoachingNote(noteId: string) {
  return supabase.from('circle_coaching_notes').delete().eq('id', noteId)
}

// ─── Revenue / conversion hooks ───────────────────────────────────────────────

export async function fetchCohortRevenue(_cohortId: string) {
  // Placeholder — wire to Stripe via API route when ready
  return {
    total_collected: 0,
    outstanding: 0,
    pif_count: 0,
    monthly_count: 0,
    overdue_count: 0,
  }
}

export async function fetchConversionData(cohortId: string) {
  const { count: total } = await supabase
    .from('circle_members')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  const { count: withStory } = await supabase
    .from('circle_transformation_stories')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  const { count: publicStories } = await supabase
    .from('circle_transformation_stories')
    .select('*', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .eq('is_shared_publicly', true)

  return {
    total_members: total ?? 0,
    submitted_stories: withStory ?? 0,
    public_testimonials: publicStories ?? 0,
  }
}

// ─── Cohort mutations ─────────────────────────────────────────────────────────

export async function createCohort(input: {
  name: string
  starts_at: string  // ISO date
  ends_at: string
  max_members: number
  is_active: boolean
}) {
  return supabase.from('circle_cohorts').insert(input).select().single()
}

export async function updateCohort(id: string, updates: {
  name?: string
  starts_at?: string
  ends_at?: string
  max_members?: number
  is_active?: boolean
}) {
  return supabase.from('circle_cohorts').update(updates).eq('id', id)
}

export async function fetchCohortById(id: string): Promise<AdminCohortSummary | null> {
  const all = await fetchAdminCohorts()
  return all.find(c => c.id === id) ?? null
}

// ─── Pair mutations ───────────────────────────────────────────────────────────

export async function pairMembers(memberAId: string, memberBId: string) {
  // Set partner_id on both rows
  const a = await supabase.from('circle_members').update({ partner_id: memberBId }).eq('id', memberAId)
  if (a.error) return a
  const b = await supabase.from('circle_members').update({ partner_id: memberAId }).eq('id', memberBId)
  return b
}

export async function unpairMember(memberId: string) {
  // Find current partner, then null both sides
  const { data: row } = await supabase.from('circle_members').select('partner_id').eq('id', memberId).maybeSingle()
  const partnerId = row?.partner_id
  await supabase.from('circle_members').update({ partner_id: null }).eq('id', memberId)
  if (partnerId) {
    await supabase.from('circle_members').update({ partner_id: null }).eq('id', partnerId)
  }
}

export async function fetchUnpairedMembers(cohortId: string) {
  const { data } = await supabase
    .from('circle_members')
    .select(`
      id, archetype, user:user_id (name)
    `)
    .eq('cohort_id', cohortId)
    .is('partner_id', null)
    .order('joined_at')
  return (data ?? []).map(m => ({
    id: m.id,
    archetype: m.archetype,
    name: ((m as any).user?.name as string | null) ?? null,
  }))
}

// ─── Live call mutations ──────────────────────────────────────────────────────

export async function createLiveCall(input: {
  cohort_id: string
  call_number: number
  title: string
  scheduled_at: string  // ISO timestamp
  zoom_url?: string | null
  recording_url?: string | null
  notes?: string | null
}) {
  return supabase.from('circle_live_calls').insert(input).select().single()
}

// ─── Admin posts (coach notes to community feed) ──────────────────────────────

export async function createCoachPost(input: {
  cohort_id: string
  author_id: string
  body: string
  week_number?: number | null
  audio_url?: string | null
  video_url?: string | null
  image_url?: string | null
  file_url?:  string | null
  file_name?: string | null
}) {
  return supabase.from('circle_posts').insert({
    cohort_id: input.cohort_id,
    author_id: input.author_id,
    post_type: 'coach_note',
    body: input.body,
    week_number: input.week_number ?? null,
    audio_url: input.audio_url ?? null,
    video_url: input.video_url ?? null,
    image_url: input.image_url ?? null,
    file_url:  input.file_url  ?? null,
    file_name: input.file_name ?? null,
  })
}

// ─── Partner message thread (admin shadow read) ───────────────────────────────

export interface PartnerThreadMessage {
  id: string
  sender_id: string
  receiver_id: string
  body: string
  audio_url: string | null
  created_at: string
}

export async function fetchPartnerThread(userIdA: string, userIdB: string): Promise<PartnerThreadMessage[]> {
  const { data } = await supabase
    .from('circle_partner_messages')
    .select('id, sender_id, receiver_id, body, audio_url, created_at')
    .or(`and(sender_id.eq.${userIdA},receiver_id.eq.${userIdB}),and(sender_id.eq.${userIdB},receiver_id.eq.${userIdA})`)
    .order('created_at', { ascending: true })
  return (data ?? []) as PartnerThreadMessage[]
}

// ─── Coach messages (1:1 admin ↔ member) ──────────────────────────────────────

export interface CoachMessage {
  id: string
  user_id: string
  sender_id: string
  body: string
  audio_url: string | null
  video_url: string | null
  image_url: string | null
  file_url:  string | null
  file_name: string | null
  created_at: string
  read_at: string | null
}

export async function fetchCoachThread(memberUserId: string): Promise<CoachMessage[]> {
  const { data } = await supabase
    .from('circle_coach_messages')
    .select('*')
    .eq('user_id', memberUserId)
    .order('created_at', { ascending: true })
  return (data ?? []) as CoachMessage[]
}

export async function sendCoachMessage(input: {
  user_id: string         // whose thread
  sender_id: string       // admin's auth.users id
  body: string
  audio_url?: string | null
  video_url?: string | null
  image_url?: string | null
  file_url?:  string | null
  file_name?: string | null
}) {
  return supabase.from('circle_coach_messages').insert({
    user_id: input.user_id,
    sender_id: input.sender_id,
    body: input.body,
    audio_url: input.audio_url ?? null,
    video_url: input.video_url ?? null,
    image_url: input.image_url ?? null,
    file_url:  input.file_url  ?? null,
    file_name: input.file_name ?? null,
  })
}

// ─── Storage upload helper ────────────────────────────────────────────────────

export async function uploadCircleFile(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('circle-uploads')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) return null

  const { data } = supabase.storage.from('circle-uploads').getPublicUrl(path)
  return data.publicUrl
}

// ─── Daily cards editor (admin) ───────────────────────────────────────────────

export interface DailyCardRow {
  id: string
  day_number: number
  theme: string
  title: string
  body_text: string | null
  affirmation: string | null
  journal_prompt: string | null
  image_url: string | null
  card_color: string | null
  emoji: string | null
}

export async function fetchDailyCards(): Promise<DailyCardRow[]> {
  const { data } = await supabase
    .from('daily_cards')
    .select('*')
    .order('day_number')
  return (data ?? []) as DailyCardRow[]
}

export async function updateDailyCard(id: string, updates: Partial<DailyCardRow>) {
  return supabase.from('daily_cards').update(updates).eq('id', id)
}

// ─── All-users roster (across all programs) ───────────────────────────────────

export interface AdminUserRow {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  selected_path: 'A' | 'B' | 'C' | null
  quiz_result: string | null
  has_paid: boolean
  is_admin: boolean
  signup_date: string | null
  cards_addon_started_at: string | null
  member_id: string | null   // populated when the user has a circle_members row
  cohort_id: string | null
  archetype: string | null
  last_active: string | null
}

export async function fetchAllUsersAdmin(): Promise<AdminUserRow[]> {
  const { data: users } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, selected_path, quiz_result, has_paid, is_admin, signup_date, cards_addon_started_at')
    .order('signup_date', { ascending: false })
  if (!users) return []

  const userIds = users.map(u => u.id)
  const [{ data: members }, { data: progress }, { data: posts }, { data: msgs }] = await Promise.all([
    supabase.from('circle_members')
      .select('id, user_id, cohort_id, archetype')
      .in('user_id', userIds),
    supabase.from('journal_entries')
      .select('user_id, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    supabase.from('wins')
      .select('user_id, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false }),
    supabase.from('daily_check_ins')
      .select('user_id, check_in_date')
      .in('user_id', userIds)
      .order('check_in_date', { ascending: false }),
  ])

  const memberByUser = new Map<string, { id: string; cohort_id: string; archetype: string }>()
  for (const m of (members ?? []) as { id: string; user_id: string; cohort_id: string; archetype: string }[]) {
    memberByUser.set(m.user_id, m)
  }
  // First-seen wins for each kind of activity = newest, since arrays are sorted desc
  const lastByUser = new Map<string, string>()
  function record(rows: { user_id: string; created_at?: string; check_in_date?: string }[] | null | undefined) {
    if (!rows) return
    for (const r of rows) {
      const ts = r.created_at ?? r.check_in_date ?? null
      if (!ts) continue
      const cur = lastByUser.get(r.user_id)
      if (!cur || cur < ts) lastByUser.set(r.user_id, ts)
    }
  }
  record(progress as { user_id: string; created_at: string }[] | null)
  record(posts    as { user_id: string; created_at: string }[] | null)
  record(msgs     as { user_id: string; check_in_date: string }[] | null)

  return users.map(u => {
    const m = memberByUser.get(u.id)
    return {
      id: u.id,
      name: u.name as string | null,
      email: u.email as string | null,
      avatar_url: (u.avatar_url as string | null) ?? null,
      selected_path: u.selected_path as 'A' | 'B' | 'C' | null,
      quiz_result: u.quiz_result as string | null,
      has_paid: !!u.has_paid,
      is_admin: !!u.is_admin,
      signup_date: u.signup_date as string | null,
      cards_addon_started_at: u.cards_addon_started_at as string | null,
      member_id: m?.id ?? null,
      cohort_id: m?.cohort_id ?? null,
      archetype: m?.archetype ?? null,
      last_active: lastByUser.get(u.id) ?? u.signup_date ?? null,
    }
  })
}

// ─── Seal-the-Leak reflections (read on admin profile, write from portal) ────

export interface ReflectionRow {
  id: string
  user_id: string
  route_id: string
  day_number: number
  item_index: number
  content: string
  updated_at: string
  created_at: string
}

export async function fetchUserReflections(userId: string): Promise<ReflectionRow[]> {
  const { data } = await supabase
    .from('stl_reflections')
    .select('*')
    .eq('user_id', userId)
    .order('day_number')
    .order('item_index')
  return (data ?? []) as ReflectionRow[]
}

export async function upsertReflection(input: {
  user_id: string
  route_id: string
  day_number: number
  item_index: number
  content: string
}) {
  return supabase.from('stl_reflections').upsert({
    user_id: input.user_id,
    route_id: input.route_id,
    day_number: input.day_number,
    item_index: input.item_index,
    content: input.content,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,route_id,day_number,item_index' })
}

// ─── Program membership detection ────────────────────────────────────────────

export type ProgramKey = 'seal' | 'cards' | 'circle'

export interface ProgramBadge {
  key: ProgramKey
  label: string
  color: string
}

/**
 * Returns every program the user has access to. A user can be in multiple
 * programs simultaneously (e.g. Seal the Leak + cards add-on, or Path B +
 * a Circle cohort).
 *
 * Inputs are the columns we already fetch on AdminUserRow / AdminUserDetail.
 */
export function getUserPrograms(input: {
  selected_path: 'A' | 'B' | 'C' | null
  cards_addon_started_at?: string | null
  has_circle_membership?: boolean
}): ProgramBadge[] {
  const out: ProgramBadge[] = []
  if (input.selected_path === 'A') {
    out.push({ key: 'seal', label: 'Seal the Leak', color: 'gold' })
    if (input.cards_addon_started_at) {
      out.push({ key: 'cards', label: '365 Cards (add-on)', color: 'green' })
    }
  } else if (input.selected_path === 'B') {
    out.push({ key: 'cards', label: '365 Cards', color: 'green' })
  } else if (input.selected_path === 'C') {
    out.push({ key: 'circle', label: 'The Circle', color: 'blue' })
  }
  // A non-Path-C user enrolled in a cohort is in two programs.
  if (input.has_circle_membership && input.selected_path !== 'C') {
    out.push({ key: 'circle', label: 'The Circle (added)', color: 'blue' })
  }
  return out
}

// ─── User tags (migration 016) ──────────────────────────────────────────────

export type TagColor = 'gold' | 'green' | 'red' | 'blue' | 'gray'

export interface UserTag {
  id: string
  label: string
  color: TagColor
  created_at: string
}

export interface UserTagAssignment {
  user_id: string
  tag_id: string
}

export async function fetchAllTags(): Promise<UserTag[]> {
  const { data } = await supabase
    .from('user_tags')
    .select('id, label, color, created_at')
    .order('label')
  return (data ?? []) as UserTag[]
}

export async function fetchTagAssignments(): Promise<UserTagAssignment[]> {
  const { data } = await supabase
    .from('user_tag_assignments')
    .select('user_id, tag_id')
  return (data ?? []) as UserTagAssignment[]
}

export async function fetchUserTags(userId: string): Promise<UserTag[]> {
  const { data } = await supabase
    .from('user_tag_assignments')
    .select('user_tags ( id, label, color, created_at )')
    .eq('user_id', userId)
  if (!data) return []
  // The join returns { user_tags: UserTag } per row.
  return (data as unknown as Array<{ user_tags: UserTag | null }>)
    .map(r => r.user_tags)
    .filter((t): t is UserTag => !!t)
}

export async function createTag(label: string, color: TagColor) {
  return supabase.from('user_tags').insert({ label: label.trim(), color }).select().single()
}

export async function deleteTag(tagId: string) {
  return supabase.from('user_tags').delete().eq('id', tagId)
}

export async function assignTag(userId: string, tagId: string, assignedBy?: string) {
  return supabase.from('user_tag_assignments').upsert({
    user_id: userId,
    tag_id: tagId,
    assigned_by: assignedBy ?? null,
  }, { onConflict: 'user_id,tag_id' })
}

export async function removeTag(userId: string, tagId: string) {
  return supabase.from('user_tag_assignments').delete().match({ user_id: userId, tag_id: tagId })
}

// ─── Audit log (migration 015) — soft-fails if table doesn't exist yet ─────

export async function logAdminAction(input: {
  actor_id: string
  actor_email?: string | null
  action: string
  resource_type?: string | null
  resource_id?: string | null
  changes?: Record<string, unknown> | null
}) {
  // Best-effort. If the table doesn't exist or RLS rejects, swallow silently —
  // we never want an audit-write to block a legitimate admin operation.
  try {
    await supabase.from('admin_audit_log').insert({
      actor_id: input.actor_id,
      actor_email: input.actor_email ?? null,
      action: input.action,
      resource_type: input.resource_type ?? null,
      resource_id: input.resource_id ?? null,
      changes: input.changes ?? null,
    })
  } catch {
    // Migration 015 not yet applied or RLS misconfigured — non-fatal.
  }
}

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  changes: Record<string, unknown> | null
  created_at: string
}

export async function fetchRecentAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const { data } = await supabase
    .from('admin_audit_log')
    .select('id, actor_id, actor_email, action, resource_type, resource_id, changes, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as AuditLogEntry[]
}

// ─── Per-user content (admin reads via RLS migration 011) ───────────────────

export interface AdminJournalEntry {
  id: string
  user_id: string
  card_id: string | null
  day_number: number | null
  content: string
  created_at: string
}

export async function fetchUserJournalEntries(userId: string): Promise<AdminJournalEntry[]> {
  const { data } = await supabase
    .from('journal_entries')
    .select('id, user_id, card_id, day_number, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as AdminJournalEntry[]
}

export interface AdminWin {
  id: string
  user_id: string
  category: string
  title: string
  description: string | null
  created_at: string
}

export async function fetchUserWins(userId: string): Promise<AdminWin[]> {
  const { data } = await supabase
    .from('wins')
    .select('id, user_id, category, title, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as AdminWin[]
}

export interface AdminCheckIn {
  id: string
  user_id: string
  check_in_date: string
  mood: string
  created_at: string
}

export async function fetchUserCheckIns(userId: string): Promise<AdminCheckIn[]> {
  const { data } = await supabase
    .from('daily_check_ins')
    .select('id, user_id, check_in_date, mood, created_at')
    .eq('user_id', userId)
    .order('check_in_date', { ascending: false })
    .limit(90)
  return (data ?? []) as AdminCheckIn[]
}

// ─── Pending purchases (Stripe pre-signup limbo) ─────────────────────────────

export interface PendingPurchase {
  id: string
  email: string
  path: 'A' | 'B' | 'C'
  stripe_customer_id: string | null
  stripe_session_id: string | null
  price_id: string | null
  claimed_at: string | null
  created_at: string
}

export async function fetchUnclaimedPurchases(): Promise<PendingPurchase[]> {
  const { data } = await supabase
    .from('pending_purchases')
    .select('*')
    .is('claimed_at', null)
    .order('created_at', { ascending: false })
  return (data ?? []) as PendingPurchase[]
}

export async function fetchPendingPurchaseByEmail(email: string): Promise<PendingPurchase | null> {
  const { data } = await supabase
    .from('pending_purchases')
    .select('*')
    .ilike('email', email.trim())
    .is('claimed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data ?? null) as PendingPurchase | null
}

/** Force-claim a pending purchase onto a user. Use when the email differs
 *  from the signup email (e.g. user paid with a different address). */
export async function adminClaimPurchaseForUser(purchaseId: string, userId: string) {
  const { data: purchase } = await supabase
    .from('pending_purchases')
    .select('*')
    .eq('id', purchaseId)
    .maybeSingle()
  if (!purchase) return { error: { message: 'Purchase not found' } }

  const userUpdate = await supabase.from('users').update({
    has_paid: true,
    selected_path: purchase.path,
    stripe_customer_id: purchase.stripe_customer_id ?? null,
    onboarding_complete: purchase.path !== 'C',
  }).eq('id', userId)
  if (userUpdate.error) return userUpdate

  return supabase.from('pending_purchases')
    .update({ claimed_at: new Date().toISOString() })
    .eq('id', purchaseId)
}

// ─── Admin user / member edits ────────────────────────────────────────────────

/** Update editable fields on public.users for any user. Admin-only via RLS. */
export async function adminUpdateUser(userId: string, updates: {
  name?: string | null
  email?: string | null
  avatar_url?: string | null
  has_paid?: boolean
  is_admin?: boolean
  onboarding_complete?: boolean
  selected_path?: 'A' | 'B' | 'C' | null
  quiz_result?: 'seeker' | 'builder' | 'healer' | 'visionary' | null
}) {
  return supabase.from('users').update(updates).eq('id', userId)
}

// ─── Single-user admin profile + cohort enrollment ────────────────────────────

export interface AdminUserDetail {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
  selected_path: 'A' | 'B' | 'C' | null
  quiz_result: 'seeker' | 'builder' | 'healer' | 'visionary' | null
  has_paid: boolean
  is_admin: boolean
  onboarding_complete: boolean
  signup_date: string | null
  cards_addon_started_at: string | null
}

export interface UserCohortMembership {
  member_id: string
  cohort_id: string
  cohort_name: string
  cohort_active: boolean
  archetype: string
  joined_at: string | null
}

export interface CohortOption {
  id: string
  name: string
  is_active: boolean
}

/** Load one user's editable profile (works for any user — Path A/B/C/none). */
export async function fetchAdminUserById(userId: string): Promise<AdminUserDetail | null> {
  const { data } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, selected_path, quiz_result, has_paid, is_admin, onboarding_complete, signup_date, cards_addon_started_at')
    .eq('id', userId)
    .maybeSingle()
  return (data as AdminUserDetail | null) ?? null
}

/** Toggle the 365 Cards add-on for a Path A user. Setting `true` stamps
 *  cards_addon_started_at to now (becomes their cards Day 1). Setting `false`
 *  clears the timestamp, removing card access. */
export async function adminSetCardsAddOn(userId: string, enabled: boolean) {
  return supabase.from('users').update({
    cards_addon_started_at: enabled ? new Date().toISOString() : null,
  }).eq('id', userId)
}

/**
 * Set a user's effective cards Day. Back-dates the appropriate column so that
 * `today - <column>` equals `(day - 1)` days.
 *
 * Path B users: writes to `signup_date` (their Day 1 anchor).
 * Path A users with the cards add-on: writes to `cards_addon_started_at`.
 * Path A users without the add-on, and Path C, are no-ops (the cards Day
 * concept doesn't apply).
 */
export async function adminSetCardsDay(
  userId: string,
  day: number,
  selectedPath: 'A' | 'B' | 'C' | null,
  hasCardsAddOn: boolean,
) {
  const targetMs = Date.now() - (day - 1) * 86400000
  const iso = new Date(targetMs).toISOString()
  if (selectedPath === 'B') {
    return supabase.from('users').update({ signup_date: iso }).eq('id', userId)
  }
  if (selectedPath === 'A' && hasCardsAddOn) {
    return supabase.from('users').update({ cards_addon_started_at: iso }).eq('id', userId)
  }
  return { error: { message: 'Day adjustment only applies to Path B users or Path A users with the cards add-on.' } }
}

/** All cohorts this user is enrolled in (zero, one, or many). */
export async function fetchUserCohorts(userId: string): Promise<UserCohortMembership[]> {
  const { data } = await supabase
    .from('circle_members')
    .select('id, cohort_id, archetype, created_at, circle_cohorts!inner(name, is_active)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (!data) return []
  return data.map((row: any) => ({
    member_id:     row.id,
    cohort_id:     row.cohort_id,
    cohort_name:   row.circle_cohorts.name,
    cohort_active: row.circle_cohorts.is_active,
    archetype:     row.archetype,
    joined_at:     row.created_at,
  }))
}

/** All cohorts available to add a user to (newest first). */
export async function fetchAllCohortsForAdmin(): Promise<CohortOption[]> {
  const { data } = await supabase
    .from('circle_cohorts')
    .select('id, name, is_active')
    .order('starts_at', { ascending: false })
  return (data as CohortOption[] | null) ?? []
}

/** Enroll a user as a member of a cohort. archetype defaults to 'door' if
 *  the user hasn't taken the quiz yet — admin can edit it later from the
 *  member detail page. */
export async function adminAddUserToCohort(
  userId: string,
  cohortId: string,
  archetype: 'door' | 'throne' | 'engine' | 'push' = 'door',
) {
  return supabase.from('circle_members').upsert({
    user_id:   userId,
    cohort_id: cohortId,
    archetype,
  }, { onConflict: 'user_id,cohort_id' })
}

/** Remove a member from their cohort. Drops the circle_members row by id.
 *  Cascades will clean partner pairings that reference this member. */
export async function adminRemoveMember(memberId: string) {
  // First null out any partner pointing at this member (FK is on partner_id
  // but there's no ON DELETE rule on it, so we orphan-clean manually).
  const { data: row } = await supabase
    .from('circle_members')
    .select('partner_id')
    .eq('id', memberId)
    .maybeSingle()
  if (row?.partner_id) {
    await supabase.from('circle_members')
      .update({ partner_id: null })
      .eq('id', row.partner_id)
  }
  return supabase.from('circle_members').delete().eq('id', memberId)
}

/** Update editable fields on circle_members for a given member row. */
export async function adminUpdateMember(memberId: string, updates: {
  archetype?: 'door' | 'throne' | 'engine' | 'push'
  enneagram_type?: string | null
  attachment_style?: 'secure' | 'anxious' | 'avoidant' | 'disorganized' | null
  feedback_pref?: 'straight' | 'context' | 'written' | 'example' | null
  goal_90day?: string | null
}) {
  return supabase.from('circle_members').update(updates).eq('id', memberId)
}

// ─── Support / bug reports ────────────────────────────────────────────────────

export interface SupportMessage {
  id: string
  user_id: string
  body: string
  page_path: string | null
  user_agent: string | null
  status: 'open' | 'in_progress' | 'resolved'
  created_at: string
  resolved_at: string | null
  user_name: string | null
  user_email: string | null
}

export type SupportCategory =
  | 'bug' | 'login' | 'payment' | 'content' | 'account' | 'feature' | 'other'

export async function submitSupportMessage(input: {
  body: string
  category?: SupportCategory | null
  page_path?: string | null
  user_agent?: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'Not signed in.' } as const }
  return supabase.from('support_messages').insert({
    user_id:    user.id,
    body:       input.body,
    category:   input.category ?? 'other',
    page_path:  input.page_path  ?? null,
    user_agent: input.user_agent ?? null,
  })
}

export async function fetchSupportMessages(filter?: {
  status?: SupportMessage['status']
}): Promise<SupportMessage[]> {
  // support_messages.user_id references auth.users(id), which PostgREST
  // doesn't expose for embedded selects — so we can't `select(user:user_id…)`.
  // Pull the rows first, then look up names/emails from public.users in a
  // second query and merge in JS. The handle_new_user trigger guarantees a
  // public.users row for every authed account, so this is reliable.
  let q = supabase
    .from('support_messages')
    .select('id, user_id, body, page_path, user_agent, status, created_at, resolved_at')
    .order('created_at', { ascending: false })
  if (filter?.status) q = q.eq('status', filter.status)
  const { data: rowsRaw, error } = await q
  if (error) {
    // Most common cause here: the 010 migration hasn't been applied.
    if (typeof console !== 'undefined') console.warn('fetchSupportMessages:', error.message)
    return []
  }
  const rows = (rowsRaw ?? []) as Array<{
    id: string; user_id: string; body: string;
    page_path: string | null; user_agent: string | null;
    status: SupportMessage['status'];
    created_at: string; resolved_at: string | null;
  }>

  if (rows.length === 0) return []

  const userIds = Array.from(new Set(rows.map(r => r.user_id)))
  const { data: profilesRaw } = await supabase
    .from('users')
    .select('id, name, email')
    .in('id', userIds)
  const profiles = (profilesRaw ?? []) as Array<{ id: string; name: string | null; email: string | null }>
  const profileById = new Map(profiles.map(p => [p.id, p] as const))

  return rows.map(r => {
    const p = profileById.get(r.user_id)
    return {
      id: r.id,
      user_id: r.user_id,
      body: r.body,
      page_path: r.page_path,
      user_agent: r.user_agent,
      status: r.status,
      created_at: r.created_at,
      resolved_at: r.resolved_at,
      user_name:  p?.name  ?? null,
      user_email: p?.email ?? null,
    }
  })
}

export async function fetchOpenSupportCount(): Promise<number> {
  const { count } = await supabase
    .from('support_messages')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'resolved')
  return count ?? 0
}

export async function updateSupportMessageStatus(id: string, status: SupportMessage['status']) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase.from('support_messages').update({
    status,
    resolved_at: status === 'resolved' ? new Date().toISOString() : null,
    resolved_by: status === 'resolved' ? user?.id ?? null : null,
  }).eq('id', id)
}

// ─── Admin media slots (curated media in fixed user-portal positions) ────────

export type MediaSlotProgram = 'cards' | 'work' | 'circle'
export type MediaSlotType    = 'video' | 'audio' | 'image'

export interface MediaSlot {
  id: string
  slot_key: string
  program: MediaSlotProgram
  media_type: MediaSlotType
  media_url: string
  title: string | null
  caption: string | null
  updated_at: string
}

export async function fetchMediaSlots(slotKeys: string[]): Promise<MediaSlot[]> {
  if (slotKeys.length === 0) return []
  const { data } = await supabase
    .from('admin_media_slots')
    .select('id, slot_key, program, media_type, media_url, title, caption, updated_at')
    .in('slot_key', slotKeys)
  return (data ?? []) as MediaSlot[]
}

export async function fetchMediaSlot(slotKey: string): Promise<MediaSlot | null> {
  const { data } = await supabase
    .from('admin_media_slots')
    .select('id, slot_key, program, media_type, media_url, title, caption, updated_at')
    .eq('slot_key', slotKey)
    .maybeSingle()
  return (data as MediaSlot | null) ?? null
}

export async function upsertMediaSlot(input: {
  slot_key: string
  program: MediaSlotProgram
  media_type: MediaSlotType
  media_url: string
  title?: string | null
  caption?: string | null
}) {
  const { data: { user } } = await supabase.auth.getUser()
  return supabase.from('admin_media_slots').upsert({
    slot_key:   input.slot_key,
    program:    input.program,
    media_type: input.media_type,
    media_url:  input.media_url,
    title:      input.title ?? null,
    caption:    input.caption ?? null,
    created_by: user?.id ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'slot_key' })
}

export async function deleteMediaSlot(slotKey: string) {
  return supabase.from('admin_media_slots').delete().eq('slot_key', slotKey)
}

// ─── Admin role helpers ───────────────────────────────────────────────────────

export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('admin_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()
  return !!data
}

// ─── Nicole broadcast / inbox ─────────────────────────────────────────────
// Channels:
//   'inbox'  — appears in /inbox forever (or until archived)
//   'banner' — sticky-top across portal; 7-day default expiry
//   'pinned' — attached to a specific Seal-the-Leak day (1–7)
//
// Audience targeting:
//   audience_paths        → ['A','B','C'] / empty = all paths
//   audience_user_ids     → uuid[] of specific users / empty = "audience-paths-only"

export type AdminMessageChannel = 'inbox' | 'banner' | 'pinned'

export interface AdminMessage {
  id: string
  channel: AdminMessageChannel
  title: string | null
  body: string
  audience_paths: ('A' | 'B' | 'C')[]
  audience_user_ids: string[]
  pinned_program_day: number | null
  expires_at: string | null
  archived_at: string | null
  email_paired: boolean
  created_by: string | null
  created_at: string
}

export interface AdminMessageInputData {
  channel: AdminMessageChannel
  title?: string | null
  body: string
  audience_paths?: ('A' | 'B' | 'C')[]
  audience_user_ids?: string[]
  pinned_program_day?: number | null
  expires_at?: string | null   // ISO; null = no expiry
  email_paired?: boolean
}

/** Admin-only — insert a new broadcast row. RLS gates non-admins out. */
export async function createAdminMessage(input: AdminMessageInputData): Promise<{ data: AdminMessage | null; error: Error | null }> {
  const { data: auth } = await supabase.auth.getUser()
  const created_by = auth.user?.id ?? null

  const row = {
    channel:            input.channel,
    title:              input.title ?? null,
    body:               input.body,
    audience_paths:     input.audience_paths ?? [],
    audience_user_ids:  input.audience_user_ids ?? [],
    pinned_program_day: input.channel === 'pinned' ? (input.pinned_program_day ?? null) : null,
    expires_at:         input.expires_at ?? null,
    email_paired:       !!input.email_paired,
    created_by,
  }

  const { data, error } = await supabase
    .from('admin_messages')
    .insert(row)
    .select('*')
    .single()
  return { data: (data as AdminMessage | null) ?? null, error: (error as unknown as Error | null) ?? null }
}

/** Admin-only — soft-delete by setting archived_at. */
export async function archiveAdminMessage(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('admin_messages')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  return { error: (error as unknown as Error | null) ?? null }
}

/** Admin-only — list of everything Nicole has sent, newest first. */
export async function fetchAdminMessageHistory(limit = 50): Promise<AdminMessage[]> {
  const { data } = await supabase
    .from('admin_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data as AdminMessage[] | null) ?? []
}

// ─── Read-state per user ──────────────────────────────────────────────────

export async function markMessageRead(messageId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return
  await supabase
    .from('user_message_reads')
    .upsert({
      user_id:    userId,
      message_id: messageId,
      read_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,message_id' })
}

export async function dismissBanner(messageId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return
  await supabase
    .from('user_message_reads')
    .upsert({
      user_id:      userId,
      message_id:   messageId,
      dismissed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,message_id' })
}

// ─── Reads for the signed-in user ─────────────────────────────────────────
// RLS already filters admin_messages to messages this user is addressed by;
// these helpers add channel and read-state filtering on top.

export interface InboxItem {
  // Discriminated union: a broadcast or a 1:1 DM rendered uniformly.
  source: 'broadcast' | 'coach'
  id: string
  title: string | null
  body: string
  created_at: string
  read_at: string | null
  /** Only set for broadcast source. */
  channel?: AdminMessageChannel
}

/** All messages for the current user, broadcasts + 1:1 coach DMs, merged
 *  and sorted newest first. */
export async function fetchUserInbox(): Promise<InboxItem[]> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return []

  // Broadcasts addressed to me, inbox channel only — banner/pinned don't
  // belong in the inbox view; they have their own surface.
  const [broadcastsRes, readsRes, coachRes] = await Promise.all([
    supabase
      .from('admin_messages')
      .select('*')
      .eq('channel', 'inbox')
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_message_reads')
      .select('message_id, read_at, dismissed_at')
      .eq('user_id', userId),
    // 1:1 coach DMs: only show messages TO this user (sender != self) so
    // the user's own outbound replies (if any) don't show as inbox items.
    supabase
      .from('circle_coach_messages')
      .select('id, body, sender_id, read_at, created_at')
      .eq('user_id', userId)
      .neq('sender_id', userId)
      .order('created_at', { ascending: false }),
  ])

  const reads = new Map<string, { read_at: string | null }>()
  for (const r of (readsRes.data as { message_id: string; read_at: string | null; dismissed_at: string | null }[] | null) ?? []) {
    reads.set(r.message_id, { read_at: r.read_at })
  }

  const broadcasts: InboxItem[] = ((broadcastsRes.data as AdminMessage[] | null) ?? []).map(m => ({
    source: 'broadcast' as const,
    id: m.id,
    title: m.title,
    body: m.body,
    created_at: m.created_at,
    read_at: reads.get(m.id)?.read_at ?? null,
    channel: m.channel,
  }))

  const coach: InboxItem[] = ((coachRes.data as { id: string; body: string; read_at: string | null; created_at: string }[] | null) ?? []).map(m => ({
    source: 'coach' as const,
    id: m.id,
    title: null,
    body: m.body,
    created_at: m.created_at,
    read_at: m.read_at,
  }))

  return [...broadcasts, ...coach].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

/** Banner messages that this user hasn't dismissed yet. Used by the
 *  portal layout to render the sticky banner. */
export async function fetchActiveBanners(): Promise<AdminMessage[]> {
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return []

  const [bannersRes, readsRes] = await Promise.all([
    supabase
      .from('admin_messages')
      .select('*')
      .eq('channel', 'banner')
      .is('archived_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_message_reads')
      .select('message_id, dismissed_at')
      .eq('user_id', userId)
      .not('dismissed_at', 'is', null),
  ])

  const dismissed = new Set(((readsRes.data as { message_id: string }[] | null) ?? []).map(r => r.message_id))
  return ((bannersRes.data as AdminMessage[] | null) ?? []).filter(m => !dismissed.has(m.id))
}

/** Pinned messages for a specific Seal-the-Leak day. Returns whatever's
 *  active for the user on that day (filtered by audience server-side). */
export async function fetchPinnedForDay(day: number): Promise<AdminMessage | null> {
  const { data } = await supabase
    .from('admin_messages')
    .select('*')
    .eq('channel', 'pinned')
    .eq('pinned_program_day', day)
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as AdminMessage | null) ?? null
}

/** Count of inbox items the user hasn't read. Drives the sidebar badge. */
export async function fetchInboxUnreadCount(): Promise<number> {
  const items = await fetchUserInbox()
  return items.filter(i => !i.read_at).length
}
