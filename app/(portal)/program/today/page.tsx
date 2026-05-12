'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'
import type { ProgramRoute } from '@/data/sealTheLeakProgram'
import MediaSlot from '@/components/media/MediaSlot'
import { upsertReflection } from '@/lib/admin/hooks'
import { supabaseClient } from '@/lib/supabase/client'
import { usePreviewMode } from '@/hooks/usePreviewMode'
import { fetchPinnedForDay, type AdminMessage } from '@/lib/admin/hooks'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 4 6-7" />
    </svg>
  )
}

function storageKey(routeId: string, dayNum: number, itemIndex: number) {
  return `stl_${routeId}_day${dayNum}_item${itemIndex}`
}

function loadReflections(routeId: string, dayNum: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    typeof window !== 'undefined' ? (localStorage.getItem(storageKey(routeId, dayNum, i)) ?? '') : ''
  )
}

function PromptItem({
  item, index, routeId, dayNum, color, readOnly,
}: {
  item: string
  index: number
  routeId: string
  dayNum: number
  color: string
  readOnly: boolean
}) {
  // When readOnly is true, disable input + hide save button. Used for previewing
  // a non-owned archetype path or a future day.
  const key = storageKey(routeId, dayNum, index)
  const [value, setValue] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem(key) ?? '') : ''
  )
  const [saved, setSaved] = useState(() =>
    typeof window !== 'undefined' ? !!localStorage.getItem(key) : false
  )
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem(key) ?? '') : ''
    setValue(stored)
    setSaved(!!stored)
    setDirty(false)
  }, [key])

  function handleChange(val: string) {
    setValue(val)
    setDirty(true)
    setSaved(false)
  }

  async function handleSave() {
    localStorage.setItem(key, value)
    setSaved(true)
    setDirty(false)
    // Mirror to Supabase so admins can read what the user wrote. Failures
    // here shouldn't block the local save — localStorage already succeeded.
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (user) {
        await upsertReflection({
          user_id: user.id,
          route_id: routeId,
          day_number: dayNum,
          item_index: index,
          content: value,
        })
      }
    } catch {
      // Swallow — admin visibility is best-effort, not load-bearing.
    }
  }

  return (
    <div>
      {/* Bullet + label */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: `${color}18`, border: `1.5px solid ${color}40`,
          color, fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-body)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: '1px',
        }}>
          {index + 1}
        </span>
        <span style={{ fontSize: '14px', color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.6, fontWeight: 500 }}>
          {item}
        </span>
      </div>

      {/* Textarea + save button row */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={value}
          onChange={(e) => !readOnly && handleChange(e.target.value)}
          placeholder={readOnly ? '' : item}
          readOnly={readOnly}
          rows={3}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box',
            padding: '12px 96px 12px 14px',
            background: value ? `${color}04` : 'var(--paper2)',
            border: `1px solid ${value && !dirty ? color + '30' : dirty ? color : 'var(--line)'}`,
            borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--font-body)',
            color: 'var(--ink)', lineHeight: 1.7, resize: 'vertical', outline: 'none',
            transition: 'border-color 0.15s ease, background 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}06` }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = value && !dirty ? color + '30' : dirty ? color : 'var(--line)'
            e.currentTarget.style.background = value ? `${color}04` : 'var(--paper2)'
          }}
        />
        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={!dirty && saved}
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              background: saved && !dirty ? 'transparent' : color,
              color: saved && !dirty ? 'var(--text-muted)' : 'white',
              border: saved && !dirty ? '1px solid var(--line)' : 'none',
              borderRadius: '6px',
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: dirty ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            {saved && !dirty ? '✓ Saved' : 'Save'}
          </button>
        )}
      </div>
    </div>
  )
}

function PromptItems({
  items, instruction, routeId, dayNum, color, readOnly = false,
}: {
  items: string[]
  instruction?: string
  routeId: string
  dayNum: number
  color: string
  readOnly?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {instruction && (
        <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', margin: '0 0 4px', lineHeight: 1.6 }}>
          {instruction}
        </p>
      )}
      {items.map((item, i) => (
        <PromptItem
          key={i}
          item={item}
          index={i}
          routeId={routeId}
          dayNum={dayNum}
          color={color}
          readOnly={readOnly}
        />
      ))}
    </div>
  )
}

function TodaysSessionInner() {
  const { user, dayNumber, streakCount, refreshUser } = useApp()
  const searchParams = useSearchParams()
  const { preview } = usePreviewMode()

  // Users normally see their own archetype track. Admins in /admin/preview
  // can pin an archetypeOverride to view any archetype's variant of the
  // program — that override wins here.
  const userRouteId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const routeId     = (preview?.path === 'A' && preview.archetypeOverride) ? preview.archetypeOverride : userRouteId
  const route       = programRoutes[routeId]

  const currentDay = Math.min(dayNumber, 7)

  // Admins (and admins inside /admin/preview) can scrub through any day; real
  // users can only revisit past days or look at today. Future days are locked
  // and unlock at 4 AM the next morning.
  const canViewFuture = user.isAdmin || (preview?.path === 'A')

  // ?day= URL param: honor it for past or today, ignore for future unless
  // the viewer is allowed to look ahead.
  const paramDay   = searchParams ? Number(searchParams.get('day')) : 0
  const paramDayInRange = paramDay >= 1 && paramDay <= 7
  const initialDay = paramDayInRange && (paramDay <= currentDay || canViewFuture)
    ? paramDay
    : currentDay

  const [viewingDay, setViewingDay] = useState(initialDay)
  const [pinnedNote, setPinnedNote] = useState<AdminMessage | null>(null)
  const [sealedDays, setSealedDays] = useState<Set<number>>(new Set())
  const [celebratingDay, setCelebratingDay] = useState(false)

  // Load Nicole's pinned note for the currently-viewed day (if any). The
  // server-side RLS filter already gates by audience, so we get a hit only
  // when this user is in the targeted path.
  useEffect(() => {
    let cancelled = false
    fetchPinnedForDay(viewingDay).then(msg => {
      if (!cancelled) setPinnedNote(msg)
    })
    return () => { cancelled = true }
  }, [viewingDay])
  const [unlockResult, setUnlockResult] = useState<
    | { granted: true; expiresAt: string }
    | { granted: false; alreadySealed: boolean }
    | null
  >(null)
  const [showUnlockModal, setShowUnlockModal] = useState(false)

  const day = route.days[viewingDay - 1]
  if (!day) return null

  const isDay7    = day.day === 7
  const isToday   = viewingDay === currentDay
  const isPast    = viewingDay < currentDay
  const isFuture  = viewingDay > currentDay
  const isPreview = isFuture
  const isSealed  = sealedDays.has(viewingDay)

  async function handleSeal() {
    setSealedDays(prev => new Set(prev).add(viewingDay))
    setCelebratingDay(true)
    setTimeout(() => setCelebratingDay(false), 1400)

    // Day 7 on the user's own path triggers the server-side completion record.
    // For Path A, this also grants the 30-day Cards window. Idempotent — fine
    // to call again on a re-seal. Fire-and-forget on errors (the local seal
    // animation already happened).
    if (isDay7 && (!isFuture || user.isAdmin)) {
      try {
        const res = await fetch('/api/program/seal-day-7', { method: 'POST' })
        if (res.ok) {
          const data = await res.json() as {
            granted: boolean
            expiresAt: string | null
            alreadySealed: boolean
          }
          if (data.granted && data.expiresAt) {
            setUnlockResult({ granted: true, expiresAt: data.expiresAt })
          } else {
            setUnlockResult({ granted: false, alreadySealed: data.alreadySealed })
          }
          // Open the modal regardless of grant. Path A first-time sealers
          // see the 30-day unlock celebration; admins, Path B/C testers,
          // or Path A users with an existing add-on see a simpler "Day 7
          // sealed" screen. Beat lets the seal reveal animation finish.
          setTimeout(() => setShowUnlockModal(true), 700)
          await refreshUser()
        } else {
          console.error('seal-day-7 non-OK', res.status, await res.text().catch(() => ''))
        }
      } catch (err) {
        console.error('seal-day-7 failed', err)
      }
    }
  }

  const sealContent = (
    <div style={{
      background: route.color,
      borderRadius: '10px',
      padding: '20px 24px',
      textAlign: 'center',
      animation: celebratingDay ? 'sealReveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : undefined,
    }}>
      <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontFamily: 'var(--font-body)', margin: '0 0 10px' }}>
        {isDay7 ? 'Sealed identity' : isPast ? "Day's seal" : "Today's seal"}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontStyle: 'italic', color: 'white', lineHeight: 1.65, margin: 0 }}>
        &ldquo;{isDay7 && day.sealedIdentity ? day.sealedIdentity : day.seal}&rdquo;
      </p>
    </div>
  )

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top strip: breadcrumb + day dots ── */}
      <div style={{ marginBottom: '20px' }}>
        {/* Row 1: breadcrumb + streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Link
            href="/program"
            style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
          >
            ← The Work
          </Link>
          <span style={{ color: 'var(--line-md)', fontSize: '12px' }}>/</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {isToday ? "Today's Session" : `Day ${viewingDay}`}
          </span>
          {streakCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '11px',
              fontWeight: 600,
              color: route.color,
              fontFamily: 'var(--font-body)',
              background: `${route.color}10`,
              border: `1px solid ${route.color}25`,
              borderRadius: '999px',
              padding: '2px 10px',
              letterSpacing: '0.02em',
            }}>
              🔥 {streakCount} day streak
            </span>
          )}
        </div>

        {/* Row 2: day dots — scrollable on mobile */}
        <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'max-content' }}>
          {route.days.map((d) => {
            const isActive     = viewingDay === d.day
            const isDoneOnOwn  = d.day < currentDay
            const isTodayOnOwn = d.day === currentDay
            const isLockedDay  = d.day > currentDay && !canViewFuture
            const clickable    = !isLockedDay
            return (
              <button
                key={d.day}
                onClick={() => { if (clickable) setViewingDay(d.day) }}
                disabled={isLockedDay}
                title={isLockedDay ? `Day ${d.day} unlocks at 4:00 AM` : `Day ${d.day} — ${d.title}`}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border:
                    isActive       ? `2px solid ${route.color}` :
                    isDoneOnOwn    ? `2px solid ${route.color}` :
                    isTodayOnOwn   ? `2px dashed ${route.color}` :
                    isLockedDay    ? '1px dashed rgba(12,12,10,0.18)' :
                                     '2px solid rgba(12,12,10,0.1)',
                  background:
                    isActive       ? route.color :
                    isDoneOnOwn    ? `${route.color}18` :
                    isLockedDay    ? 'rgba(12,12,10,0.03)' :
                                     'white',
                  color:
                    isActive       ? 'white' :
                    isDoneOnOwn    ? route.color :
                    isLockedDay    ? 'rgba(12,12,10,0.35)' :
                                     'var(--text-muted)',
                  fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)',
                  cursor: clickable ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  outline: isActive ? `3px solid ${route.color}25` : 'none',
                  outlineOffset: '2px', transition: 'all 0.15s ease',
                }}
              >
                {isDoneOnOwn && !isActive ? <CheckIcon /> : d.day}
              </button>
            )
          })}
          <div style={{ marginLeft: '8px' }}>
            {isToday ? (
              <span style={{ fontSize: '10px', fontWeight: 500, color: route.color, border: `1px solid ${route.color}40`, borderRadius: '999px', padding: '3px 10px', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Today
              </span>
            ) : isPast ? (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--line)', borderRadius: '999px', padding: '3px 10px', fontFamily: 'var(--font-body)' }}>
                Reviewing
              </span>
            ) : null}
          </div>
        </div>
        </div>{/* end scroll wrapper */}
        {/* Fade edge hint */}
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: '4px', width: '40px',
          background: 'linear-gradient(to right, transparent, var(--paper))',
          pointerEvents: 'none',
        }} className="dots-fade" />
        </div>{/* end relative wrapper */}
      </div>

      {/* Pinned note from Nicole — only renders if she's pinned one to
          this specific day for users in the current audience filter. */}
      {pinnedNote && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(184,146,42,0.08) 0%, rgba(184,146,42,0.02) 100%)',
          border: '1px solid rgba(184,146,42,0.28)',
          borderLeft: '3px solid var(--gold)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: 'var(--gold)',
            margin: '0 0 8px', fontFamily: 'var(--font-body)',
          }}>
            ✨ From Nicole
          </p>
          {pinnedNote.title && (
            <p style={{
              fontSize: 14, fontWeight: 600, color: 'var(--ink)',
              margin: '0 0 6px', fontFamily: 'var(--font-body)',
            }}>
              {pinnedNote.title}
            </p>
          )}
          <p style={{
            fontSize: 13, color: 'var(--text-soft)',
            margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            fontFamily: 'var(--font-body)',
          }}>
            {pinnedNote.body}
          </p>
        </div>
      )}

      {/* Preview banner when viewing a future day */}
      {isPreview && (
        <div style={{
          background: `${route.color}10`,
          border: `1px solid ${route.color}30`,
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '14px',
          fontSize: '12px',
          color: 'var(--text-soft)',
          fontFamily: 'var(--font-body)',
        }}>
          Previewing Day {viewingDay} — your work unlocks on Day {viewingDay} (you&apos;re on Day {currentDay}). You can browse but not seal yet.
        </div>
      )}

      {/* ── Day title row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 300, color: 'var(--ink)', margin: 0 }}>
          Day {viewingDay} — {day.title}
        </h1>
        <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: route.color, border: `1px solid ${route.color}40`, padding: '2px 8px', borderRadius: '999px', fontFamily: 'var(--font-body)', flexShrink: 0 }}>
          {day.phase}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>{route.name}</span>
        {isPast && (
          <span style={{ fontSize: '12px', color: 'var(--green)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckIcon /> Completed
          </span>
        )}
      </div>

      {/* ── Day 7 completion hero ── */}
      {isDay7 && (isPast || isSealed) && (
        <div style={{
          background: `linear-gradient(135deg, ${route.color} 0%, ${route.color}cc 100%)`,
          borderRadius: '14px',
          padding: '28px 32px',
          marginBottom: '24px',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', margin: '0 0 8px', fontFamily: 'var(--font-body)' }}>
              Program complete
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 300, margin: '0 0 6px', fontStyle: 'italic' }}>
              You sealed the leak.
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
              7 days. Every prompt. Every action. The work you did here is permanent.
            </p>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            borderRadius: '10px',
            padding: '14px 20px',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <p style={{ fontSize: '28px', margin: '0 0 4px' }}>✦</p>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', margin: 0, fontFamily: 'var(--font-body)' }}>
              {route.name}
            </p>
          </div>
        </div>
      )}

      {/* ── 30-day Cards unlock pill (persistent reminder) ──
          Quiet inline reminder for return visits. The big celebratory popup
          fires from handleSeal() — this strip is what keeps the unlock
          discoverable after the modal is dismissed. Hidden once the window
          expires; the upgrade prompt then lives in /cards. */}
      {isDay7 && (isPast || isSealed) && user.selectedPath === 'A' && (() => {
        const unlocked = user.cardsAddOnSource === 'seal_day7' && user.cardsAddOnExpiresAt && user.cardsAddOnExpiresAt.getTime() > Date.now()
          ? user.cardsAddOnExpiresAt.toISOString()
          : null
        if (!unlocked) return null
        const daysLeft = Math.max(0, Math.ceil((new Date(unlocked).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        return (
          <div style={{
            background: `${route.color}08`,
            border: `1px solid ${route.color}25`,
            borderRadius: '999px',
            padding: '8px 16px 8px 14px',
            marginBottom: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ fontSize: '14px' }}>✦</span>
            <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
              <strong style={{ color: route.color, fontWeight: 700 }}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong> of Alignment unlocked
            </span>
            <Link
              href="/cards"
              style={{
                color: route.color,
                fontWeight: 600,
                textDecoration: 'none',
                marginLeft: '4px',
              }}
            >
              Open cards →
            </Link>
          </div>
        )
      })()}

      {/* ── Two-column main layout ── */}
      <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT: context column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Opening frame — admin-curated media slot above the framing copy.
              Day 1 defaults to a video placeholder; days 2-7 default to voice.
              Admins can override either choice from /admin/content. */}
          <div style={{
            background: `${route.color}08`,
            borderLeft: `4px solid ${route.color}`,
            borderRadius: '0 10px 10px 0',
            padding: '18px 20px',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 10px' }}>
              Opening frame
            </p>
            <div style={{ marginBottom: '14px' }}>
              <MediaSlot
                slotKey={`stl_${routeId}_day${viewingDay}_opening`}
                fallbackSlotKey={`stl_day${viewingDay}_opening`}
                defaultType={viewingDay === 1 ? 'video' : 'audio'}
                accent={route.color}
              />
            </div>
            <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.8, margin: 0, fontFamily: 'var(--font-body)' }}>
              {day.openingFrame}
            </p>
          </div>

          {/* Action */}
          <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '10px', padding: '18px 20px' }}>
            <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>
              {isPast ? 'The action' : "Today's action"}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontWeight: 400, color: 'var(--ink)', margin: '0 0 10px' }}>
              {day.action.title}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-soft)', lineHeight: 1.75, margin: 0, fontFamily: 'var(--font-body)' }}>
              {day.action.body}
            </p>
          </div>

          {/* Seal — claimable only on user's own path, today or past. Preview shows the seal text statically. */}
          {(isPast || isSealed) ? (
            sealContent
          ) : isPreview ? (
            <div style={{ background: `${route.color}06`, border: `1px dashed ${route.color}30`, borderRadius: '10px', padding: '18px 20px' }}>
              <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
                Day&apos;s seal
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontStyle: 'italic', color: 'var(--ink)', lineHeight: 1.65, margin: 0 }}>
                &ldquo;{isDay7 && day.sealedIdentity ? day.sealedIdentity : day.seal}&rdquo;
              </p>
            </div>
          ) : (
            <div style={{ background: 'white', border: `1px dashed ${route.color}40`, borderRadius: '10px', padding: '18px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 12px', lineHeight: 1.6 }}>
                Complete your reflections, then claim your seal.
              </p>
              <button
                onClick={handleSeal}
                style={{
                  background: route.color, color: 'white', border: 'none',
                  borderRadius: '8px', padding: '10px 24px', fontSize: '13px',
                  fontWeight: 500, fontFamily: 'var(--font-body)', cursor: 'pointer',
                  letterSpacing: '0.2px', transition: 'opacity 0.15s', width: '100%',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
              >
                I did the work — seal it
              </button>
            </div>
          )}

          {/* Day 7 proofs */}
          {isDay7 && day.proofs && (isPast || isSealed) && (
            <div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
                What you&apos;ve proven
              </p>
              <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {day.proofs.map((proof) => (
                  <div key={proof.label} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 500, color: route.color, margin: '0 0 4px', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{proof.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-soft)', fontStyle: 'italic', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)' }}>&ldquo;{proof.quote}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isDay7 && isSealed && (
            <Link href="/program" style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textDecoration: 'none', textAlign: 'center', display: 'block', padding: '4px' }}>
              See the full journey →
            </Link>
          )}
        </div>

        {/* RIGHT: prompt / reflection column */}
        <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '10px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
            <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
              {isPast ? 'Daily Journal' : "Today's prompt"}
            </p>
            <Link
              href={`/journal?day=${viewingDay}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 500,
                color: route.color,
                fontFamily: 'var(--font-body)',
                textDecoration: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${route.color}30`,
                background: `${route.color}06`,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
            >
              ✏ {isPast ? `Add Day ${viewingDay} reflection` : 'Write in journal'}
            </Link>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--ink)', margin: '0 0 20px' }}>
            {day.prompt.title}
          </h2>
          <PromptItems
            items={day.prompt.items}
            instruction={day.prompt.instruction}
            routeId={routeId}
            dayNum={viewingDay}
            color={route.color}
            readOnly={isPreview}
          />
        </div>

      </div>

      {/* ── Prev / Next day navigation (any day 1-7) ── */}
      {(viewingDay > 1 || viewingDay < 7) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', gap: '12px' }}>
          {viewingDay > 1 ? (
            <button
              onClick={() => { setViewingDay(v => v - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '8px', border: '1px solid var(--line)',
                background: 'white', color: 'var(--text-soft)', fontSize: '13px',
                fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = route.color; (e.currentTarget as HTMLButtonElement).style.color = route.color }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)' }}
            >
              ← Day {viewingDay - 1} — {route.days[viewingDay - 2]?.title}
            </button>
          ) : <div />}

          {viewingDay < 7 ? (
            <button
              onClick={() => { setViewingDay(v => v + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '8px', border: `1px solid ${route.color}30`,
                background: `${route.color}08`, color: route.color, fontSize: '13px',
                fontFamily: 'var(--font-body)', fontWeight: 500, cursor: 'pointer',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              Day {viewingDay + 1} — {route.days[viewingDay]?.title} →
            </button>
          ) : <div />}
        </div>
      )}

      {/* ── Recorded section ── */}
      <RecordedSection routeId={routeId} route={route} currentDay={currentDay} />

      {/* ── Unlock modal — fires after a Day 7 seal call returns OK ──
          Path A first-time sealers see the 30-day unlock celebration.
          Anyone else (admins testing, Path B/C, or Path A users who
          already had the add-on) gets a simpler "Day 7 sealed" view. */}
      {showUnlockModal && unlockResult && (
        <UnlockModal
          accent={route.color}
          result={unlockResult}
          onClose={() => setShowUnlockModal(false)}
        />
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sealReveal {
          from { transform: scale(0.93); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes unlockBackdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes unlockPop {
          0%   { transform: scale(0.8) translateY(20px); opacity: 0; }
          60%  { transform: scale(1.04) translateY(-4px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes confettiFloat {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(-180px) rotate(720deg); opacity: 0; }
        }
        @media (max-width: 768px) {
          .dots-fade { display: none; }
        }
        @media (min-width: 769px) {
          .dots-fade { display: none; }
        }
      `}</style>
    </div>
  )
}

// ── Unlock modal ──────────────────────────────────────────────────────────────
// Full-screen celebratory popup that fires after a Day 7 seal API call.
// Two faces:
//   granted = true  → 30-day Cards unlock celebration (Path A first-time)
//   granted = false → simpler "Day 7 sealed" view for admins testing,
//                     Path B/C users, or Path A users who already have an
//                     add-on (no new grant happened).
// One-shot per seal; dismiss closes it. The persistent pill below the day
// title still shows the unlock window for return visits.
type UnlockResult =
  | { granted: true; expiresAt: string }
  | { granted: false; alreadySealed: boolean }

function UnlockModal({
  accent, result, onClose,
}: {
  accent: string
  result: UnlockResult
  onClose: () => void
}) {
  const granted    = result.granted
  const expiresAt  = granted ? result.expiresAt : null
  const daysLeft   = granted
    ? Math.max(0, Math.ceil((new Date(result.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0
  const expiryDate = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [])

  // Confetti — 16 small dots, randomized
  const confetti = Array.from({ length: 16 }, (_, i) => ({
    left: `${(i / 16) * 100 + (Math.random() * 5)}%`,
    delay: Math.random() * 0.4,
    duration: 1.4 + Math.random() * 1.2,
    size: 6 + Math.floor(Math.random() * 6),
    color: i % 3 === 0 ? accent : i % 3 === 1 ? '#1f5c3a' : '#b8922a',
  }))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(12,12,10,0.62)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'unlockBackdrop 0.25s ease forwards',
      }}
    >
      {/* Confetti layer behind the card */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {confetti.map((c, i) => (
          <span key={i} style={{
            position: 'absolute',
            bottom: '40%',
            left: c.left,
            width: c.size, height: c.size,
            borderRadius: '50%',
            background: c.color,
            animation: `confettiFloat ${c.duration}s ease-out ${c.delay}s forwards`,
          }} />
        ))}
      </div>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 480,
          background: '#fffdf7',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: `0 24px 80px rgba(12,12,10,0.4), 0 0 0 1px ${accent}30`,
          animation: 'unlockPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* Top gradient header with seal */}
        <div style={{
          background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
          padding: '36px 32px 28px',
          textAlign: 'center',
          position: 'relative',
          color: 'white',
        }}>
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 32, height: 32, borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.18)',
              color: 'white',
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.18)' }}
          >
            ✕
          </button>

          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.18)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
            margin: '0 auto 16px',
          }}>
            ✦
          </div>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)',
            margin: '0 0 8px',
          }}>
            Day 7 sealed
          </p>
          <h2 id="unlock-modal-title" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 300, fontStyle: 'italic',
            margin: 0, lineHeight: 1.2, letterSpacing: '-0.01em',
          }}>
            {granted ? '30 days of Alignment, unlocked.' : 'You sealed the leak.'}
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 32px 28px' }}>
          <p style={{
            fontSize: 14, color: 'var(--text-soft)',
            lineHeight: 1.65, margin: '0 0 18px', textAlign: 'center',
          }}>
            {granted ? (
              <>You did the work. Starting now, you have <strong style={{ color: 'var(--ink)' }}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong> of full access to the 365 Alignment app — daily cards, journal, win tracker, and the vault.</>
            ) : (
              <>Seven days, every prompt, every action. The shift is yours to keep — head back to your daily practice whenever you&apos;re ready.</>
            )}
          </p>

          {/* Expiry pill — only when a real grant happened */}
          {granted && (
            <div style={{
              background: `${accent}10`,
              border: `1px solid ${accent}25`,
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
              flexWrap: 'wrap', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16 }}>📅</span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: accent,
                letterSpacing: '0.02em',
              }}>
                Window ends {expiryDate}
              </span>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link
              href={granted ? '/cards' : '/dashboard'}
              onClick={onClose}
              style={{
                display: 'block', textAlign: 'center',
                background: accent, color: 'white',
                padding: '14px 20px',
                borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.02em',
                boxShadow: `0 4px 14px ${accent}40`,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 6px 18px ${accent}55`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = `0 4px 14px ${accent}40`;
              }}
            >
              {granted ? "Open today's card →" : 'Back to dashboard →'}
            </Link>
            <button
              onClick={onClose}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
                padding: '8px', cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              I&apos;ll explore later
            </button>
          </div>

          {granted && (
            <p style={{
              fontSize: 11, color: 'var(--text-muted)',
              textAlign: 'center', margin: '14px 0 0',
              lineHeight: 1.5,
            }}>
              We&apos;ll remind you before your window ends so you don&apos;t lose your streak.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function RecordedSection({ routeId, route, currentDay }: {
  routeId: string
  route: ProgramRoute
  currentDay: number
}) {
  // Collect all saved entries across all days
  const [entries, setEntries] = useState<{ day: number; title: string; items: { question: string; answer: string }[] }[]>([])

  useEffect(() => {
    const result = []
    for (const d of route.days) {
      if (d.day > currentDay) break
      const saved = d.prompt.items
        .map((q, i) => ({ question: q, answer: localStorage.getItem(storageKey(routeId, d.day, i)) ?? '' }))
        .filter(e => e.answer.trim())
      if (saved.length > 0) {
        result.push({ day: d.day, title: d.title, items: saved })
      }
    }
    setEntries(result)
  }, [routeId, route, currentDay])

  if (entries.length === 0) return null

  return (
    <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--line)' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 300,
        color: 'var(--ink)',
        margin: '0 0 6px',
      }}>
        Recorded
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 24px' }}>
        Everything you&apos;ve written across this program.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {entries.map(({ day, title, items }) => (
          <div key={day} style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{ height: '3px', background: route.color }} />
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Day {day}</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{title}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {items.map(({ question, answer }, i) => (
                  <div key={i}>
                    <p style={{ fontSize: '11px', color: route.color, fontFamily: 'var(--font-body)', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {question}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodaysSessionPage() {
  return (
    <Suspense fallback={null}>
      <TodaysSessionInner />
    </Suspense>
  )
}
