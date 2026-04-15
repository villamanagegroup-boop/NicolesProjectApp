'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'
import type { ProgramRoute } from '@/data/sealTheLeakProgram'

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

  function handleSave() {
    localStorage.setItem(key, value)
    setSaved(true)
    setDirty(false)
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
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write your reflection here..."
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
      </div>
    </div>
  )
}

function PromptItems({
  items, instruction, routeId, dayNum, color,
}: {
  items: string[]
  instruction?: string
  routeId: string
  dayNum: number
  color: string
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
          readOnly={false}
        />
      ))}
    </div>
  )
}

export default function TodaysSessionPage() {
  const { user, dayNumber } = useApp()
  const searchParams = useSearchParams()

  const routeId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const route   = programRoutes[routeId]
  const currentDay = Math.min(dayNumber, 7)

  const paramDay = searchParams ? Number(searchParams.get('day')) : 0
  const initialDay = paramDay >= 1 && paramDay <= currentDay ? paramDay : currentDay

  const [viewingDay, setViewingDay] = useState(initialDay)
  const [sealedDays, setSealedDays] = useState<Set<number>>(new Set())

  const day = route.days[viewingDay - 1]
  if (!day) return null

  const isDay7     = day.day === 7
  const isToday    = viewingDay === currentDay
  const isPast     = viewingDay < currentDay
  const isSealed   = sealedDays.has(viewingDay)

  function handleSeal() {
    setSealedDays(prev => new Set(prev).add(viewingDay))
  }

  const sealContent = (
    <div style={{
      background: route.color,
      borderRadius: '10px',
      padding: '20px 24px',
      textAlign: 'center',
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
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

      {/* ── Top strip: breadcrumb left, day dots right ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Day dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {route.days.map((d) => {
            const isAvailable = d.day <= currentDay
            const isActive    = viewingDay === d.day
            const isDone      = d.day < currentDay
            return (
              <button
                key={d.day}
                onClick={() => isAvailable && setViewingDay(d.day)}
                title={isAvailable ? `Day ${d.day} — ${d.title}` : `Unlocks on Day ${d.day}`}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: isActive ? `2px solid ${route.color}` : isDone ? `2px solid ${route.color}` : d.day === currentDay ? `2px dashed ${route.color}` : '2px solid rgba(12,12,10,0.1)',
                  background: isActive ? route.color : isDone ? `${route.color}18` : 'white',
                  color: isActive ? 'white' : isDone ? route.color : 'var(--text-muted)',
                  fontSize: '11px', fontWeight: 600, fontFamily: 'var(--font-body)',
                  cursor: isAvailable ? 'pointer' : 'default',
                  opacity: isAvailable ? 1 : 0.3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  outline: isActive ? `3px solid ${route.color}25` : 'none',
                  outlineOffset: '2px', transition: 'all 0.15s ease',
                }}
              >
                {isDone && !isActive ? <CheckIcon /> : d.day}
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
      </div>

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

      {/* ── Two-column main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT: context column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Opening frame */}
          <div style={{
            background: `${route.color}08`,
            borderLeft: `4px solid ${route.color}`,
            borderRadius: '0 10px 10px 0',
            padding: '18px 20px',
          }}>
            <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
              Opening frame
            </p>
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

          {/* Seal */}
          {(isPast || isSealed) ? (
            sealContent
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
          <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>
            {isPast ? 'Reflection prompt' : "Today's prompt"}
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 400, color: 'var(--ink)', margin: '0 0 20px' }}>
            {day.prompt.title}
          </h2>
          <PromptItems
            items={day.prompt.items}
            instruction={day.prompt.instruction}
            routeId={routeId}
            dayNum={viewingDay}
            color={route.color}
          />
        </div>

      </div>

      {/* ── Recorded section ── */}
      <RecordedSection routeId={routeId} route={route} currentDay={currentDay} />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 780px) {
          .session-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
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
