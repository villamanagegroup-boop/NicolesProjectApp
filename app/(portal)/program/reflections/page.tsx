'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute } from '@/data/sealTheLeakProgram'
import type { ProgramRoute } from '@/data/sealTheLeakProgram'
import type { JournalEntry } from '@/types'

function storageKey(routeId: string, dayNum: number, itemIndex: number) {
  return `stl_${routeId}_day${dayNum}_item${itemIndex}`
}

function DownloadAllButton({ routeId, route, currentDay, journalEntries }: {
  routeId: string
  route: ProgramRoute
  currentDay: number
  journalEntries: JournalEntry[]
}) {
  function handleDownload() {
    const lines: string[] = []
    lines.push(`SEAL THE LEAK — ${route.name}`)
    lines.push(`Daily Journal Export`)
    lines.push(`Generated ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
    lines.push('')
    lines.push('─'.repeat(60))

    // Program prompt entries
    let hasPrompts = false
    for (const d of route.days) {
      if (d.day > currentDay) break
      const dayLines: string[] = []
      d.prompt.items.forEach((q, i) => {
        const answer = localStorage.getItem(storageKey(routeId, d.day, i))
        if (answer?.trim()) {
          if (!hasPrompts) {
            lines.push(''); lines.push('PROGRAM PROMPTS'); lines.push('')
            hasPrompts = true
          }
          if (dayLines.length === 0) {
            dayLines.push(`Day ${d.day} — ${d.title} (${d.phase})`)
            dayLines.push('')
          }
          dayLines.push(`Prompt: ${q}`)
          dayLines.push(answer.trim())
          dayLines.push('')
        }
      })
      if (dayLines.length > 0) {
        lines.push(...dayLines)
        lines.push('─'.repeat(40))
      }
    }

    // Daily Journal entries
    if (journalEntries.length > 0) {
      lines.push(''); lines.push('DAILY JOURNAL'); lines.push('')
      for (const entry of journalEntries) {
        lines.push(`Day ${entry.dayNumber} · ${entry.createdAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`)
        lines.push(entry.content.trim())
        lines.push('')
        lines.push('─'.repeat(40))
      }
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `seal-the-leak-daily-journal.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 18px', borderRadius: '8px',
        background: 'white', color: 'var(--text-soft)',
        border: '1px solid var(--line)', fontSize: '13px',
        fontWeight: 500, fontFamily: 'var(--font-body)',
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--ink)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)' }}
    >
      ↓ Download all
    </button>
  )
}

function parseEntry(content: string) {
  const parts = content.split('\n\n')
  if (parts.length > 1 && parts[0].length < 80) {
    return { topic: parts[0], body: parts.slice(1).join('\n\n') }
  }
  return { topic: null, body: content }
}

function ReflectionsInner() {
  const { user, dayNumber, journalEntries } = useApp()
  const searchParams = useSearchParams()

  const routeId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const route   = programRoutes[routeId]

  const currentDay   = Math.min(dayNumber, 7)

  // Which day tab is active — default to query param or currentDay
  const paramDay = searchParams ? Number(searchParams.get('day')) : 0
  const [activeDay, setActiveDay] = useState<number | 'journal'>(
    paramDay >= 1 && paramDay <= currentDay ? paramDay : currentDay
  )

  // Prompt reflection entries (from localStorage)
  type PromptEntry = { day: number; title: string; items: { question: string; answer: string }[] }
  const [promptEntries, setPromptEntries] = useState<PromptEntry[]>([])

  useEffect(() => {
    const result: PromptEntry[] = []
    for (const d of route.days) {
      if (d.day > currentDay) break
      const saved = d.prompt.items
        .map((q, i) => ({ question: q, answer: localStorage.getItem(storageKey(routeId, d.day, i)) ?? '' }))
        .filter(e => e.answer.trim())
      if (saved.length > 0) {
        result.push({ day: d.day, title: d.title, items: saved })
      }
    }
    setPromptEntries(result)
  }, [routeId, route, currentDay])

  const completedDays = Math.max(currentDay - 1, 0)

  // Journal entries split into program reflections and free-write
  // Daily journal entries belong to the program (no card binding).
  const programJournalEntries = journalEntries.filter(e => !e.cardId)

  // Active prompt entry for selected day
  const activePromptEntry = typeof activeDay === 'number'
    ? promptEntries.find(e => e.day === activeDay)
    : null

  const hasSomething = promptEntries.length > 0 || programJournalEntries.length > 0

  // ── Cycle navigation ──
  const availableDays = route.days
    .filter(d => d.day <= currentDay)
    .map(d => d.day)

  const allTabs: (number | 'journal')[] = [
    ...availableDays,
    ...(programJournalEntries.length > 0 ? ['journal' as const] : []),
  ]

  const currentTabIndex = allTabs.indexOf(activeDay as number | 'journal')
  const prevTab = currentTabIndex > 0 ? allTabs[currentTabIndex - 1] : null
  const nextTab = currentTabIndex < allTabs.length - 1 ? allTabs[currentTabIndex + 1] : null

  function tabLabel(tab: number | 'journal'): string {
    if (tab === 'journal') return 'Journal entries'
    return `Day ${tab} — ${route.days[(tab as number) - 1]?.title ?? ''}`
  }

  function goToTab(tab: number | 'journal') {
    setActiveDay(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Link
            href="/program/progress"
            style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
          >
            ← My Progress
          </Link>
          <span style={{ color: 'var(--line-md)', fontSize: '12px' }}>/</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Daily Journal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 500, padding: '3px 10px', borderRadius: '4px',
                background: route.badgeColor, color: route.textColor, fontFamily: 'var(--font-body)',
              }}>
                {route.name}
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 300, color: 'var(--ink)', margin: '0 0 6px' }}>
              Daily Journal
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
              Your daily journal entries across the program.
            </p>
          </div>

          <Link
            href="/program/today"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              borderRadius: '8px',
              background: route.color,
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.88' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
          >
            Review my sessions →
          </Link>
          <DownloadAllButton routeId={routeId} route={route} currentDay={currentDay} journalEntries={programJournalEntries} />
        </div>
      </div>

      {!hasSomething ? (
        /* Empty state */
        <div style={{
          border: '1px dashed var(--line-md)', borderRadius: '12px',
          padding: '64px 24px', textAlign: 'center', background: 'var(--paper2)',
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 300, color: 'var(--ink)', margin: '0 0 8px' }}>
            No entries yet
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 20px' }}>
            Complete a day&apos;s session to see your daily journal here.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/program/today"
              style={{
                padding: '9px 18px', borderRadius: '8px', background: route.color, color: 'white',
                fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', textDecoration: 'none',
              }}
            >
              Go to Today&apos;s Session →
            </Link>
          </div>
        </div>
      ) : (
        <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── LEFT: nav ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

            {/* Program days */}
            {completedDays > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ height: '3px', background: route.color }} />
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 10px', fontFamily: 'var(--font-body)' }}>
                    Program prompts
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {route.days.filter(d => d.day <= currentDay).map((d) => {
                      const hasEntries = promptEntries.some(e => e.day === d.day)
                      const isActive = activeDay === d.day
                      return (
                        <button
                          key={d.day}
                          onClick={() => setActiveDay(d.day)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: isActive ? `${route.color}10` : 'transparent',
                            textAlign: 'left', width: '100%', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper2)' }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', fontSize: '11px',
                              fontWeight: 600, fontFamily: 'var(--font-body)', flexShrink: 0,
                              background: isActive ? route.color : hasEntries ? `${route.color}18` : 'var(--paper2)',
                              color: isActive ? 'white' : hasEntries ? route.color : 'var(--text-muted)',
                            }}>
                              {d.day}
                            </div>
                            <span style={{
                              fontSize: '12px', fontFamily: 'var(--font-body)',
                              color: isActive ? 'var(--ink)' : 'var(--text-soft)',
                              fontWeight: isActive ? 500 : 400,
                            }}>
                              {d.title}
                            </span>
                          </div>
                          {hasEntries && (
                            <span style={{ fontSize: '10px', color: route.color, flexShrink: 0 }}>●</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Daily Journal entries tab */}
            {programJournalEntries.length > 0 && (
              <button
                onClick={() => setActiveDay('journal')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: '10px', border: `1px solid ${activeDay === 'journal' ? 'rgba(61,48,128,0.25)' : 'var(--line)'}`,
                  background: activeDay === 'journal' ? 'rgba(61,48,128,0.06)' : 'white',
                  cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.1s',
                }}
              >
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: activeDay === 'journal' ? '#3D3080' : 'var(--text-muted)', margin: '0 0 2px', fontFamily: 'var(--font-body)' }}>
                    Daily Journal
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', margin: 0, fontFamily: 'var(--font-body)' }}>
                    {programJournalEntries.length} {programJournalEntries.length === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
                <span style={{ fontSize: '14px', color: activeDay === 'journal' ? '#3D3080' : 'var(--text-muted)', opacity: 0.7 }}>✏</span>
              </button>
            )}
          </div>

          {/* ── RIGHT: content ── */}
          <div>

            {/* Position strip */}
            {allTabs.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '20px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '2px',
              }}>
                {allTabs.map((tab, i) => {
                  const isActive = tab === activeDay
                  const isDot = typeof tab === 'number'
                  const hasData = isDot
                    ? promptEntries.some(e => e.day === tab)
                    : programJournalEntries.length > 0
                  return (
                    <button
                      key={String(tab)}
                      onClick={() => goToTab(tab)}
                      title={tabLabel(tab)}
                      style={{
                        flexShrink: 0,
                        width: isActive ? 'auto' : 28,
                        minWidth: 28,
                        height: 28,
                        borderRadius: isActive ? '14px' : '50%',
                        padding: isActive ? '0 12px' : '0',
                        border: isActive
                          ? `2px solid ${route.color}`
                          : hasData
                            ? `2px solid ${route.color}`
                            : '2px solid var(--line)',
                        background: isActive
                          ? route.color
                          : hasData
                            ? `${route.color}18`
                            : 'white',
                        color: isActive ? 'white' : hasData ? route.color : 'var(--text-muted)',
                        fontSize: isActive ? '11px' : '11px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                        outline: isActive ? `3px solid ${route.color}25` : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      {isActive
                        ? (typeof tab === 'number' ? `Day ${tab}` : '✏ Journal')
                        : (typeof tab === 'number' ? tab : '✏')}
                    </button>
                  )
                })}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginLeft: '4px', flexShrink: 0 }}>
                  {currentTabIndex + 1} / {allTabs.length}
                </span>
              </div>
            )}

            {/* Program prompt entries for selected day */}
            {typeof activeDay === 'number' && (
              <>
                {activePromptEntry ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '20px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 300, color: 'var(--ink)', margin: 0 }}>
                        Day {activePromptEntry.day} — {activePromptEntry.title}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {activePromptEntry.items.map(({ question, answer }, i) => (
                        <div key={i} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ height: '3px', background: route.color }} />
                          <div style={{ padding: '20px 24px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 600, color: route.color, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                              {question}
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                              {answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/program/today?day=${activeDay}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          fontSize: '12px', fontWeight: 500, color: route.color,
                          fontFamily: 'var(--font-body)', textDecoration: 'none',
                          padding: '7px 14px', borderRadius: '6px',
                          border: `1px solid ${route.color}30`, background: `${route.color}06`,
                          transition: 'opacity 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
                      >
                        Open Day {activeDay} session →
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '1px dashed var(--line-md)', borderRadius: '12px',
                    padding: '48px 24px', textAlign: 'center', background: 'var(--paper2)',
                  }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 300, color: 'var(--ink)', margin: '0 0 6px' }}>
                      No reflections saved for Day {activeDay}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 16px' }}>
                      Complete the session to record your reflections.
                    </p>
                    <Link
                      href={`/program/today?day=${activeDay}`}
                      style={{
                        display: 'inline-flex', padding: '9px 18px', borderRadius: '8px',
                        background: route.color, color: 'white', fontSize: '13px',
                        fontWeight: 500, fontFamily: 'var(--font-body)', textDecoration: 'none',
                      }}
                    >
                      Go to Day {activeDay} →
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Journal entries view */}
            {activeDay === 'journal' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 300, color: 'var(--ink)', margin: '0 0 20px' }}>
                  Daily Journal
                </h2>

                {programJournalEntries.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {programJournalEntries.map(entry => {
                      const parsed = parseEntry(entry.content)
                      return (
                        <div key={entry.id} style={{ background: 'white', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' }}>
                          <div style={{ height: '3px', background: '#3D3080' }} />
                          <div style={{ padding: '18px 20px' }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>
                              Day {entry.dayNumber} · {entry.createdAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            {parsed.topic && (
                              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
                                {parsed.topic}
                              </p>
                            )}
                            <p style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                              {parsed.body}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Prev / Next cycling ── */}
            {(prevTab !== null || nextTab !== null) && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginTop: '32px',
                paddingTop: '20px',
                borderTop: '1px solid var(--line)',
              }}>
                {prevTab !== null ? (
                  <button
                    onClick={() => goToTab(prevTab)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '8px',
                      border: '1px solid var(--line)', background: 'white',
                      color: 'var(--text-soft)', fontSize: '12px',
                      fontFamily: 'var(--font-body)', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                      maxWidth: '45%', textAlign: 'left',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = route.color
                      el.style.color = route.color
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLButtonElement
                      el.style.borderColor = 'var(--line)'
                      el.style.color = 'var(--text-soft)'
                    }}
                  >
                    <span style={{ flexShrink: 0 }}>←</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tabLabel(prevTab)}
                    </span>
                  </button>
                ) : <div />}

                {nextTab !== null ? (
                  <button
                    onClick={() => goToTab(nextTab)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 16px', borderRadius: '8px',
                      border: `1px solid ${route.color}30`,
                      background: `${route.color}08`,
                      color: route.color, fontSize: '12px',
                      fontFamily: 'var(--font-body)', fontWeight: 500,
                      cursor: 'pointer', transition: 'opacity 0.15s',
                      maxWidth: '45%', textAlign: 'right',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.75' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tabLabel(nextTab)}
                    </span>
                    <span style={{ flexShrink: 0 }}>→</span>
                  </button>
                ) : <div />}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 780px) {
          .two-col-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function ReflectionsPage() {
  return (
    <Suspense fallback={null}>
      <ReflectionsInner />
    </Suspense>
  )
}
