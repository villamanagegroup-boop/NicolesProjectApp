'use client'
import React from 'react'
import Link from 'next/link'
import { useApp, getArchetypePlaceholder } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'
import { quizResults } from '@/data/quizData'
import { getPath } from '@/data/paths'

const archetypeColors: Record<string, string> = {
  seeker: 'var(--green)',
  builder: 'var(--gold)',
  healer: 'var(--red)',
  visionary: '#2a1a5e',
}

const themeColors: Record<string, string> = {
  Alignment: '#1a5230',
  Clarity:   '#2c4b8a',
  Strength:  '#8a3a2c',
  Purpose:   '#5a3a8a',
  Healing:   '#3a7a6e',
}

interface Milestone {
  day: number
  title: string
  subtitle: string
  href?: string
}

const MILESTONES: Milestone[] = [
  { day: 7,   title: 'First Week',          subtitle: 'You showed up seven days.' },
  { day: 30,  title: 'Vault Unlocked',      subtitle: 'Older cards become retrievable.', href: '/vault' },
  { day: 90,  title: '90-Day Reassessment', subtitle: 'Retake the quiz — see who you\'ve become.' },
  { day: 180, title: 'Halfway',             subtitle: 'Six months of alignment.' },
  { day: 365, title: 'Full Journey',        subtitle: 'You completed all 365.' },
]

export default function ProfilePage() {
  const { user, dayNumber, cards, journalEntries, avatarUrl, setAvatarUrl, streakCount } = useApp()

  const photoSrc = avatarUrl ?? getArchetypePlaceholder(user.quizResult)
  const frameBorder = user.quizResult
    ? `3px solid ${archetypeColors[user.quizResult] ?? 'var(--gold)'}`
    : '3px solid var(--gold)'

  const matchedResult = quizResults.find(r => r.id === user.quizResult)
  const path = getPath(user.selectedPath)
  const daysToReassessment = Math.max(0, 90 - dayNumber)
  const reassessmentAvailable = dayNumber >= 90

  const cardsUnlocked = Math.min(dayNumber, cards.length)
  const reflectionsCount = journalEntries.length

  // ── Recent reflections (last 10, newest first) ────────────────────────────
  const recentReflections = [...journalEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map(entry => {
      const card = cards.find(c => c.id === entry.cardId)
      return { entry, card }
    })

  // ── Theme compass — unlocked + reflected counts per theme ─────────────────
  const themeOrder = ['Alignment', 'Clarity', 'Strength', 'Purpose', 'Healing']
  const themes = themeOrder.map(theme => {
    const totalInTheme = cards.filter(c => c.theme === theme).length
    const unlockedInTheme = cards.filter(c => c.theme === theme && c.dayNumber <= dayNumber).length
    const reflectedInTheme = journalEntries.filter(e => {
      const card = cards.find(c => c.id === e.cardId)
      return card?.theme === theme
    }).length
    return { theme, totalInTheme, unlockedInTheme, reflectedInTheme }
  }).filter(t => t.totalInTheme > 0)

  return (
    <div>
      {/* ── 1. Identity header ─────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--paper2) 100%)',
          border: '1px solid var(--gold-line)',
          borderRadius: '12px',
          padding: '28px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
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
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onloadend = () => setAvatarUrl(reader.result as string)
              reader.readAsDataURL(file)
            }}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: 0,
          }}>
            {user.name}
          </h1>
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            marginTop: '4px',
          }}>
            Day {dayNumber} of 365
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {matchedResult && (
              <span style={{
                border: '1px solid rgba(184,148,83,0.40)',
                color: 'var(--gold)',
                fontSize: '11px',
                padding: '4px 12px',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-body)',
              }}>
                {matchedResult.emoji} {matchedResult.title}
              </span>
            )}
            <span style={{
              border: `1px solid ${path.accent}40`,
              color: path.accent,
              fontSize: '11px',
              padding: '4px 12px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'var(--font-body)',
            }}>
              {path.icon} {path.shortTitle}
            </span>
          </div>
        </div>

        {/* Edit profile link */}
        <Link
          href="/settings"
          style={{
            fontSize: '12px',
            color: 'var(--text-soft)',
            fontFamily: 'var(--font-body)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--line-md)',
            alignSelf: 'flex-start',
            flexShrink: 0,
          }}
        >
          Edit profile
        </Link>
      </div>

      {/* ── 2. Progress KPI strip ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Days active',     value: dayNumber,        accent: 'var(--green)' },
          { label: 'Cards unlocked',  value: cardsUnlocked,    accent: 'var(--gold)' },
          { label: 'Reflections',     value: reflectionsCount, accent: '#5a3a8a' },
          { label: 'Current streak',  value: streakCount,      accent: 'var(--red)' },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            style={{
              background: '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: '10px',
              padding: '18px 18px 16px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '3px',
              height: '100%',
              background: accent,
            }} />
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '30px',
              fontWeight: 300,
              color: 'var(--ink)',
              lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              marginTop: '8px',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. Reflection thread ──────────────────────────────────────────── */}
      <div style={{
        border: '1px solid var(--line)',
        borderRadius: '12px',
        background: '#ffffff',
        marginBottom: '24px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: 'var(--ink)', margin: 0 }}>
            Your reflections
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {reflectionsCount === 0 ? 'None yet' : `Showing ${recentReflections.length} of ${reflectionsCount}`}
          </span>
        </div>

        {recentReflections.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              margin: '0 0 14px',
            }}>
              Your written reflections will gather here.
            </p>
            <Link
              href="/card"
              style={{
                fontSize: '13px',
                color: 'var(--green)',
                fontFamily: 'var(--font-body)',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
              }}
            >
              Start today's reflection →
            </Link>
          </div>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {recentReflections.map(({ entry, card }, i) => {
              const isLast = i === recentReflections.length - 1
              const themeColor = card ? themeColors[card.theme] ?? 'var(--text-soft)' : 'var(--text-soft)'
              const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
              })
              return (
                <Link
                  key={entry.id}
                  href={`/card?day=${entry.dayNumber}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      padding: '16px 24px',
                      borderBottom: isLast ? 'none' : '1px solid var(--line)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--paper)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', gap: 12, marginBottom: 6, alignItems: 'baseline' }}>
                      <span style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: themeColor,
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                      }}>
                        Day {entry.dayNumber}{card ? ` · ${card.theme}` : ''}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        fontFamily: 'var(--font-body)',
                        marginLeft: 'auto',
                      }}>
                        {date}
                      </span>
                    </div>
                    {card && (
                      <p style={{
                        fontFamily: 'var(--font-display)',
                        fontStyle: 'italic',
                        fontSize: '13px',
                        color: 'var(--text-soft)',
                        margin: '0 0 6px',
                      }}>
                        {card.title}
                      </p>
                    )}
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-body)',
                      margin: 0,
                      lineHeight: 1.55,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {entry.content || <em style={{ color: 'var(--text-muted)' }}>Empty entry</em>}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 4. Theme compass ──────────────────────────────────────────────── */}
      <div style={{
        border: '1px solid var(--line)',
        borderRadius: '12px',
        background: '#ffffff',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: 'var(--ink)', margin: '0 0 4px' }}>
          Your theme compass
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 18px' }}>
          Where your energy has gone across the five themes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {themes.map(({ theme, totalInTheme, unlockedInTheme, reflectedInTheme }) => {
            const color = themeColors[theme] ?? 'var(--text-soft)'
            const unlockedPct = totalInTheme ? (unlockedInTheme / totalInTheme) * 100 : 0
            const reflectedPct = totalInTheme ? (reflectedInTheme / totalInTheme) * 100 : 0
            return (
              <div key={theme}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-body)',
                    color: 'var(--ink)',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    {theme}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                    {unlockedInTheme} / {totalInTheme} unlocked · {reflectedInTheme} reflected
                  </span>
                </div>
                {/* Stacked bar: unlocked (faint) + reflected (bold) overlaid */}
                <div style={{
                  position: 'relative',
                  height: '6px',
                  background: 'var(--line)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    height: '100%',
                    width: `${unlockedPct}%`,
                    background: `${color}40`,
                    transition: 'width 0.3s ease',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    height: '100%',
                    width: `${reflectedPct}%`,
                    background: color,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 5. Milestones earned ──────────────────────────────────────────── */}
      <div style={{
        border: '1px solid var(--line)',
        borderRadius: '12px',
        background: '#ffffff',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 400, color: 'var(--ink)', margin: '0 0 4px' }}>
          Milestones
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 18px' }}>
          Markers along the 365.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          {MILESTONES.map(m => {
            const earned = dayNumber >= m.day
            const toGo = m.day - dayNumber
            const content = (
              <div
                style={{
                  padding: '16px',
                  border: earned ? `1px solid ${archetypeColors[user.quizResult ?? ''] ?? 'var(--green)'}40` : '1px dashed var(--line-md)',
                  borderRadius: '10px',
                  background: earned ? 'var(--paper2)' : 'transparent',
                  opacity: earned ? 1 : 0.55,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '14px',
                    color: earned ? 'var(--green)' : 'var(--text-muted)',
                  }}>
                    {earned ? '✓' : '○'}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: earned ? 'var(--green)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                  }}>
                    Day {m.day}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 400,
                  color: 'var(--ink)',
                  lineHeight: 1.2,
                }}>
                  {m.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.45,
                }}>
                  {earned ? m.subtitle : `${toGo} ${toGo === 1 ? 'day' : 'days'} to go`}
                </div>
              </div>
            )
            return earned && m.href ? (
              <Link key={m.day} href={m.href} style={{ textDecoration: 'none' }}>
                {content}
              </Link>
            ) : (
              <div key={m.day}>{content}</div>
            )
          })}
        </div>
      </div>

      {/* ── 6. 90-Day Reassessment ─────────────────────────────────────────── */}
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
