'use client'
import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

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
      <path d="M4 5V3.5" />
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

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5.5" r="2.5" />
      <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" />
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

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 016 0v2" />
      <circle cx="8" cy="11" r="1" fill="currentColor" stroke="none" />
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
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', icon: HomeIcon, label: 'The Entry', subtitle: 'Start where you are' },
  { href: '/card', icon: CardsIcon, label: 'Daily Alignment', subtitle: 'Meet yourself today' },
  { href: '/past', icon: PastIcon, label: 'The Becoming', subtitle: 'See your evolution' },
  { href: '/journal', icon: JournalIcon, label: 'Reflection', subtitle: 'Tell the truth' },
  { href: '/wins', icon: WinsIcon, label: 'My Wins', subtitle: 'Victories logged here' },
  { href: '/profile', icon: ProfileIcon, label: 'Self', subtitle: 'This is who you are becoming' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, dayNumber } = useApp()

  const programUnlocked = user.selectedPath === 'A' && user.hasPaid
  const vaultUnlocked = dayNumber >= 30

  return (
    <aside
      style={{
        width: 'var(--sidebar)',
        minWidth: 'var(--sidebar)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--paper2)',
        borderRight: '1px solid var(--line)',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Wordmark */}
      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 500,
            color: 'var(--ink)',
          }}
        >
          <span style={{ color: 'var(--gold)' }}>✦</span> Seal Your Leak
        </div>
        <p
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            margin: '4px 0 0 0',
          }}
        >
          Find Your Center
        </p>
        <div
          style={{
            borderTop: '1px solid var(--line)',
            marginTop: '16px',
            marginBottom: '8px',
          }}
        />
      </div>

      {/* Main nav items */}
      <nav style={{ flex: 1 }}>
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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
                  backgroundColor: isActive ? 'var(--green-pale)' : 'transparent',
                  color: isActive ? 'var(--green)' : 'var(--text-soft)',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--paper3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                  }
                }}
              >
                <span style={{ flexShrink: 0 }}>
                  <Icon />
                </span>
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: isActive ? 'var(--green-dim)' : 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.3,
                      marginTop: '2px',
                    }}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Unlockable divider */}
        <div style={{ padding: '0 20px', marginTop: '16px', marginBottom: '8px' }}>
          <div style={{ borderTop: '1px solid var(--line)', marginBottom: '8px' }} />
          <p
            style={{
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              margin: 0,
            }}
          >
            Unlockable
          </p>
        </div>

        {/* Program — locked or unlocked */}
        {programUnlocked ? (
          <Link href="/program" style={{ textDecoration: 'none', display: 'block' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                margin: '1px 8px',
                backgroundColor:
                  pathname === '/program' || pathname.startsWith('/program/')
                    ? 'var(--green-pale)'
                    : 'transparent',
                color:
                  pathname === '/program' || pathname.startsWith('/program/')
                    ? 'var(--green)'
                    : 'var(--text-soft)',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease, color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                const active = pathname === '/program' || pathname.startsWith('/program/')
                if (!active) {
                  ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--paper3)'
                }
              }}
              onMouseLeave={(e) => {
                const active = pathname === '/program' || pathname.startsWith('/program/')
                if (!active) {
                  ;(e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
                }
              }}
            >
              <span style={{ flexShrink: 0, color: 'var(--gold)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5,2 14,8 5,14" fill="none" />
                </svg>
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.2,
                  }}
                >
                  The Work
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.3,
                    marginTop: '2px',
                  }}
                >
                  Go deeper
                </div>
              </div>
              {/* Unlocked badge */}
              <span
                style={{
                  fontSize: '9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--green-pale)',
                  color: 'var(--green)',
                  border: '1px solid rgba(31,92,58,0.2)',
                  fontFamily: 'var(--font-body)',
                  flexShrink: 0,
                }}
              >
                Unlocked
              </span>
            </div>
          </Link>
        ) : (
          /* Locked program row */
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '8px',
              margin: '1px 8px',
              backgroundColor: 'var(--gold-pale)',
              border: '1px dashed var(--gold-line)',
              cursor: 'not-allowed',
              opacity: 0.7,
            }}
            title="Unlock with Path A"
          >
            <span style={{ flexShrink: 0, color: 'var(--gold)' }}>
              <LockIcon />
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.2,
                  color: 'var(--ink)',
                }}
              >
                The Work
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.3,
                  marginTop: '2px',
                }}
              >
                Go deeper
              </div>
            </div>
            {/* PATH A badge */}
            <span
              style={{
                fontSize: '9px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: 'var(--gold-pale)',
                color: 'var(--gold)',
                border: '1px solid var(--gold-line)',
                fontFamily: 'var(--font-body)',
                flexShrink: 0,
              }}
            >
              Path A
            </span>
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div
        style={{
          padding: '0 20px 0 20px',
          paddingBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* New Journal Entry button with red dot indicator */}
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <button
            onClick={() => router.push('/journal/new')}
            style={{
              width: '100%',
              backgroundColor: 'var(--green)',
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
          {/* Red urgency dot */}
          <div
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--red)',
              border: '1.5px solid var(--paper2)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Vault row */}
        {vaultUnlocked ? (
          <Link
            href="/vault"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}
          >
            <span
              style={{
                fontSize: '12px',
                fontFamily: 'var(--font-body)',
                color: 'var(--text-soft)',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--ink)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-soft)' }}
            >
              The Vault
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-soft)' }}>→</span>
          </Link>
        ) : (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                opacity: 0.5,
                cursor: 'default',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-muted)',
                }}
              >
                🔒 The Vault
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--font-body)',
                  color: 'var(--text-muted)',
                }}
              >
                Day 30
              </span>
            </div>
            <p
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-body)',
                color: 'color-mix(in srgb, var(--text-muted) 50%, transparent)',
                fontStyle: 'italic',
                margin: '-6px 0 0 0',
                padding: '0 20px',
              }}
            >
              Unlocks on Day 30
            </p>
          </div>
        )}

        {/* Settings link */}
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
          onClick={() => {
            // TODO: call supabase.auth.signOut() when connected
            router.push('/')
          }}
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
