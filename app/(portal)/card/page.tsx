'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Button from '@/components/ui/Button'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import DailyCheckIn from '@/components/cards/DailyCheckIn'

function getCardPillStyle(cardColor: string) {
  const colorMap: Record<string, { bg: string; color: string; border: string }> = {
    '#1a2e20': { bg: 'rgba(26,46,32,0.1)', color: '#1a2e20', border: 'rgba(26,46,32,0.25)' },
    '#1a2040': { bg: 'rgba(26,32,64,0.1)', color: '#1a2040', border: 'rgba(26,32,64,0.25)' },
    '#2a1a40': { bg: 'rgba(42,26,64,0.1)', color: '#2a1a40', border: 'rgba(42,26,64,0.25)' },
    '#3a1a1a': { bg: 'rgba(58,26,26,0.1)', color: '#3a1a1a', border: 'rgba(58,26,26,0.25)' },
    '#1a1a2a': { bg: 'rgba(26,26,42,0.1)', color: '#1a1a2a', border: 'rgba(26,26,42,0.25)' },
  }
  return colorMap[cardColor] ?? {
    bg: `${cardColor}18`,
    color: cardColor,
    border: `${cardColor}40`,
  }
}

function getLockedLabel(lockedDayNumber: number, currentDay: number) {
  if (lockedDayNumber === currentDay + 1) return 'Unlocks tomorrow'
  return 'Locked'
}

function CardPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dayParam = searchParams.get('day')
  const { user, cards, dayNumber, todayCard, cardsAccess, checkInToday, setCheckIn, journalEntries, addJournalEntry, updateJournalEntry } = useApp()

  // If ?day= param exists, find that card; otherwise show today's card
  const displayCard = dayParam
    ? cards.find(c => c.dayNumber === parseInt(dayParam)) ?? todayCard
    : todayCard

  // Effective day the user can view up to. For Path A this is clamped by
  // their program progress (see lib/utils/pathAccess.ts).
  const visibleMaxDay = cardsAccess.maxDay
  const displayDayNumber = dayParam ? parseInt(dayParam) : visibleMaxDay
  const isHistoricalView = !!dayParam && parseInt(dayParam) !== visibleMaxDay

  // Prev/next nav clamped to what the user can see
  const canPrev = displayDayNumber > 1
  const canNext = displayDayNumber < visibleMaxDay

  function goToDay(target: number) {
    if (target < 1 || target > visibleMaxDay) return
    if (target === visibleMaxDay) router.push('/card')
    else router.push(`/card?day=${target}`)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowLeft' && canPrev) { e.preventDefault(); goToDay(displayDayNumber - 1) }
      else if (e.key === 'ArrowRight' && canNext) { e.preventDefault(); goToDay(displayDayNumber + 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPrev, canNext, displayDayNumber, visibleMaxDay])

  // Find existing entry for this specific card
  const existingEntry = displayCard
    ? journalEntries.find(e => e.cardId === displayCard.id)
    : undefined

  const [journalText, setJournalText] = useState('')
  const [isEditingReflection, setIsEditingReflection] = useState(false)

  // Sync textarea when card changes or an entry is found
  useEffect(() => {
    setJournalText(existingEntry?.content ?? '')
  }, [existingEntry?.content])

  // Reset edit mode when navigating to a different card
  useEffect(() => {
    setIsEditingReflection(false)
  }, [displayCard?.id])

  // 'open' = full widget, 'minimized' = pill button at top
  const [checkInState, setCheckInState] = useState<'open' | 'minimized'>(
    !checkInToday && !isHistoricalView ? 'open' : 'minimized'
  )
  const [savedMood, setSavedMood] = useState<string | null>(checkInToday || null)

  const moodMeta: Record<string, { emoji: string; label: string }> = {
    aligned:      { emoji: '🌿', label: 'Aligned' },
    clear:        { emoji: '✨', label: 'Clear' },
    drained:      { emoji: '🌑', label: 'Drained' },
    overwhelmed:  { emoji: '🌊', label: 'Overwhelmed' },
    disconnected: { emoji: '🪨', label: 'Disconnected' },
  }

  // Locked — cards don't open for Path A users until program Day 6.
  if (cardsAccess.state === 'locked-not-yet') {
    const daysLeft = (cardsAccess.unlocksOnDay ?? 6) - dayNumber
    return (
      <div style={{ padding: '60px 20px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <p style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
          margin: '0 0 10px',
          fontWeight: 500,
        }}>
          Daily Alignment unlocks on Day {cardsAccess.unlocksOnDay}
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 32,
          fontWeight: 300,
          color: 'var(--ink)',
          margin: '0 0 14px',
          lineHeight: 1.15,
        }}>
          Stay with the program for now.
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-soft)', margin: '0 0 28px', lineHeight: 1.7 }}>
          You&apos;re {daysLeft === 1 ? 'one day' : `${daysLeft} days`} away. Seal the Leak starts with focus, not breadth. Your first two Alignment cards will open on Days 6 and 7 as a taste of what the 365 rhythm feels like.
        </p>
        <Link
          href="/program"
          style={{
            display: 'inline-block',
            padding: '11px 22px',
            background: '#3D3080',
            color: 'white',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            fontFamily: 'var(--font-body)',
          }}
        >
          Go to today&apos;s Seal the Leak session →
        </Link>
      </div>
    )
  }

  if (!displayCard) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
          No card available for Day {displayDayNumber}.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => goToDay(displayDayNumber - 1)}
            disabled={!canPrev}
            style={{
              padding: '8px 14px',
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              color: canPrev ? 'var(--text-soft)' : 'var(--text-muted)',
              cursor: canPrev ? 'pointer' : 'not-allowed',
              opacity: canPrev ? 1 : 0.4,
            }}
          >
            ◀ Day {Math.max(1, displayDayNumber - 1)}
          </button>
          <button
            onClick={() => router.push('/card')}
            style={{
              padding: '8px 14px',
              background: 'var(--green)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
            }}
          >
            Back to today
          </button>
          <button
            onClick={() => goToDay(displayDayNumber + 1)}
            disabled={!canNext}
            style={{
              padding: '8px 14px',
              background: 'white',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              color: canNext ? 'var(--text-soft)' : 'var(--text-muted)',
              cursor: canNext ? 'pointer' : 'not-allowed',
              opacity: canNext ? 1 : 0.4,
            }}
          >
            Day {Math.min(visibleMaxDay, displayDayNumber + 1)} ▶
          </button>
        </div>
      </div>
    )
  }

  const card = displayCard

  // Next 3 locked cards after dayNumber
  const upcomingCards = cards
    .filter(c => c.dayNumber > dayNumber)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .slice(0, 3)

  const progressPercent = dayNumber / 365
  const circumference = 2 * Math.PI * 42 // r=42 → 263.89

  return (
    <>
      {/* Upgrade prompt — Path A users past the 7-day program */}
      {cardsAccess.state === 'locked-upgrade' && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(184,146,42,0.08) 0%, rgba(184,146,42,0.04) 100%)',
          border: '1px solid rgba(184,146,42,0.35)',
          borderLeft: '3px solid #b8922a',
          borderRadius: 10,
          padding: '14px 20px',
          marginBottom: 20,
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
              You&apos;ve seen the first two Alignment cards. The rest — 363 more — live inside 365 Days and Private Coaching.
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

      <div className="two-col-grid" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

      {/* ── LEFT COLUMN ─ sticky card visual ── */}
      <div
        className="card-left-col"
        style={{
          width: '380px',
          flexShrink: 0,
          position: 'sticky',
          top: '92px',
        }}
      >
        {/* Card visual */}
        <div
          style={{
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            aspectRatio: '3 / 4',
            background: `linear-gradient(135deg, ${card.cardColor} 0%, ${card.cardColor}cc 100%)`,
          }}
        >
          {/* Card image */}
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt={card.title}
              fill
              unoptimized
              style={{ objectFit: 'cover' }}
            />
          ) : (
            /* Centered emoji */
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '80px', lineHeight: 1 }}>{card.emoji}</span>
            </div>
          )}

          {/* Gradient overlay — visual depth only, no text */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
            }}
          />
        </div>

        {/* Card metadata — below the visual */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '12px',
          paddingLeft: '4px',
          paddingRight: '4px',
        }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            {user.selectedPath === 'A' ? 'Path A' : 'Path B'} · Day {displayDayNumber}
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: '13px',
            color: 'var(--text-soft)',
          }}>
            {card.theme}
          </span>
        </div>

        {/* Day nav — prev / next */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '10px',
          padding: '8px 6px',
          borderTop: '1px solid var(--line)',
          gap: '8px',
        }}>
          <button
            onClick={() => goToDay(displayDayNumber - 1)}
            disabled={!canPrev}
            aria-label="Previous day"
            title="Previous day (←)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-body)',
              color: canPrev ? 'var(--text-soft)' : 'var(--text-muted)',
              cursor: canPrev ? 'pointer' : 'not-allowed',
              opacity: canPrev ? 1 : 0.4,
              transition: 'border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => { if (canPrev) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--green)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)' }}
          >
            <span style={{ fontSize: '12px' }}>◀</span>
            Day {Math.max(1, displayDayNumber - 1)}
          </button>
          <span style={{
            fontSize: '10px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            {displayDayNumber} / {visibleMaxDay}
          </span>
          <button
            onClick={() => goToDay(displayDayNumber + 1)}
            disabled={!canNext}
            aria-label="Next day"
            title="Next day (→)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: 'var(--font-body)',
              color: canNext ? 'var(--text-soft)' : 'var(--text-muted)',
              cursor: canNext ? 'pointer' : 'not-allowed',
              opacity: canNext ? 1 : 0.4,
              transition: 'border-color 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={(e) => { if (canNext) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--green)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)' }}
          >
            Day {Math.min(visibleMaxDay, displayDayNumber + 1)}
            <span style={{ fontSize: '12px' }}>▶</span>
          </button>
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Optional daily check-in widget */}
        {checkInState === 'open' && (
          <DailyCheckIn
            compact
            onComplete={(mood) => {
              if (mood) { setCheckIn(mood); setSavedMood(mood) }
              setCheckInState('minimized')
            }}
            onDismiss={() => setCheckInState('minimized')}
          />
        )}

        {/* Minimized check-in pill — inline at top of right column */}
        {checkInState === 'minimized' && (() => {
          const confirmed = savedMood ? moodMeta[savedMood] : null
          return (
            <button
              onClick={() => setCheckInState('open')}
              style={{
                alignSelf: 'flex-start',
                padding: '7px 14px',
                background: confirmed ? 'var(--paper2)' : 'var(--paper)',
                border: confirmed ? '1px solid var(--green)' : '1px solid var(--gold)',
                borderRadius: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                color: confirmed ? 'var(--green)' : 'var(--gold)',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = confirmed ? '#edf6ef' : 'var(--gold-pale)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = confirmed ? 'var(--paper2)' : 'var(--paper)' }}
            >
              {confirmed ? (
                <>
                  <span style={{ fontSize: '13px' }}>{confirmed.emoji}</span>
                  {confirmed.label} — confirmed
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>✓</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '13px' }}>✦</span>
                  Daily Check-In
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>+</span>
                </>
              )}
            </button>
          )
        })()}

        {/* Historical view banner */}
        {isHistoricalView && (
          <div style={{
            background: 'var(--paper2)',
            border: '1px solid var(--line)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--text-soft)', fontFamily: 'var(--font-body)' }}>
              Viewing Day {displayDayNumber} — {card.theme}
            </span>
            <Link href="/past" style={{ fontSize: '12px', color: 'var(--gold)', textDecoration: 'none', fontFamily: 'var(--font-body)' }}>
              ← Back to The Becoming
            </Link>
          </div>
        )}

        {/* Section 1 — Header */}
        <div>
          {(() => {
            const pillStyle = getCardPillStyle(card.cardColor)
            return (
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                backgroundColor: pillStyle.bg,
                color: pillStyle.color,
                border: `1px solid ${pillStyle.border}`,
              }}>
                {isHistoricalView ? 'Past Reflection' : 'Today\'s Reflection'}
              </div>
            )
          })()}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: '38px',
              lineHeight: 1.15,
              color: 'var(--ink)',
              margin: '12px 0 0 0',
            }}
          >
            {card.title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: 'var(--text-soft)',
              lineHeight: 1.85,
              fontWeight: 300,
              margin: '16px 0 0 0',
            }}
          >
            {card.bodyText}
          </p>
        </div>

        {/* Section 2 — Affirmation */}
        <div
          style={{
            backgroundColor: 'var(--paper2)',
            borderRadius: '10px 10px 10px 3px',
            padding: '20px',
            borderLeft: '2px solid var(--gold)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                backgroundColor: 'var(--green)',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'var(--green)',
              }}
            >
              Daily Affirmation
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: 300,
              color: 'var(--ink)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {card.affirmation}
          </p>
        </div>

        {/* Section 3 — Journal */}
        <div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: 'var(--text-muted)',
              margin: '0 0 12px 0',
            }}
          >
            Your Reflection
          </p>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'rgba(var(--ink-rgb, 30,30,30), 0.7)',
              lineHeight: 1.65,
              margin: '0 0 20px 0',
            }}
          >
            {card.journalPrompt}
          </p>

          <textarea
            value={journalText}
            onChange={isEditingReflection || !existingEntry ? (e) => setJournalText(e.target.value) : undefined}
            readOnly={!!existingEntry && !isEditingReflection}
            placeholder="Begin your reflection here..."
            style={{
              width: '100%',
              minHeight: '140px',
              border: existingEntry && !isEditingReflection ? '1px solid var(--line)' : '1px solid var(--line-md)',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: existingEntry && !isEditingReflection ? 'var(--paper2)' : 'var(--paper)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              color: existingEntry && !isEditingReflection ? 'var(--text-soft)' : 'var(--ink)',
              cursor: existingEntry && !isEditingReflection ? 'default' : 'text',
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              lineHeight: 1.6,
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => {
              if (!existingEntry || isEditingReflection) {
                e.currentTarget.style.borderColor = 'var(--green)'
              }
            }}
            onBlur={e => {
              if (!existingEntry || isEditingReflection) {
                e.currentTarget.style.borderColor = 'var(--line-md)'
              }
            }}
          />

          {/* Action row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {!existingEntry ? (
                // State 1: No entry yet — show "Complete Reflection →"
                <button
                  onClick={() => {
                    if (!journalText.trim() || !displayCard) return
                    addJournalEntry({
                      userId: user.id,
                      cardId: displayCard.id,
                      dayNumber: displayDayNumber,
                      content: journalText,
                    })
                  }}
                  disabled={!journalText.trim()}
                  style={{
                    padding: '9px 20px',
                    background: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    cursor: journalText.trim() ? 'pointer' : 'not-allowed',
                    opacity: !journalText.trim() ? 0.5 : 1,
                  }}
                >
                  Complete Reflection →
                </button>
              ) : !isEditingReflection ? (
                // State 2: Entry exists, NOT editing — show "Edit Reflection"
                <button
                  onClick={() => setIsEditingReflection(true)}
                  style={{
                    padding: '9px 20px',
                    background: 'white',
                    color: 'var(--green)',
                    border: '1px solid var(--green)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Edit Reflection
                </button>
              ) : (
                // State 3: Entry exists, IS editing — show "Save Changes" + "Cancel"
                <>
                  <button
                    onClick={() => {
                      if (!journalText.trim()) return
                      updateJournalEntry(existingEntry.id, journalText)
                      setIsEditingReflection(false)
                    }}
                    disabled={!journalText.trim()}
                    style={{
                      padding: '9px 20px',
                      background: 'var(--green)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      cursor: journalText.trim() ? 'pointer' : 'not-allowed',
                      opacity: !journalText.trim() ? 0.5 : 1,
                    }}
                  >
                    Save Changes →
                  </button>
                  <button
                    onClick={() => {
                      setJournalText(existingEntry.content)
                      setIsEditingReflection(false)
                    }}
                    style={{
                      padding: '9px 16px',
                      border: '1px solid var(--line-md)',
                      background: 'white',
                      color: 'var(--text-soft)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'var(--font-body)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}

              {/* Share button — keep as is */}
              <button
                style={{
                  padding: '9px 16px',
                  border: '1px solid var(--line-md)',
                  background: 'white',
                  color: 'var(--text-soft)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                }}
              >
                Share
              </button>
            </div>

            {/* Right side: completed indicator if entry exists */}
            {existingEntry && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-body)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                Reflection saved
              </div>
            )}
          </div>
        </div>

        {/* Section 4 — Progress arc */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            paddingTop: '20px',
            paddingBottom: '20px',
            borderTop: '1px solid var(--line)',
          }}
        >
          <svg width={100} height={100}>
            {/* Track */}
            <circle
              cx={50}
              cy={50}
              r={42}
              stroke="var(--line)"
              strokeWidth={6}
              fill="none"
            />
            {/* Progress */}
            <circle
              cx={50}
              cy={50}
              r={42}
              stroke="var(--green)"
              strokeWidth={6}
              fill="none"
              strokeDasharray="263.89"
              strokeDashoffset={263.89 * (1 - progressPercent)}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
            {/* Center label */}
            <text
              x={50}
              y={50}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '18px',
                fill: 'var(--green)',
              }}
            >
              {dayNumber}
            </text>
          </svg>

          <div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                color: 'var(--ink)',
                fontWeight: 500,
                margin: 0,
              }}
            >
              {Math.round(progressPercent * 100)}% complete
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                margin: '4px 0 0 0',
              }}
            >
              2 days remaining in this theme
            </p>
          </div>
        </div>

        {/* Section 5 — Locked upcoming cards */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
          <EyebrowLabel color="muted">Coming Next</EyebrowLabel>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            {upcomingCards.map(upCard => (
              <div
                key={upCard.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  border: '1.5px dashed var(--line-md)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                }}
              >
                {/* Lock icon */}
                <span style={{ fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>🔒</span>

                {/* Middle */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      margin: '0 0 2px 0',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Day {upCard.dayNumber}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '14px',
                      color: 'var(--text-soft)',
                      margin: 0,
                    }}
                  >
                    Day {upCard.dayNumber} · {upCard.theme}
                  </p>
                </div>

                {/* Right */}
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {getLockedLabel(upCard.dayNumber, dayNumber)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
    </>
  )
}

export default function CardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <CardPageInner />
    </Suspense>
  )
}
