'use client'

import React from 'react'
import { PATHS, PATH_ORDER } from '@/data/paths'

type Row = {
  label: string
  values: Record<string, string | boolean>
  section?: string
}

const ROWS: Row[] = [
  { label: 'Price',                      section: 'Pricing', values: { B: '$9/mo or $67/yr', A: '$37 one-time', C: '$497 or $197×3' } },
  { label: 'Daily archetype prompts',    section: 'Features', values: { B: true,  A: true,  C: true  } },
  { label: 'Journal + win tracker',      values: { B: true,  A: false, C: false } },
  { label: 'Monthly theme focus',        values: { B: true,  A: false, C: false } },
  { label: '7-day reset program',        values: { B: false, A: true,  C: false } },
  { label: '365 app access',             values: { B: true,  A: '30-day trial', C: false } },
  { label: 'Action + shift steps',       values: { B: false, A: true,  C: true  } },
  { label: 'Identity-level shift work',  section: 'Coaching', values: { B: false, A: false, C: true  } },
  { label: 'Direct access to Nicole',    values: { B: false, A: false, C: true  } },
  { label: 'Group coaching',             values: { B: false, A: false, C: true  } },
  { label: '1:1 intensive option',       values: { B: false, A: false, C: true  } },
]

const ACCENTS: Record<string, string> = {
  B: PATHS.B.accent,
  A: PATHS.A.accent,
  C: PATHS.C.accent,
}

function Cell({ value, accent }: { value: string | boolean; accent: string }) {
  if (value === true) {
    return (
      <span style={{ color: accent, fontWeight: 700, fontSize: '16px' }}>✓</span>
    )
  }
  if (value === false) {
    return (
      <span style={{ color: 'rgba(12,12,10,0.2)', fontSize: '14px' }}>—</span>
    )
  }
  return (
    <span style={{
      fontSize: '12px',
      color: accent,
      fontFamily: 'var(--font-body)',
      fontWeight: 500,
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
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          margin: '0 0 10px',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
        }}>
          Side by side
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '28px',
          fontWeight: 300,
          color: 'var(--ink)',
          margin: 0,
        }}>
          Compare all paths
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
        }}>
          {/* Column headers */}
          <thead>
            <tr>
              <th style={{ width: '36%', padding: '0 16px 20px 0', textAlign: 'left' }} />
              {PATH_ORDER.map((id) => {
                const p = PATHS[id]
                return (
                  <th key={id} style={{
                    width: '21%',
                    padding: '0 8px 20px',
                    textAlign: 'center',
                    verticalAlign: 'bottom',
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
                        fontWeight: 600,
                        color: p.accent,
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.shortTitle}
                      </span>
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
                          padding: i === 0 ? '0 0 8px' : '20px 0 8px',
                          fontSize: '10px',
                          letterSpacing: '1.5px',
                          textTransform: 'uppercase',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          fontFamily: 'var(--font-body)',
                        }}
                      >
                        {row.section}
                      </td>
                    </tr>
                  )}
                  <tr
                    style={{
                      borderTop: '1px solid rgba(12,12,10,0.07)',
                      backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(12,12,10,0.015)',
                    }}
                  >
                    <td style={{
                      padding: '14px 16px 14px 0',
                      fontSize: '13px',
                      color: 'var(--text-soft)',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.4,
                    }}>
                      {row.label}
                    </td>
                    {PATH_ORDER.map((id) => (
                      <td key={id} style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <Cell value={row.values[id]} accent={ACCENTS[id]} />
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              )
            })}
          </tbody>

          {/* CTA row */}
          <tfoot>
            <tr style={{ borderTop: '2px solid rgba(12,12,10,0.1)' }}>
              <td style={{ padding: '20px 16px 0 0' }} />
              {PATH_ORDER.map((id) => {
                const p = PATHS[id]
                return (
                  <td key={id} style={{ padding: '20px 8px 0', textAlign: 'center' }}>
                    <a
                      href={p.ctaHref}
                      target={p.billing !== 'call' ? '_blank' : undefined}
                      rel={p.billing !== 'call' ? 'noopener noreferrer' : undefined}
                      style={{
                        display: 'inline-block',
                        padding: '10px 14px',
                        backgroundColor: p.accent,
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.ctaLabel}
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
