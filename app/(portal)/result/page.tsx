'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { quizResults } from '@/data/quizData'
import type { QuizResult, QuizResultId, Path } from '@/types'

export default function ResultPage() {
  const router = useRouter()
  const [result, setResult] = useState<QuizResult | null>(null)
  const [selectedPath, setSelectedPath] = useState<Path | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('quiz_result') as QuizResultId | null
    if (stored) {
      const found = quizResults.find(r => r.id === stored) ?? null
      setResult(found)
    }
  }, [])

  function handleEnter() {
    if (!selectedPath) return
    sessionStorage.setItem('selected_path', selectedPath)
    router.push('/dashboard')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#ffffff',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '48px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto', width: '100%' }}>
          {/* Eyebrow */}
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--gold)',
              marginBottom: 24,
              fontFamily: 'var(--font-body)',
            }}
          >
            Your Archetype
          </p>

          {result ? (
            <>
              {/* Emoji */}
              <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>
                {result.emoji}
              </div>

              {/* Heading */}
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 300,
                  fontSize: '3rem',
                  lineHeight: 1.1,
                  color: 'var(--ink)',
                  marginBottom: 24,
                }}
              >
                The{' '}
                <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                  {result.title.replace('The ', '')}
                </em>
              </h1>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--text-soft)',
                  fontWeight: 300,
                  lineHeight: 1.7,
                  maxWidth: 440,
                  margin: '0 auto 32px',
                }}
              >
                {result.description}
              </p>

              {/* Strengths */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginBottom: 48,
                }}
              >
                {result.strengths.map(strength => (
                  <span
                    key={strength}
                    style={{
                      border: '1px solid var(--gold-line)',
                      color: 'var(--gold)',
                      padding: '6px 16px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {strength}
                  </span>
                ))}
              </div>

              {/* Path heading */}
              <p
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  color: 'var(--text-muted)',
                  marginBottom: 20,
                  fontFamily: 'var(--font-body)',
                }}
              >
                Choose your path
              </p>

              {/* Path tiles */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  width: '100%',
                  maxWidth: 520,
                  margin: '0 auto',
                }}
              >
                {/* Path A */}
                <button
                  onClick={() => setSelectedPath('A')}
                  style={{
                    flex: 1,
                    border: `1px solid ${selectedPath === 'A' ? 'var(--gold)' : 'var(--line-md)'}`,
                    borderRadius: 12,
                    padding: 24,
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: selectedPath === 'A' ? 'var(--gold-pale)' : '#ffffff',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Checkmark */}
                  {selectedPath === 'A' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </div>
                  )}

                  <div style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.25rem',
                        color: 'var(--ink)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      Full Journey
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-body)',
                        color: 'var(--gold)',
                        backgroundColor: 'var(--gold-pale)',
                        padding: '2px 10px',
                        borderRadius: 999,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        border: '1px solid var(--gold-line)',
                      }}
                    >
                      Path A
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {['Daily clarity cards', 'Self-paced program', 'Video lessons'].map(f => (
                      <span
                        key={f}
                        style={{
                          fontSize: 12,
                          color: 'var(--text-soft)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        ✦ {f}
                      </span>
                    ))}
                  </div>
                </button>

                {/* Path B */}
                <button
                  onClick={() => setSelectedPath('B')}
                  style={{
                    flex: 1,
                    border: `1px solid ${selectedPath === 'B' ? 'var(--gold)' : 'var(--line-md)'}`,
                    borderRadius: 12,
                    padding: 24,
                    cursor: 'pointer',
                    position: 'relative',
                    backgroundColor: selectedPath === 'B' ? 'var(--gold-pale)' : '#ffffff',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Checkmark */}
                  {selectedPath === 'B' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        color: '#ffffff',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </div>
                  )}

                  <div style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.25rem',
                        color: 'var(--ink)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      Daily Practice
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'var(--font-body)',
                        color: 'var(--text-soft)',
                        border: '1px solid var(--line-md)',
                        padding: '2px 10px',
                        borderRadius: 999,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Path B
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    {['Daily clarity cards', 'Journal prompts', 'Card archive'].map(f => (
                      <span
                        key={f}
                        style={{
                          fontSize: 12,
                          color: 'var(--text-soft)',
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        ✦ {f}
                      </span>
                    ))}
                  </div>
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleEnter}
                disabled={!selectedPath}
                style={{
                  marginTop: 32,
                  width: '100%',
                  maxWidth: 340,
                  backgroundColor: 'var(--gold)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '14px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  cursor: selectedPath ? 'pointer' : 'default',
                  opacity: selectedPath ? 1 : 0.5,
                  transition: 'opacity 0.2s ease',
                }}
              >
                Enter My Portal →
              </button>
            </>
          ) : (
            <p
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
              }}
            >
              Loading your result...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
