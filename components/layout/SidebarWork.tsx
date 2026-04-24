'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

// Deep purple accent — stays consistent throughout this sidebar
const PURPLE = '#3D3080'
const PURPLE_PALE = 'rgba(61,48,128,0.07)'
const PURPLE_DIM  = 'rgba(61,48,128,0.55)'

// SVG Icons
function OverviewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  )
}

function FlameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 14s-5-3.5-5-7.5C3 4 5 2 8 2c1 2 0 3.5-1 4.5C9 6 11 4.5 10 2c2 1.5 3 3.5 3 4.5 0 4-5 7.5-5 7.5z" />
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

function ProgressIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5v3l2 2" />
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
  exact?: boolean   // if true, only highlight on exact path match
}

// Reflection before My Progress; Self removed
const workNavItems: NavItem[] = [
  { href: '/program',          icon: OverviewIcon, label: 'The Work',         subtitle: 'Program overview',           exact: true },
  { href: '/program/today',    icon: FlameIcon,    label: "Today's Session",  subtitle: 'Pick up where you left off', exact: true },
  { href: '/program/reflections', icon: JournalIcon, label: 'Daily Journal',   subtitle: 'Tell the truth',             exact: true },
  { href: '/program/progress', icon: ProgressIcon, label: 'My Progress',      subtitle: 'Your journey so far',        exact: true },
]

function isItemActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

export default function SidebarWork() {
  const pathname = usePathname()
  const router   = useRouter()
  const { setSidebarMode, hasCardsAccess, hasCircleAccess } = useApp()

  return (
    <aside
      style={{
        width: 'var(--sidebar)',
        minWidth: 'var(--sidebar)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#faf9fd',
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
          <span style={{ color: PURPLE }}>✦</span> Seal the Leak
        </div>
        <p style={{
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          margin: '4px 0 0 0',
        }}>
          7-Day Reset
        </p>
        <div style={{ borderTop: '1px solid var(--line)', marginTop: '16px', marginBottom: '8px' }} />
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1 }}>
        {workNavItems.map((item) => {
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
                  backgroundColor: active ? PURPLE_PALE : 'transparent',
                  color: active ? PURPLE : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(61,48,128,0.04)'
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
                    color: active ? PURPLE_DIM : 'var(--text-muted)',
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

        {/* Swap buttons — only show for modes the user can actually access */}
        <div style={{ padding: '0 8px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {(hasCardsAccess || hasCircleAccess) && (
            <div style={{ borderTop: '1px solid var(--line)', marginBottom: '6px' }} />
          )}
          {hasCardsAccess && (
            <button
              onClick={() => { setSidebarMode('cards'); router.push('/dashboard') }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'var(--green-pale)',
                border: '1px solid rgba(31,92,58,0.15)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ color: 'var(--green)', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="12" height="9" rx="1.5" />
                  <path d="M4 5V4a2 2 0 012-2h4a2 2 0 012 2v1" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)', lineHeight: 1.2 }}>
                  365 Days
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3, marginTop: '2px' }}>
                  ← Switch to Daily Cards
                </div>
              </div>
            </button>
          )}

          {hasCircleAccess && (
            <button
              onClick={() => { setSidebarMode('circle'); router.push('/circle') }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(201,125,58,0.08)',
                border: '1px solid rgba(201,125,58,0.2)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ color: '#C97D3A', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6" />
                  <circle cx="8" cy="8" r="2" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-body)', color: 'var(--ink)', lineHeight: 1.2 }}>
                  The Circle
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', lineHeight: 1.3, marginTop: '2px' }}>
                  → Switch to your cohort
                </div>
              </div>
            </button>
          )}
        </div>
      </nav>


      {/* Bottom — shared */}
      <div style={{ padding: '12px 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* New Journal Entry */}
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <button
            onClick={() => router.push('/journal/new')}
            style={{
              width: '100%',
              backgroundColor: PURPLE,
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
            border: '1.5px solid #faf9fd',
            pointerEvents: 'none',
          }} />
        </div>

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
