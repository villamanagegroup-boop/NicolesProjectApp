// app/(admin)/admin/cohorts/new/page.tsx
// Create a new cohort.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCohort } from '@/lib/admin/hooks'

const card = { background: '#fff', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px', maxWidth: 560 }
const label: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, display: 'block' }
const input: React.CSSProperties = { width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--ink)', fontSize: 13, padding: '10px 12px', outline: 'none', fontFamily: 'inherit', marginBottom: 14 }
const btn: React.CSSProperties = { fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: 'var(--gold)', color: '#fff' }

export default function NewCohortPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [maxMembers, setMaxMembers] = useState(16)
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startsAt || !endsAt) return
    setSubmitting(true)
    setError(null)
    const { data, error } = await createCohort({
      name: name.trim(),
      starts_at: startsAt,
      ends_at: endsAt,
      max_members: maxMembers,
      is_active: isActive,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    // Land on the new cohort's detail page so the admin can keep configuring it.
    router.push(data?.id ? `/admin/cohorts/${data.id}` : '/admin/cohorts')
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/admin/cohorts" style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to cohorts
        </Link>
        <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '8px 0 8px' }}>
          New
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, color: 'var(--ink)', letterSpacing: '-0.015em', lineHeight: 1.1, margin: 0 }}>New cohort</h1>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.55, margin: '8px 0 0', maxWidth: 520 }}>
          Sets the 12-week window. Weekly content can be seeded later.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={card}>
        <label style={label}>Name</label>
        <input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cohort 2 — Summer 2026" required />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={label}>Starts</label>
            <input style={input} type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} required />
          </div>
          <div>
            <label style={label}>Ends</label>
            <input style={input} type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} required />
          </div>
        </div>

        <label style={label}>Max members</label>
        <input style={input} type="number" min={1} max={50} value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))} />

        <label style={{ ...label, display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'none', fontSize: '13px', fontWeight: 500, color: 'var(--ink)' }}>
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
          Active immediately (members can be enrolled and see this cohort)
        </label>

        {error && (
          <p style={{ fontSize: '12px', color: 'var(--red)', margin: '8px 0' }}>{error}</p>
        )}

        <button type="submit" disabled={submitting} style={{ ...btn, opacity: submitting ? 0.6 : 1, marginTop: '8px' }}>
          {submitting ? 'Creating…' : 'Create cohort'}
        </button>
      </form>
    </div>
  )
}
