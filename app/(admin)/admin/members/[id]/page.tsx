'use client'

// app/(admin)/admin/members/[id]/page.tsx
// Admin-side profile for a single circle member. Aggregates the full picture:
// account, cohort + program progress, partner, coach chat, coaching notes,
// profile intake, plus user-app activity (journals, wins, check-ins).
//
// Reached from /admin/cohorts/[id] (member name links here) and from the
// /admin/members roster as a future expansion of the in-row drawer.

import { useEffect, useState, useCallback, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import {
  fetchCoachingNotes, addCoachingNote,
  fetchCoachThread, sendCoachMessage,
  adminUpdateUser, adminUpdateMember,
  fetchUserReflections,
  type CoachingNote, type CoachMessage, type ReflectionRow,
} from '@/lib/admin/hooks'
import { uploadCircleAttachment } from '@/lib/circle'

const ARCHETYPE_COLORS: Record<string, string> = {
  door: 'var(--green)', throne: '#1a1a2e', engine: 'var(--red)', push: '#3d2c0e',
}
const ARCHETYPE_LABELS: Record<string, string> = {
  door: 'Open Door', throne: 'Overthink Throne', engine: 'Interrupted Engine', push: 'Pushthrough',
}
const ALERT_COLORS = {
  amber:  { bg: 'rgba(184,146,42,.15)', text: 'var(--gold)' },
  orange: { bg: 'rgba(201,125,58,.15)', text: '#C97D3A' },
  red:    { bg: 'rgba(139,31,47,.25)', text: 'var(--red)' },
}
type AlertLevel = 'amber' | 'orange' | 'red'

interface MemberRow {
  id: string
  user_id: string
  cohort_id: string
  archetype: string
  enneagram_type: string | null
  attachment_style: string | null
  feedback_pref: string | null
  goal_90day: string | null
  partner_id: string | null
  joined_at: string
}

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  signup_date: string | null
  selected_path: 'A' | 'B' | null
  quiz_result: string | null
  has_paid: boolean | null
  is_admin: boolean | null
  cards_addon_started_at: string | null
  onboarding_complete: boolean | null
  avatar_url: string | null
}

interface Cohort {
  id: string
  name: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

interface PartnerInfo {
  id: string
  user_id: string
  archetype: string
  name: string | null
  email: string | null
}

interface ProgressRow {
  week_number: number
  journal_completed: boolean
  action_completed: boolean
  completed_at: string | null
}

interface JournalEntry {
  id: string
  day_number: number | null
  content: string | null
  created_at: string
}

interface WinRow {
  id: string
  title: string | null
  description: string | null
  created_at: string
}

interface CheckInRow {
  check_in_date: string
  mood: string
}

interface AlertRow {
  id: string
  alert_level: AlertLevel
  reason: string | null
  days_inactive: number
  created_at: string
}

function daysBetween(from: string | null): number | null {
  if (!from) return null
  return Math.floor((Date.now() - new Date(from).getTime()) / 86400000)
}

function currentWeekFromStart(startDate: string): number {
  const start = new Date(startDate)
  const diff = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return Math.min(Math.max(diff + 1, 1), 12)
}

export default function AdminMemberProfilePage() {
  const params = useParams<{ id: string }>()
  const memberId = params?.id

  const [member, setMember] = useState<MemberRow | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [cohort, setCohort] = useState<Cohort | null>(null)
  const [partner, setPartner] = useState<PartnerInfo | null>(null)
  const [progress, setProgress] = useState<ProgressRow[]>([])
  const [notes, setNotes] = useState<CoachingNote[]>([])
  const [coachThread, setCoachThread] = useState<CoachMessage[]>([])
  const [coachUserId, setCoachUserId] = useState('')
  const [partnerThread, setPartnerThread] = useState<{ created_at: string; body: string; sender_id: string }[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [wins, setWins] = useState<WinRow[]>([])
  const [checkIns, setCheckIns] = useState<CheckInRow[]>([])
  const [alerts, setAlerts] = useState<AlertRow[]>([])
  const [hasStory, setHasStory] = useState(false)
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null)
  const [reflections, setReflections] = useState<ReflectionRow[]>([])

  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [msgBody, setMsgBody] = useState('')
  const [msgSending, setMsgSending] = useState(false)

  // ── Edit mode ─────────────────────────────────────────────────────────────
  type EditDraft = {
    name: string
    email: string
    avatar_url: string | null
    has_paid: boolean
    is_admin: boolean
    onboarding_complete: boolean
    selected_path: 'A' | 'B' | ''
    archetype: 'door' | 'throne' | 'engine' | 'push'
    enneagram_type: string
    attachment_style: 'secure' | 'anxious' | 'avoidant' | 'disorganized' | ''
    feedback_pref:    'straight' | 'context' | 'written' | 'example' | ''
    goal_90day: string
  }
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<EditDraft | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  function openEdit() {
    if (!user || !member) return
    setDraft({
      name:      user.name ?? '',
      email:     user.email ?? '',
      avatar_url: user.avatar_url,
      has_paid:  !!user.has_paid,
      is_admin:  !!user.is_admin,
      onboarding_complete: !!user.onboarding_complete,
      selected_path: (user.selected_path ?? '') as 'A' | 'B' | '',
      archetype: member.archetype as 'door' | 'throne' | 'engine' | 'push',
      enneagram_type: member.enneagram_type ?? '',
      attachment_style: (member.attachment_style ?? '') as EditDraft['attachment_style'],
      feedback_pref:    (member.feedback_pref ?? '')    as EditDraft['feedback_pref'],
      goal_90day: member.goal_90day ?? '',
    })
    setProfileError(null)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setDraft(null)
    setProfileError(null)
  }

  async function handleAvatarUpload(file: File) {
    if (!draft) return
    setUploadingAvatar(true)
    const url = await uploadCircleAttachment(file)
    setUploadingAvatar(false)
    if (url) setDraft({ ...draft, avatar_url: url })
    else setProfileError('Avatar upload failed.')
  }

  async function saveProfile() {
    if (!user || !member || !draft) return
    setSavingProfile(true)
    setProfileError(null)

    const userPatch = {
      name:  draft.name.trim() || null,
      email: draft.email.trim() || null,
      avatar_url: draft.avatar_url,
      has_paid: draft.has_paid,
      is_admin: draft.is_admin,
      onboarding_complete: draft.onboarding_complete,
      selected_path: draft.selected_path === '' ? null : draft.selected_path,
    }
    const memberPatch = {
      archetype: draft.archetype,
      enneagram_type:   draft.enneagram_type.trim()   || null,
      attachment_style: draft.attachment_style === '' ? null : draft.attachment_style,
      feedback_pref:    draft.feedback_pref    === '' ? null : draft.feedback_pref,
      goal_90day: draft.goal_90day.trim() || null,
    }

    const [uRes, mRes] = await Promise.all([
      adminUpdateUser(user.id, userPatch),
      adminUpdateMember(member.id, memberPatch),
    ])
    setSavingProfile(false)
    const err = uRes.error?.message || mRes.error?.message
    if (err) {
      setProfileError(err)
      return
    }
    setEditing(false)
    setDraft(null)
    await loadAll()
  }

  const loadAll = useCallback(async () => {
    if (!memberId) return
    setLoading(true)

    // 1. Member + cohort + partner come from a single chained fetch.
    const { data: m } = await supabaseClient
      .from('circle_members')
      .select('*')
      .eq('id', memberId)
      .maybeSingle()

    if (!m) { setLoading(false); return }
    setMember(m as MemberRow)

    const [
      userRes, cohortRes, partnerRes, progressRes, notesRes,
      coachUserRes, journalRes, winsRes, checkInsRes, alertsRes, storyRes,
      progressActivityRes, postActivityRes, msgActivityRes,
    ] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', m.user_id).maybeSingle(),
      supabaseClient.from('circle_cohorts').select('id,name,starts_at,ends_at,is_active').eq('id', m.cohort_id).maybeSingle(),
      m.partner_id
        ? supabaseClient.from('circle_members')
            .select('id, user_id, archetype, user:user_id(name, email)')
            .eq('id', m.partner_id)
            .maybeSingle()
        : Promise.resolve({ data: null } as { data: null }),
      supabaseClient.from('circle_member_progress')
        .select('week_number, journal_completed, action_completed, completed_at')
        .eq('member_id', memberId)
        .order('week_number'),
      fetchCoachingNotes(memberId),
      supabaseClient.auth.getUser(),
      supabaseClient.from('journal_entries')
        .select('id, day_number, content, created_at')
        .eq('user_id', m.user_id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseClient.from('wins')
        .select('id, title, description, created_at')
        .eq('user_id', m.user_id)
        .order('created_at', { ascending: false })
        .limit(8),
      supabaseClient.from('daily_check_ins')
        .select('check_in_date, mood')
        .eq('user_id', m.user_id)
        .order('check_in_date', { ascending: false })
        .limit(14),
      supabaseClient.from('circle_engagement_alerts')
        .select('id, alert_level, reason, days_inactive, created_at')
        .eq('member_id', memberId)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false }),
      supabaseClient.from('circle_transformation_stories')
        .select('id', { count: 'exact', head: true })
        .eq('member_id', memberId),
      // For "last active" we look at progress completions, posts, and partner DMs
      supabaseClient.from('circle_member_progress')
        .select('completed_at')
        .eq('member_id', memberId)
        .order('completed_at', { ascending: false })
        .limit(1),
      supabaseClient.from('circle_posts')
        .select('created_at')
        .eq('author_id', m.user_id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabaseClient.from('circle_partner_messages')
        .select('created_at')
        .eq('sender_id', m.user_id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    setUser((userRes.data as UserProfile | null) ?? null)
    setCohort((cohortRes.data as Cohort | null) ?? null)
    if (partnerRes.data) {
      const p = partnerRes.data as { id: string; user_id: string; archetype: string; user: { name: string | null; email: string | null } | null }
      setPartner({
        id: p.id,
        user_id: p.user_id,
        archetype: p.archetype,
        name: p.user?.name ?? null,
        email: p.user?.email ?? null,
      })
    } else {
      setPartner(null)
    }
    setProgress((progressRes.data as ProgressRow[]) ?? [])
    setNotes(notesRes)
    setCoachUserId(coachUserRes.data.user?.id ?? '')
    setJournalEntries((journalRes.data as JournalEntry[]) ?? [])
    setWins((winsRes.data as WinRow[]) ?? [])
    setCheckIns((checkInsRes.data as CheckInRow[]) ?? [])
    setAlerts((alertsRes.data as AlertRow[]) ?? [])
    setHasStory(((storyRes as { count: number | null }).count ?? 0) > 0)

    // Compute last-active = max of progress completion, post creation, partner DM, journal entry, win
    const dates = [
      progressActivityRes.data?.[0]?.completed_at,
      postActivityRes.data?.[0]?.created_at,
      msgActivityRes.data?.[0]?.created_at,
      (journalRes.data as JournalEntry[] | null)?.[0]?.created_at,
      (winsRes.data as WinRow[] | null)?.[0]?.created_at,
    ].filter(Boolean) as string[]
    setLastActiveDate(dates.length ? dates.sort().reverse()[0] : (m.joined_at as string))

    // Coach + partner threads (need user ids from the resolved fetches above)
    const [thread, partnerMsgs] = await Promise.all([
      fetchCoachThread(m.user_id),
      m.partner_id && partnerRes.data
        ? supabaseClient.from('circle_partner_messages')
            .select('created_at, body, sender_id')
            .or(`and(sender_id.eq.${m.user_id},receiver_id.eq.${(partnerRes.data as { user_id: string }).user_id}),and(sender_id.eq.${(partnerRes.data as { user_id: string }).user_id},receiver_id.eq.${m.user_id})`)
            .order('created_at', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] } as { data: { created_at: string; body: string; sender_id: string }[] }),
    ])
    setCoachThread(thread)
    setPartnerThread((partnerMsgs.data as { created_at: string; body: string; sender_id: string }[]) ?? [])

    // Seal-the-Leak reflections live in stl_reflections keyed by auth user_id.
    fetchUserReflections(m.user_id).then(setReflections)

    setLoading(false)
  }, [memberId])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleAddNote() {
    if (!member || !newNote.trim() || savingNote) return
    setSavingNote(true)
    const { data: { user: auth } } = await supabaseClient.auth.getUser()
    if (auth) {
      await addCoachingNote(member.id, auth.id, newNote.trim())
      const updated = await fetchCoachingNotes(member.id)
      setNotes(updated)
      setNewNote('')
    }
    setSavingNote(false)
  }

  async function handleSendMessage() {
    if (!member || !msgBody.trim() || !coachUserId || msgSending) return
    setMsgSending(true)
    await sendCoachMessage({ user_id: member.user_id, sender_id: coachUserId, body: msgBody.trim() })
    const fresh = await fetchCoachThread(member.user_id)
    setCoachThread(fresh)
    setMsgBody('')
    setMsgSending(false)
  }

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading member…</div>
  }

  if (!member || !user) {
    return (
      <div style={{ color: 'var(--ink)' }}>
        <Link href="/admin/cohorts" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>← Cohorts</Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px' }}>Member not found</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          The member may have been removed, or you don&apos;t have access.
        </p>
      </div>
    )
  }

  const displayName = user.name?.trim() || user.email?.split('@')[0] || 'Member'
  const initials = displayName.slice(0, 2).toUpperCase()
  const archetypeColor = ARCHETYPE_COLORS[member.archetype] ?? 'var(--line)'
  const archetypeLabel = ARCHETYPE_LABELS[member.archetype] ?? member.archetype
  const inactiveDays = daysBetween(lastActiveDate) ?? 0
  const cohortWeek = cohort ? currentWeekFromStart(cohort.starts_at) : 1
  const totalPossible = cohortWeek * 2
  const completed = progress.reduce((s, p) => s + (p.journal_completed ? 1 : 0) + (p.action_completed ? 1 : 0), 0)
  const completionPct = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0
  const thisWeek = progress.find(p => p.week_number === cohortWeek)
  const planLabel = user.selected_path === 'A' ? 'Path A — Cohort' : user.selected_path === 'B' ? 'Path B — Daily Cards' : '—'

  // ── Styles ──────────────────────────────────────────────────────────────
  const S = {
    section: {
      background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
      overflow: 'hidden', marginBottom: 16,
    } as const,
    sectionHead: {
      padding: '14px 20px', borderBottom: '1px solid var(--line)', background: 'var(--paper)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    } as const,
    sectionTitle: {
      fontSize: 11, fontWeight: 700, letterSpacing: '.1em',
      textTransform: 'uppercase' as const, color: 'var(--text-muted)',
    } as const,
    label: {
      fontSize: 10, fontWeight: 700, letterSpacing: '.09em',
      textTransform: 'uppercase' as const, color: 'var(--text-muted)', marginBottom: 4,
    } as const,
    value: { fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, fontFamily: 'var(--font-body)' } as const,
    tag: (color: string) => ({
      display: 'inline-block', fontSize: 10, fontWeight: 600,
      padding: '3px 9px', borderRadius: 999,
      background: `${color}20`, color, border: `1px solid ${color}40`,
      letterSpacing: '0.04em',
    } as const),
    btnPrimary: {
      fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8,
      cursor: 'pointer', border: 'none', background: 'var(--gold)', color: '#fff',
      fontFamily: 'inherit',
    } as const,
    input: {
      width: '100%', padding: '8px 12px', borderRadius: 8,
      border: '1px solid var(--line-md)', background: '#fff',
      fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none',
    } as const,
    textarea: {
      width: '100%', padding: '10px 12px', borderRadius: 8,
      border: '1px solid var(--line-md)', background: '#fff',
      fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none',
      resize: 'vertical' as const, minHeight: 80,
    } as const,
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 6, display: 'flex', gap: 12, fontSize: 12, alignItems: 'center' }}>
        {cohort && (
          <Link href={`/admin/cohorts/${cohort.id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← {cohort.name}
          </Link>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!editing ? (
            <>
              <button
                onClick={openEdit}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '6px 12px', borderRadius: 7,
                  border: '1px solid var(--gold-line)',
                  background: 'var(--gold-pale)', color: 'var(--gold)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Edit profile
              </button>
              <Link href="/admin/members" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                All members →
              </Link>
            </>
          ) : (
            <>
              {profileError && <span style={{ fontSize: 11, color: 'var(--red)' }}>{profileError}</span>}
              <button
                onClick={cancelEdit}
                disabled={savingProfile}
                style={{
                  fontSize: 12, padding: '6px 12px', borderRadius: 7,
                  border: '1px solid var(--line-md)', background: '#fff',
                  color: 'var(--text-soft)', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: '6px 14px', borderRadius: 7,
                  border: 'none', background: 'var(--gold)', color: '#fff',
                  cursor: 'pointer', fontFamily: 'inherit',
                  opacity: savingProfile ? 0.6 : 1,
                }}
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--paper2) 100%)',
        border: '1px solid var(--line)', borderLeft: `4px solid ${archetypeColor}`,
        borderRadius: 12, padding: '24px', marginBottom: 16,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        {editing && draft ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
              background: archetypeColor, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, flexShrink: 0,
              border: '3px solid #fff', boxShadow: '0 0 0 1px var(--line)',
            }}>
              {draft.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={draft.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : initials}
            </div>
            <label style={{
              position: 'absolute', bottom: -4, right: -4,
              background: 'var(--gold)', color: '#fff',
              borderRadius: '50%', width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, cursor: uploadingAvatar ? 'wait' : 'pointer',
              border: '2px solid #fff', opacity: uploadingAvatar ? 0.6 : 1,
            }} title="Upload photo">
              {uploadingAvatar ? '…' : '📷'}
              <input
                type="file" accept="image/*" style={{ display: 'none' }}
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) handleAvatarUpload(file)
                }}
              />
            </label>
            {draft.avatar_url && (
              <button
                onClick={() => setDraft({ ...draft, avatar_url: null })}
                title="Remove photo"
                style={{
                  position: 'absolute', top: -4, right: -4,
                  background: 'var(--red)', color: '#fff',
                  border: '2px solid #fff', borderRadius: '50%',
                  width: 22, height: 22, fontSize: 11, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, lineHeight: 1,
                }}
              >×</button>
            )}
          </div>
        ) : (
          <div style={{
            width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
            background: archetypeColor, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, flexShrink: 0,
            border: '3px solid #fff', boxShadow: '0 0 0 1px var(--line)',
          }}>
            {user.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          {editing && draft ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 420 }}>
              <input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="Display name"
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300,
                  color: 'var(--ink)', background: '#fff',
                  border: '1px solid var(--line-md)', borderRadius: 8,
                  padding: '8px 12px', outline: 'none',
                }}
              />
              <input
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="email@example.com"
                type="email"
                style={{
                  fontSize: 13, color: 'var(--ink)', background: '#fff',
                  border: '1px solid var(--line-md)', borderRadius: 8,
                  padding: '7px 12px', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0 }}>
                Editing public.users + circle_members. Auth email is separate and unchanged.
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300, color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>
                {displayName}
              </h1>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: 'var(--text-soft)', fontFamily: 'var(--font-body)' }}>
                <span style={S.tag(archetypeColor)}>{archetypeLabel}</span>
                {cohort && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span>{cohort.name} · Week {cohortWeek}/12</span>
                  </>
                )}
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span>{user.email ?? '—'}</span>
                {user.is_admin && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Admin</span>
                  </>
                )}
                {hasStory && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>✨ Transformation story</span>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        {alerts[0] && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: ALERT_COLORS[alerts[0].alert_level].bg,
            color: ALERT_COLORS[alerts[0].alert_level].text,
            fontSize: 12, fontWeight: 600,
            maxWidth: 240,
          }}>
            {alerts[0].alert_level === 'red' ? '🔴 At risk' : alerts[0].alert_level === 'orange' ? '🟠 Quiet' : '🟡 Monitor'} —{' '}
            {alerts[0].days_inactive}d inactive
            {alerts[0].reason && <div style={{ fontSize: 11, fontWeight: 500, marginTop: 3, opacity: 0.85 }}>{alerts[0].reason}</div>}
          </div>
        )}
      </div>

      {/* ── Quick stats ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <Stat label="Last active" value={lastActiveDate ? `${inactiveDays}d ago` : 'Never'} />
        <Stat label="Completion" value={`${completionPct}%`} />
        <Stat label="Streak" value={`${checkIns.length} check-ins`} />
        <Stat label="Wins" value={String(wins.length)} />
        <Stat label="Journals" value={String(journalEntries.length)} />
        <Stat label="Notes" value={String(notes.length)} />
      </div>

      {/* ── Program progress ─────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Program progress</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {completed} of {totalPossible} items complete
          </span>
        </div>
        <div style={{ padding: 16 }}>
          {thisWeek && (
            <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--paper)', border: '1px solid var(--line)' }}>
              <div style={S.label}>This week (week {cohortWeek})</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <ProgressTile label="Journal" done={thisWeek.journal_completed} />
                <ProgressTile label="Action"  done={thisWeek.action_completed} />
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 6 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(w => {
              const row = progress.find(p => p.week_number === w)
              const j = row?.journal_completed ?? false
              const a = row?.action_completed ?? false
              const score = (j ? 1 : 0) + (a ? 1 : 0)
              const bg = score === 2 ? 'rgba(31,92,58,0.12)' : score === 1 ? 'rgba(184,146,42,0.12)' : 'var(--paper)'
              const fg = score === 2 ? 'var(--green)' : score === 1 ? 'var(--gold)' : 'var(--text-muted)'
              return (
                <div key={w} style={{
                  background: bg, border: `1px solid ${fg}30`, borderRadius: 8, padding: '8px 6px',
                  textAlign: 'center', fontSize: 11, color: fg, fontWeight: 600,
                }}>
                  W{w}<br />
                  <span style={{ fontSize: 10 }}>{j ? '✓' : '○'} {a ? '✓' : '○'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Partner ──────────────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Accountability partner</span>
          <Link href="/admin/pairs" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>
            Manage pairs →
          </Link>
        </div>
        <div style={{ padding: 16 }}>
          {partner ? (
            <div>
              <Link
                href={`/admin/members/${partner.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'var(--paper)', borderRadius: 10,
                  border: '1px solid var(--line)', textDecoration: 'none', color: 'inherit',
                  marginBottom: 12,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: ARCHETYPE_COLORS[partner.archetype] ?? 'var(--line)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {(partner.name ?? 'P').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{partner.name ?? 'Unnamed'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ARCHETYPE_LABELS[partner.archetype] ?? partner.archetype} · {partner.email ?? '—'}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>View profile →</span>
              </Link>

              <div style={S.label}>Recent partner messages ({partnerThread.length})</div>
              {partnerThread.length === 0 ? (
                <div style={{ ...S.value, color: 'var(--text-muted)' }}>No messages between this pair yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {partnerThread.slice(0, 5).map((msg, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', background: 'var(--paper)', borderRadius: 8,
                      border: '1px solid var(--line)', fontSize: 12,
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
                        {msg.sender_id === member.user_id ? `${displayName} →` : `${partner.name ?? 'Partner'} →`}
                        {' · '}
                        {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </div>
                      <div style={{ color: 'var(--ink)', lineHeight: 1.5 }}>{msg.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...S.value, color: 'var(--text-muted)' }}>
              No partner assigned yet.{' '}
              <Link href="/admin/pairs" style={{ color: 'var(--gold)', fontWeight: 600 }}>Pair them →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Coach chat ───────────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Coach chat (1:1)</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{coachThread.length} message{coachThread.length === 1 ? '' : 's'}</span>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{
            background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 10,
            padding: 10, minHeight: 120, maxHeight: 320, overflowY: 'auto', marginBottom: 12,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {coachThread.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '40px 10px' }}>
                No messages yet — send the first one below.
              </div>
            ) : coachThread.map(m => {
              const fromCoach = m.sender_id === coachUserId
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: fromCoach ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    background: fromCoach ? 'var(--gold)' : '#fff',
                    color: fromCoach ? '#fff' : 'var(--ink)',
                    border: fromCoach ? 'none' : '1px solid var(--line)',
                    borderRadius: 10, padding: '8px 12px',
                    fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>
                    {!fromCoach && (
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
                        {displayName}
                      </div>
                    )}
                    {m.body}
                    <div style={{ fontSize: 9, opacity: 0.65, marginTop: 4, textAlign: 'right' }}>
                      {new Date(m.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <textarea
            value={msgBody}
            onChange={(e) => setMsgBody(e.target.value)}
            placeholder={`Write to ${displayName}…`}
            style={S.textarea}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              onClick={handleSendMessage}
              disabled={!msgBody.trim() || msgSending}
              style={{ ...S.btnPrimary, opacity: !msgBody.trim() || msgSending ? 0.5 : 1 }}
            >
              {msgSending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Coaching notes ───────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Coaching notes — private</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{notes.length} note{notes.length === 1 ? '' : 's'}</span>
        </div>
        <div style={{ padding: 16 }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Private note — only visible to admins."
            style={S.textarea}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, marginBottom: 16 }}>
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || savingNote}
              style={{ ...S.btnPrimary, opacity: !newNote.trim() || savingNote ? 0.5 : 1 }}
            >
              {savingNote ? 'Saving…' : 'Add note'}
            </button>
          </div>

          {notes.length === 0 ? (
            <div style={{ ...S.value, color: 'var(--text-muted)' }}>No coaching notes yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notes.map(note => (
                <div key={note.id} style={{
                  padding: '10px 12px', background: 'var(--paper)', borderRadius: 8,
                  border: '1px solid var(--line)',
                }}>
                  <div style={{ fontSize: 12, color: 'var(--ink)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note.note}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                    {new Date(note.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Profile details ──────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Intake & profile</span>
          {editing && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>Editing</span>}
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {editing && draft ? (
            <>
              <EditField label="Archetype">
                <select
                  value={draft.archetype}
                  onChange={(e) => setDraft({ ...draft, archetype: e.target.value as EditDraft['archetype'] })}
                  style={editInputStyle}
                >
                  <option value="door">Open Door</option>
                  <option value="throne">Overthink Throne</option>
                  <option value="engine">Interrupted Engine</option>
                  <option value="push">Pushthrough</option>
                </select>
              </EditField>
              <EditField label="Enneagram type">
                <input
                  value={draft.enneagram_type}
                  onChange={(e) => setDraft({ ...draft, enneagram_type: e.target.value })}
                  placeholder="e.g. 4w5"
                  style={editInputStyle}
                />
              </EditField>
              <EditField label="Attachment style">
                <select
                  value={draft.attachment_style}
                  onChange={(e) => setDraft({ ...draft, attachment_style: e.target.value as EditDraft['attachment_style'] })}
                  style={editInputStyle}
                >
                  <option value="">—</option>
                  <option value="secure">secure</option>
                  <option value="anxious">anxious</option>
                  <option value="avoidant">avoidant</option>
                  <option value="disorganized">disorganized</option>
                </select>
              </EditField>
              <EditField label="Feedback preference">
                <select
                  value={draft.feedback_pref}
                  onChange={(e) => setDraft({ ...draft, feedback_pref: e.target.value as EditDraft['feedback_pref'] })}
                  style={editInputStyle}
                >
                  <option value="">—</option>
                  <option value="straight">straight</option>
                  <option value="context">context</option>
                  <option value="written">written</option>
                  <option value="example">example</option>
                </select>
              </EditField>
              <EditField label="90-day focus" full>
                <textarea
                  rows={3}
                  value={draft.goal_90day}
                  onChange={(e) => setDraft({ ...draft, goal_90day: e.target.value })}
                  placeholder="What are they working toward?"
                  style={{ ...editInputStyle, resize: 'vertical', minHeight: 60 }}
                />
              </EditField>
              <Field label="Quiz result" value={user.quiz_result ?? '—'} />
            </>
          ) : (
            <>
              <Field label="Archetype"          value={archetypeLabel} />
              <Field label="Enneagram type"     value={member.enneagram_type ? `Type ${member.enneagram_type}` : '—'} />
              <Field label="Attachment style"   value={member.attachment_style ?? '—'} />
              <Field label="Feedback preference" value={member.feedback_pref ?? '—'} />
              <Field label="90-day focus"       value={member.goal_90day ?? '—'} multiline />
              <Field label="Quiz result"        value={user.quiz_result ?? '—'} />
            </>
          )}
        </div>
      </div>

      {/* ── Seal-the-Leak reflections ───────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Seal-the-Leak reflections</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {reflections.length} entr{reflections.length === 1 ? 'y' : 'ies'}
          </span>
        </div>
        <div style={{ padding: 16 }}>
          {reflections.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              No reflections saved yet. Members write these in the Today&apos;s Session prompts —
              entries before the 012 migration may still live only in their browser localStorage.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Array.from(new Set(reflections.map(r => r.day_number))).sort((a, b) => a - b).map(day => {
                const dayRows = reflections.filter(r => r.day_number === day)
                return (
                  <div key={day} style={{
                    padding: '10px 14px', borderRadius: 10,
                    background: 'var(--paper)', border: '1px solid var(--line)',
                  }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--text-muted)',
                      marginBottom: 8,
                    }}>
                      Day {day} — {dayRows[0].route_id}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {dayRows.map(r => (
                        <div key={r.id}>
                          <div style={{
                            fontSize: 10, color: 'var(--gold)', fontWeight: 600,
                            letterSpacing: '0.05em', textTransform: 'uppercase',
                            marginBottom: 3,
                          }}>
                            Prompt {r.item_index + 1}
                          </div>
                          <p style={{
                            fontSize: 13, color: 'var(--ink)', lineHeight: 1.65,
                            margin: 0, whiteSpace: 'pre-wrap',
                          }}>
                            {r.content}
                          </p>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
                            saved {new Date(r.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity ─────────────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Recent activity</span>
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <ActivityList
            title={`Wins (${wins.length})`}
            empty="No wins logged yet."
            items={wins.slice(0, 5).map(w => ({
              key: w.id,
              primary: w.title || w.description || '—',
              secondary: new Date(w.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }))}
          />
          <ActivityList
            title={`Journal entries (${journalEntries.length})`}
            empty="No journal entries yet."
            items={journalEntries.slice(0, 5).map(j => ({
              key: j.id,
              primary: (j.content ?? '').slice(0, 90) + ((j.content?.length ?? 0) > 90 ? '…' : ''),
              secondary: `Day ${j.day_number ?? '—'} · ${new Date(j.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            }))}
          />
          <ActivityList
            title={`Check-ins — last 14 days (${checkIns.length})`}
            empty="No daily check-ins yet."
            items={checkIns.slice(0, 5).map(c => ({
              key: c.check_in_date,
              primary: c.mood,
              secondary: new Date(c.check_in_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            }))}
          />
        </div>
      </div>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHead}>
          <span style={S.sectionTitle}>Account</span>
          {editing && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>Editing</span>}
        </div>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {editing && draft ? (
            <>
              <EditField label="Selected plan">
                <select
                  value={draft.selected_path}
                  onChange={(e) => setDraft({ ...draft, selected_path: e.target.value as 'A' | 'B' | '' })}
                  style={editInputStyle}
                >
                  <option value="">—</option>
                  <option value="A">A — Cohort</option>
                  <option value="B">B — Daily Cards</option>
                </select>
              </EditField>
              <EditToggleField
                label="Has paid"
                value={draft.has_paid}
                onChange={(v) => setDraft({ ...draft, has_paid: v })}
              />
              <EditToggleField
                label="Onboarding complete"
                value={draft.onboarding_complete}
                onChange={(v) => setDraft({ ...draft, onboarding_complete: v })}
              />
              <EditToggleField
                label="Admin access"
                value={draft.is_admin}
                onChange={(v) => setDraft({ ...draft, is_admin: v })}
              />
              <Field label="Signed up"     value={user.signup_date ? new Date(user.signup_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
              <Field label="Joined cohort" value={new Date(member.joined_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
              <Field label="Cards add-on"  value={user.cards_addon_started_at ? `Active since ${new Date(user.cards_addon_started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Not active'} />
            </>
          ) : (
            <>
              <Field label="Email"          value={user.email ?? '—'} />
              <Field label="Signed up"      value={user.signup_date ? new Date(user.signup_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
              <Field label="Joined cohort"  value={new Date(member.joined_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
              <Field label="Selected plan"  value={planLabel} />
              <Field label="Has paid"       value={user.has_paid ? 'Yes' : 'No'} />
              <Field label="Onboarding"     value={user.onboarding_complete ? 'Complete' : 'Not complete'} />
              <Field label="Cards add-on"   value={user.cards_addon_started_at ? `Active since ${new Date(user.cards_addon_started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Not active'} />
              <Field label="Admin access"   value={user.is_admin ? 'Yes' : 'No'} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: 12,
    }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 4 }}>
        {label}
      </div>
    </div>
  )
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.6, fontFamily: 'var(--font-body)', whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
        {value}
      </div>
    </div>
  )
}

function ProgressTile({ label, done }: { label: string; done: boolean }) {
  return (
    <div style={{
      flex: 1, padding: '8px', borderRadius: 8, textAlign: 'center',
      background: done ? 'rgba(31,92,58,0.15)' : 'var(--line)',
      border: `1px solid ${done ? 'var(--green)' : 'var(--line-md)'}`,
    }}>
      <div style={{ fontSize: 14 }}>{done ? '✓' : '○'}</div>
      <div style={{ fontSize: 10, color: done ? 'var(--green)' : 'var(--text-muted)', marginTop: 2, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  )
}

const editInputStyle: CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 6,
  border: '1px solid var(--line-md)',
  background: '#fff',
  fontSize: 13,
  color: 'var(--ink)',
  fontFamily: 'inherit',
  outline: 'none',
}

function EditField({ label, full, children }: { label: string; full?: boolean; children: ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function EditToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
        {label}
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-label={`${value ? 'Disable' : 'Enable'} ${label}`}
        style={{
          width: 44, height: 24, borderRadius: 12, flexShrink: 0,
          background: value ? 'var(--gold)' : 'var(--line-md)',
          border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: '50%', background: 'white',
          position: 'absolute', top: 3,
          left: value ? 23 : 3, transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}

function ActivityList({ title, items, empty }: {
  title: string
  items: { key: string; primary: string; secondary: string }[]
  empty: string
}) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
        {title}
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{empty}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(it => (
            <div key={it.key} style={{
              padding: '8px 12px', background: 'var(--paper)', borderRadius: 8,
              border: '1px solid var(--line)', fontSize: 12,
            }}>
              <div style={{ color: 'var(--ink)', lineHeight: 1.5 }}>{it.primary}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{it.secondary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
