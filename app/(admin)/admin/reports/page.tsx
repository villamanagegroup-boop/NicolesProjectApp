'use client'

// app/(admin)/admin/reports/page.tsx
// Reports & exports — pull data out of the portal as CSV. Each report is
// computed client-side from the existing admin reads, so it respects RLS
// and matches what you see on screen.

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { fetchAllUsersAdmin, type AdminUserRow } from '@/lib/admin/hooks'

type ReportKey = 'all_users' | 'paid_users' | 'signup_velocity' | 'conversion_by_path' | 'all_journals' | 'all_wins'

function downloadCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  if (rows.length === 0) {
    alert('Nothing to export — the report came back empty.')
    return
  }
  const headers = Array.from(rows.reduce((set, r) => {
    Object.keys(r).forEach(k => set.add(k))
    return set
  }, new Set<string>()))
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function ReportsPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [busy, setBusy] = useState<ReportKey | null>(null)
  const [counts, setCounts] = useState({ users: 0, paid: 0 })

  useEffect(() => {
    fetchAllUsersAdmin().then(rows => {
      setUsers(rows)
      setCounts({ users: rows.length, paid: rows.filter(r => r.has_paid).length })
    })
  }, [])

  async function run(key: ReportKey) {
    setBusy(key)
    try {
      switch (key) {
        case 'all_users': {
          const rows = users.map(u => ({
            name: u.name, email: u.email,
            path: u.selected_path ?? '',
            quiz_result: u.quiz_result ?? '',
            has_paid: u.has_paid ? 'yes' : 'no',
            is_admin: u.is_admin ? 'yes' : 'no',
            signup_date: u.signup_date,
            last_active: u.last_active,
          }))
          downloadCsv(`all_users_${stamp()}.csv`, rows)
          break
        }
        case 'paid_users': {
          const rows = users
            .filter(u => u.has_paid)
            .map(u => ({
              name: u.name, email: u.email,
              path: u.selected_path ?? '',
              signup_date: u.signup_date,
            }))
          downloadCsv(`paid_users_${stamp()}.csv`, rows)
          break
        }
        case 'signup_velocity': {
          // Group by ISO week.
          const byWeek = new Map<string, { week: string; A: number; B: number; C: number; none: number; total: number }>()
          for (const u of users) {
            if (!u.signup_date) continue
            const wk = isoWeek(new Date(u.signup_date))
            if (!byWeek.has(wk)) byWeek.set(wk, { week: wk, A: 0, B: 0, C: 0, none: 0, total: 0 })
            const row = byWeek.get(wk)!
            if (u.selected_path === 'A')      row.A++
            else if (u.selected_path === 'B') row.B++
            else if (u.selected_path === 'C') row.C++
            else                              row.none++
            row.total++
          }
          const rows = Array.from(byWeek.values()).sort((a, b) => a.week.localeCompare(b.week))
          downloadCsv(`signup_velocity_${stamp()}.csv`, rows)
          break
        }
        case 'conversion_by_path': {
          const totals = { A: 0, B: 0, C: 0, none: 0 }
          const paid   = { A: 0, B: 0, C: 0, none: 0 }
          for (const u of users) {
            const k = (u.selected_path ?? 'none') as keyof typeof totals
            totals[k]++
            if (u.has_paid) paid[k]++
          }
          const rows = (['A', 'B', 'C', 'none'] as const).map(k => ({
            path: k,
            total_signups: totals[k],
            paid: paid[k],
            paid_pct: totals[k] > 0 ? ((paid[k] / totals[k]) * 100).toFixed(1) + '%' : '—',
          }))
          downloadCsv(`conversion_by_path_${stamp()}.csv`, rows)
          break
        }
        case 'all_journals': {
          const { data } = await supabaseClient
            .from('journal_entries')
            .select('id, user_id, day_number, content, created_at')
            .order('created_at', { ascending: false })
            .limit(5000)
          const userById = new Map(users.map(u => [u.id, u]))
          const rows = (data ?? []).map(j => {
            const u = userById.get(j.user_id as string)
            return {
              created_at: j.created_at,
              user_email: u?.email ?? '',
              user_name:  u?.name ?? '',
              path:       u?.selected_path ?? '',
              day_number: j.day_number ?? '',
              content:    j.content ?? '',
            }
          })
          downloadCsv(`journal_entries_${stamp()}.csv`, rows)
          break
        }
        case 'all_wins': {
          const { data } = await supabaseClient
            .from('wins')
            .select('id, user_id, category, title, description, created_at')
            .order('created_at', { ascending: false })
            .limit(5000)
          const userById = new Map(users.map(u => [u.id, u]))
          const rows = (data ?? []).map(w => {
            const u = userById.get(w.user_id as string)
            return {
              created_at: w.created_at,
              user_email: u?.email ?? '',
              user_name:  u?.name ?? '',
              category:   w.category,
              title:      w.title,
              description: w.description ?? '',
            }
          })
          downloadCsv(`wins_${stamp()}.csv`, rows)
          break
        }
      }
    } catch (err) {
      alert('Report failed. Check the console for details.')
      console.error(err)
    }
    setBusy(null)
  }

  const reports: { key: ReportKey; title: string; desc: string }[] = [
    { key: 'all_users',           title: 'All users',           desc: 'Every signed-up account: name, email, path, paid status, signup date.' },
    { key: 'paid_users',          title: 'Paid users only',     desc: 'Just the customers — no free accounts. Use for outreach lists.' },
    { key: 'conversion_by_path',  title: 'Conversion by path',  desc: 'Signups vs. paid for A / B / C / none. Quick health check.' },
    { key: 'signup_velocity',     title: 'Signup velocity',     desc: 'New accounts per ISO week, broken down by path.' },
    { key: 'all_journals',        title: 'All journal entries', desc: 'Up to 5,000 most recent journal entries with user + day. Honor privacy.' },
    { key: 'all_wins',            title: 'All wins',            desc: 'Up to 5,000 most recent wins. Useful for testimonial mining.' },
  ]

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Reports</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          {counts.users} users · {counts.paid} paid. Download as CSV — opens in Excel, Google Sheets, or Numbers.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        {reports.map(r => (
          <div key={r.key} style={{
            background: '#fff', border: '1px solid var(--line)', borderRadius: 12, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{r.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{r.desc}</div>
            <button
              onClick={() => run(r.key)}
              disabled={busy !== null}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: busy === r.key ? 'var(--line)' : 'var(--green)',
                color: '#fff',
                cursor: busy ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {busy === r.key ? 'Building…' : 'Download CSV ↓'}
            </button>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 18 }}>
        For per-user data, open the user&apos;s profile and use <strong>Export JSON</strong> at the top.
      </p>
    </div>
  )
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}
function isoWeek(d: Date): string {
  // Returns "YYYY-Www" — same week numbering as Mon-start ISO-8601
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}
