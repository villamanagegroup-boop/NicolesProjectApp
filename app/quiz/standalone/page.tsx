'use client'

// app/quiz/standalone/page.tsx
// Standalone version of the quiz for users who already have an account
// and a path but missed the original funnel. Same 12 questions; the only
// difference is the submit step writes the result to their existing user
// row and routes them straight to their proper home — no lead capture,
// no paths comparison.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QUESTIONS, scoreQuiz } from '@/lib/utils/quizUtils'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import QuizProgress from '@/components/quiz/QuizProgress'
import QuizNav from '@/components/quiz/QuizNav'
import { supabaseClient } from '@/lib/supabase/client'

const TOTAL = 12

const PANEL_IMAGES = [
  '/quiz/q1.jpg', '/quiz/q2.jpg', '/quiz/q3.jpg',
  '/quiz/q4.jpg', '/quiz/q5.jpg', '/quiz/q6.jpg',
]

const IRIDESCENT_BG = [
  'radial-gradient(ellipse at 12% 18%, rgba(210, 72, 60, 0.10) 0%, transparent 52%)',
  'radial-gradient(ellipse at 88% 12%, rgba(100, 180, 90, 0.09) 0%, transparent 48%)',
  'radial-gradient(ellipse at 55% 85%, rgba(230, 185, 40, 0.09) 0%, transparent 52%)',
  'radial-gradient(ellipse at 78% 70%, rgba(80, 170, 110, 0.08) 0%, transparent 44%)',
].join(', ')

export default function StandaloneQuizPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [visible, setVisible] = useState(true)
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const question = QUESTIONS[currentIndex]
  const questionNumber = currentIndex + 1
  const isLast = currentIndex === TOTAL - 1
  const panelImage = PANEL_IMAGES[Math.floor(currentIndex / 2)]

  useEffect(() => {
    setSelected(answers[currentIndex] ?? null)
  }, [currentIndex, answers])

  function transition(fn: () => void) {
    setVisible(false)
    setTimeout(() => {
      fn()
      setVisible(true)
    }, 150)
  }

  function handleSelect(optionIndex: number) {
    if (autoAdvancing || submitting) return
    setSelected(optionIndex)
    const newAnswers = { ...answers, [currentIndex]: optionIndex }
    setAnswers(newAnswers)

    if (!isLast) {
      setAutoAdvancing(true)
      setTimeout(() => {
        transition(() => {
          setCurrentIndex(i => i + 1)
          setAutoAdvancing(false)
        })
      }, 320)
    }
  }

  async function finish() {
    if (selected === null) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = scoreQuiz(answers)
      const { data: { user: authUser } } = await supabaseClient.auth.getUser()
      if (!authUser) {
        router.replace('/login')
        return
      }
      // Look up the user's path so we know where to send them next.
      const { data: profile } = await supabaseClient
        .from('users')
        .select('selected_path')
        .eq('id', authUser.id)
        .maybeSingle()

      const { error: updateError } = await supabaseClient
        .from('users')
        .update({ quiz_result: result })
        .eq('id', authUser.id)
      if (updateError) {
        setSubmitError(updateError.message ?? 'Could not save your result.')
        setSubmitting(false)
        return
      }

      const path = profile?.selected_path as 'A' | 'B' | 'C' | null
      const dest = path === 'A' ? '/program'
                 : path === 'C' ? '/circle'
                 : '/dashboard'
      router.replace(dest)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unexpected error saving your result.')
      setSubmitting(false)
    }
  }

  function handleContinue() {
    if (selected === null || submitting) return
    if (isLast) {
      void finish()
    } else {
      transition(() => setCurrentIndex(i => i + 1))
    }
  }

  function handleBack() {
    if (submitting) return
    if (currentIndex === 0) {
      router.push('/take-the-quiz')
    } else {
      transition(() => setCurrentIndex(i => i - 1))
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* LEFT PANEL — desktop only */}
      <div
        className="quiz-left-panel"
        style={{
          width: '50%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          overflow: 'hidden',
        }}
      >
        <img
          key={panelImage}
          src={panelImage}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: visible ? 1 : 0.6, transition: 'opacity 0.15s',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(12,12,10,0.62) 0%, rgba(12,12,10,0.50) 50%, rgba(12,12,10,0.70) 100%)',
        }} />
        <div style={{ position: 'absolute', bottom: 48, left: 48, right: 48, zIndex: 1 }}>
          <p style={{
            fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase',
            color: 'var(--gold)', margin: '0 0 8px', fontWeight: 500,
          }}>
            Question {questionNumber} of {TOTAL}
          </p>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42, fontWeight: 300, fontStyle: 'italic',
            color: 'white', margin: '0 0 12px', lineHeight: 1.15,
            whiteSpace: 'pre-line',
          }}>
            {question.theme}
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
            Take your time. There are no wrong answers.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="quiz-right-panel"
        style={{
          flex: 1, background: '#fdfcfa', backgroundImage: IRIDESCENT_BG,
          display: 'flex', flexDirection: 'column',
          padding: '44px 40px', overflowY: 'auto',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 48,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400,
            color: 'var(--gold)', letterSpacing: '0.5px',
          }}>
            ✦ Seal Your Leak
          </span>
          <div style={{ width: 160 }}>
            <QuizProgress current={questionNumber} total={TOTAL} />
          </div>
        </div>

        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.15s, transform 0.15s',
        }}>
          <QuizQuestion
            question={question}
            questionNumber={questionNumber}
            selectedIndex={selected}
            onSelect={handleSelect}
          />
        </div>

        {submitError && (
          <p style={{
            margin: '14px 0 0', fontSize: 13, color: 'rgba(180,40,40,0.85)',
            textAlign: 'center',
          }}>
            {submitError}
          </p>
        )}

        <div style={{ marginTop: 32 }}>
          <QuizNav
            onBack={handleBack}
            onContinue={handleContinue}
            showBack={true}
            canContinue={selected !== null && !submitting}
            isLast={isLast}
            isFirst={currentIndex === 0}
          />
          {isLast && submitting && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Saving your archetype…
            </p>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .quiz-left-panel { display: none !important; }
          .quiz-right-panel {
            padding: 28px 20px 100px !important;
            width: 100% !important;
          }
          .quiz-question-text { font-size: 24px !important; }
        }
      `}</style>
    </div>
  )
}
