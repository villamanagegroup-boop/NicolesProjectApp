'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { programRoutes, archetypeToRoute, PHASE_DAYS } from '@/data/sealTheLeakProgram'
import type { ProgramDay } from '@/data/sealTheLeakProgram'

function useWorkProgress(dayNumber: number) {
  const completedDays = Math.min(Math.max(dayNumber - 1, 0), 7)
  const currentDay = Math.min(dayNumber, 7)
  return { completedDays, currentDay }
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 4 6-7" />
    </svg>
  )
}

function PhaseTag({ phase, color }: { phase: string; color: string }) {
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 500,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color,
      fontFamily: 'var(--font-body)',
      border: `1px solid ${color}40`,
      padding: '2px 8px',
      borderRadius: '999px',
    }}>
      {phase}
    </span>
  )
}

function DayDot({
  day, status, color, onClick, active,
}: {
  day: number
  status: 'completed' | 'current' | 'upcoming'
  color: string
  onClick: () => void
  active: boolean
}) {
  const isCompleted = status === 'completed'
  const isCurrent   = status === 'current'

  return (
    <button
      onClick={onClick}
      title={`Day ${day}`}
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        border: active
          ? `2px solid ${color}`
          : isCompleted
            ? `2px solid ${color}`
            : isCurrent
              ? `2px dashed ${color}`
              : '2px solid rgba(12,12,10,0.12)',
        background: isCompleted ? color : isCurrent ? `${color}18` : 'white',
        color: isCompleted ? 'white' : isCurrent ? color : 'var(--text-muted)',
        fontSize: '13px',
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s ease',
        outline: active ? `3px solid ${color}30` : 'none',
        outlineOffset: '2px',
      }}
    >
      {isCompleted ? <CheckIcon size={16} /> : day}
    </button>
  )
}

function DayCard({ dayData, color, isCompleted }: { dayData: ProgramDay; color: string; isCompleted: boolean }) {
  return (
    <div style={{
      border: '1px solid rgba(12,12,10,0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: 'white',
    }}>
      {/* Top accent */}
      <div style={{ height: '3px', background: color }} />

      <div style={{ padding: '24px' }}>
        {/* Day header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <PhaseTag phase={dayData.phase} color={color} />
          {isCompleted && (
            <span style={{
              fontSize: '10px',
              color: 'var(--green)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <CheckIcon size={12} /> Completed
            </span>
          )}
        </div>

        {/* Opening frame */}
        <div style={{
          background: `${color}08`,
          borderLeft: `3px solid ${color}`,
          borderRadius: '0 8px 8px 0',
          padding: '14px 16px',
          marginBottom: '20px',
        }}>
          <p style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            margin: '0 0 8px 0',
            fontFamily: 'var(--font-body)',
          }}>
            Opening frame
          </p>
          <p style={{
            fontSize: '13px',
            fontStyle: 'italic',
            color: 'var(--ink)',
            lineHeight: 1.8,
            margin: 0,
            fontFamily: 'var(--font-body)',
          }}>
            {dayData.openingFrame}
          </p>
        </div>

        {/* Prompt + Action */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--paper2)', borderRadius: '8px', padding: '14px' }}>
            <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontFamily: 'var(--font-body)' }}>
              Today&apos;s prompt
            </p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', margin: '0 0 6px', fontFamily: 'var(--font-body)' }}>
              {dayData.prompt.title}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>
              {dayData.prompt.body}
            </p>
          </div>
          <div style={{ background: 'var(--paper2)', borderRadius: '8px', padding: '14px' }}>
            <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 6px', fontFamily: 'var(--font-body)' }}>
              Today&apos;s action
            </p>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink)', margin: '0 0 6px', fontFamily: 'var(--font-body)' }}>
              {dayData.action.title}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-soft)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>
              {dayData.action.body}
            </p>
          </div>
        </div>

        {/* Seal */}
        <div style={{
          background: `${color}06`,
          border: `1px solid ${color}25`,
          borderRadius: '8px',
          padding: '14px 16px',
        }}>
          <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color, margin: '0 0 6px', fontFamily: 'var(--font-body)' }}>
            {dayData.day === 7 ? 'Sealed identity' : "Today's seal"}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>
            &ldquo;{dayData.day === 7 && dayData.sealedIdentity ? dayData.sealedIdentity : dayData.seal}&rdquo;
          </p>
        </div>

        {/* Day 7 proof grid */}
        {dayData.day === 7 && dayData.proofs && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', margin: '0 0 10px', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              What you&apos;ve proven this week
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {dayData.proofs.map((proof) => (
                <div key={proof.label} style={{
                  background: 'white',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 500, color, margin: '0 0 4px', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {proof.label}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-soft)', fontStyle: 'italic', lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)' }}>
                    &ldquo;{proof.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link to Today's Session for this day */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
          <Link
            href={`/program/today?day=${dayData.day}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color,
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: '6px',
              border: `1px solid ${color}30`,
              background: `${color}06`,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
          >
            {isCompleted ? 'Review reflections →' : 'Open Today\'s Session →'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function MyProgressPage() {
  const { user, dayNumber } = useApp()

  const routeId = archetypeToRoute[user.quizResult ?? 'seeker'] ?? 'door'
  const route   = programRoutes[routeId]
  const { completedDays, currentDay } = useWorkProgress(dayNumber)

  const [viewingDay, setViewingDay] = useState(currentDay)

  const viewingDayData    = route.days.find(d => d.day === viewingDay) ?? route.days[0]
  const isViewingCompleted = viewingDay < currentDay

  const currentPhaseEntry = Object.entries(PHASE_DAYS).find(([, days]) => days.includes(currentDay))
  const currentPhase      = currentPhaseEntry?.[0] ?? 'Awareness'
  const progressPercent   = Math.round((completedDays / 7) * 100)

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

      {/* Two-column grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gap: '24px',
        alignItems: 'start',
      }}>

        {/* ── LEFT: header + stats + day selector ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Header */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 500,
                padding: '3px 10px',
                borderRadius: '4px',
                background: route.badgeColor,
                color: route.textColor,
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.04em',
              }}>
                {route.name}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                Day {currentDay} of 7
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 300,
              color: 'var(--ink)',
              margin: '0 0 6px',
            }}>
              My Progress
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
              {route.coreWound}
            </p>
          </div>

          {/* Stats card */}
          <div style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            <div style={{ height: '3px', background: route.color }} />
            <div style={{ padding: '16px 20px' }}>
              {/* Progress bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Overall progress
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: route.color, fontFamily: 'var(--font-body)' }}>
                    {progressPercent}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'var(--line)', borderRadius: '3px' }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: route.color,
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* Phase + Days done */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>
                    Current phase
                  </p>
                  <PhaseTag phase={currentPhase} color={route.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 4px' }}>
                    Days done
                  </p>
                  <p style={{ fontSize: '20px', fontWeight: 600, color: route.color, fontFamily: 'var(--font-body)', margin: 0 }}>
                    {completedDays}<span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 400 }}>/7</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Day selector */}
          <div style={{
            background: 'white',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '16px 20px',
          }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 14px' }}>
              Your journey — tap a day to review
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(['Awareness', 'Interruption', 'Reclamation', 'Identity'] as const).map((phase) => {
                const phaseDays = PHASE_DAYS[phase]
                return (
                  <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      width: '76px',
                      flexShrink: 0,
                      letterSpacing: '0.04em',
                    }}>
                      {phase}
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {phaseDays.map((d) => {
                        const status = d < currentDay ? 'completed' : d === currentDay ? 'current' : 'upcoming'
                        return (
                          <DayDot
                            key={d}
                            day={d}
                            status={status}
                            color={route.color}
                            active={viewingDay === d}
                            onClick={() => setViewingDay(d)}
                          />
                        )
                      })}
                    </div>
                    {phaseDays.every(d => d < currentDay) && (
                      <span style={{ fontSize: '10px', color: route.color, fontFamily: 'var(--font-body)' }}>✓</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: day content ── */}
        <div>
          {/* Day label */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 400,
              color: 'var(--ink)',
              margin: 0,
            }}>
              Day {viewingDay} — {viewingDayData.title}
            </h2>
            {viewingDay === currentDay && (
              <span style={{
                fontSize: '10px',
                fontWeight: 500,
                color: route.color,
                border: `1px solid ${route.color}40`,
                borderRadius: '999px',
                padding: '2px 8px',
                fontFamily: 'var(--font-body)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Today
              </span>
            )}
            {viewingDay > currentDay && (
              <span style={{
                fontSize: '10px',
                color: 'var(--text-muted)',
                border: '1px solid var(--line)',
                borderRadius: '999px',
                padding: '2px 8px',
                fontFamily: 'var(--font-body)',
              }}>
                Upcoming
              </span>
            )}
          </div>

          {/* Day content or locked state */}
          {viewingDay > currentDay ? (
            <div style={{
              border: '1px dashed var(--line-md)',
              borderRadius: '12px',
              padding: '64px 24px',
              textAlign: 'center',
              background: 'var(--paper2)',
            }}>
              <p style={{ fontSize: '28px', margin: '0 0 12px' }}>🔒</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 300, color: 'var(--ink)', margin: '0 0 6px' }}>
                Day {viewingDay} unlocks soon.
              </p>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: 0 }}>
                Complete each day in order — the arc builds on itself.
              </p>
            </div>
          ) : (
            <DayCard dayData={viewingDayData} color={route.color} isCompleted={isViewingCompleted} />
          )}
        </div>

      </div>
    </div>
  )
}
