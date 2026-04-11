'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useApp } from '@/context/AppContext'
import EyebrowLabel from '@/components/ui/EyebrowLabel'
import Button from '@/components/ui/Button'

const FILTERS = ['All', 'Alignment', 'Clarity', 'Strength', 'Purpose', 'Healing']

export default function PastPage() {
  const { pastCards } = useApp()
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredCards =
    activeFilter === 'All'
      ? pastCards
      : pastCards.filter((c) => c.theme === activeFilter)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <EyebrowLabel color="muted">Your Collective Wisdom</EyebrowLabel>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 300,
            color: 'var(--ink)',
            marginTop: '4px',
            marginBottom: '8px',
          }}
        >
          The Past
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-soft)', margin: 0, fontFamily: 'var(--font-body)' }}>
          Every card you've walked through, held here for reflection.
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              style={{
                backgroundColor: isActive ? 'var(--ink)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-soft)',
                border: isActive ? 'none' : '1px solid var(--line-md)',
                padding: '6px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--paper2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              {filter}
            </button>
          )
        })}
      </div>

      {/* Card grid */}
      {filteredCards.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '40px', paddingBottom: '40px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            No cards in this category yet.
          </p>
        </div>
      ) : (
        <div
          className="four-col-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}
        >
          {filteredCards.map((card) => (
            <Link key={card.id} href={"/card?day=" + card.dayNumber} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '3/4',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: card.cardColor,
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
                }}
              >
                {/* Image or emoji */}
                {card.imageUrl ? (
                  <Image
                    src={card.imageUrl}
                    alt={card.title}
                    fill
                    unoptimized
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '36px',
                    }}
                  >
                    {card.emoji}
                  </div>
                )}

                {/* Gradient overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 55%)',
                  }}
                />

                {/* Bottom content */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px' }}>
                  <p
                    style={{
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--gold)',
                      fontFamily: 'var(--font-body)',
                      margin: '0 0 4px 0',
                    }}
                  >
                    Day {card.dayNumber}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: '#ffffff',
                      margin: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {card.title}
                  </p>
                  <p
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.40)',
                      fontFamily: 'var(--font-body)',
                      margin: '2px 0 0 0',
                    }}
                  >
                    {card.theme}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: '40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            margin: 0,
          }}
        >
          You have unlocked {pastCards.length + 1} of 365 daily insights
        </p>
        <Link href="/vault" style={{ textDecoration: 'none' }}>
          <Button variant="outline" size="sm">
            Retrieve Older Memories ↻
          </Button>
        </Link>
      </div>
    </div>
  )
}
