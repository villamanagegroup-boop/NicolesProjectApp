'use client'
import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useApp } from '@/context/AppContext'
import { mockModules } from '@/data/mockLessons'
import { ProgramLesson } from '@/types'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import ProgressBar from '@/components/ui/ProgressBar'
import ProgressRing from '@/components/program/ProgressRing'
import ModuleList from '@/components/program/ModuleList'
import VideoPlayer from '@/components/program/VideoPlayer'

export default function ProgramPage() {
  const { user } = useApp()

  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [activeModuleId, setActiveModuleId] = useState<string>(mockModules[0].id)

  // Totals
  const totalModules = mockModules.length
  const totalLessons = useMemo(
    () => mockModules.reduce((sum, m) => sum + m.lessons.length, 0),
    []
  )

  // Active lesson — first lesson of active module
  const activeLesson = useMemo<ProgramLesson | null>(() => {
    const mod = mockModules.find(m => m.id === activeModuleId)
    return mod?.lessons[0] ?? null
  }, [activeModuleId])

  const activeModule = useMemo(
    () => mockModules.find(m => m.id === activeModuleId) ?? null,
    [activeModuleId]
  )

  // Progress
  const progressPercent = useMemo(
    () => (totalLessons === 0 ? 0 : Math.round((completedLessons.length / totalLessons) * 100)),
    [completedLessons.length, totalLessons]
  )

  // Per-module progress
  const moduleProgress = useMemo(
    () =>
      mockModules.map(mod => {
        const completed = mod.lessons.filter(l => completedLessons.includes(l.id)).length
        return {
          id: mod.id,
          title: mod.title,
          value: mod.lessons.length === 0 ? 0 : Math.round((completed / mod.lessons.length) * 100),
        }
      }),
    [completedLessons]
  )

  function handleToggleLesson(lessonId: string) {
    // If it's a module's first lesson id, switch active module
    const parentModule = mockModules.find(m => m.lessons.some(l => l.id === lessonId))
    if (parentModule) {
      setActiveModuleId(parentModule.id)
    }

    setCompletedLessons(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    )
  }

  // Locked state — user hasn't unlocked the program
  if (user.selectedPath !== 'A' || !user.hasPaid) {
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center', padding: '0 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🔒</div>
        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', fontFamily: 'var(--font-body)', marginBottom: 12 }}>
          UNLOCKABLE FEATURE
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 300, color: 'var(--ink)', marginBottom: 16, lineHeight: 1.2 }}>
          The Work awaits you.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-soft)', fontFamily: 'var(--font-body)', lineHeight: 1.8, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
          Self-paced video lessons, guided modules, and deep-dive content — available when you're ready to go further.
        </p>
        <div style={{
          border: '1px dashed var(--gold-line)',
          borderRadius: 12,
          padding: '24px 32px',
          background: 'var(--gold-pale)',
          marginBottom: 32,
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', margin: 0 }}>
            &ldquo;The deeper work begins when you&apos;re ready to meet yourself there.&rdquo;
          </p>
        </div>
        <Link
          href="/profile"
          style={{
            display: 'inline-block',
            background: 'var(--gold)',
            color: 'white',
            padding: '12px 28px',
            borderRadius: 8,
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          Learn More →
        </Link>
      </div>
    )
  }

  return (
    <div className="two-col-grid" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <EyebrowLabel color="green">Your Program</EyebrowLabel>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '30px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: '4px 0 4px 0',
            lineHeight: 1.2,
          }}
        >
          Self-Paced Journey
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '0 0 32px 0',
          }}
        >
          {totalModules} modules · {totalLessons} lessons
        </p>

        {/* Video player */}
        <VideoPlayer
          videoUrl={activeLesson?.videoUrl ?? null}
          lessonTitle={activeLesson?.title ?? ''}
        />

        {/* Active lesson info */}
        <div style={{ marginTop: '16px', marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              color: 'var(--ink)',
              margin: 0,
              fontWeight: 400,
            }}
          >
            {activeLesson?.title ?? 'Select a lesson'}
          </h2>
          {activeModule && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0',
              }}
            >
              Module {activeModule.orderIndex} — {activeModule.title}
            </p>
          )}
          {activeLesson && (
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '8px 0 0 0',
              }}
            >
              {activeLesson.durationMinutes} min
            </p>
          )}
        </div>

        {/* Module list */}
        <ModuleList
          modules={mockModules}
          completedLessonIds={completedLessons}
          activeModuleId={activeModuleId}
          onToggleLesson={handleToggleLesson}
        />
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div
        style={{
          width: '280px',
          flexShrink: 0,
          position: 'sticky',
          top: '92px',
        }}
      >
        {/* Progress ring */}
        <ProgressRing value={progressPercent} size={100} />

        {/* Ring label */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px',
              color: 'var(--green)',
              margin: 0,
            }}
          >
            {progressPercent}%
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '4px 0 0 0',
            }}
          >
            Complete
          </p>
        </div>

        {/* Divider */}
        <div
          style={{
            borderTop: '1px solid var(--line)',
            margin: '20px 0',
          }}
        />

        {/* Per-module progress bars */}
        {moduleProgress.map(mp => (
          <div key={mp.id} style={{ marginBottom: '16px' }}>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'var(--text-soft)',
                margin: '0 0 4px 0',
              }}
            >
              {mp.title}
            </p>
            <ProgressBar value={mp.value} height={3} color="green" />
          </div>
        ))}

        {/* Milestone note */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: '11px',
            color: 'rgba(var(--gold-rgb, 184,146,42), 0.8)',
            marginTop: '16px',
            lineHeight: 1.6,
          }}
        >
          Next milestone at 60% — you&apos;re close.
        </p>
      </div>

    </div>
  )
}
