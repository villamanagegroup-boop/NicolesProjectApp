'use client'

// app/(admin)/admin/palette-preview/page.tsx
// Side-by-side mockup of the current vs. proposed Pan-African palette so
// the team can flip between them on real-looking content before committing
// to a refactor. Self-contained — uses inline styles only, no global CSS
// changes anywhere else.

import { useState } from 'react'

interface Palette {
  name: string
  // Surfaces
  bg: string
  card: string
  ink: string
  textSoft: string
  textMuted: string
  line: string
  // Accents
  gold: string
  goldPale: string
  red: string
  // Path colors
  seal: string         // Path A
  sealPale: string
  cards: string        // Path B
  cardsPale: string
  circle: string       // Path C
  circlePale: string
}

const CURRENT: Palette = {
  name: 'Current',
  bg:        '#fdfcfa',
  card:      '#ffffff',
  ink:       '#0c0c0a',
  textSoft:  '#3a3a35',
  textMuted: '#8a857a',
  line:      'rgba(12,12,10,0.08)',
  gold:      '#b8922a',
  goldPale:  'rgba(184,146,42,0.10)',
  red:       '#B23C3C',
  seal:      '#3D3080',
  sealPale:  'rgba(61,48,128,0.10)',
  cards:     '#1A5230',
  cardsPale: 'rgba(26,82,48,0.10)',
  circle:    '#C97D3A',
  circlePale:'rgba(201,125,58,0.10)',
}

const PROPOSED: Palette = {
  name: 'Pan-African',
  bg:        '#fafaf7',         // near-white, faint warm cast (not beige)
  card:      '#ffffff',
  ink:       '#0c0c0a',         // unchanged
  textSoft:  '#2f2f2c',
  textMuted: '#7a766f',
  line:      'rgba(12,12,10,0.10)',
  gold:      '#C8941F',         // richer, more sacred
  goldPale:  'rgba(200,148,31,0.12)',
  red:       '#8B2A2A',         // deep blood-red
  seal:      '#8B2A2A',         // ← was purple, now red (urgency / sealing)
  sealPale:  'rgba(139,42,42,0.10)',
  cards:     '#0F4D2E',         // deeper green (was already green)
  cardsPale: 'rgba(15,77,46,0.10)',
  circle:    '#B8862E',         // sacred gold (was orange)
  circlePale:'rgba(184,134,46,0.10)',
}

export default function PalettePreviewPage() {
  const [mode, setMode] = useState<'current' | 'proposed'>('proposed')
  const p = mode === 'current' ? CURRENT : PROPOSED

  return (
    <div style={{ color: 'var(--ink)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 22, flexWrap: 'wrap', gap: 14,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Palette preview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Same content, swap the palette. Pick the one that lands.
          </p>
        </div>
        <div style={{ display: 'inline-flex', background: 'var(--paper)', borderRadius: 999, padding: 4, border: '1px solid var(--line)' }}>
          {(['current', 'proposed'] as const).map(opt => {
            const on = mode === opt
            return (
              <button
                key={opt}
                onClick={() => setMode(opt)}
                style={{
                  padding: '8px 16px', borderRadius: 999,
                  border: 'none', cursor: 'pointer',
                  background: on ? '#fff' : 'transparent',
                  color: on ? 'var(--ink)' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {opt === 'proposed' ? '🇪🇹 Pan-African' : 'Current'}
              </button>
            )
          })}
        </div>
      </header>

      <PreviewCanvas palette={p} />

      <Swatches palette={p} />
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// CANVAS — mocks the real app surfaces with the active palette
// ───────────────────────────────────────────────────────────────────────────

function PreviewCanvas({ palette: p }: { palette: Palette }) {
  return (
    <div style={{
      background: p.bg,
      border: `1px solid ${p.line}`,
      borderRadius: 14,
      padding: '28px 28px 36px',
      marginBottom: 28,
      fontFamily: 'var(--font-body)',
    }}>
      {/* Wordmark */}
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500,
        color: p.ink, marginBottom: 22, letterSpacing: '-0.01em',
      }}>
        <span style={{ color: p.gold }}>✦</span> The Energy Leader
      </div>

      {/* Hero card */}
      <div style={{
        background: p.card,
        border: `1px solid ${p.line}`,
        borderRadius: 14,
        padding: '26px 26px 22px',
        marginBottom: 22,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.gold, margin: '0 0 8px' }}>
          Today
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: p.ink, margin: '0 0 8px', lineHeight: 1.2 }}>
          Welcome back, Nicole.
        </h2>
        <p style={{ fontSize: 14, color: p.textSoft, margin: 0, lineHeight: 1.65, maxWidth: 540 }}>
          Day 3 of 7 · <em>The pattern doesn&apos;t need permission to soften.</em>
        </p>
      </div>

      {/* Archetype chip strip */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: p.textMuted, margin: '0 0 10px' }}>
          Archetypes
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: "Overthinker's Throne", color: p.seal,   bg: p.sealPale },
            { label: 'Open Door',            color: p.cards,  bg: p.cardsPale },
            { label: 'Interrupted Engine',   color: p.red,    bg: 'rgba(139,42,42,0.10)' },
            { label: 'Pushthrough',          color: p.gold,   bg: p.goldPale },
          ].map(c => (
            <span key={c.label} style={{
              fontSize: 11, fontWeight: 600,
              padding: '6px 14px', borderRadius: 999,
              background: c.bg, color: c.color,
              border: `1px solid ${c.color}40`,
              letterSpacing: '0.02em',
            }}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* 3-up path tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 22 }}>
        <PathTile palette={p} accent={p.cards}  pale={p.cardsPale}  eyebrow="Daily Practice"     title="365 Days of Alignment" price="$9 / mo" cta="Subscribe" />
        <PathTile palette={p} accent={p.seal}   pale={p.sealPale}   eyebrow="7-Day Reset"        title="Seal the Leak"          price="$37"      cta="Buy Now" />
        <PathTile palette={p} accent={p.circle} pale={p.circlePale} eyebrow="12-Week Intensive"  title="The Circle"             price="$497"     cta="Join" />
      </div>

      {/* Buttons + state */}
      <div style={{
        background: p.card, border: `1px solid ${p.line}`, borderRadius: 12,
        padding: '16px 18px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <button style={{
          background: p.gold, color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Primary action →
        </button>
        <button style={{
          background: 'transparent', color: p.gold, border: `1px solid ${p.gold}60`,
          padding: '10px 20px', borderRadius: 8,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Secondary
        </button>
        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,77,46,0.10)', color: p.cards, border: `1px solid ${p.cards}30`, fontWeight: 600 }}>
          ✓ Active
        </span>
        <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'rgba(139,42,42,0.08)', color: p.red, border: `1px solid ${p.red}40`, fontWeight: 600 }}>
          ! Needs attention
        </span>
      </div>
    </div>
  )
}

function PathTile({ palette: p, accent, pale, eyebrow, title, price, cta }: {
  palette: Palette
  accent: string
  pale: string
  eyebrow: string
  title: string
  price: string
  cta: string
}) {
  return (
    <div style={{
      background: p.card,
      border: `1.5px solid ${accent}30`,
      borderRadius: 12,
      padding: '20px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: accent, margin: 0 }}>
        {eyebrow}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, color: p.ink, margin: 0, lineHeight: 1.2 }}>
        {title}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: accent, margin: 0 }}>
        {price}
      </p>
      <button style={{
        background: accent, color: '#fff', border: 'none',
        padding: '9px 14px', borderRadius: 8,
        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        marginTop: 4,
      }}>
        {cta} →
      </button>
      <button style={{
        background: 'transparent', color: accent, border: `1px solid ${accent}`,
        padding: '8px 14px', borderRadius: 8,
        fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Preview first
      </button>
      <span style={{ display: 'none' }}>{pale}</span>
    </div>
  )
}

// ───────────────────────────────────────────────────────────────────────────
// SWATCHES — the actual hex codes in case the team wants to lift them
// ───────────────────────────────────────────────────────────────────────────

function Swatches({ palette: p }: { palette: Palette }) {
  const rows: { label: string; value: string }[] = [
    { label: 'Background',         value: p.bg },
    { label: 'Card',               value: p.card },
    { label: 'Ink (text)',         value: p.ink },
    { label: 'Text soft',          value: p.textSoft },
    { label: 'Text muted',         value: p.textMuted },
    { label: 'Gold accent',        value: p.gold },
    { label: 'Red',                value: p.red },
    { label: 'Seal (Path A)',      value: p.seal },
    { label: 'Cards (Path B)',     value: p.cards },
    { label: 'Circle (Path C)',    value: p.circle },
  ]

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
      padding: '18px 22px',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>
        Hex codes
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: r.value, border: '1px solid rgba(12,12,10,0.10)', flexShrink: 0,
            }} />
            <span style={{ flex: 1, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{r.label}</span>
            <code style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {r.value}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}
