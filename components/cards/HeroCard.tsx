import Link from 'next/link'
import Image from 'next/image'
import { DailyCard } from '@/types'

interface HeroCardProps {
  card: DailyCard
  dayNumber: number
}

export default function HeroCard({ card, dayNumber }: HeroCardProps) {
  return (
    <Link href="/card" style={{ display: 'block' }}>
      <div
        style={{
          width: '100%',
          borderRadius: '12px',
          minHeight: '340px',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          background: `linear-gradient(135deg, ${card.cardColor} 0%, ${lighten(card.cardColor)} 100%)`,
        }}
      >
        {/* Card image */}
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
              fontSize: '72px',
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
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
        />

        {/* Bottom content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '24px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: labels + title */}
          <div>
            {/* Gold pill */}
            <div
              style={{
                display: 'inline-block',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '4px 10px',
                backgroundColor: 'rgba(184,146,42,0.20)',
                border: '1px solid rgba(184,146,42,0.40)',
                color: 'var(--gold-dim)',
                borderRadius: '999px',
                marginBottom: '8px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Today&apos;s Focus
            </div>

            {/* Title */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: '24px',
                fontWeight: 300,
                color: '#ffffff',
                lineHeight: 1.25,
              }}
            >
              {card.title}
            </div>

            {/* Day + theme */}
            <div
              style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.50)',
                marginTop: '4px',
                fontFamily: 'var(--font-body)',
              }}
            >
              Day {dayNumber} · {card.theme}
            </div>
          </div>

          {/* Right: CTA button */}
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.30)',
              color: '#ffffff',
              fontSize: '11px',
              padding: '8px 14px',
              borderRadius: '6px',
              fontFamily: 'var(--font-body)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.10)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
            }}
          >
            Read Full Insight →
          </div>
        </div>
      </div>
    </Link>
  )
}

/** Slightly lighten a hex color for the gradient endpoint */
function lighten(hex: string): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = Math.min(255, parseInt(clean.slice(0, 2), 16) + 30)
  const g = Math.min(255, parseInt(clean.slice(2, 4), 16) + 30)
  const b = Math.min(255, parseInt(clean.slice(4, 6), 16) + 30)
  return `rgb(${r},${g},${b})`
}
