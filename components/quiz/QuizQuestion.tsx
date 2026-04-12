'use client'

import { Question } from '@/lib/utils/quizUtils'
import QuizOption from './QuizOption'

interface QuizQuestionProps {
  question: Question
  questionNumber: number
  selectedIndex: number | null
  onSelect: (index: number) => void
}

export default function QuizQuestion({ question, questionNumber, selectedIndex, onSelect }: QuizQuestionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p
        style={{
          fontSize: '10px',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: 'var(--gold)',
          margin: 0,
        }}
      >
        Question {questionNumber}
      </p>

      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 400,
          lineHeight: 1.2,
          color: 'var(--ink)',
          margin: '0 0 8px',
        }}
        className="quiz-question-text"
      >
        {question.text}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map((option, i) => (
          <QuizOption
            key={i}
            index={i}
            label={option}
            selected={selectedIndex === i}
            onSelect={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  )
}
