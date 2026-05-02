'use client'

// components/layout/Sidebar.tsx
// Single sidebar that shows ONE program's nav at a time, with a
// program-picker dropdown at the top.
//
//   - Owned programs swap the sidebar nav and route to that program's home
//   - Locked programs go to /upgrade?path=X
//   - "My journey" cross-cutting items (Home, Journal, Wins, Profile)
//     always show below the program nav
//
// Replaces the older Sidebar/SidebarWork/SidebarCircle trio + the Topbar
// ProgramSwitcher.

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import { signOut } from '@/lib/supabase/auth'
import AdminPortalLink from './AdminPortalLink'
import ReportBugButton from '@/components/support/ReportBugButton'

// ── Per-program palette ──────────────────────────────────────────────────────
const SEAL   = { fg: '#3D3080', pale: 'rgba(61,48,128,0.08)',  hover: 'rgba(61,48,128,0.04)' }
const CARDS  = { fg: '#1A5230', pale: 'rgba(26,82,48,0.07)',   hover: 'rgba(26,82,48,0.04)'  }
const CIRCLE = { fg: '#C97D3A', pale: 'rgba(201,125,58,0.08)', hover: 'rgba(201,125,58,0.04)'}

type ProgramKey = 'seal' | 'cards' | 'circle'

interface NavItem { href: string; label: string; exact?: boolean }
interface Program {
  key: ProgramKey
  title: string
  subtitle: string
  icon: string
  home: string                 // landing route when this program is selected
  palette: typeof SEAL
  pathPrefix: string           // for matching the current URL
  upgradePath: 'A' | 'B' | 'C' // for /upgrade?path=X
}

const PROGRAMS: Record<ProgramKey, Program> = {
  seal:   { key: 'seal',   title: 'Seal the Leak', subtitle: '7-day reset',      icon: '✦', home: '/program', palette: SEAL,   pathPrefix: '/program', upgradePath: 'A' },
  cards:  { key: 'cards',  title: '365 Cards',     subtitle: 'Daily alignment',  icon: '◇', home: '/card',    palette: CARDS,  pathPrefix: '/card',    upgradePath: 'B' },
  circle: { key: 'circle', title: 'The Circle',    subtitle: '90-day cohort',    icon: '○', home: '/circle',  palette: CIRCLE, pathPrefix: '/circle',  upgradePath: 'C' },
}

const SEAL_ITEMS: NavItem[] = [
  { href: '/program',             label: 'The Work',         exact: true },
  { href: '/program/today',       label: "Today's session",  exact: true },
  { href: '/program/reflections', label: 'Reflections',      exact: true },
  { href: '/program/progress',    label: 'My progress',      exact: true },
]

const CIRCLE_ITEMS: NavItem[] = [
  { href: '/circle',           label: 'Your Circle',  exact: true },
  { href: '/circle/community', label: 'Community',    exact: true },
  { href: '/circle/partner',   label: 'Partner',      exact: true },
  { href: '/circle/calls',     label: 'Live streams', exact: true },
]

interface JourneyItem extends NavItem {
  icon: React.ReactNode
}

const JOURNEY_ITEMS: JourneyItem[] = [
  { href: '/journal', label: 'Journal',  icon: <JournalIcon /> },
  { href: '/wins',    label: 'My wins',  icon: <WinsIcon />,    exact: true },
  { href: '/profile', label: 'Profile',  icon: <ProfileIcon />, exact: true },
]

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

// Derive which program the user is currently in based on the URL.
// /dashboard is universal (not tied to any program) — the picker stays on
// whatever the user's natural default was when they navigate there.
function programFromPath(pathname: string, fallback: ProgramKey): ProgramKey {
  if (pathname.startsWith('/program')) return 'seal'
  if (pathname.startsWith('/circle'))  return 'circle'
  if (pathname === '/card'  || pathname.startsWith('/card')  ||
      pathname === '/past'  || pathname.startsWith('/past')  ||
      pathname === '/vault' || pathname.startsWith('/vault')) {
    return 'cards'
  }
  return fallback
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname() ?? ''
  const router   = useRouter()
  const { user, dayNumber, hasWorkAccess, hasCardsAccess, hasCircleAccess } = useApp()

  const access: Record<ProgramKey, boolean> = {
    seal:   hasWorkAccess,
    cards:  hasCardsAccess,
    circle: hasCircleAccess,
  }
  const owned   = (Object.keys(access) as ProgramKey[]).filter(k => access[k])
  const locked  = (Object.keys(access) as ProgramKey[]).filter(k => !access[k])

  // Default the selected program to whatever the user owns first, or 'cards'
  // if they own nothing (rare — admin without a path).
  const naturalDefault = owned[0] ?? 'cards'
  const [selected, setSelected] = useState<ProgramKey>(programFromPath(pathname, naturalDefault))

  // When the URL changes, follow it. Keeps the dropdown in sync if the user
  // navigates via direct link or the journey items.
  useEffect(() => {
    const next = programFromPath(pathname, naturalDefault)
    setSelected(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Build the items for the selected program. Cards is dynamic because the
  // Vault unlock depends on dayNumber.
  const vaultUnlocked = dayNumber >= 30
  const cardsItems: NavItem[] = [
    { href: '/dashboard', label: 'Your daily cards', exact: true },
    { href: '/card',      label: "Today's card",     exact: true },
    { href: '/past',      label: 'Past cards',       exact: true },
    ...(vaultUnlocked ? [{ href: '/vault', label: 'The Vault', exact: true }] : []),
  ]

  const itemsByProgram: Record<ProgramKey, NavItem[]> = {
    seal:   SEAL_ITEMS,
    cards:  cardsItems,
    circle: CIRCLE_ITEMS,
  }

  const program = PROGRAMS[selected]
  const items   = itemsByProgram[selected]

  // Dropdown open state
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!dropOpen) return
    const handler = (e: MouseEvent) => {
      if (!dropRef.current) return
      if (!dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropOpen])

  function pickProgram(key: ProgramKey) {
    setDropOpen(false)
    if (access[key]) {
      setSelected(key)
      router.push(PROGRAMS[key].home)
    } else {
      router.push(`/upgrade?path=${PROGRAMS[key].upgradePath}`)
    }
  }

  return (
    <aside style={{
      width: 'var(--sidebar)', minWidth: 'var(--sidebar)',
      height: '100vh', position: 'sticky', top: 0,
      backgroundColor: '#fbfaf7',
      borderRight: '1px solid var(--line)',
      padding: '20px 0 0',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Wordmark */}
      <div style={{ padding: '0 20px 14px' }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500,
          color: 'var(--ink)',
        }}>
          <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
        </div>
      </div>

      {/* Program picker — primary nav element. Sits at the top so the
          user's current program is always visible. */}
      <div ref={dropRef} style={{ padding: '0 8px 4px', position: 'relative' }}>
        <button
          onClick={() => setDropOpen(o => !o)}
          aria-expanded={dropOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '8px 12px', borderRadius: 7,
            background: 'transparent',
            border: 'none',
            borderLeft: `3px solid ${program.palette.fg}`,
            color: program.palette.fg,
            fontFamily: 'var(--font-body)', cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = program.palette.hover }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{program.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>
              {program.title}
            </div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1, color: 'var(--text-muted)' }}>
              {program.subtitle}
            </div>
          </div>
          <span style={{ fontSize: 9, opacity: 0.5 }}>{dropOpen ? '▲' : '▼'}</span>
        </button>

        {dropOpen && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 8, right: 8,
            background: '#fff',
            border: '1px solid var(--line-md)',
            borderRadius: 10,
            boxShadow: '0 6px 20px rgba(12,12,10,0.10)',
            overflow: 'hidden',
            zIndex: 50,
          }}>
            {owned.length > 0 && (
              <>
                <DropdownLabel>Your programs</DropdownLabel>
                {owned.map(k => {
                  const p = PROGRAMS[k]
                  const active = k === selected
                  return (
                    <DropdownRow
                      key={k}
                      icon={p.icon} title={p.title} subtitle={p.subtitle}
                      palette={p.palette} active={active}
                      onClick={() => pickProgram(k)}
                    />
                  )
                })}
              </>
            )}
            {locked.length > 0 && !user.isAdmin && (
              <>
                <DropdownLabel>Add to your journey</DropdownLabel>
                {locked.map(k => {
                  const p = PROGRAMS[k]
                  return (
                    <DropdownRow
                      key={k}
                      icon={p.icon} title={p.title} subtitle={p.subtitle}
                      palette={p.palette} locked
                      onClick={() => pickProgram(k)}
                    />
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* Body — Home + program nav + journey block, scrollable, fills available space */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
      {/* Home — universal landing. Sits inside the same nav block as the
          program items so it reads as part of the sidebar's core nav,
          not a separate widget. Neutral ink color (no program palette). */}
      <nav style={{ padding: '0 8px' }}>
        {(() => {
          const active = pathname === '/dashboard'
          return (
            <Link href="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 7,
                  margin: '1px 4px',
                  backgroundColor: active ? 'rgba(0,0,0,0.05)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.025)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: active ? 'var(--ink)' : 'transparent',
                  border: active ? 'none' : '1px solid var(--line-md)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  lineHeight: 1.2,
                }}>
                  Home
                </span>
              </div>
            </Link>
          )
        })()}

        {/* Subtle divider before the selected program's items */}
        <div style={{ height: 1, background: 'var(--line)', margin: '8px 12px' }} />

        {items.map(item => {
          const active = isActive(item.href, pathname, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 7,
                  margin: '1px 4px',
                  backgroundColor: active ? program.palette.pale : 'transparent',
                  color: active ? program.palette.fg : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = program.palette.hover
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: active ? program.palette.fg : 'transparent',
                  border: active ? 'none' : '1px solid var(--line-md)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}

      </nav>

      {/* My journey — universal data banks. Lives in its own boxed block
          below the program nav so users see they don't change with the
          program selector. Available to anyone signed in. */}
      <div style={{
        margin: '0 12px 14px',
        padding: '10px 12px 8px',
        background: '#ffffff',
        border: '1px solid var(--line)',
        borderRadius: 10,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 4px 6px',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>·</span>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
          }}>
            Always with you
          </div>
        </div>
        {JOURNEY_ITEMS.map(item => {
          const active = isActive(item.href, pathname, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 8px', borderRadius: 6,
                  backgroundColor: active ? 'rgba(0,0,0,0.05)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.025)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }}
              >
                <span style={{
                  flexShrink: 0,
                  color: active ? 'var(--ink)' : 'var(--text-muted)',
                }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
      </div>

      {/* Bottom — settings + admin shortcut + sign out */}
      <div style={{
        padding: '14px 20px 18px',
        borderTop: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <Link
          href="/settings"
          style={{
            textDecoration: 'none',
            fontSize: 12, color: 'var(--text-soft)',
            fontFamily: 'var(--font-body)',
            padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <GearIcon /> Settings
        </Link>

        <AdminPortalLink />

        <button
          onClick={async () => { await signOut(); router.push('/') }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            padding: '4px 0', textAlign: 'left',
          }}
          onMouseOver={e => (e.currentTarget.style.color = 'var(--red)')}
          onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          Sign out
        </button>

        <ReportBugButton />
      </div>
    </aside>
  )
}

// ── Dropdown helpers ─────────────────────────────────────────────────────────
function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 14px', fontSize: 9, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      background: 'var(--paper)', borderBottom: '1px solid var(--line)',
      fontFamily: 'var(--font-body)', fontWeight: 600,
    }}>
      {children}
    </div>
  )
}

function DropdownRow({
  icon, title, subtitle, palette, active, locked, onClick,
}: {
  icon: string; title: string; subtitle: string; palette: typeof SEAL
  active?: boolean; locked?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '11px 14px',
        background: active ? palette.pale : '#fff',
        border: 'none', borderBottom: '1px solid var(--line)',
        cursor: 'pointer', textAlign: 'left',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--paper)'
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#fff'
      }}
    >
      <span style={{
        width: 26, height: 26, borderRadius: '50%',
        background: palette.pale, color: palette.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, lineHeight: 1, flexShrink: 0,
        opacity: locked ? 0.55 : 1,
      }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? palette.fg : (locked ? 'var(--text-soft)' : 'var(--ink)') }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
          {subtitle}
        </div>
      </div>
      {active && (
        <span style={{ fontSize: 9, fontWeight: 700, color: palette.fg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Current
        </span>
      )}
      {locked && (
        <span style={{ fontSize: 9, fontWeight: 700, color: palette.fg, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Upgrade →
        </span>
      )}
    </button>
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

function JournalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2h8a1 1 0 011 1v10a1 1 0 01-1 1H3" />
      <path d="M3 2a1 1 0 00-1 1v10a1 1 0 001 1" />
      <path d="M6 6h4M6 9h4M6 12h2" />
    </svg>
  )
}

function WinsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l1.5 3.1L13 5.6l-2.5 2.4.6 3.4L8 9.8l-3.1 1.6.6-3.4L3 5.6l3.5-.5L8 2z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" />
    </svg>
  )
}
