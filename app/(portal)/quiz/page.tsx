'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { quizQuestions } from '@/data/quizData'
import { scoreQuiz } from '@/lib/utils/quizUtils'
import QuizProgress from '@/components/quiz/QuizProgress'

export default function QuizPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})

  const question = quizQuestions[currentIndex]
  const isLast = currentIndex === quizQuestions.length - 1
  const hasAnswer = !!answers[question.id]

  function selectOption(value: string) {
    setAnswers(prev => ({ ...prev, [question.id]: value }))
  }

  function handleNext() {
    if (isLast) {
      const result = scoreQuiz(answers)
      sessionStorage.setItem('quiz_result', result)
      router.push('/result')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'var(--paper)',
        overflowY: 'auto',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: 56,
          borderBottom: '1px solid var(--line)',
          paddingLeft: 32,
          paddingRight: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          zIndex: 10,
        }}
      >
        {/* Wordmark */}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            color: 'var(--ink)',
          }}
        >
          <span style={{ color: 'var(--gold)' }}>✦</span> Clarity
        </span>

        {/* Progress — absolutely centered */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <QuizProgress current={currentIndex + 1} total={quizQuestions.length} />
        </div>

        {/* Exit */}
        <Link
          href="/dashboard"
          style={{
            fontSize: '0.875rem',
            color: 'var(--text-soft)',
            textDecoration: 'none',
          }}
          onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--ink)')}
          onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--text-soft)')}
        >
          Exit
        </Link>
      </div>

      {/* Question area */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 56px - 80px)',
          padding: '48px 32px',
        }}
      >
        <div style={{ maxWidth: 580, width: '100%', margin: '0 auto' }}>
          {/* Eyebrow */}
          <p
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--gold)',
              marginBottom: 16,
              fontFamily: 'var(--font-body)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--red)',
                flexShrink: 0,
              }}
            />
            Question {currentIndex + 1}
          </p>

          {/* Question text */}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 34,
              lineHeight: 1.2,
              color: 'var(--ink)',
              marginBottom: question.subtitle ? 8 : 32,
            }}
          >
            {question.question}
          </h1>

          {/* Subtitle */}
          {question.subtitle && (
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-soft)',
                marginBottom: 32,
                fontFamily: 'var(--font-body)',
              }}
            >
              {question.subtitle}
            </p>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {question.options.map(option => {
              const selected = answers[question.id] === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => selectOption(option.value)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px 20px',
                    border: `1px solid ${selected ? 'var(--green-dim)' : 'var(--line-md)'}`,
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    backgroundColor: selected ? 'var(--green-pale)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--paper2)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selected) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#ffffff'
                    }
                  }}
                >
                  {/* Radio circle */}
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      border: `1.5px solid ${selected ? 'var(--green)' : 'var(--line-md)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {selected && (
                      <div
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          backgroundColor: 'var(--green)',
                        }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    style={{
                      fontSize: 14,
                      fontFamily: 'var(--font-body)',
                      color: 'var(--ink)',
                    }}
                  >
                    {option.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 80,
          borderTop: '1px solid var(--line)',
          paddingLeft: 32,
          paddingRight: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          zIndex: 10,
        }}
      >
        {/* Back */}
        <button
          onClick={handleBack}
          disabled={currentIndex === 0}
          style={{
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            color: currentIndex === 0 ? 'var(--text-muted)' : 'var(--ink)',
            backgroundColor: 'transparent',
            border: '1px solid var(--line-md)',
            borderRadius: 8,
            padding: '8px 20px',
            cursor: currentIndex === 0 ? 'default' : 'pointer',
            opacity: currentIndex === 0 ? 0.4 : 1,
          }}
        >
          Back
        </button>

        {/* Next / See Result */}
        <button
          onClick={handleNext}
          disabled={!hasAnswer}
          style={{
            fontSize: '0.875rem',
            fontFamily: 'var(--font-body)',
            color: '#ffffff',
            backgroundColor: 'var(--ink)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            cursor: hasAnswer ? 'pointer' : 'default',
            opacity: hasAnswer ? 1 : 0.4,
          }}
        >
          {isLast ? 'See Your Result →' : 'Next →'}
        </button>
      </div>
    </div>
  )
}
