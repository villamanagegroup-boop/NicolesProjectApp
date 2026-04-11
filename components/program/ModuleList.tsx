'use client'
import React from 'react'
import { ProgramModule } from '@/types'

interface ModuleListProps {
  modules: ProgramModule[]
  completedLessonIds: string[]
  activeModuleId: string | null
  onToggleLesson: (lessonId: string) => void
}

export default function ModuleList({
  modules,
  completedLessonIds,
  activeModuleId,
  onToggleLesson,
}: ModuleListProps) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      {modules.map((module, idx) => {
        const isActive = module.id === activeModuleId
        const allLessonIds = module.lessons.map(l => l.id)
        const isCompleted =
          allLessonIds.length > 0 &&
          allLessonIds.every(id => completedLessonIds.includes(id))
        const isLast = idx === modules.length - 1

        return (
          <div
            key={module.id}
            style={{
              borderBottom: isLast ? 'none' : '1px solid var(--line)',
            }}
          >
            {/* Module header row */}
            <div
              onClick={() => {
                // Toggle first lesson of module as active indicator
                if (module.lessons.length > 0) {
                  onToggleLesson(module.lessons[0].id)
                }
              }}
              style={{
                padding: isActive ? '16px 20px 16px 18px' : '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderLeft: isActive ? '2px solid var(--green)' : '2px solid transparent',
                backgroundColor: isActive ? 'var(--green-pale)' : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
            >
              {/* Left */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Module number */}
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '30px',
                    fontWeight: 300,
                    color: 'rgba(var(--ink-rgb, 30, 30, 30), 0.18)',
                    width: '40px',
                    flexShrink: 0,
                    lineHeight: 1,
                    opacity: 0.4,
                  }}
                >
                  {String(module.orderIndex).padStart(2, '0')}
                </span>
                {/* Content */}
                <div>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--ink)',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {module.title}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {module.lessons.length} lessons
                  </p>
                </div>
              </div>

              {/* Right */}
              {isCompleted ? (
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--green)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>
                </div>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>→</span>
              )}
            </div>

            {/* Lessons (show when active) */}
            {isActive && (
              <div style={{ backgroundColor: 'var(--paper2)', borderTop: '1px solid var(--line)' }}>
                {module.lessons.map((lesson, lIdx) => {
                  const lessonCompleted = completedLessonIds.includes(lesson.id)
                  const isLastLesson = lIdx === module.lessons.length - 1

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onToggleLesson(lesson.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px 12px 72px',
                        borderBottom: isLastLesson ? 'none' : '1px solid var(--line)',
                        cursor: 'pointer',
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {/* Completion dot */}
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: lessonCompleted ? 'var(--green)' : 'var(--line-md)',
                          flexShrink: 0,
                          transition: 'background-color 0.2s ease',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: lessonCompleted ? 'var(--text-muted)' : 'var(--ink)',
                            margin: 0,
                            textDecoration: lessonCompleted ? 'line-through' : 'none',
                            opacity: lessonCompleted ? 0.6 : 1,
                          }}
                        >
                          {lesson.title}
                        </p>
                        <p
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            margin: '2px 0 0 0',
                          }}
                        >
                          {lesson.durationMinutes} min
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
