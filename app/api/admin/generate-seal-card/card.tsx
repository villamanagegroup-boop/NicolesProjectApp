// app/api/admin/generate-seal-card/card.tsx
// Pure JSX builder for the graduation seal card. Lives in its own .tsx file
// so the route handler can stay a regular .ts file (Turbopack scans .tsx
// route entries differently and can wedge on a stale cache after renames).

import type { ReactElement } from 'react'

const FOREST = '#1B4332'
const GOLD   = '#C9A84C'
const CREAM  = '#f5f0e8'

export interface SealCardInput {
  fullName:       string
  archetypeLabel: string
  storyLine:      string
  cohortName:     string
  yearStr:        string
}

export function buildSealCard(input: SealCardInput): ReactElement {
  const { fullName, archetypeLabel, storyLine, cohortName, yearStr } = input
  return (
    <div
      style={{
        width: '1080px',
        height: '1080px',
        background: FOREST,
        color: CREAM,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'serif',
      }}
    >
      {/* Outer decorative ring */}
      <div
        style={{
          position: 'absolute',
          inset: 60,
          border: `2px solid ${GOLD}`,
          opacity: 0.6,
          borderRadius: '50%',
          display: 'flex',
        }}
      />
      {/* Inner decorative ring */}
      <div
        style={{
          position: 'absolute',
          inset: 96,
          border: `1px solid ${GOLD}`,
          opacity: 0.3,
          borderRadius: '50%',
          display: 'flex',
        }}
      />
      {/* 16 dot ornaments placed by polar coordinates. Satori doesn't
          support CSS conic gradients or transforms on container bgs,
          so we composite each dot explicitly. */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const r = 480
        const cx = 540
        const cy = 540
        const x = cx + Math.sin(angle) * r - 5
        const y = cy - Math.cos(angle) * r - 5
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: GOLD,
              opacity: 0.85,
              display: 'flex',
            }}
          />
        )
      })}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 140px',
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: 18,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: GOLD,
            fontWeight: 700,
            marginTop: 12,
          }}
        >
          THE ENERGY LEADER™
        </div>
        <div
          style={{
            width: 140,
            height: 1,
            background: GOLD,
            opacity: 0.8,
            margin: '18px 0 60px',
          }}
        />

        <div
          style={{
            fontSize: 88,
            color: GOLD,
            lineHeight: 1,
            marginBottom: 36,
            fontFamily: 'serif',
          }}
        >
          ◎
        </div>

        <div
          style={{
            fontSize: 76,
            fontWeight: 400,
            lineHeight: 1.05,
            color: CREAM,
            letterSpacing: '-0.01em',
            marginBottom: 18,
            textAlign: 'center',
          }}
        >
          {fullName}
        </div>
        <div
          style={{
            fontSize: 26,
            fontStyle: 'italic',
            color: GOLD,
            marginBottom: 60,
          }}
        >
          {archetypeLabel}
        </div>

        <div
          style={{
            fontSize: 26,
            lineHeight: 1.45,
            color: CREAM,
            maxWidth: 720,
            textAlign: 'center',
            fontStyle: 'italic',
            opacity: 0.92,
          }}
        >
          {storyLine}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 92,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          fontSize: 16,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: GOLD,
          fontWeight: 600,
        }}
      >
        THE CIRCLE · {cohortName.toUpperCase()} · {yearStr}
      </div>
    </div>
  )
}
