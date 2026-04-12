'use client'

const CIRCLED_NUMBERS = ['①', '②', '③', '④']

interface QuizOptionProps {
  index: number
  label: string
  selected: boolean
  onSelect: () => void
}

export default function QuizOption({ index, label, selected, onSelect }: QuizOptionProps) {
  return (
    <button
      type="button"
      aria-label={`Option ${index + 1}: ${label}`}
      aria-pressed={selected}
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 18px',
        borderRadius: '8px',
        border: selected
          ? '0.5px solid #1f5c3a'
          : '0.5px solid rgba(12,12,10,0.12)',
        background: selected ? '#e8f3ec' : 'white',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.background = '#f0ebe2'
          e.currentTarget.style.borderColor = 'rgba(12,12,10,0.25)'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.background = 'white'
          e.currentTarget.style.borderColor = 'rgba(12,12,10,0.12)'
        }
      }}
    >
      {/* Radio circle */}
      <span
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: selected ? '5px solid #1f5c3a' : '1.5px solid rgba(12,12,10,0.25)',
          flexShrink: 0,
          display: 'inline-block',
          transition: 'border 0.15s',
        }}
      />
      {/* Circled number */}
      <span
        style={{
          fontSize: '11px',
          color: 'var(--text-muted)',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {CIRCLED_NUMBERS[index]}
      </span>
      {/* Option text */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: selected ? 500 : 400,
          color: selected ? '#1f5c3a' : 'var(--ink)',
          flex: 1,
          lineHeight: 1.4,
        }}
      >
        {label}
      </span>
    </button>
  )
}
