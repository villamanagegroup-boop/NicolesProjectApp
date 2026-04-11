const intentions = [
  'Complete morning journaling three times this week',
  'Revisit Day 3 card and sit with the prompt',
  'Begin Module 2 of the program',
]

export default function IntentionsPanel() {
  return (
    <div
      style={{
        backgroundColor: 'var(--green)',
        borderRadius: '10px',
        padding: '20px',
        color: '#ffffff',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '16px',
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.80)',
          margin: '0 0 16px 0',
        }}
      >
        This week
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {intentions.map((intention, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            {/* Bullet */}
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: 'rgba(184,146,42,0.80)',
                marginTop: '6px',
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: '13px',
                fontFamily: 'var(--font-body)',
                color: 'rgba(255,255,255,0.80)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {intention}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
