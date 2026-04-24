'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

// Deep green accent — stays consistent throughout this sidebar
const GREEN = '#1A5230'
const GREEN_PALE = 'rgba(26,82,48,0.07)'
const GREEN_DIM  = 'rgba(26,82,48,0.55)'

// Purple for the Seal the Leak swap button
const PURPLE = '#3D3080'

// SVG Icons
function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" />
      <path d="M6 15V9h4v6" />
    </svg>
  )
}

function CardsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="12" height="9" rx="1.5" />
      <path d="M4 5V4a2 2 0 012-2h4a2 2 0 012 2v1" />
    </svg>
  )
}

function PastIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 2" />
    </svg>
  )
}

function JournalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h8a1 1 0 011 1v10a1 1 0 01-1 1H3" />
      <path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1" />
      <path d="M6 6h4M6 9h4M6 12h2" />
    </svg>
  )
}

function WinsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.5 3.1L13 5.6l-2.5 2.4.6 3.4L8 9.8l-3.1 1.6.6-3.4L3 5.6l3.5-.5L8 2z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  )
}

interface NavItem {
  href: string
  icon: React.ComponentType
  label: string
  subtitle: string
  exact?: boolean
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', icon: HomeIcon,    label: 'The Entry',        subtitle: 'Start where you are',          exact: true },
  { href: '/card',      icon: CardsIcon,   label: 'Daily Alignment',  subtitle: 'Meet yourself today',          exact: true },
  { href: '/past',      icon: PastIcon,    label: 'The Becoming',     subtitle: 'See your evolution',           exact: true },
  { href: '/journal',   icon: JournalIcon, label: 'Reflection',       subtitle: 'Tell the truth'                            },
  { href: '/wins',      icon: WinsIcon,    label: 'My Wins',          subtitle: 'Victories logged here',        exact: true },
  { href: '/profile',   icon: ProfileIcon, label: 'Self',             subtitle: 'This is who you are becoming', exact: true },
]

function isItemActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, dayNumber, realDayNumber, adminCardDay, setAdminCardDay, setSidebarMode } = useApp()
  const [adminOpen, setAdminOpen] = React.useState(false)

  const vaultUnlocked = dayNumber >= 30
  const quickPicks = [1, 7, 14, 30, 40]

  return (
    <aside
      style={{
        width: 'var(--sidebar)',
        minWidth: 'var(--sidebar)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#f9fdfb',
        borderRight: '1px solid var(--line)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Wordmark */}
      <div style={{ padding: '0 20px' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 500,
          color: 'var(--ink)',
        }}>
          <span style={{ color: GREEN }}>✦</span> 365 Days
        </div>
        <p style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          margin: '4px 0 0 0',
        }}>
          Daily Alignment
        </p>
        <div style={{ borderTop: '1px solid var(--line)', marginTop: '16px', marginBottom: '8px' }} />
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1 }}>
        {mainNavItems.map((item) => {
          const active = isItemActive(item.href, pathname, item.exact)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
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
                  backgroundColor: active ? GREEN_PALE : 'transparent',
                  color: active ? GREEN : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(26,82,48,0.04)'
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                <span style={{ flexShrink: 0 }}>
                  <Icon />
                </span>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.2,
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: active ? GREEN_DIM : 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.3,
                    marginTop: '2px',
                  }}>
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Swap to The Work */}
        <div style={{ padding: '0 8px', marginTop: '16px' }}>
          <div style={{ borderTop: '1px solid var(--line)', marginBottom: '12px' }} />
          <button
            onClick={() => { setSidebarMode('work'); router.push('/program') }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(61,48,128,0.07)',
              border: '1px solid rgba(61,48,128,0.15)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ color: PURPLE, flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2a6 6 0 016 6v2l1 2H1l1-2V8a6 6 0 016-6z" />
                <path d="M6.5 14a1.5 1.5 0 003 0" />
              </svg>
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)', lineHeight: 1.2 }}>
                Seal the Leak
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3, marginTop: '2px' }}>
                → Switch to The Work
              </div>
            </div>
          </button>
        </div>
      </nav>

      {/* Admin panel — cards side */}
      {user.isAdmin && (
        <div style={{ padding: '0 8px', marginTop: '8px' }}>
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
              background: adminOpen ? 'rgba(26,82,48,0.06)' : 'transparent',
              border: '1px solid ' + (adminOpen ? 'rgba(26,82,48,0.2)' : 'var(--line)'),
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={adminOpen ? GREEN : 'var(--text-muted)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 500, color: adminOpen ? GREEN : 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', flex: 1, textAlign: 'left' }}>
              Admin Preview
            </span>
            {adminCardDay !== null && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{adminOpen ? '▲' : '▼'}</span>
          </button>

          {adminOpen && (
            <div style={{
              marginTop: '8px',
              padding: '14px',
              background: 'rgba(26,82,48,0.04)',
              border: '1px solid rgba(26,82,48,0.15)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
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
                      border: adminCardDay === null ? `1.5px solid ${GREEN}` : '1px solid var(--line)',
                      background: adminCardDay === null ? `${GREEN}10` : 'white',
                      color: adminCardDay === null ? GREEN : 'var(--text-soft)',
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
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: active ? `1.5px solid ${GREEN}` : '1px solid var(--line)',
                          background: active ? GREEN : 'white',
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
                      padding: '5px 8px',
                      borderRadius: '5px',
                      border: '1px solid var(--line-md)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-body)',
                      color: 'var(--ink)',
                      outline: 'none',
                      width: '100%',
                      minWidth: 0,
                    }}
                  />
                </div>
              </div>

              {adminCardDay !== null && (
                <button
                  onClick={() => setAdminCardDay(null)}
                  style={{
                    padding: '6px 10px',
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
                  ✕ Reset to live day
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bottom section */}
      <div style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* New Journal Entry */}
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <button
            onClick={() => router.push('/journal/new')}
            style={{
              width: '100%',
              backgroundColor: GREEN,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'opacity 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            New Journal Entry
          </button>
          <div style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--red)',
            border: '1.5px solid #f9fdfb',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Vault */}
        {vaultUnlocked ? (
          <Link
            href="/vault"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 4px',
              fontSize: '12px',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-soft)',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-soft)' }}
          >
            The Vault →
          </Link>
        ) : (
          <div style={{ padding: '4px', fontSize: '12px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', opacity: 0.6 }}>
            🔒 The Vault <span style={{ fontSize: '10px' }}>(Day 30)</span>
          </div>
        )}

        {/* Settings */}
        <Link
          href="/settings"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 4px',
            fontSize: '12px',
            fontFamily: 'var(--font-body)',
            color: 'var(--text-soft)',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-soft)' }}
        >
          <GearIcon />
          Settings
        </Link>

        {/* Sign Out */}
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '0',
            textAlign: 'left',
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--red)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
