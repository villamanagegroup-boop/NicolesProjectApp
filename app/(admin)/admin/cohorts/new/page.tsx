// app/(admin)/admin/cohorts/new/page.tsx
// Create a new cohort.

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createCohort } from '@/lib/admin/hooks'

const card = { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '14px', padding: '24px', maxWidth: 560 }
const label: React.CSSProperties = { fontSize: '10px', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }
const input: React.CSSProperties = { width: '100%', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '8px', color: 'var(--ink)', fontSize: '13px', padding: '10px 12px', outline: 'none', fontFamily: 'inherit', marginBottom: '14px' }
const btn: React.CSSProperties = { fontSize: '13px', fontWeight: 600, padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', border: 'none', background: 'var(--green)', color: '#fff' }

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
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/cohorts" style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Back to cohorts
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '6px 0 4px' }}>New cohort</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          Sets the 90-day window. Weekly content can be seeded later.
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
