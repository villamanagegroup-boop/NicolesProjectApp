'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QUESTIONS } from '@/lib/utils/quizUtils'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import QuizProgress from '@/components/quiz/QuizProgress'
import QuizNav from '@/components/quiz/QuizNav'
import { QuizResultId } from '@/types'

const PREVIEW_RESULTS: { id: QuizResultId; label: string }[] = [
  { id: 'healer',   label: 'Open Door' },
  { id: 'seeker',   label: "Overthinker's Throne" },
  { id: 'builder',  label: 'Interrupted Engine' },
  { id: 'visionary',label: 'Pushthrough' },
]

const TOTAL = 12

// 6 images cycle across 12 questions — each image appears for 2 questions
const PANEL_IMAGES = [
  '/quiz/q1.jpg', // Q1–2
  '/quiz/q2.jpg', // Q3–4
  '/quiz/q3.jpg', // Q5–6
  '/quiz/q4.jpg', // Q7–8
  '/quiz/q5.jpg', // Q9–10
  '/quiz/q6.jpg', // Q11–12
]

const IRIDESCENT_BG = [
  'radial-gradient(ellipse at 12% 18%, rgba(210, 72, 60, 0.10) 0%, transparent 52%)',
  'radial-gradient(ellipse at 88% 12%, rgba(100, 180, 90, 0.09) 0%, transparent 48%)',
  'radial-gradient(ellipse at 55% 85%, rgba(230, 185, 40, 0.09) 0%, transparent 52%)',
  'radial-gradient(ellipse at 78% 70%, rgba(80, 170, 110, 0.08) 0%, transparent 44%)',
].join(', ')

export default function QuizPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [selected, setSelected] = useState<number | null>(null)
  const [visible, setVisible] = useState(true)
  const [autoAdvancing, setAutoAdvancing] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  function previewResult(id: QuizResultId) {
    sessionStorage.setItem('clarity_quiz_result', id)
    router.push('/quiz/result')
  }

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
    if (autoAdvancing) return
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

  function handleContinue() {
    if (selected === null) return
    if (isLast) {
      sessionStorage.setItem('clarity_quiz_answers', JSON.stringify(answers))
      router.push('/quiz/submit')
    } else {
      transition(() => setCurrentIndex(i => i + 1))
    }
  }

  function handleBack() {
    if (currentIndex === 0) {
      router.push('/')
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
        {/* Photo background */}
        <img
          key={panelImage}
          src={panelImage}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            opacity: visible ? 1 : 0.6,
            transition: 'opacity 0.15s',
          }}
        />
        {/* Dark overlay so text stays readable */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, rgba(12,12,10,0.62) 0%, rgba(12,12,10,0.50) 50%, rgba(12,12,10,0.70) 100%)',
          }}
        />

        {/* Bottom overlay content */}
        <div style={{ position: 'absolute', bottom: '48px', left: '48px', right: '48px', zIndex: 1 }}>
          <p
            style={{
              fontSize: '10px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              margin: '0 0 8px',
              fontWeight: 500,
            }}
          >
            Question {questionNumber} of {TOTAL}
          </p>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '42px',
              fontWeight: 300,
              fontStyle: 'italic',
              color: 'white',
              margin: '0 0 12px',
              lineHeight: 1.15,
              whiteSpace: 'pre-line',
            }}
          >
            {question.theme}
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.40)', margin: 0 }}>
            Take your time. There are no wrong answers.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="quiz-right-panel"
        style={{
          flex: 1,
          background: '#fdfcfa',
          backgroundImage: IRIDESCENT_BG,
          display: 'flex',
          flexDirection: 'column',
          padding: '44px 40px',
          overflowY: 'auto',
        }}
      >
        {/* Top row: wordmark + progress */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '48px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 400,
              color: 'var(--gold)',
              letterSpacing: '0.5px',
            }}
          >
            ✦ Seal Your Leak
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Admin preview */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setAdminOpen(o => !o)}
                style={{
                  fontSize: '10px',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: 'rgba(12,12,10,0.3)',
                  background: 'none',
                  border: '1px solid rgba(12,12,10,0.15)',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                Admin
              </button>
              {adminOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'white',
                    border: '1px solid rgba(12,12,10,0.12)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(12,12,10,0.1)',
                    padding: '8px',
                    zIndex: 50,
                    minWidth: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <p style={{ fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(12,12,10,0.35)', margin: '0 0 6px 6px', fontFamily: 'var(--font-body)' }}>
                    Preview result
                  </p>
                  {PREVIEW_RESULTS.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => previewResult(r.id)}
                      style={{
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        borderRadius: '5px',
                        padding: '8px 10px',
                        fontSize: '13px',
                        color: 'var(--ink)',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(12,12,10,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      The {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ width: '160px' }}>
              <QuizProgress current={questionNumber} total={TOTAL} />
            </div>
          </div>
        </div>

        {/* Question content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 0.15s, transform 0.15s',
          }}
        >
          <QuizQuestion
            question={question}
            questionNumber={questionNumber}
            selectedIndex={selected}
            onSelect={handleSelect}
          />
        </div>

        {/* Nav */}
        <div style={{ marginTop: '32px' }}>
          <QuizNav
            onBack={handleBack}
            onContinue={handleContinue}
            showBack={true}
            canContinue={selected !== null}
            isLast={isLast}
            isFirst={currentIndex === 0}
          />
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
