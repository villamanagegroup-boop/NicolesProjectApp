'use client'

// app/(portal)/cards/page.tsx
// "Your daily cards" — the 365 Cards program home page. Path B's
// equivalent of /circle for Path C: a single dashboard that surfaces
// today's card preview, today's affirmation, the streak, recent past
// cards, recent journal entries, and recent wins.
//
// Same visual language as /dashboard and /circle: row-based sections,
// hairline dividers, thin accent strip, full-width affirmation, 2-col
// grid on desktop that collapses to single column under 900px.

import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'

const CARDS_GREEN = '#0F4D2E'
const CARDS_PALE  = 'rgba(15,77,46,0.07)'
const TOTAL_DAYS  = 365

const FALLBACK_AFFIRMATION = 'I am exactly where I need to be.'

export default function CardsHomePage() {
  const {
    user, dayNumber, todayCard, pastCards, journalEntries, wins,
    streakCount, cardsAccess,
  } = useApp()

  const firstName = user.name?.split(/\s+/)[0] ?? 'there'
  const hour = typeof window !== 'undefined' ? new Date().getHours() : 9
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const affirmation = todayCard?.affirmation?.trim() || FALLBACK_AFFIRMATION
  const visibleDay = Math.min(dayNumber, cardsAccess.maxDay || dayNumber)

  // Recent journal entries — last 3, newest first
  const recentJournal = [...journalEntries]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  // Recent wins — last 3
  const recentWins = [...wins]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  // Recent past cards — show 5 slots. Fill from real past cards first;
  // any unfilled slots become outlined Day-N placeholders so the strip
  // always reads as "5 cards across the start of your year".
  const RECENT_LIMIT = 5
  const recentPast = pastCards.slice(0, RECENT_LIMIT)
  const placeholderSlots: number[] = []
  for (let i = recentPast.length; i < RECENT_LIMIT; i++) {
    // Fill upward from current visible day so placeholders line up with
    // the days the user is about to unlock. Fall back to sequential 1..5
    // if the user is brand new (visibleDay = 1) and has no past cards.
    const targetDay = visibleDay > 0 ? visibleDay + (i - recentPast.length + 1) : i + 1
    placeholderSlots.push(Math.min(365, targetDay))
  }

  // 30-day window expired — fully lock the home view behind the upgrade
  // prompt. Same component pattern as /card so users who land on either
  // surface see the same conversion moment.
  if (cardsAccess.state === 'expired-upgrade') {
    const monthlyHref = process.env.NEXT_PUBLIC_STRIPE_CARDS_MONTHLY ?? '/upgrade'
    const yearlyHref  = process.env.NEXT_PUBLIC_STRIPE_CARDS_YEARLY  ?? '/upgrade'
    return (
      <div style={{ padding: '60px 20px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: CARDS_GREEN,
          fontFamily: 'var(--font-body)', margin: '0 0 14px',
        }}>
          ✦ Your 30-day window has ended
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 300,
          color: 'var(--ink)', margin: '0 0 12px',
          lineHeight: 1.15, letterSpacing: '-0.01em',
        }}>
          Keep the practice going.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 auto 28px', lineHeight: 1.7, maxWidth: 460 }}>
          You&apos;ve been doing the work for 30 days. Pick a plan to keep your daily card,
          journal, win tracker, and streak running without missing a beat.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <a href={monthlyHref} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block', padding: '13px 24px',
            background: 'white', border: `1.5px solid ${CARDS_GREEN}`, color: CARDS_GREEN,
            borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            fontFamily: 'var(--font-body)', minWidth: 180,
          }}>
            $9/month →
          </a>
          <a href={yearlyHref} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-block', padding: '13px 24px',
            background: CARDS_GREEN, color: 'white',
            borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            fontFamily: 'var(--font-body)', minWidth: 180,
          }}>
            $67/year · Save 38% →
          </a>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-body)' }}>
          Cancel anytime · Secure checkout via Stripe
        </p>
      </div>
    )
  }

  // Show a soft countdown banner during the last 7 days of the window so
  // users aren't surprised when access ends. Only renders for users with
  // the seal_day7 add-on; paid Path B subs / admin grants have no expiry.
  const showExpiryBanner =
    cardsAccess.state === 'open' &&
    typeof cardsAccess.daysRemaining === 'number' &&
    cardsAccess.daysRemaining <= 7

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {showExpiryBanner && (
        <div style={{
          background: '#fffdf7',
          border: `1px solid ${CARDS_GREEN}30`,
          borderLeft: `3px solid ${CARDS_GREEN}`,
          borderRadius: 8,
          padding: '12px 18px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: CARDS_GREEN, margin: '0 0 3px', fontFamily: 'var(--font-body)' }}>
              {cardsAccess.daysRemaining === 0
                ? 'Last day of your 30-day window'
                : `${cardsAccess.daysRemaining} ${cardsAccess.daysRemaining === 1 ? 'day' : 'days'} left in your window`}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
              Pick a plan now and your streak keeps running — no break.
            </p>
          </div>
          <Link href="/upgrade" style={{
            padding: '8px 14px',
            background: CARDS_GREEN, color: 'white',
            borderRadius: 7, fontSize: 12, fontWeight: 600,
            textDecoration: 'none', whiteSpace: 'nowrap',
            fontFamily: 'var(--font-body)',
          }}>
            See plans →
          </Link>
        </div>
      )}

      {/* Hero */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          margin: '0 0 8px', fontFamily: 'var(--font-body)',
        }}>
          365 Cards · Daily alignment
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.015em',
          lineHeight: 1.1,
        }}>
          Good {timeOfDay}, {firstName}.
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '8px 0 0', lineHeight: 1.55, maxWidth: 520 }}>
          Day {visibleDay} of {TOTAL_DAYS}
          {streakCount > 0 && <> · <strong style={{ color: CARDS_GREEN }}>🔥 {streakCount}-day streak</strong></>}
        </p>
      </div>

      {/* Today's affirmation — wide gradient block, the centerpiece. */}
      <div style={{
        background: `linear-gradient(135deg, ${CARDS_PALE} 0%, #fff 70%)`,
        borderTop: `2px solid ${CARDS_GREEN}`,
        borderBottom: '1px solid var(--line)',
        padding: '22px 4px 22px 20px',
        marginBottom: 22,
      }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: CARDS_GREEN,
          margin: '0 0 12px', fontFamily: 'var(--font-body)',
        }}>
          Today&apos;s affirmation
        </p>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontStyle: 'italic',
          fontWeight: 300, color: 'var(--ink)',
          margin: 0, lineHeight: 1.35, maxWidth: 720,
        }}>
          &ldquo;{affirmation}&rdquo;
        </p>
      </div>

      {/* 2-col below: today's card on the left, recent activity on the right */}
      <div className="cards-cols" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: 28, alignItems: 'start',
      }}>

        {/* LEFT — Today's card preview + recent past */}
        <div>
          <Section title="Today's card">
            <TodayCardRow card={todayCard} dayNumber={visibleDay} />
          </Section>

          <Section title="Recent" right={<Link href="/past" style={subtleLink}>See all →</Link>}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 10,
              padding: 18,
            }}>
              {recentPast.map(card => (
                <Link key={card.id} href={`/card?day=${card.dayNumber}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    aspectRatio: '3/4', borderRadius: 8, overflow: 'hidden',
                    background: card.cardColor, position: 'relative',
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
                  >
                    {card.imageUrl ? (
                      <Image src={card.imageUrl} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)', fontSize: 24,
                      }}>{card.emoji}</div>
                    )}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent 55%)',
                    }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '8px 10px',
                    }}>
                      <p style={{
                        fontSize: 8, fontWeight: 600, letterSpacing: '0.08em',
                        textTransform: 'uppercase', color: 'var(--gold)',
                        margin: '0 0 2px', fontFamily: 'var(--font-body)',
                      }}>
                        Day {card.dayNumber}
                      </p>
                      <p style={{
                        fontFamily: 'var(--font-display)', fontStyle: 'italic',
                        fontSize: 11, color: '#fff', margin: 0, lineHeight: 1.25,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {card.title}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Outline placeholders — same shape as filled cards but
                  dashed border + muted "Day N · Coming" copy. Same pattern
                  used on the locked Vault state. */}
              {placeholderSlots.map((d, i) => (
                <div
                  key={`placeholder-${i}`}
                  style={{
                    aspectRatio: '3/4', borderRadius: 8,
                    border: '1.5px dashed var(--line-md)',
                    background: 'var(--card)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: 10, textAlign: 'center',
                    opacity: 0.7,
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 18, fontWeight: 300,
                    color: CARDS_GREEN, opacity: 0.5,
                    lineHeight: 1,
                  }}>
                    Day {d}
                  </div>
                  <div style={{
                    fontSize: 9, fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginTop: 6, fontFamily: 'var(--font-body)',
                  }}>
                    Coming
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* RIGHT — Stats, recent journal + wins, vault peek */}
        <div style={{ position: 'sticky', top: 24 }}>
          <Section title="Your numbers">
            <Stat label="Day"     value={`${visibleDay} of ${TOTAL_DAYS}`} />
            <Stat label="Streak"  value={streakCount > 0 ? `${streakCount} ${streakCount === 1 ? 'day' : 'days'}` : 'Build today'} />
            <Stat label="Journal" value={`${journalEntries.length} ${journalEntries.length === 1 ? 'entry' : 'entries'}`} />
            <Stat label="Wins"    value={`${wins.length} logged`} />
          </Section>

          {recentJournal.length > 0 && (
            <Section title="Latest reflections" right={<Link href="/journal" style={subtleLink}>Open journal →</Link>}>
              {recentJournal.map(j => (
                <ActivityRow
                  key={j.id}
                  eyebrow={j.dayNumber ? `Day ${j.dayNumber}` : 'Journal'}
                  title={j.content.slice(0, 80) + (j.content.length > 80 ? '…' : '')}
                  meta={new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
              ))}
            </Section>
          )}

          {recentWins.length > 0 && (
            <Section title="Recent wins" right={<Link href="/wins" style={subtleLink}>All wins →</Link>}>
              {recentWins.map(w => (
                <ActivityRow
                  key={w.id}
                  eyebrow={w.category}
                  title={w.title}
                  meta={new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
              ))}
            </Section>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .cards-cols {
            grid-template-columns: 1fr !important;
          }
          .cards-cols > div { position: static !important; }
        }
        .stat-row:last-child, .activity-row:last-child { border-bottom: none !important; }
      `}</style>
    </div>
  )
}

// ── Today's card row — feature card with image and prompt preview ──────────
function TodayCardRow({
  card, dayNumber,
}: {
  card: { title: string; theme: string; bodyText: string; affirmation: string; journalPrompt: string; imageUrl: string | null; cardColor: string; emoji: string } | null
  dayNumber: number
}) {
  if (!card) {
    return (
      <div style={{
        padding: '14px 16px 14px 18px', position: 'relative',
      }}>
        <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: CARDS_GREEN, borderRadius: 2 }} />
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Today&apos;s card is loading…
        </p>
      </div>
    )
  }

  return (
    <Link href="/card" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          display: 'flex', gap: 18, alignItems: 'flex-start',
          padding: '14px 16px 14px 18px',
          position: 'relative',
          transition: 'background 0.15s',
          flexWrap: 'wrap',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(200,148,31,0.04)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
      >
        <span style={{
          position: 'absolute', left: 0, top: 14, bottom: 14,
          width: 3, background: CARDS_GREEN, borderRadius: 2,
        }} />

        {/* Card thumbnail */}
        <div style={{
          width: 100, height: 130, borderRadius: 10, overflow: 'hidden',
          background: card.cardColor || CARDS_PALE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, flexShrink: 0,
          position: 'relative',
        }}>
          {card.imageUrl ? (
            <Image src={card.imageUrl} alt="" fill unoptimized sizes="100px" style={{ objectFit: 'cover' }} />
          ) : (
            <span>{card.emoji || '✦'}</span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
            textTransform: 'uppercase', color: CARDS_GREEN,
            marginBottom: 6, fontFamily: 'var(--font-body)',
          }}>
            Day {dayNumber} · {card.theme}
          </div>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 300,
            fontStyle: 'italic', color: 'var(--ink)',
            margin: '0 0 10px', lineHeight: 1.3,
          }}>
            {card.title}
          </h3>
          {card.journalPrompt && (
            <div style={{ marginBottom: 10 }}>
              <p style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                margin: '0 0 4px', fontFamily: 'var(--font-body)',
              }}>
                Journal prompt
              </p>
              <p style={{
                fontSize: 13, color: 'var(--text-soft)', margin: 0,
                lineHeight: 1.55, fontFamily: 'var(--font-body)',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {card.journalPrompt}
              </p>
            </div>
          )}
          <span style={{
            display: 'inline-block', marginTop: 4,
            fontSize: 12, fontWeight: 600, color: CARDS_GREEN,
          }}>
            Open today&apos;s card →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Stat row ────────────────────────────────────────────────────────────────
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-row" style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      padding: '13px 16px 13px 18px',
      borderBottom: '1px solid var(--line)',
      position: 'relative',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: CARDS_GREEN, borderRadius: 2 }} />
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
      }}>
        {label}
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>
        {value}
      </span>
    </div>
  )
}

// ── Activity row (journal / wins) ───────────────────────────────────────────
function ActivityRow({
  eyebrow, title, meta,
}: {
  eyebrow: string
  title: string
  meta: string
}) {
  return (
    <div className="activity-row" style={{
      padding: '14px 16px 14px 18px',
      borderBottom: '1px solid var(--line)',
      position: 'relative',
    }}>
      <span style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 3, background: CARDS_GREEN, borderRadius: 2 }} />
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: CARDS_GREEN,
        marginBottom: 6, fontFamily: 'var(--font-body)',
      }}>
        {eyebrow}
        <span style={{ marginLeft: 8, fontWeight: 500, color: 'var(--text-muted)' }}>· {meta}</span>
      </div>
      <p style={{
        fontSize: 16, fontWeight: 600, color: 'var(--ink)', margin: 0,
        lineHeight: 1.4,
        fontFamily: 'var(--font-body)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {title}
      </p>
    </div>
  )
}

// ── Section wrapper ─────────────────────────────────────────────────────────
function Section({
  title, right, children,
}: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <header style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500,
          color: 'var(--ink)', margin: 0, letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {right}
      </header>
      <div style={{
        background: 'var(--card)', border: '1px solid var(--line)',
        borderRadius: 10, overflow: 'hidden',
      }}>{children}</div>
    </section>
  )
}

const subtleLink: React.CSSProperties = {
  fontSize: 12, color: 'var(--text-muted)',
  textDecoration: 'none', fontWeight: 500,
}
