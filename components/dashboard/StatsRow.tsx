interface StatsRowProps {
  daysActive: number
  streakCount: number
  cardsUnlocked: number
}

export default function StatsRow({ daysActive, streakCount, cardsUnlocked }: StatsRowProps) {
  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: '10px',
        backgroundColor: 'var(--paper2)',
        display: 'flex',
      }}
    >
      {/* Days Active */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          borderRight: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '30px',
            fontWeight: 700,
            color: 'var(--gold)',
          }}
        >
          {daysActive}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            marginTop: '2px',
          }}
        >
          Days Active
        </div>
      </div>

      {/* Current Streak */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
          borderRight: '1px solid var(--line)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 500,
            color: 'var(--green)',
          }}
        >
          {streakCount === 0 ? '—' : streakCount}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            marginTop: '2px',
          }}
        >
          Days in Alignment
        </div>
      </div>

      {/* Cards Unlocked */}
      <div
        style={{
          flex: 1,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 500,
            color: 'var(--ink)',
          }}
        >
          {cardsUnlocked}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            marginTop: '2px',
          }}
        >
          Cards Unlocked
        </div>
      </div>
    </div>
  )
}
