// app/(admin)/admin/pairs/page.tsx
// Accountability pair map — health monitor, re-pair management

'use client'

import { useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { fetchPairMap, fetchRepairRequests, fetchAdminCohorts, fetchUnpairedMembers, pairMembers, fetchPartnerThread, type AdminPairRow, type RepairRequest, type PartnerThreadMessage } from '@/lib/admin/hooks'

const ARCHETYPE_COLORS: Record<string, string> = {
  door: 'var(--green)', throne: '#1a1a2e', engine: 'var(--red)', push: '#3d2c0e',
}
const ARCHETYPE_LABELS: Record<string, string> = {
  door: 'Open Door', throne: 'Overthink Throne', engine: 'Interrupted Engine', push: 'Pushthrough',
}

function PairHealthBadge({ health }: { health: string }) {
  const map: Record<string, { bg: string; text: string; emoji: string }> = {
    strong:   { bg: 'rgba(31,92,58,.3)',    text: 'var(--green)', emoji: '🔥' },
    moderate: { bg: 'rgba(184,146,42,.15)', text: 'var(--gold)', emoji: '✓' },
    quiet:    { bg: 'rgba(201,125,58,.15)',  text: '#C97D3A', emoji: '⚠' },
    silent:   { bg: 'rgba(139,31,47,.25)',  text: 'var(--red)', emoji: '🔴' },
  }
  const c = map[health] ?? map.moderate
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 10px',
      borderRadius: '10px', background: c.bg, color: c.text,
    }}>
      {c.emoji} {health.charAt(0).toUpperCase() + health.slice(1)}
    </span>
  )
}

type Unpaired = { id: string; name: string | null; archetype: string }

export default function PairsPage() {
  const [cohortId, setCohortId] = useState('')
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([])
  const [pairs, setPairs] = useState<AdminPairRow[]>([])
  const [repairReqs, setRepairReqs] = useState<RepairRequest[]>([])
  const [unpaired, setUnpaired] = useState<Unpaired[]>([])
  const [loading, setLoading] = useState(false)

  // Match-pair UI state
  const [pickA, setPickA] = useState<string>('')
  const [pickB, setPickB] = useState<string>('')
  const [pairing, setPairing] = useState(false)
  const [pairError, setPairError] = useState<string | null>(null)

  // Thread viewer state
  const [openThread, setOpenThread] = useState<{ pair: AdminPairRow; messages: PartnerThreadMessage[] } | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)

  useEffect(() => {
    fetchAdminCohorts().then(c => {
      const active = c.filter(x => x.status === 'active')
      setCohorts(active)
      if (active[0]) setCohortId(active[0].id)
    })
  }, [])

  async function refreshAll() {
    setLoading(true)
    const [p, r, u] = await Promise.all([
      fetchPairMap(cohortId),
      fetchRepairRequests(cohortId),
      fetchUnpairedMembers(cohortId),
    ])
    setPairs(p); setRepairReqs(r); setUnpaired(u)
    setLoading(false)
  }

  useEffect(() => {
    if (!cohortId) return
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortId])

  async function handlePair() {
    if (!pickA || !pickB || pickA === pickB) return
    setPairing(true)
    setPairError(null)
    const result = await pairMembers(pickA, pickB)
    setPairing(false)
    if (result.error) {
      setPairError(result.error.message)
      return
    }
    setPickA(''); setPickB('')
    await refreshAll()
  }

  // Find user_ids for a pair (we have user_id on AdminPairRow only via a separate fetch).
  // Easier path: re-fetch the two member rows to grab their user_id.
  async function openPairThread(pair: AdminPairRow) {
    setLoadingThread(true)
    setOpenThread({ pair, messages: [] })
    const { data: rows } = await supabaseClient
      .from('circle_members')
      .select('id, user_id')
      .in('id', [pair.member_a_id, pair.member_b_id])
    const a = rows?.find(r => r.id === pair.member_a_id)?.user_id
    const b = rows?.find(r => r.id === pair.member_b_id)?.user_id
    if (a && b) {
      const msgs = await fetchPartnerThread(a, b)
      setOpenThread({ pair, messages: msgs })
    }
    setLoadingThread(false)
  }

  async function approveRepair(reqId: string) {
    const { data: { user } } = await supabaseClient.auth.getUser()
    await supabaseClient.from('circle_repair_requests').update({
      status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', reqId)
    setRepairReqs(r => r.map(x => x.id === reqId ? { ...x, status: 'approved' } : x))
  }

  async function denyRepair(reqId: string) {
    const { data: { user } } = await supabaseClient.auth.getUser()
    await supabaseClient.from('circle_repair_requests').update({
      status: 'denied', reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', reqId)
    setRepairReqs(r => r.map(x => x.id === reqId ? { ...x, status: 'denied' } : x))
  }

  const pendingRepairs = repairReqs.filter(r => r.status === 'pending')
  const silentPairs = pairs.filter(p => p.pair_health === 'silent')
  const quietPairs = pairs.filter(p => p.pair_health === 'quiet')

  const S = {
    h1: { fontSize: '20px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' },
    section: { marginBottom: '28px' },
    sectionHead: {
      fontSize: '11px', fontWeight: 700, letterSpacing: '.1em',
      textTransform: 'uppercase' as const, color: 'var(--text-muted)',
      marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--line)',
    },
    card: { background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginBottom: '8px' },
    tag: (arch: string) => ({
      fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px',
      background: `${ARCHETYPE_COLORS[arch] ?? 'var(--line)'}50`, color: 'var(--gold)',
    }),
    btn: (variant: 'primary' | 'ghost' | 'danger') => ({
      fontSize: '11px', fontWeight: 600, padding: '5px 12px', borderRadius: '7px',
      cursor: 'pointer', border: 'none',
      background: variant === 'primary' ? 'var(--green)' : variant === 'danger' ? 'rgba(139,31,47,.3)' : 'var(--line)',
      color: variant === 'primary' ? '#fff' : variant === 'danger' ? 'var(--red)' : 'var(--text-soft)',
    }),
    select: {
      background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px',
      color: 'var(--text-soft)', fontSize: '13px', padding: '7px 12px', cursor: 'pointer',
    },
  }

  return (
    <div style={{ color: 'var(--ink)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={S.h1}>Accountability pairs</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {pairs.length} pairs · {silentPairs.length} silent · {pendingRepairs.length} re-pair request{pendingRepairs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <select value={cohortId} onChange={e => setCohortId(e.target.value)} style={S.select}>
          {cohorts.length === 0 && <option value="">No active cohorts</option>}
          {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Match new pair */}
      {unpaired.length >= 2 && (
        <div style={S.section}>
          <div style={S.sectionHead}>Match new pair — {unpaired.length} unpaired members</div>
          <div style={S.card}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Member A</div>
                <select value={pickA} onChange={e => setPickA(e.target.value)} style={{ ...S.select, width: '100%' }}>
                  <option value="">Select…</option>
                  {unpaired.map(u => (
                    <option key={u.id} value={u.id}>
                      {(u.name ?? '—')} · {ARCHETYPE_LABELS[u.archetype] ?? u.archetype}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Member B</div>
                <select value={pickB} onChange={e => setPickB(e.target.value)} style={{ ...S.select, width: '100%' }}>
                  <option value="">Select…</option>
                  {unpaired.filter(u => u.id !== pickA).map(u => (
                    <option key={u.id} value={u.id}>
                      {(u.name ?? '—')} · {ARCHETYPE_LABELS[u.archetype] ?? u.archetype}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePair}
                disabled={!pickA || !pickB || pairing}
                style={{
                  ...S.btn('primary'),
                  padding: '7px 14px',
                  opacity: !pickA || !pickB ? 0.5 : 1,
                }}
              >
                {pairing ? 'Pairing…' : 'Pair them'}
              </button>
            </div>
            {pairError && <p style={{ fontSize: '12px', color: 'var(--red)', margin: '8px 0 0' }}>{pairError}</p>}
          </div>
        </div>
      )}

      {/* Re-pair requests */}
      {pendingRepairs.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionHead}>Re-pair requests — pending approval</div>
          {pendingRepairs.map(req => (
            <div key={req.id} style={{ ...S.card, borderLeft: '3px solid var(--gold)', borderRadius: '0 12px 12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '3px' }}>
                    {req.requester_name ?? 'Member'} → requesting new partner
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={S.tag(req.requester_archetype)}>{ARCHETYPE_LABELS[req.requester_archetype]}</span>
                    {req.original_partner_name && ` · Current partner: ${req.original_partner_name}`}
                    {req.reason && ` · "${req.reason}"`}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Requested {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => approveRepair(req.id)} style={S.btn('primary')}>Approve</button>
                  <button onClick={() => denyRepair(req.id)} style={S.btn('danger')}>Deny</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pairs needing attention */}
      {(silentPairs.length > 0 || quietPairs.length > 0) && (
        <div style={S.section}>
          <div style={S.sectionHead}>Pairs needing attention</div>
          {[...silentPairs, ...quietPairs].map((pair, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ARCHETYPE_COLORS[pair.member_a_archetype] ?? 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                    {(pair.member_a_name ?? 'A').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{pair.member_a_name ?? 'Member A'}</div>
                    <span style={S.tag(pair.member_a_archetype)}>{ARCHETYPE_LABELS[pair.member_a_archetype]}</span>
                  </div>
                </div>

                <div style={{ fontSize: '16px', color: 'var(--text-muted)' }}>⟷</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ARCHETYPE_COLORS[pair.member_b_archetype] ?? 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                    {(pair.member_b_name ?? 'B').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{pair.member_b_name ?? 'Member B'}</div>
                    <span style={S.tag(pair.member_b_archetype)}>{ARCHETYPE_LABELS[pair.member_b_archetype]}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <PairHealthBadge health={pair.pair_health} />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {pair.message_count} msgs · {pair.days_since_message === 999 ? 'never messaged' : `${pair.days_since_message}d silent`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All pairs */}
      <div style={S.section}>
        <div style={S.sectionHead}>All pairs — {pairs.length} total</div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading pairs...</div>
        ) : pairs.map((pair, i) => (
          <div
            key={i}
            onClick={() => openPairThread(pair)}
            style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{pair.member_a_name ?? '—'}</span>
              <span style={S.tag(pair.member_a_archetype)}>{pair.member_a_archetype}</span>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>+</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{pair.member_b_name ?? '—'}</span>
              <span style={S.tag(pair.member_b_archetype)}>{pair.member_b_archetype}</span>
            </div>
            <PairHealthBadge health={pair.pair_health} />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px', textAlign: 'right' }}>
              {pair.message_count} msgs · view thread →
            </div>
          </div>
        ))}

        {pairs.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '30px' }}>
            No pairs formed yet for this cohort
          </div>
        )}
      </div>

      {/* Thread viewer modal — read-only shadow into a partner thread */}
      {openThread && (
        <>
          <div
            onClick={() => setOpenThread(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 }}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0,
            width: 'min(440px, 100vw)',
            background: '#ffffff', borderLeft: '1px solid var(--line)',
            display: 'flex', flexDirection: 'column', zIndex: 100, overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--line)' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Partner thread — admin view
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {openThread.pair.member_a_name ?? 'A'} &harr; {openThread.pair.member_b_name ?? 'B'}
                </div>
                <button
                  onClick={() => setOpenThread(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }}
                >×</button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Read-only. Members will not be notified.
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
              {loadingThread ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading…</div>
              ) : openThread.messages.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                  No messages yet between this pair.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {openThread.messages.map(m => (
                    <div key={m.id} style={{ background: 'var(--paper)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--line)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        From: {m.sender_id.slice(0, 8)}… · {new Date(m.created_at).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {m.body}
                      </div>
                      {m.audio_url && (
                        <audio controls src={m.audio_url} style={{ marginTop: '8px', width: '100%', height: '32px' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
