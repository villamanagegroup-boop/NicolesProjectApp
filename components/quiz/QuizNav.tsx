'use client'

interface QuizNavProps {
  onBack: () => void
  onContinue: () => void
  showBack: boolean
  canContinue: boolean
  isLast: boolean
  isFirst?: boolean
}

export default function QuizNav({ onBack, onContinue, showBack, canContinue, isLast, isFirst }: QuizNavProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {showBack ? (
        <button
          type="button"
          aria-label={isFirst ? 'Back to home' : 'Go back to previous question'}
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '8px 0',
          }}
        >
          ← {isFirst ? 'Home' : 'Back'}
        </button>
      ) : (
        <span />
      )}

      <button
        type="button"
        aria-label={isLast ? 'Submit my answers' : 'Continue to next question'}
        onClick={onContinue}
        disabled={!canContinue}
        style={{
          background: isLast ? '#1f5c3a' : 'var(--ink)',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '11px 22px',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: canContinue ? 'pointer' : 'not-allowed',
          opacity: canContinue ? 1 : 0.4,
          transition: 'opacity 0.15s',
          letterSpacing: '0.2px',
        }}
      >
        {isLast ? 'Submit My Answers →' : 'Continue →'}
      </button>
    </div>
  )
}
