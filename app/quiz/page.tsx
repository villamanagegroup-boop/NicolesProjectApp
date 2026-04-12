'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QUESTIONS } from '@/lib/utils/quizUtils'
import QuizQuestion from '@/components/quiz/QuizQuestion'
import QuizProgress from '@/components/quiz/QuizProgress'
import QuizNav from '@/components/quiz/QuizNav'

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
          <div style={{ width: '160px' }}>
            <QuizProgress current={questionNumber} total={TOTAL} />
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
