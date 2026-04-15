'use client'
import React from 'react'
import Link from 'next/link'
import { useApp, getArchetypePlaceholder } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'
import { quizResults } from '@/data/quizData'

const archetypeColors: Record<string, string> = {
  seeker: 'var(--green)',
  builder: 'var(--gold)',
  healer: 'var(--red)',
  visionary: '#2a1a5e',
}

export default function ProfilePage() {
  const { user, dayNumber, cards, journalEntries, avatarUrl, setAvatarUrl, dailyReminders, setDailyReminders, sidebarMode } = useApp()
  const isWorkMode = sidebarMode === 'work'

  // Journal entries from the last 7 days
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weeklyEntries = journalEntries.filter(e => new Date(e.createdAt) >= oneWeekAgo)

  const photoSrc = avatarUrl ?? getArchetypePlaceholder(user.quizResult)
  const frameBorder = user.quizResult
    ? `3px solid ${archetypeColors[user.quizResult] ?? 'var(--gold)'}`
    : '3px solid var(--gold)'

  const matchedResult = quizResults.find((r) => r.id === user.quizResult)
  const daysToReassessment = Math.max(0, 90 - dayNumber)
  const reassessmentAvailable = dayNumber >= 90

  return (
    <div>
      {/* Hero row */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--paper2) 100%)',
          border: '1px solid var(--gold-line)',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {/* Photo circle */}
          <div style={{
            width: 80, height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            border: frameBorder,
            position: 'relative',
            backgroundColor: 'var(--paper2)',
          }}>
            <img
              src={photoSrc}
              alt={user.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Upload button — small camera icon overlaid bottom-right */}
          <label
            htmlFor="avatar-upload"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: 'var(--gold)',
              border: '2px solid white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Upload photo"
          >
            {/* Camera SVG icon 12px */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </label>

          {/* Hidden file input */}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onloadend = () => {
                setAvatarUrl(reader.result as string)
              }
              reader.readAsDataURL(file)
            }}
          />
        </div>

        {/* Info */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 300,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            {user.name}
          </h1>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '4px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span>{user.email}</span>
            <span>· Day {dayNumber}</span>
            <span>· {isWorkMode ? 'Seal the Leak' : user.selectedPath === 'A' ? 'Full Journey' : 'Daily Practice'}</span>
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {matchedResult && (
              <span
                style={{
                  border: '1px solid rgba(184,148,83,0.40)',
                  color: 'var(--gold)',
                  fontSize: '11px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {matchedResult.emoji} {matchedResult.title}
              </span>
            )}
            <span
              style={{
                border: '1px solid var(--line-md)',
                color: 'var(--text-soft)',
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-body)',
              }}
            >
              {user.selectedPath === 'A' ? '⚡ Full Journey' : '🌿 Daily Practice'}
            </span>
          </div>
        </div>
      </div>

      {/* 2-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Left — Preferences */}
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '24px',
            backgroundColor: '#ffffff',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              color: 'var(--ink)',
              margin: '0 0 16px 0',
              fontWeight: 400,
            }}
          >
            Preferences
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Daily reminders — live toggle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                  Daily reminders
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
                  {dailyReminders ? 'Delivered at 4am every day' : 'Reminders are off'}
                </div>
              </div>
              <button
                onClick={() => setDailyReminders(!dailyReminders)}
                style={{
                  width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                  background: dailyReminders ? 'var(--green)' : 'var(--line-md)',
                  border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  position: 'absolute', top: 3,
                  left: dailyReminders ? 21 : 3, transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            {/* Static preference rows */}
            {[
              { label: 'Email digest', value: 'Weekly' },
              { label: 'Card time', value: '4:00 AM' },
              { label: 'Language', value: 'English' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                  {label}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Journey Stats (cards) or Program Progress (work) */}
        {isWorkMode ? (
          <div
            style={{
              border: '1px solid var(--gold-line)',
              borderRadius: '12px',
              padding: '24px',
              backgroundColor: 'var(--gold-pale)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'var(--ink)',
                margin: '0 0 4px 0',
                fontWeight: 400,
              }}
            >
              Seal the Leak
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              7-Day Reset Progress
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Current day', value: `Day ${Math.min(dayNumber, 7)} of 7` },
                { label: 'Sessions done', value: `${Math.min(dayNumber, 7)}` },
                { label: 'Journal entries', value: String(journalEntries.length) },
                { label: 'Status', value: dayNumber >= 7 ? '✓ Complete' : 'In progress' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--gold-line)',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Overall completion</span>
                <span style={{ fontSize: '11px', color: 'var(--gold)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  {Math.round((Math.min(dayNumber, 7) / 7) * 100)}%
                </span>
              </div>
              <div style={{ height: '4px', background: 'var(--gold-line)', borderRadius: '2px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((Math.min(dayNumber, 7) / 7) * 100)}%`,
                  background: 'var(--gold)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '24px',
              backgroundColor: '#ffffff',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                color: 'var(--ink)',
                margin: '0 0 16px 0',
                fontWeight: 400,
              }}
            >
              Journey Stats
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { label: 'Days active', value: String(dayNumber) },
                { label: 'Cards unlocked', value: String(Math.min(dayNumber, cards.length)) },
                { label: 'Journal entries', value: String(journalEntries.length) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Reflection Summary */}
      <div
        style={{
          border: '1px solid var(--line)',
          borderRadius: '12px',
          overflow: 'hidden',
          marginBottom: '24px',
        }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            This Week&apos;s Reflections
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {weeklyEntries.length} {weeklyEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        <div style={{ padding: weeklyEntries.length === 0 ? '24px' : '0 24px' }}>
          {weeklyEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic', marginBottom: '12px' }}>
                No reflections this week yet.
              </p>
              <Link
                href="/journal"
                style={{
                  fontSize: '13px',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                }}
              >
                Go to Reflection →
              </Link>
            </div>
          ) : (
            weeklyEntries.map((entry, i) => {
              const date = new Date(entry.createdAt)
              const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              const isLast = i === weeklyEntries.length - 1
              return (
                <div
                  key={entry.id}
                  style={{
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    borderBottom: isLast ? 'none' : '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--ink)',
                          fontFamily: 'var(--font-body)',
                          margin: 0,
                          lineHeight: 1.6,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {entry.content || <em style={{ color: 'var(--text-muted)' }}>No content</em>}
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {entry.cardId ? `✦ Day ${entry.dayNumber}` : dayLabel}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 90-Day Reassessment panel */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--green-pale) 100%)',
          border: '1px solid var(--gold-line)',
          borderLeft: '3px solid var(--red)',
          borderRadius: '12px',
          padding: '28px',
          marginBottom: '24px',
        }}
      >
        <EyebrowLabel color="red">Milestone Review</EyebrowLabel>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 300,
            color: 'var(--ink)',
            marginTop: '8px',
            marginBottom: '8px',
          }}
        >
          90-Day Reassessment
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: 'var(--text-soft)',
            lineHeight: 1.6,
            marginBottom: '20px',
            fontFamily: 'var(--font-body)',
          }}
        >
          At Day 90, you unlock the ability to retake the quiz and see how your archetype has
          evolved. This journey changes you — let the portal reflect that.
        </p>
        {!reassessmentAvailable && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              fontFamily: 'var(--font-body)',
              marginBottom: '16px',
            }}
          >
            Available on Day 90 — {daysToReassessment} days to go.
          </p>
        )}
        <Button variant="outline" size="sm" disabled={!reassessmentAvailable}>
          Learn More
        </Button>
      </div>
    </div>
  )
}
