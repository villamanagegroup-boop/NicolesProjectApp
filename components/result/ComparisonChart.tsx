'use client'

import React from 'react'
import { PATHS, PATH_ORDER } from '@/data/paths'

type Row = {
  label: string
  values: Record<string, string | boolean>
  section?: string
}

const ROWS: Row[] = [
  // Pricing
  { section: 'Pricing',           label: 'Price',                   values: { B: '$9/mo or $67/yr', A: '$37 once', C: '$497 or 3 × $197' } },
  {                               label: 'Billing',                 values: { B: 'Monthly or yearly', A: 'One-time', C: 'One-time or 3-pay' } },
  {                               label: 'Lifetime access',         values: { B: false,      A: true,       C: true } },
  {                               label: 'Cancel anytime',          values: { B: true,       A: 'N/A',      C: 'N/A' } },

  // Daily practice
  { section: 'Daily practice',    label: 'Daily card by archetype', values: { B: true,       A: '30 days after Day 7', C: true } },
  {                               label: 'Journal + win tracker',   values: { B: true,       A: '30 days after Day 7', C: true } },
  {                               label: 'Streaks + monthly themes',values: { B: true,       A: '30 days after Day 7', C: true } },
  {                               label: 'Card vault library',      values: { B: true,       A: '30 days after Day 7', C: true } },

  // 7-day reset
  { section: '7-day reset',       label: '7-day archetype reset',   values: { B: false,      A: true,       C: false } },
  {                               label: 'Prompt + action + seal',  values: { B: false,      A: 'Daily',    C: false } },
  {                               label: '4-phase shift framework', values: { B: false,      A: true,       C: false } },

  // Coaching & community
  { section: 'Coaching & community', label: '12-week guided program', values: { B: false, A: false, C: true } },
  {                               label: 'Direct access to Nicole', values: { B: false,      A: false,      C: true } },
  {                               label: 'Accountability partner',  values: { B: false,      A: false,      C: true } },
  {                               label: 'Live group calls',        values: { B: false,      A: false,      C: true } },
  {                               label: 'Cohort community feed',   values: { B: false,      A: false,      C: true } },
]

const ACCENTS: Record<string, string> = {
  B: PATHS.B.accent,
  A: PATHS.A.accent,
  C: PATHS.C.accent,
}

function Cell({ value, accent }: { value: string | boolean; accent: string }) {
  if (value === true) {
    return <span style={{ color: accent, fontWeight: 700, fontSize: '16px' }}>✓</span>
  }
  if (value === false) {
    return <span style={{ color: 'rgba(12,12,10,0.18)', fontSize: '14px' }}>—</span>
  }
  return (
    <span style={{
      fontSize: '11.5px',
      color: accent,
      fontFamily: 'var(--font-body)',
      fontWeight: 600,
      letterSpacing: '0.02em',
    }}>
      {value}
    </span>
  )
}

export default function ComparisonChart() {
  let lastSection = ''

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto', padding: '0 0 64px' }}>
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <p style={{
          fontSize: '10px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          margin: '0 0 10px',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
        }}>
          Side by side
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 300,
          color: 'var(--ink)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          Compare the three paths
        </h2>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid rgba(12,12,10,0.08)',
        borderRadius: '14px',
        padding: '8px 20px 20px',
        overflowX: 'auto',
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
        }}>
          {/* Column headers */}
          <thead>
            <tr>
              <th style={{ width: '36%', padding: '20px 16px 18px 0', textAlign: 'left' }} />
              {PATH_ORDER.map((id) => {
                const p = PATHS[id]
                const isFeatured = !!p.recommended
                return (
                  <th key={id} style={{
                    width: '21%',
                    padding: '20px 8px 18px',
                    textAlign: 'center',
                    verticalAlign: 'bottom',
                    background: isFeatured ? `${p.accent}08` : 'transparent',
                    borderRadius: isFeatured ? '8px 8px 0 0' : 0,
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{ fontSize: '20px' }}>{p.icon}</span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: p.accent,
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                      }}>
                        {p.shortTitle}
                      </span>
                      {isFeatured && (
                        <span style={{
                          fontSize: '8px',
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: p.accent,
                          background: `${p.accent}1a`,
                          padding: '3px 8px',
                          borderRadius: 999,
                        }}>
                          Most popular
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row, i) => {
              const showSection = row.section && row.section !== lastSection
              if (row.section) lastSection = row.section

              return (
                <React.Fragment key={row.label}>
                  {showSection && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: i === 0 ? '4px 0 10px' : '24px 0 10px',
                          fontSize: '10px',
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {row.section}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '1px solid rgba(12,12,10,0.06)' }}>
                    <td style={{
                      padding: '13px 16px 13px 0',
                      fontSize: '13px',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.4,
                    }}>
                      {row.label}
                    </td>
                    {PATH_ORDER.map((id) => {
                      const isFeatured = !!PATHS[id].recommended
                      return (
                        <td key={id} style={{
                          padding: '13px 8px',
                          textAlign: 'center',
                          background: isFeatured ? `${PATHS[id].accent}08` : 'transparent',
                        }}>
                          <Cell value={row.values[id]} accent={ACCENTS[id]} />
                        </td>
                      )
                    })}
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>

          {/* CTA row */}
          <tfoot>
            <tr style={{ borderTop: '2px solid rgba(12,12,10,0.1)' }}>
              <td style={{ padding: '22px 16px 8px 0' }} />
              {PATH_ORDER.map((id) => {
                const p = PATHS[id]
                const isFeatured = !!p.recommended
                return (
                  <td key={id} style={{
                    padding: '22px 8px 12px',
                    textAlign: 'center',
                    background: isFeatured ? `${p.accent}08` : 'transparent',
                    borderRadius: isFeatured ? '0 0 8px 8px' : 0,
                  }}>
                    <a
                      href={p.ctaHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '10px 16px',
                        backgroundColor: p.accent,
                        color: 'white',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {p.ctaLabel} →
                    </a>
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
