// app/(admin)/admin/cohorts/page.tsx
// Cohort list — clicking a row opens the detail/edit view.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAdminCohorts, type AdminCohortSummary } from '@/lib/admin/hooks'

const PHASE_COLORS: Record<string, string> = {
  root: 'var(--green)', rebuild: 'var(--gold)', rise: '#7A1F1F',
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminCohorts().then(c => { setCohorts(c); setLoading(false) })
  }, [])

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px' }}>
            Operations
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 }}>Cohorts</h1>
          <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 520 }}>
            {cohorts.length} cohort{cohorts.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <Link href="/admin/cohorts/new" style={{
          fontSize: 13, fontWeight: 600, padding: '8px 14px',
          borderRadius: 8, background: 'var(--gold)', color: '#fff',
          textDecoration: 'none',
        }}>
          + New cohort
        </Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</div>
      ) : cohorts.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: 10, padding: '32px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⬡</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
            No cohorts yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Click <strong>+ New cohort</strong> above to create your first one.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
          {cohorts.map(c => (
            <Link
              key={c.id}
              href={`/admin/cohorts/${c.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: '#fff', border: '1px solid var(--line)',
                borderRadius: 10, padding: '14px 16px 14px 18px',
                borderLeft: `3px solid ${PHASE_COLORS[c.phase]}`,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: PHASE_COLORS[c.phase] ?? 'var(--text-muted)', marginBottom: 3 }}>
                      {c.status}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>{c.name}</div>
                    {c.slug && (
                      <div style={{
                        display: 'inline-block', marginTop: 5, padding: '2px 7px',
                        borderRadius: 5, background: 'var(--paper)', border: '1px solid var(--line)',
                        fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-soft)',
                      }}>
                        ?cohort={c.slug}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(c.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {c.member_count}/{c.max_members} members · Week {c.current_week} · {c.phase_label}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
