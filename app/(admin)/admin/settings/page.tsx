'use client'

// app/(admin)/admin/settings/page.tsx
// Admin settings — owner-facing configuration surface. Distinct from the
// member-facing /settings page: this one is about running the platform
// (admin team, workspace defaults, integrations) rather than personal profile
// preferences. Route is gated by proxy.ts so only admin_roles users land here.

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'
import { signOut } from '@/lib/supabase/auth'

const SECTIONS = [
  { id: 'profile',      label: 'Owner profile' },
  { id: 'team',         label: 'Admin team' },
  { id: 'workspace',    label: 'Workspace' },
  { id: 'defaults',     label: 'Member defaults' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'security',     label: 'Security' },
] as const

type SectionId = typeof SECTIONS[number]['id']

type AdminRow = {
  id: string
  user_id: string
  role: 'owner' | 'assistant'
  can_view_members: boolean
  can_message_members: boolean
  can_manage_pairs: boolean
  can_view_financials: boolean
  can_view_journal_entries: boolean
  can_view_coaching_notes: boolean
  can_manage_content: boolean
  can_manage_cohorts: boolean
  email?: string
}

const PERMISSION_LABELS: Record<string, string> = {
  can_view_members:         'Members',
  can_message_members:      'Messaging',
  can_manage_pairs:         'Pairs',
  can_view_financials:      'Financials',
  can_view_journal_entries: 'Journals',
  can_view_coaching_notes:  'Coaching notes',
  can_manage_content:       'Content',
  can_manage_cohorts:       'Cohorts',
}

export default function AdminSettingsPage() {
  const router = useRouter()

  // ── Owner identity ─────────────────────────────────────────────────────────
  const [ownerId, setOwnerId] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerName, setOwnerName] = useState('Coach')
  const [savedName, setSavedName] = useState('')
  const [ownerRole, setOwnerRole] = useState<'owner' | 'assistant'>('owner')
  const [nameSaved, setNameSaved] = useState(false)

  // ── Admin team ─────────────────────────────────────────────────────────────
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [adminsLoading, setAdminsLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')

  // ── Workspace (local stub — real persistence layer TBD) ────────────────────
  const [workspaceName, setWorkspaceName] = useState('The Circle')
  const [supportEmail, setSupportEmail] = useState('')
  const [brandColor, setBrandColor] = useState('#1F5C3A')
  const [workspaceSaved, setWorkspaceSaved] = useState(false)

  // ── Member defaults ────────────────────────────────────────────────────────
  const [defaultCohort, setDefaultCohort] = useState<string>('')
  const [cohorts, setCohorts] = useState<{ id: string; name: string }[]>([])
  const [welcomeEnabled, setWelcomeEnabled] = useState(true)
  const [autoPairOnDay, setAutoPairOnDay] = useState(true)

  // ── Danger zone ────────────────────────────────────────────────────────────
  const [confirmWipe, setConfirmWipe] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user || cancelled) return
      setOwnerId(user.id)
      setOwnerEmail(user.email ?? '')

      // Prefer the saved name from public.users; fall back to email prefix
      // so the input is never empty on first load.
      const { data: profile } = await supabaseClient
        .from('users')
        .select('name')
        .eq('id', user.id)
        .maybeSingle()
      const fallback = (user.email ?? 'Coach').split('@')[0]
      const saved = profile?.name?.trim() || ''
      if (!cancelled) {
        setOwnerName(saved || fallback)
        setSavedName(saved || fallback)
      }

      const { data: myRow } = await supabaseClient
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
      if (myRow?.role && !cancelled) setOwnerRole(myRow.role as 'owner' | 'assistant')

      const { data: rows } = await supabaseClient
        .from('admin_roles')
        .select('*')
        .order('created_at', { ascending: true })
      if (!cancelled && rows) setAdmins(rows as AdminRow[])
      if (!cancelled) setAdminsLoading(false)

      const { data: cohortRows } = await supabaseClient
        .from('circle_cohorts')
        .select('id,name')
        .order('created_at', { ascending: false })
      if (!cancelled && cohortRows) setCohorts(cohortRows as { id: string; name: string }[])
    })()
    return () => { cancelled = true }
  }, [])

  async function commitOwnerName() {
    const trimmed = ownerName.trim()
    if (!ownerId || !trimmed || trimmed === savedName) return
    const { error } = await supabaseClient
      .from('users')
      .update({ name: trimmed })
      .eq('id', ownerId)
    if (error) return
    setSavedName(trimmed)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 1500)
  }

  function commitWorkspace() {
    setWorkspaceSaved(true)
    setTimeout(() => setWorkspaceSaved(false), 1500)
  }

  // ── Scroll-spy ─────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<SectionId>('profile')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          const id = visible[0].target.id as SectionId
          if (id) setActiveSection(id)
        }
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    for (const s of SECTIONS) {
      const el = sectionRefs.current[s.id]
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  function scrollToSection(id: SectionId) {
    const el = sectionRefs.current[id]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const ownerInitials = (ownerEmail || 'CO').slice(0, 2).toUpperCase()

  return (
    <div>
      {/* ── Hero summary ───────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--gold-pale) 0%, var(--paper2) 100%)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 60, height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 22, fontWeight: 700,
          fontFamily: 'var(--font-body)',
          flexShrink: 0,
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px var(--gold-line)',
        }}>
          {ownerInitials}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 300,
            color: 'var(--ink)',
            margin: 0,
            lineHeight: 1.2,
          }}>
            Admin settings
          </h1>
          <div style={{
            display: 'flex',
            gap: '10px',
            marginTop: '6px',
            flexWrap: 'wrap',
            alignItems: 'center',
            fontSize: '12px',
            color: 'var(--text-soft)',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {ownerRole === 'owner' ? 'Owner' : 'Assistant'}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>{ownerEmail || '—'}</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span>{admins.length} admin{admins.length === 1 ? '' : 's'} on team</span>
          </div>
        </div>
      </div>

      {/* ── Two-column: left rail + right content ───────────────────────── */}
      <div className="two-col-grid" style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: '32px',
        alignItems: 'flex-start',
      }}>
        {/* Left rail */}
        <nav
          className="hide-mobile"
          style={{
            position: 'sticky',
            top: '80px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '0 12px 10px',
          }}>
            Jump to
          </div>
          {SECTIONS.map(s => {
            const active = activeSection === s.id
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                style={{
                  textAlign: 'left',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: active ? 'var(--gold-pale)' : 'transparent',
                  color: active ? 'var(--gold)' : 'var(--text-soft)',
                  fontSize: '13px',
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  borderLeft: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                  paddingLeft: '10px',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink)' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-soft)' }}
              >
                {s.label}
              </button>
            )
          })}
          <button
            onClick={async () => { await signOut(); router.push('/') }}
            style={{
              textAlign: 'left',
              padding: '8px 12px',
              marginTop: '12px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              borderLeft: '2px solid transparent',
              paddingLeft: '10px',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
          >
            Sign out →
          </button>
        </nav>

        {/* Right content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* ── Owner profile ───────────────────────────────────────── */}
          <section
            id="profile"
            ref={el => { sectionRefs.current.profile = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Owner profile</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                Your admin account — separate from any member-side profile.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                    Display name
                  </label>
                  {nameSaved && (
                    <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Saved ✓
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  onBlur={commitOwnerName}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur() }}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                    background: 'none', padding: '0 0 8px', fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--gold)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                  Email address
                </label>
                <div style={{ fontSize: 14, fontFamily: 'var(--font-body)', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {ownerEmail || '—'}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Locked
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 6 }}>
                  Email changes flow through Supabase auth — coming soon.
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                  Role
                </label>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'var(--gold-pale)',
                  color: 'var(--gold)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  border: '1px solid var(--gold-line)',
                }}>
                  ◎ {ownerRole === 'owner' ? 'Owner — full access' : 'Assistant'}
                </div>
              </div>
            </div>
          </section>

          {/* ── Admin team ──────────────────────────────────────────── */}
          <section
            id="team"
            ref={el => { sectionRefs.current.team = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Admin team</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                People with access to this admin portal. Live from <code style={{ fontSize: 10 }}>admin_roles</code>.
              </p>
            </div>
            <div style={{ padding: '0 24px' }}>
              {adminsLoading ? (
                <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  Loading admins…
                </div>
              ) : admins.length === 0 ? (
                <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                  No admins on file.
                </div>
              ) : (
                admins.map((a, i) => {
                  const perms = Object.keys(PERMISSION_LABELS).filter(k => (a as unknown as Record<string, boolean>)[k])
                  const isMe = a.user_id && ownerEmail && a.email === ownerEmail
                  return (
                    <div key={a.id} style={{
                      padding: '16px 0',
                      borderBottom: i < admins.length - 1 ? '1px solid var(--line)' : 'none',
                      display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: a.role === 'owner'
                          ? 'linear-gradient(135deg, var(--gold), var(--gold-dim))'
                          : 'linear-gradient(135deg, var(--green), var(--green-dim))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(a.email ?? a.user_id).slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                            {a.email ?? a.user_id.slice(0, 8) + '…'}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                            padding: '2px 8px', borderRadius: 999,
                            background: a.role === 'owner' ? 'var(--gold-pale)' : 'var(--green-pale)',
                            color: a.role === 'owner' ? 'var(--gold)' : 'var(--green)',
                            border: `1px solid ${a.role === 'owner' ? 'var(--gold-line)' : 'rgba(31,92,58,0.2)'}`,
                          }}>
                            {a.role}
                          </span>
                          {isMe && (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>you</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                          {a.role === 'owner' ? (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                              All permissions
                            </span>
                          ) : perms.length === 0 ? (
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                              No granular permissions enabled
                            </span>
                          ) : (
                            perms.map(p => (
                              <span key={p} style={{
                                fontSize: 9, padding: '2px 7px', borderRadius: 4,
                                background: 'var(--paper2)', color: 'var(--text-soft)',
                                fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em',
                              }}>
                                {PERMISSION_LABELS[p]}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                      {a.role !== 'owner' && (
                        <button
                          onClick={() => alert('Revoke admin — coming soon')}
                          style={{
                            fontSize: 11, color: 'var(--red)', background: 'none',
                            border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                            padding: '4px 0',
                          }}
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--line)', background: 'var(--paper)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="assistant@example.com"
                  style={{
                    flex: 1, minWidth: 180, padding: '8px 12px',
                    border: '1px solid var(--line-md)', borderRadius: 6,
                    fontSize: 13, fontFamily: 'var(--font-body)', color: 'var(--ink)',
                    background: '#fff', outline: 'none',
                  }}
                />
                <button
                  onClick={() => {
                    if (!inviteEmail) return
                    alert(`Invite ${inviteEmail} as assistant — coming soon`)
                    setInviteEmail('')
                  }}
                  disabled={ownerRole !== 'owner'}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: ownerRole === 'owner' ? 'var(--gold)' : 'var(--line-md)',
                    color: '#fff', fontSize: 12, fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    cursor: ownerRole === 'owner' ? 'pointer' : 'not-allowed',
                  }}
                >
                  Invite assistant
                </button>
              </div>
              {ownerRole !== 'owner' && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '8px 0 0' }}>
                  Only owners can invite or revoke admins.
                </p>
              )}
            </div>
          </section>

          {/* ── Workspace ───────────────────────────────────────────── */}
          <section
            id="workspace"
            ref={el => { sectionRefs.current.workspace = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Workspace</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                Brand and contact details members see.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 440 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                    Workspace name
                  </label>
                  {workspaceSaved && (
                    <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Saved ✓
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  onBlur={commitWorkspace}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                    background: 'none', padding: '0 0 8px', fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--gold)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                  Support email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="hello@thecircle.app"
                  onBlur={commitWorkspace}
                  style={{
                    width: '100%', border: 'none', borderBottom: '1px solid var(--line-md)',
                    background: 'none', padding: '0 0 8px', fontSize: 15,
                    fontFamily: 'var(--font-body)', color: 'var(--ink)', outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'var(--gold)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-soft)', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
                  Brand color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    onBlur={commitWorkspace}
                    style={{
                      width: 44, height: 32, padding: 0, border: '1px solid var(--line-md)',
                      borderRadius: 6, background: 'none', cursor: 'pointer',
                    }}
                  />
                  <code style={{ fontSize: 12, color: 'var(--text-soft)', fontFamily: 'monospace' }}>{brandColor}</code>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 6 }}>
                  Used for buttons and accents in member-facing surfaces.
                </p>
              </div>
            </div>
          </section>

          {/* ── Member defaults ─────────────────────────────────────── */}
          <section
            id="defaults"
            ref={el => { sectionRefs.current.defaults = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Member defaults</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                Applied to every new member unless overridden.
              </p>
            </div>
            <div style={{ padding: '0 24px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
                padding: '16px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Default cohort</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>
                    New signups land here automatically.
                  </div>
                </div>
                <select
                  value={defaultCohort}
                  onChange={(e) => setDefaultCohort(e.target.value)}
                  style={{
                    padding: '6px 10px', border: '1px solid var(--line-md)', borderRadius: 6,
                    fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--ink)',
                    background: '#fff',
                  }}
                >
                  <option value="">— None —</option>
                  {cohorts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Send welcome email on signup',         sub: 'Triggers from /admin/comms templates.', value: welcomeEnabled, set: setWelcomeEnabled },
                { label: 'Auto-assign accountability partner',   sub: 'Pair members on day 7 of their cohort.', value: autoPairOnDay, set: setAutoPairOnDay },
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '18px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <button
                    onClick={() => item.set(!item.value)}
                    aria-label={`${item.value ? 'Disable' : 'Enable'} ${item.label}`}
                    style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: item.value ? 'var(--gold)' : 'var(--line-md)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: item.value ? 23 : 3, transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Integrations ────────────────────────────────────────── */}
          <section
            id="integrations"
            ref={el => { sectionRefs.current.integrations = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Integrations</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                External services connected to this workspace.
              </p>
            </div>
            <div style={{ padding: '0 24px' }}>
              {([
                { name: 'Supabase',     desc: 'Database + auth',        status: 'connected', action: 'Manage' },
                { name: 'Stripe',       desc: 'Payments + subscriptions', status: 'pending',   action: 'Connect' },
                { name: 'Resend',       desc: 'Transactional email',    status: 'pending',   action: 'Connect' },
                { name: 'Calendar',     desc: 'Live stream scheduling', status: 'pending',   action: 'Connect' },
              ] as { name: string; desc: string; status: 'connected' | 'pending'; action: string }[]).map((int, i, arr) => (
                <div key={int.name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
                  padding: '16px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{int.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>{int.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
                      padding: '3px 9px', borderRadius: 999,
                      background: int.status === 'connected' ? 'var(--green-pale)' : 'var(--paper2)',
                      color: int.status === 'connected' ? 'var(--green)' : 'var(--text-muted)',
                      border: `1px solid ${int.status === 'connected' ? 'rgba(31,92,58,0.2)' : 'var(--line)'}`,
                    }}>
                      {int.status === 'connected' ? '● Connected' : 'Pending'}
                    </span>
                    <button
                      onClick={() => alert(`${int.action} ${int.name} — coming soon`)}
                      style={{
                        fontSize: 12, color: 'var(--gold)', background: 'none',
                        border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                      }}
                    >
                      {int.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Security ────────────────────────────────────────────── */}
          <section
            id="security"
            ref={el => { sectionRefs.current.security = el }}
            style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: '#ffffff' }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--line)', background: 'var(--paper)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--ink)', margin: 0 }}>Security</h2>
            </div>
            <div style={{ padding: '0 24px' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Admin password</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>Used to sign into the admin portal.</div>
                </div>
                <button style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
                  Change password
                </button>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0', borderBottom: '1px solid var(--line)',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Two-factor authentication</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>Required for owner accounts in the future.</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Coming soon
                </span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 0',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Admin activity log</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2 }}>See who did what, and when.</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          {/* ── Danger zone ─────────────────────────────────────────── */}
          <section style={{
            border: '1px solid rgba(178,60,60,0.35)',
            borderRadius: 12,
            overflow: 'hidden',
            background: 'rgba(178,60,60,0.03)',
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(178,60,60,0.2)', background: 'rgba(178,60,60,0.05)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 400, color: 'var(--red)', margin: 0 }}>Danger zone</h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                Workspace-level actions. Be sure.
              </p>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)' }}>Wipe demo data</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 2, lineHeight: 1.5 }}>
                    Deletes seeded cohorts, sample members, and demo wins. Real members are not affected.
                  </div>
                </div>
                {confirmWipe ? (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => { alert('Wipe demo data — coming soon'); setConfirmWipe(false) }}
                      style={{
                        fontSize: 12, padding: '8px 14px', borderRadius: 6, border: 'none',
                        background: 'var(--red)', color: 'white', fontFamily: 'var(--font-body)',
                        cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      Confirm wipe
                    </button>
                    <button
                      onClick={() => setConfirmWipe(false)}
                      style={{
                        fontSize: 12, padding: '8px 14px', borderRadius: 6,
                        border: '1px solid var(--line-md)', background: 'white',
                        color: 'var(--text-soft)', fontFamily: 'var(--font-body)', cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmWipe(true)}
                    disabled={ownerRole !== 'owner'}
                    style={{
                      fontSize: 12, padding: '8px 14px', borderRadius: 6,
                      border: '1px solid rgba(178,60,60,0.4)', background: 'white',
                      color: ownerRole === 'owner' ? 'var(--red)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      cursor: ownerRole === 'owner' ? 'pointer' : 'not-allowed',
                      flexShrink: 0,
                    }}
                  >
                    Wipe demo data
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 4px 20px',
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            <span>Admin v1.0.0 · Built by Hicks Virtual Solutions LLC</span>
            <span>{ownerEmail || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
