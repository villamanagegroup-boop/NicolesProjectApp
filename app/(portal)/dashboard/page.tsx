'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'
import StatsRow from '@/components/dashboard/StatsRow'
import IntentionsPanel from '@/components/dashboard/IntentionsPanel'
import HeroCard from '@/components/cards/HeroCard'

export default function DashboardPage() {
  const { user, dayNumber, todayCard, pastCards, journalEntries, streakCount, wins, cardsAccess } = useApp()

  const cardsUnlocked = pastCards.length + 1
  const recentPastCards = pastCards.slice(0, 5)
  const CARD_SLOTS = 5

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <p
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            margin: '0 0 8px 0',
          }}
        >
          Welcome back, {user.name}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 300,
            color: 'var(--ink)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Your path is clear today.
        </h1>
      </div>

      {/* Main two-column grid */}
      <div
        className="two-col-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '24px',
          marginBottom: '40px',
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Hero Card — or a locked/upgrade state for Path A users */}
          {cardsAccess.state === 'locked-not-yet' ? (
            <div style={{
              width: '100%',
              minHeight: 340,
              borderRadius: 12,
              padding: '36px 32px',
              background: 'linear-gradient(135deg, rgba(61,48,128,0.06) 0%, rgba(201,125,58,0.04) 100%)',
              border: '1px solid rgba(61,48,128,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 10,
            }}>
              <div style={{ fontSize: 40, marginBottom: 6 }}>🔒</div>
              <p style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#3D3080',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                margin: 0,
              }}>
                Daily Alignment unlocks on Day {cardsAccess.unlocksOnDay}
              </p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26,
                fontWeight: 300,
                color: 'var(--ink)',
                margin: '4px 0',
                lineHeight: 1.2,
                maxWidth: 420,
              }}>
                Stay with Seal the Leak — your first cards arrive soon.
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0, maxWidth: 420, lineHeight: 1.65 }}>
                On Day 6 you&apos;ll see Alignment Day 1. On Day 7 you&apos;ll see Day 2. Then choose whether to keep going.
              </p>
              <Link
                href="/program"
                style={{
                  marginTop: 10,
                  padding: '10px 20px',
                  background: '#3D3080',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'none',
                }}
              >
                Go to today&apos;s Seal the Leak session →
              </Link>
            </div>
          ) : todayCard ? (
            <HeroCard card={todayCard} dayNumber={dayNumber} />
          ) : (
            <div
              style={{
                width: '100%',
                minHeight: '340px',
                borderRadius: '12px',
                backgroundColor: 'var(--paper3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌙</div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '20px',
                    color: 'var(--text-soft)',
                    margin: 0,
                  }}
                >
                  Your journey begins tomorrow.
                </p>
              </div>
            </div>
          )}

          {/* Upgrade prompt for Path A users past the 7-day program */}
          {cardsAccess.state === 'locked-upgrade' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(184,146,42,0.08) 0%, rgba(184,146,42,0.04) 100%)',
              border: '1px solid rgba(184,146,42,0.35)',
              borderLeft: '3px solid #b8922a',
              borderRadius: 10,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b8922a', fontWeight: 600, marginBottom: 3 }}>
                  You&apos;ve finished Seal the Leak
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
                  You&apos;ve unlocked Alignment Days 1 & 2. Upgrade to keep the rhythm going.
                </div>
              </div>
              <Link
                href="/upgrade"
                style={{
                  padding: '8px 14px',
                  background: '#b8922a',
                  color: 'white',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                See upgrade options →
              </Link>
            </div>
          )}

          {/* Stats row */}
          <div className="stats-row-wrapper">
            <StatsRow
              daysActive={dayNumber}
              streakCount={streakCount}
              cardsUnlocked={cardsUnlocked}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Wins Preview */}
          <div style={{
            border: '1px solid var(--line)',
            borderRadius: 10,
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink)' }}>My Wins</span>
              <Link href="/wins" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>View all →</Link>
            </div>
            {wins.slice(0, 2).map(win => (
              <div key={win.id} style={{
                padding: '10px 0',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                  background: win.category === 'boundary' ? 'var(--red)' : win.category === 'choice' ? 'var(--gold)' : 'var(--green)',
                }} />
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{win.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{win.category}</div>
                </div>
              </div>
            ))}
            {wins.length === 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}>Log your first win →</p>
            )}
          </div>

          {/* Intentions panel */}
          <IntentionsPanel />

          {/* Journal shortcut */}
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: '10px',
              padding: '20px',
              backgroundColor: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  color: 'var(--ink)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--red)',
                    flexShrink: 0,
                  }}
                />
                Reflect Today
              </p>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  margin: '2px 0 0 0',
                }}
              >
                {journalEntries.length} entries this month
              </p>
            </div>

            <Link href="/journal" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  border: '1px solid var(--line-md)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-soft)',
                  fontSize: '14px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--paper2)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                →
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Past Cards section */}
      <div>
        {/* Section header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 400,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            The Past
          </h2>
          <Link
            href="/past"
            style={{
              fontSize: '12px',
              color: 'var(--text-soft)',
              textDecoration: 'none',
              transition: 'color 0.15s ease',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-soft)'
            }}
          >
            View all →
          </Link>
        </div>

        {/* 5-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
          }}
        >
          {Array.from({ length: CARD_SLOTS }).map((_, i) => {
            const card = recentPastCards[i]
            if (card) {
              return (
                <Link key={card.id} href={`/card?day=${card.dayNumber}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div
                    style={{
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      aspectRatio: '3/4',
                      backgroundColor: card.cardColor,
                      cursor: 'pointer',
                    }}
                  >
                    {card.imageUrl ? (
                      <Image
                        src={card.imageUrl}
                        alt={card.title}
                        fill
                        unoptimized
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                      />
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                        }}
                      >
                        {card.emoji}
                      </div>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.10) 55%, transparent 100%)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '10px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '9px',
                          color: 'var(--gold-dim)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontFamily: 'var(--font-body)',
                          margin: 0,
                        }}
                      >
                        Day {card.dayNumber}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '12px',
                          fontStyle: 'italic',
                          color: '#ffffff',
                          margin: '2px 0 0 0',
                          lineHeight: 1.3,
                        }}
                      >
                        {card.title}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            }

            // Empty slot — dotted outline placeholder
            return (
              <div
                key={`empty-${i}`}
                style={{
                  borderRadius: '10px',
                  aspectRatio: '3/4',
                  border: '1.5px dashed rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    color: 'rgba(0,0,0,0.18)',
                    letterSpacing: '0.02em',
                  }}
                >
                  <span style={{ color: 'rgba(191,155,67,0.35)' }}>✦</span> Seal Your Leak
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
