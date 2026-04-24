'use client'
import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { programRoutes } from '@/data/sealTheLeakProgram'
import { signOut } from '@/lib/supabase/auth'

const GREEN  = '#1A5230'
const GREEN_PALE = 'rgba(26,82,48,0.07)'
const GREEN_DIM  = 'rgba(26,82,48,0.55)'
const PURPLE = '#3D3080'
const PURPLE_PALE = 'rgba(61,48,128,0.07)'
const PURPLE_DIM  = 'rgba(61,48,128,0.55)'

// ── Icons (same as sidebars) ──────────────────────────────────────────────────

function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"/><path d="M6 15V9h4v6"/></svg>
}
function CardsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M4 5V4a2 2 0 012-2h4a2 2 0 012 2v1"/></svg>
}
function PastIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
}
function JournalIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2h8a1 1 0 011 1v10a1 1 0 01-1 1H3"/><path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1"/><path d="M6 6h4M6 9h4M6 12h2"/></svg>
}
function WinsIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2l1.5 3.1L13 5.6l-2.5 2.4.6 3.4L8 9.8l-3.1 1.6.6-3.4L3 5.6l3.5-.5L8 2z"/></svg>
}
function ProfileIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="5.5" r="2.5"/><path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5"/></svg>
}
function OverviewIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
}
function FlameIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 14s-5-3.5-5-7.5C3 4 5 2 8 2c1 2 0 3.5-1 4.5C9 6 11 4.5 10 2c2 1.5 3 3.5 3 4.5 0 4-5 7.5-5 7.5z"/></svg>
}
function ProgressIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
}
function GearIcon() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>
}
function CloseIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4l10 10M14 4L4 14"/></svg>
}

// ── Nav item types ────────────────────────────────────────────────────────────

interface NavItem {
  href: string
  icon: React.ComponentType
  label: string
  subtitle: string
  exact?: boolean
}

const cardsNavItems: NavItem[] = [
  { href: '/dashboard', icon: HomeIcon,    label: 'The Entry',       subtitle: 'Start where you are',          exact: true },
  { href: '/card',      icon: CardsIcon,   label: 'Daily Alignment', subtitle: 'Meet yourself today',          exact: true },
  { href: '/past',      icon: PastIcon,    label: 'The Becoming',    subtitle: 'See your evolution',           exact: true },
  { href: '/journal',   icon: JournalIcon, label: 'Reflection',      subtitle: 'Tell the truth'                            },
  { href: '/wins',      icon: WinsIcon,    label: 'My Wins',         subtitle: 'Victories logged here',        exact: true },
  { href: '/profile',   icon: ProfileIcon, label: 'Self',            subtitle: 'This is who you are becoming', exact: true },
]

const workNavItems: NavItem[] = [
  { href: '/program',          icon: OverviewIcon, label: 'The Work',        subtitle: 'Program overview',           exact: true },
  { href: '/program/today',    icon: FlameIcon,    label: "Today's Session", subtitle: 'Pick up where you left off', exact: true },
  { href: '/journal',          icon: JournalIcon,  label: 'Reflection',      subtitle: 'Tell the truth'                            },
  { href: '/program/progress', icon: ProgressIcon, label: 'My Progress',     subtitle: 'Your journey so far',        exact: true  },
]

function isActive(href: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const {
    user, dayNumber, realDayNumber,
    adminCardDay, setAdminCardDay,
    adminProgramDay, setAdminProgramDay,
    adminArchetype, setAdminArchetype,
    sidebarMode, setSidebarMode,
  } = useApp()
  const [adminOpen, setAdminOpen] = React.useState(false)

  const isWork      = sidebarMode === 'work'
  const accent      = isWork ? PURPLE : GREEN
  const accentPale  = isWork ? PURPLE_PALE : GREEN_PALE
  const accentDim   = isWork ? PURPLE_DIM  : GREEN_DIM
  const bgColor     = isWork ? '#faf9fd' : '#f9fdfb'
  const vaultUnlocked = dayNumber >= 30
  const quickPicks = [1, 7, 14, 30, 40]
  const ROUTE_ORDER = ['door', 'throne', 'engine', 'push'] as const
  const adminHasOverride = isWork
    ? (adminProgramDay !== null || adminArchetype !== null)
    : adminCardDay !== null

  const panelRef = useRef<HTMLDivElement>(null)

  // Slide in / out
  useEffect(() => {
    const el = panelRef.current
    if (!el) return
    if (open) {
      el.style.transform = 'translateX(-100%)'
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = 'transform 0.28s cubic-bezier(0.32,0,0.15,1)'
          el.style.transform = 'translateX(0)'
        })
      })
    } else {
      el.style.transition = 'transform 0.22s cubic-bezier(0.32,0,0.15,1)'
      el.style.transform = 'translateX(-100%)'
    }
  }, [open])

  if (!open && panelRef.current?.style.transform === 'translateX(-100%)') return null

  function navigate(href: string) {
    onClose()
    router.push(href)
  }

  const navItems = isWork ? workNavItems : cardsNavItems

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: open ? 'rgba(12,12,10,0.4)' : 'rgba(12,12,10,0)',
          zIndex: 200,
          transition: 'background-color 0.25s ease',
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel — matches sidebar */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: '280px',
          backgroundColor: bgColor,
          borderRight: '1px solid var(--line)',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          transform: 'translateX(-100%)',
          willChange: 'transform',
        }}
      >
        {/* Wordmark — matches sidebar */}
        <div style={{ padding: '24px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, color: 'var(--ink)' }}>
                <span style={{ color: accent }}>✦</span>{' '}
                {isWork ? 'Seal the Leak' : '365 Days'}
              </div>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '4px 0 0' }}>
                {isWork ? '7-Day Reset' : 'Daily Alignment'}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-soft)', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
            >
              <CloseIcon />
            </button>
          </div>
          <div style={{ borderTop: '1px solid var(--line)', marginTop: '16px', marginBottom: '8px' }} />
        </div>

        {/* Main nav */}
        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const active = isActive(item.href, pathname, item.exact)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    margin: '1px 8px',
                    backgroundColor: active ? accentPale : 'transparent',
                    color: active ? accent : 'var(--text-soft)',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  <span style={{ flexShrink: 0 }}><Icon /></span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: active ? 600 : 500, fontFamily: 'var(--font-body)', lineHeight: 1.2 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '10px', color: active ? accentDim : 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3, marginTop: '2px' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          {/* Mode switch button */}
          <div style={{ padding: '0 8px', marginTop: '16px' }}>
            <div style={{ borderTop: '1px solid var(--line)', marginBottom: '12px' }} />
            {isWork ? (
              <button
                onClick={() => { setSidebarMode('cards'); navigate('/dashboard') }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: GREEN_PALE, border: '1px solid rgba(26,82,48,0.15)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ color: GREEN, flexShrink: 0 }}>
                  <CardsIcon />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)', lineHeight: 1.2 }}>365 Days</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3, marginTop: '2px' }}>← Switch to Daily Cards</div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => { setSidebarMode('work'); navigate('/program') }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: '8px',
                  background: PURPLE_PALE, border: '1px solid rgba(61,48,128,0.15)',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ color: PURPLE, flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 2a6 6 0 016 6v2l1 2H1l1-2V8a6 6 0 016-6z"/><path d="M6.5 14a1.5 1.5 0 003 0"/>
                  </svg>
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)', lineHeight: 1.2 }}>Seal the Leak</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3, marginTop: '2px' }}>→ Switch to The Work</div>
                </div>
              </button>
            )}
          </div>

          {/* Admin panel — mode-aware (cards or work) */}
          {user.isAdmin && (
            <div style={{ padding: '0 8px', marginTop: '12px' }}>
              <div style={{ borderTop: '1px solid var(--line)', marginBottom: '8px' }} />
              <button
                onClick={() => setAdminOpen(o => !o)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: adminOpen ? `${accent}10` : 'transparent',
                  border: '1px solid ' + (adminOpen ? `${accent}30` : 'var(--line)'),
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={adminOpen ? accent : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="3" />
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 500, color: adminOpen ? accent : 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>
                  Admin Preview
                </span>
                {adminHasOverride && (
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{adminOpen ? '▲' : '▼'}</span>
              </button>

              {adminOpen && (
                <div style={{
                  marginTop: '8px',
                  padding: '14px',
                  background: `${accent}08`,
                  border: `1px solid ${accent}20`,
                  borderRadius: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}>

                  {/* Cards mode — day override */}
                  {!isWork && (
                    <>
                      <div>
                        <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px', fontFamily: 'var(--font-body)' }}>
                          View Day
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 8px', lineHeight: 1.4 }}>
                          Real day: {realDayNumber}. Override unlocks cards + vault.
                        </p>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <button
                            onClick={() => setAdminCardDay(null)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              border: adminCardDay === null ? `1.5px solid ${accent}` : '1px solid var(--line)',
                              background: adminCardDay === null ? `${accent}15` : 'white',
                              color: adminCardDay === null ? accent : 'var(--text-soft)',
                              fontSize: '10px',
                              fontWeight: adminCardDay === null ? 600 : 400,
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                            }}
                          >
                            Live
                          </button>
                          {quickPicks.map((d) => {
                            const active = adminCardDay === d
                            return (
                              <button
                                key={d}
                                onClick={() => setAdminCardDay(d)}
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  border: active ? `1.5px solid ${accent}` : '1px solid var(--line)',
                                  background: active ? accent : 'white',
                                  color: active ? 'white' : 'var(--text-soft)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  fontFamily: 'var(--font-body)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {d}
                              </button>
                            )
                          })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
                            Any day:
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={365}
                            value={adminCardDay ?? ''}
                            placeholder="1–365"
                            onChange={(e) => {
                              const raw = e.target.value
                              if (raw === '') { setAdminCardDay(null); return }
                              const n = parseInt(raw, 10)
                              if (Number.isNaN(n)) return
                              setAdminCardDay(Math.max(1, Math.min(365, n)))
                            }}
                            style={{
                              flex: 1,
                              padding: '6px 8px',
                              borderRadius: '5px',
                              border: '1px solid var(--line-md)',
                              fontSize: '12px',
                              fontFamily: 'var(--font-body)',
                              color: 'var(--ink)',
                              outline: 'none',
                              width: '100%',
                              minWidth: 0,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Work mode — archetype + day override */}
                  {isWork && (
                    <>
                      <div>
                        <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px', fontFamily: 'var(--font-body)' }}>
                          Archetype / Route
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            onClick={() => setAdminArchetype(null)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: adminArchetype === null ? `1.5px solid ${accent}` : '1px solid var(--line)',
                              background: adminArchetype === null ? `${accent}10` : 'white',
                              color: adminArchetype === null ? accent : 'var(--text-soft)',
                              fontSize: '12px',
                              fontWeight: adminArchetype === null ? 600 : 400,
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                              textAlign: 'left',
                            }}
                          >
                            Default (user&apos;s route)
                          </button>
                          {ROUTE_ORDER.map((id) => {
                            const r = programRoutes[id]
                            const active = adminArchetype === id
                            return (
                              <button
                                key={id}
                                onClick={() => setAdminArchetype(id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 10px',
                                  borderRadius: '6px',
                                  border: active ? `1.5px solid ${r.color}` : '1px solid var(--line)',
                                  background: active ? `${r.color}10` : 'white',
                                  color: active ? r.color : 'var(--text-soft)',
                                  fontSize: '12px',
                                  fontWeight: active ? 600 : 400,
                                  fontFamily: 'var(--font-body)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                {r.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <p style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 4px', fontFamily: 'var(--font-body)' }}>
                          View Day
                        </p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', margin: '0 0 8px', lineHeight: 1.4 }}>
                          All 7 days unlocked in admin mode.
                        </p>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setAdminProgramDay(null)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '5px',
                              border: adminProgramDay === null ? `1.5px solid ${accent}` : '1px solid var(--line)',
                              background: adminProgramDay === null ? `${accent}15` : 'white',
                              color: adminProgramDay === null ? accent : 'var(--text-soft)',
                              fontSize: '11px',
                              fontWeight: adminProgramDay === null ? 600 : 400,
                              fontFamily: 'var(--font-body)',
                              cursor: 'pointer',
                            }}
                          >
                            Current
                          </button>
                          {[1,2,3,4,5,6,7].map((d) => {
                            const active = adminProgramDay === d
                            return (
                              <button
                                key={d}
                                onClick={() => setAdminProgramDay(d)}
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: '50%',
                                  border: active ? `1.5px solid ${accent}` : '1px solid var(--line)',
                                  background: active ? accent : 'white',
                                  color: active ? 'white' : 'var(--text-soft)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  fontFamily: 'var(--font-body)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {d}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Reset */}
                  {adminHasOverride && (
                    <button
                      onClick={() => {
                        if (isWork) { setAdminProgramDay(null); setAdminArchetype(null) }
                        else setAdminCardDay(null)
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--line)',
                        background: 'white',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      ✕ Reset to live defaults
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Bottom — New Journal Entry + Settings + Sign Out */}
        <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Vault (cards mode only) */}
          {!isWork && (
            vaultUnlocked ? (
              <Link
                href="/vault"
                onClick={onClose}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px', fontSize: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-soft)' }}
              >
                The Vault →
              </Link>
            ) : (
              <div style={{ padding: '4px', fontSize: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', opacity: 0.6 }}>
                🔒 The Vault <span style={{ fontSize: '10px' }}>(Day 30)</span>
              </div>
            )
          )}

          {/* New Journal Entry */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => navigate('/journal/new')}
              style={{
                width: '100%',
                backgroundColor: accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              New Journal Entry
            </button>
            <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--red)', border: `1.5px solid ${bgColor}`, pointerEvents: 'none' }} />
          </div>

          {/* Settings */}
          <Link
            href="/settings"
            onClick={onClose}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px', fontSize: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-soft)' }}
          >
            <GearIcon />
            Settings
          </Link>

          {/* Sign Out */}
          <button
            onClick={async () => { onClose(); await signOut(); router.push('/') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', padding: '0', textAlign: 'left' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
