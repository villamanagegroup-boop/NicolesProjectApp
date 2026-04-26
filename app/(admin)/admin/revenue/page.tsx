// app/(admin)/admin/revenue/page.tsx
// Revenue + access + conversion tracker

'use client'

import { useEffect, useState } from 'react'
import { fetchAdminCohorts, fetchConversionData } from '@/lib/admin/hooks'

export default function RevenuePage() {
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([])
  const [conversion, setConversion] = useState({ total_members: 0, submitted_stories: 0, public_testimonials: 0 })

  useEffect(() => {
    fetchAdminCohorts().then(c => {
      setCohorts(c)
      if (c[0]) setCohortId(c[0].id)
    })
  }, [])

  useEffect(() => {
    if (!cohortId) return
    fetchConversionData(cohortId).then(setConversion)
  }, [cohortId])

  const S = {
    h1: { fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' },
    statCard: { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', padding: '18px' },
    statNum: { fontSize: '28px', fontWeight: 800, lineHeight: 1.1 },
    statLabel: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase' as const, letterSpacing: '.07em' },
    notice: { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', textAlign: 'center' as const, color: 'var(--text-muted)', fontSize: '13px' },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={S.h1}>Revenue + access</h1>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={{ background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--text-soft)', fontSize: '13px', padding: '7px 12px', cursor: 'pointer' }}>
          {cohorts.length === 0 && <option value="">No cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Program outcomes
      </div>
      <div style={S.grid}>
        {[
          { label: 'Total members',       value: conversion.total_members,       color: 'var(--green)' },
          { label: 'Stories submitted',   value: conversion.submitted_stories,   color: 'var(--gold)' },
          { label: 'Public testimonials', value: conversion.public_testimonials, color: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={{ ...S.statNum, color: s.color }}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Payment tracking
      </div>
      <div style={S.notice}>
        <div style={{ fontSize: '20px', marginBottom: '8px' }}>💳</div>
        <div style={{ fontWeight: 600, color: 'var(--text-soft)', marginBottom: '4px' }}>Connect Stripe to track revenue</div>
        <div>Wire your Stripe webhook to <code style={{ background: 'var(--line)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>/api/admin/stripe-webhook</code> to see revenue data here.</div>
      </div>
    </div>
  )
}
