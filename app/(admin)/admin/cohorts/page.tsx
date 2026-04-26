// app/(admin)/admin/cohorts/page.tsx
// Cohort list — read-only for now. Create/edit ships in a follow-up.

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchAdminCohorts, type AdminCohortSummary } from '@/lib/admin/hooks'

const PHASE_COLORS: Record<string, string> = {
  root: 'var(--green)', rebuild: 'var(--gold)', rise: '#3D3080',
}

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<AdminCohortSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminCohorts().then(c => { setCohorts(c); setLoading(false) })
  }, [])

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Cohorts</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {cohorts.length} cohort{cohorts.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <Link href="/admin/cohorts/new" style={{
          fontSize: '13px', fontWeight: 600, padding: '8px 16px',
          borderRadius: '8px', background: 'var(--green)', color: '#fff',
          textDecoration: 'none',
        }}>
          + New cohort
        </Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading…</div>
      ) : cohorts.length === 0 ? (
        <div style={{
          background: '#ffffff', border: '1px solid var(--line)',
          borderRadius: '14px', padding: '40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⬡</div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
            No cohorts yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Insert one via the Supabase SQL editor for now — the cohort builder UI lands next.
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
                background: '#ffffff', border: '1px solid var(--line)',
                borderRadius: '14px', padding: '18px',
                borderLeft: `3px solid ${PHASE_COLORS[c.phase]}`,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '3px' }}>
                      {c.status}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink)' }}>{c.name}</div>
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
