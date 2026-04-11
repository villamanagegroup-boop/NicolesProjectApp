'use client'
import React from 'react'

interface StreakBannerProps {
  streakCount: number
}

function getStreakMessage(count: number): string {
  if (count <= 3) return 'You are beginning to arrive.'
  if (count <= 6) return 'The practice is taking root.'
  if (count <= 13) return `${count} Days in Alignment`
  if (count <= 20) return `Consistency in Self — ${count} Days`
  if (count <= 29) return `You've been choosing you for ${count} days`
  return `${count} Days of Devotion to Self`
}

export default function StreakBanner({ streakCount }: StreakBannerProps) {
  const message = getStreakMessage(streakCount)

  return (
    <div
      style={{
        border: '1px solid var(--gold-line, var(--gold))',
        borderRadius: '10px',
        padding: '20px 24px',
        backgroundColor: 'var(--gold-pale)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}
    >
      {/* Left side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Large streak number */}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            fontWeight: 300,
            lineHeight: 1,
            color: 'var(--gold)',
          }}
        >
          {streakCount}
        </span>

        {/* Text column */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '18px',
              color: 'var(--ink)',
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {message}
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '12px',
              color: 'var(--text-soft)',
              margin: '4px 0 0 0',
            }}
          >
            Keep showing up for yourself.
          </p>
        </div>
      </div>

      {/* Right side */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: '24px',
            color: 'var(--gold)',
            lineHeight: 1,
          }}
        >
          ✦
        </span>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
          }}
        >
          current streak
        </p>
      </div>
    </div>
  )
}
