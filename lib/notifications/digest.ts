// lib/notifications/digest.ts
// Computes "what's new today" for a single user, scoped to their program.
// Returns a list of DigestItem; the daily-digest cron emails it only when the
// list is non-empty (no "0 new things" nudges).
//
// Every content query is wrapped defensively — a missing table/column or a
// transient error degrades to "skip that one signal", never a failed digest.
//
// Date math mirrors the app's 4 AM rollover (lib/utils/cardUtils.ts) and the
// Circle week math (lib/circle.ts). The runtime is UTC on Vercel, which is the
// same boundary the rest of the app uses. True per-user timezones are a
// fast-follow once a tz column exists on users.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface DigestItem {
  title: string
  detail?: string
  href: string
}

export interface DigestUser {
  id: string
  email: string | null
  name: string | null
  selected_path: 'A' | 'B' | 'C' | null
  signup_date: string | null
  cards_addon_started_at: string | null
}

interface MemberRow {
  id: string
  cohort_id: string | null
  partner_id: string | null
  archetype: string | null
}

interface CohortRow {
  starts_at: string | null
}

// ── date helpers (mirror cardUtils + circle week math) ──────────────────────

function dayIndexAtFourAm(d: Date): number {
  const shifted = new Date(d.getTime() - 4 * 60 * 60 * 1000)
  shifted.setUTCHours(0, 0, 0, 0)
  return Math.floor(shifted.getTime() / 86_400_000)
}

function dayNumberSince(anchorISO: string, now: Date): number {
  return Math.max(1, dayIndexAtFourAm(now) - dayIndexAtFourAm(new Date(anchorISO)) + 1)
}

function circleWeek(startsAt: string, at: Date): number | null {
  const start = new Date(startsAt) // DATE column → UTC midnight
  if (isNaN(start.getTime())) return null
  const diffDays = Math.floor((at.getTime() - start.getTime()) / 86_400_000)
  if (diffDays < 0) return null
  const wk = Math.floor(diffDays / 7) + 1
  return wk >= 1 && wk <= 12 ? wk : null
}

// ── main ────────────────────────────────────────────────────────────────────

export async function buildDigest(
  admin: SupabaseClient,
  user: DigestUser,
  windowStart: Date,
  appBaseUrl: string,
): Promise<DigestItem[]> {
  const items: DigestItem[] = []
  const root = appBaseUrl.replace(/\/$/, '')
  const now = new Date()
  const since = windowStart.toISOString()
  const path = user.selected_path

  // ── Path A / B — today's daily card ───────────────────────────────────────
  if (path === 'A' || path === 'B') {
    try {
      const anchor = (path === 'B' ? user.cards_addon_started_at : user.signup_date) ?? user.signup_date
      if (anchor) {
        const dayNumber = dayNumberSince(anchor, now)
        const { data: card } = await admin
          .from('daily_cards')
          .select('day_number, title, emoji')
          .eq('day_number', dayNumber)
          .maybeSingle()
        if (card) {
          const { data: entry } = await admin
            .from('journal_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('day_number', dayNumber)
            .maybeSingle()
          if (!entry) {
            items.push({
              title: `${card.emoji ?? '🌿'} Today's card is ready`,
              detail: card.title ?? undefined,
              href: `${root}/program/today`,
            })
          }
        }
      }
    } catch { /* skip card signal */ }
  }

  // ── Path C — The Circle ───────────────────────────────────────────────────
  if (path === 'C') {
    let member: MemberRow | null = null
    let cohort: CohortRow | null = null
    try {
      const { data: m } = await admin
        .from('circle_members')
        .select('id, cohort_id, partner_id, archetype')
        .eq('user_id', user.id)
        .maybeSingle()
      member = (m as MemberRow | null) ?? null
      if (member?.cohort_id) {
        const { data: c } = await admin
          .from('circle_cohorts')
          .select('starts_at')
          .eq('id', member.cohort_id)
          .maybeSingle()
        cohort = (c as CohortRow | null) ?? null
      }
    } catch { /* no membership → no circle items */ }

    if (member) {
      // Coach (Nicole) messages
      try {
        const { data } = await admin
          .from('circle_coach_messages')
          .select('id, sender_id, created_at')
          .eq('user_id', user.id)
          .gt('created_at', since)
        const fromCoach = (data ?? []).filter(r => r.sender_id !== user.id)
        if (fromCoach.length) {
          items.push({
            title: `💬 Nicole sent you ${fromCoach.length > 1 ? `${fromCoach.length} messages` : 'a message'}`,
            href: `${root}/circle/coach`,
          })
        }
      } catch { /* skip */ }

      // Partner replies (unread)
      if (member.partner_id) {
        try {
          const { data } = await admin
            .from('circle_partner_messages')
            .select('id, read_at, created_at')
            .eq('receiver_id', user.id)
            .gt('created_at', since)
          const unread = (data ?? []).filter(r => !r.read_at)
          if (unread.length) {
            items.push({
              title: '🤝 Your accountability partner replied',
              detail: unread.length > 1 ? `${unread.length} new messages` : undefined,
              href: `${root}/circle/partner`,
            })
          }
        } catch { /* skip */ }
      }

      // New community posts from cohort-mates
      if (member.cohort_id) {
        try {
          const { data } = await admin
            .from('circle_posts')
            .select('id, author_id, created_at')
            .eq('cohort_id', member.cohort_id)
            .gt('created_at', since)
          const others = (data ?? []).filter(r => r.author_id !== user.id)
          if (others.length) {
            items.push({
              title: `✨ ${others.length} new ${others.length > 1 ? 'posts' : 'post'} in your circle`,
              href: `${root}/circle/community`,
            })
          }
        } catch { /* skip */ }
      }

      if (cohort?.starts_at) {
        const week = circleWeek(cohort.starts_at, now)
        const weekAtWindow = circleWeek(cohort.starts_at, windowStart)

        // A new week just opened (new teaching + video)
        if (week && week !== weekAtWindow) {
          let detail: string | undefined
          let hasVideo = false
          try {
            const { data: wc } = await admin
              .from('circle_weekly_content')
              .select('week_title, video_url, archetype')
              .eq('cohort_id', member.cohort_id)
              .eq('week_number', week)
            const rows = wc ?? []
            const pick =
              rows.find(r => r.archetype === member!.archetype) ??
              rows.find(r => r.archetype === 'universal') ??
              rows[0]
            detail = pick?.week_title ?? undefined
            hasVideo = !!pick?.video_url
          } catch { /* still surface the week */ }
          items.push({
            title: `📖 Week ${week} is open${hasVideo ? ' — new video inside' : ''}`,
            detail,
            href: `${root}/circle/week/${week}`,
          })
        }

        // Today's Mon/Wed/Fri prompt, if not yet done
        if (week) {
          const dow = now.getUTCDay() // 1 Mon, 3 Wed, 5 Fri
          const promptDay = dow === 1 ? 'Monday' : dow === 3 ? 'Wednesday' : dow === 5 ? 'Friday' : null
          if (promptDay) {
            try {
              const { data: prog } = await admin
                .from('circle_member_progress')
                .select('monday_completed_at, partner_checkin_sent_at, friday_completed_at')
                .eq('member_id', member.id)
                .eq('week_number', week)
                .maybeSingle()
              const done =
                promptDay === 'Monday'    ? !!prog?.monday_completed_at :
                promptDay === 'Wednesday' ? !!prog?.partner_checkin_sent_at :
                                            !!prog?.friday_completed_at
              if (!done) {
                items.push({
                  title: `📝 Today's ${promptDay} prompt is waiting`,
                  href: `${root}/circle`,
                })
              }
            } catch { /* skip */ }
          }
        }
      }

      // Live call in the next 24h
      if (member.cohort_id) {
        try {
          const in24 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
          const { data } = await admin
            .from('circle_live_calls')
            .select('title, scheduled_at')
            .eq('cohort_id', member.cohort_id)
            .gte('scheduled_at', now.toISOString())
            .lte('scheduled_at', in24.toISOString())
          if ((data ?? []).length) {
            items.push({
              title: '📞 Live call coming up',
              detail: data![0].title ?? undefined,
              href: `${root}/circle`,
            })
          }
        } catch { /* skip */ }
      }
    }
  }

  return items
}
