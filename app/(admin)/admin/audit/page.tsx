'use client'

// app/(admin)/admin/audit/page.tsx
// Read-only audit log viewer. Empty until migration 015 is applied AND
// admin call sites start invoking logAdminAction(). Both are intentionally
// non-blocking — the table can lag behind without breaking anything.

import { useEffect, useState } from 'react'
import { fetchRecentAuditLog, type AuditLogEntry } from '@/lib/admin/hooks'

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentAuditLog(200)
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>Audit log</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Most recent {entries.length} admin actions.
        </p>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
      ) : entries.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: 14, padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>·</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No audit entries yet</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.6 }}>
            This page populates once migration <code>015_admin_audit_log.sql</code> is applied
            <br />and admin actions start invoking <code>logAdminAction()</code>.
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {entries.map((e, i) => (
            <div
              key={e.id}
              style={{
                display: 'flex', gap: 12, padding: '10px 14px',
                borderBottom: i === entries.length - 1 ? 'none' : '1px solid var(--line)',
                fontSize: 12,
              }}
            >
              <div style={{ flex: '0 0 130px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {new Date(e.created_at).toLocaleString()}
              </div>
              <div style={{ flex: '0 0 160px', color: 'var(--ink)', fontWeight: 600 }}>{e.action}</div>
              <div style={{ flex: '0 0 180px', color: 'var(--text-muted)' }}>
                {e.resource_type}
                {e.resource_id && <> · <code style={{ fontSize: 10 }}>{e.resource_id.slice(0, 8)}…</code></>}
              </div>
              <div style={{ flex: 1, color: 'var(--text-muted)' }}>
                {e.actor_email ?? e.actor_id ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
