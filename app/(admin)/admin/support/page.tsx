'use client'

// app/(admin)/admin/support/page.tsx
// Bug-report triage queue. Reads public.support_messages (admin RLS) and lets
// the admin walk a report through open → in_progress → resolved.
//
// Each row also exposes a "Reply via coach chat" deep-link that jumps to the
// admin member profile for the reporter — so the admin can pull up the user's
// full context and respond on the existing 1:1 thread.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  fetchSupportMessages, updateSupportMessageStatus,
  type SupportMessage,
} from '@/lib/admin/hooks'
import { supabaseClient } from '@/lib/supabase/client'

type StatusFilter = 'open' | 'in_progress' | 'resolved' | 'all'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'open',         label: 'Open' },
  { id: 'in_progress',  label: 'In progress' },
  { id: 'resolved',     label: 'Resolved' },
  { id: 'all',          label: 'All' },
]

const STATUS_COLORS: Record<SupportMessage['status'], { bg: string; text: string; border: string; emoji: string }> = {
  open:        { bg: 'rgba(184,146,42,0.15)', text: 'var(--gold)',     border: 'rgba(184,146,42,0.3)', emoji: '🆕' },
  in_progress: { bg: 'rgba(61,48,128,0.12)',  text: '#3D3080',         border: 'rgba(61,48,128,0.3)',  emoji: '🛠' },
  resolved:    { bg: 'rgba(31,92,58,0.12)',   text: 'var(--green)',    border: 'rgba(31,92,58,0.25)',  emoji: '✓' },
}

export default function AdminSupportPage() {
  const [filter, setFilter] = useState<StatusFilter>('open')
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [memberLookup, setMemberLookup] = useState<Record<string, string | null>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    const rows = await fetchSupportMessages(filter === 'all' ? undefined : { status: filter })
    setMessages(rows)
    setLoading(false)

    // Look up circle_members ids for each unique user so we can deep-link to
    // /admin/members/[id]. Members live in cohorts; users without a member row
    // (e.g. solo cards-app users) won't have a profile to jump to.
    const userIds = Array.from(new Set(rows.map(r => r.user_id)))
    if (userIds.length > 0) {
      const { data: members } = await supabaseClient
        .from('circle_members')
        .select('id, user_id')
        .in('user_id', userIds)
      const lookup: Record<string, string | null> = {}
      for (const uid of userIds) lookup[uid] = null
      for (const m of (members ?? []) as { id: string; user_id: string }[]) {
        lookup[m.user_id] = m.id
      }
      setMemberLookup(lookup)
    }
  }

  useEffect(() => { refresh() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter])

  async function setStatus(id: string, status: SupportMessage['status']) {
    setBusyId(id)
    await updateSupportMessageStatus(id, status)
    await refresh()
    setBusyId(null)
  }

  const counts = messages.reduce(
    (acc, m) => { acc[m.status] = (acc[m.status] ?? 0) + 1; return acc },
    { open: 0, in_progress: 0, resolved: 0 } as Record<SupportMessage['status'], number>,
  )

  const S = {
    h1: { fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0 },
    sub: { fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' },
    tabRow: {
      display: 'flex', gap: 0,
      borderBottom: '1px solid var(--line)',
      marginBottom: 18,
      flexWrap: 'wrap' as const,
    },
    tab: (on: boolean) => ({
      padding: '10px 18px', fontSize: 13, fontWeight: on ? 600 : 500,
      color: on ? 'var(--gold)' : 'var(--text-muted)',
      background: 'none', border: 'none',
      borderBottom: on ? '2px solid var(--gold)' : '2px solid transparent',
      cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 8,
    }),
    badge: {
      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 999,
      background: 'var(--paper2)', color: 'var(--text-soft)',
      letterSpacing: '0.04em',
    },
    card: {
      background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
      padding: 14, marginBottom: 10,
    },
    statusPill: (s: SupportMessage['status']) => {
      const c = STATUS_COLORS[s]
      return {
        fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }
    },
    btn: (variant: 'primary' | 'ghost' | 'danger') => ({
      fontSize: 11, fontWeight: 600, padding: '5px 11px', borderRadius: 7,
      cursor: 'pointer', border: 'none', fontFamily: 'inherit',
      background: variant === 'primary' ? 'var(--gold)' : variant === 'danger' ? 'rgba(139,31,47,0.12)' : 'var(--line)',
      color: variant === 'primary' ? '#fff' : variant === 'danger' ? 'var(--red)' : 'var(--text-soft)',
    }),
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={S.h1}>Support — bug reports</h1>
          <p style={S.sub}>
            Submitted from the user-portal &ldquo;Report a bug&rdquo; button.
            {filter !== 'all' && filter !== 'resolved' && ` ${messages.length} ${filter === 'in_progress' ? 'in progress' : filter}.`}
          </p>
        </div>
        <button onClick={refresh} style={S.btn('ghost')}>Refresh</button>
      </div>

      <div style={S.tabRow}>
        {STATUS_TABS.map(t => {
          const on = filter === t.id
          // Counts are scoped to the current filter result, so for "all" we
          // don't double up — only show a count when it adds info.
          return (
            <button key={t.id} style={S.tab(on)} onClick={() => setFilter(t.id)}>
              {t.label}
              {on && filter !== 'all' && (
                <span style={S.badge}>{messages.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>Loading reports…</div>
      ) : messages.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
          textAlign: 'center', color: 'var(--text-muted)',
          fontSize: 13, padding: 40,
        }}>
          {filter === 'open' ? 'Inbox zero. Nothing open right now.' :
           filter === 'in_progress' ? 'Nothing in progress.' :
           filter === 'resolved' ? 'No resolved reports yet.' :
           'No reports yet.'}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {messages.map((msg, i) => {
            const memberId = memberLookup[msg.user_id] ?? null
            const isOpen = expanded === msg.id
            const reporterLabel = msg.user_name?.trim() || msg.user_email || msg.user_id.slice(0, 8) + '…'
            const time = new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const isHovered = hoverId === msg.id
            // Expanded uses a soft gold tint so it stands out from BOTH the
            // white card body and the page's --paper background. Hover is a
            // lighter version of the same accent.
            const rowBg = isOpen
              ? 'rgba(184,146,42,0.10)'
              : isHovered ? 'rgba(184,146,42,0.06)' : '#fff'
            return (
              <div
                key={msg.id}
                style={{
                  borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                  borderLeft: isOpen ? '3px solid var(--gold)' : '3px solid transparent',
                  background: rowBg,
                }}
              >
                {/* Single-line row — click anywhere to expand for full body + actions */}
                <div
                  onClick={() => setExpanded(isOpen ? null : msg.id)}
                  onMouseEnter={() => setHoverId(msg.id)}
                  onMouseLeave={() => setHoverId(prev => prev === msg.id ? null : prev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', cursor: 'pointer',
                    fontSize: 13,
                    flexWrap: 'wrap',
                  }}
                >
                  <span title={msg.status} style={{ fontSize: 14, flexShrink: 0 }}>
                    {STATUS_COLORS[msg.status].emoji}
                  </span>
                  <span style={{
                    fontWeight: 600, color: 'var(--ink)',
                    flexShrink: 0, minWidth: 120, maxWidth: 200,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {reporterLabel}
                  </span>
                  <span style={{
                    flex: '1 1 220px', minWidth: 0,
                    color: 'var(--text-soft)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {msg.body}
                  </span>
                  {msg.page_path && (
                    <code style={{
                      fontSize: 10, color: 'var(--text-muted)',
                      flexShrink: 0, maxWidth: 140,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {msg.page_path}
                    </code>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, minWidth: 56, textAlign: 'right' }}>
                    {time}
                  </span>
                  <span style={S.statusPill(msg.status)}>{msg.status.replace('_', ' ')}</span>
                </div>

                {/* Expanded panel — full body, UA, actions */}
                {isOpen && (
                  <div style={{ padding: '0 14px 14px 50px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                      {msg.body}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(msg.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      {msg.user_email && <> · {msg.user_email}</>}
                      {msg.user_agent && (
                        <> · <span style={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>UA: {msg.user_agent}</span></>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {memberId && (
                        <Link
                          href={`/admin/members/${memberId}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{ ...S.btn('primary'), textDecoration: 'none' }}
                        >
                          Open profile →
                        </Link>
                      )}
                      {msg.status !== 'in_progress' && msg.status !== 'resolved' && (
                        <button
                          disabled={busyId === msg.id}
                          onClick={(e) => { e.stopPropagation(); setStatus(msg.id, 'in_progress') }}
                          style={S.btn('ghost')}
                        >
                          Mark in progress
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          disabled={busyId === msg.id}
                          onClick={(e) => { e.stopPropagation(); setStatus(msg.id, 'resolved') }}
                          style={S.btn('ghost')}
                        >
                          Resolve
                        </button>
                      )}
                      {msg.status === 'resolved' && (
                        <button
                          disabled={busyId === msg.id}
                          onClick={(e) => { e.stopPropagation(); setStatus(msg.id, 'open') }}
                          style={S.btn('ghost')}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p style={{ marginTop: 24, fontSize: 11, color: 'var(--text-muted)' }}>
        Counts in this view: {counts.open} open · {counts.in_progress} in progress · {counts.resolved} resolved.
      </p>
    </div>
  )
}
